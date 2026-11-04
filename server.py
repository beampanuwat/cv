"""Loopback-only CV editor. No database. Run: python server.py --port 8124."""
import argparse
import base64
import hashlib
import hmac
import io
import json
import mimetypes
import os
from pathlib import Path
import re
import secrets
import threading
import time
from collections import deque
from datetime import datetime, timezone, timedelta
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs

ROOT = Path(__file__).resolve().parent
PRIVATE = ROOT / '.local'
LOCK = threading.RLock()
SESSIONS = {}
ATTEMPTS = {}
TICKETS = {}
EVENTS = deque(maxlen=200)
TZ = timezone(timedelta(hours=7))


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def atomic_json(path, data):
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    os.replace(temp, path)


def content():
    path = PRIVATE / 'content.json'
    return read_json(path if path.exists() else ROOT / 'assets/data/cv-seed.json')


def validate(data):
    """Accept structured text and raster images only, never user-authored HTML."""
    def text(value, limit=12000):
        if not isinstance(value, str) or len(value) > limit:
            raise ValueError('Invalid or oversized text')
    def bilingual(value):
        if not isinstance(value, dict) or set(value) != {'en', 'th'}:
            raise ValueError('Please provide English and Thai fields')
        for v in value.values(): text(v)
    def image(value):
        text(value, 4000000)
        if value == '' or re.fullmatch(r'assets/img/[a-zA-Z0-9_.-]+', value): return
        if not re.match(r'^data:image/(jpeg|png|webp);base64,', value):
            raise ValueError('Use a JPG, PNG or WebP image')
        raw = base64.b64decode(value.split(',', 1)[1], validate=True)
        if len(raw) > 2500000: raise ValueError('Image too large')
        from PIL import Image
        with Image.open(io.BytesIO(raw)) as im:
            if im.format not in ('JPEG', 'PNG', 'WEBP') or im.width * im.height > 16000000:
                raise ValueError('Invalid image')
            im.verify()
    required = {'revision','availability','overview','profile','contact','experience','projects','credentials','education'}
    if set(data) != required: raise ValueError('Invalid content structure')
    if type(data['availability']['open']) is not bool: raise ValueError('Invalid availability')
    for key in ('years','companies'):
        if not re.fullmatch(r'\d{1,2}', data['overview'][key]): raise ValueError('Enter a number from 0 to 99')
    bilingual(data['overview']['experience'])
    image(data['profile'])
    c = data['contact']
    text(c['email'],254); text(c['phone'],50)
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',c['email']): raise ValueError('Invalid email')
    if not re.fullmatch(r'[+\d ()-]{5,50}',c['phone']): raise ValueError('Invalid phone')
    bilingual(c['location']); bilingual(c['description'])
    schemas = {
        'experience': (['period','role','points'], ['company','tags']),
        'projects': (['kind','title','role','summary','points'], ['tags']),
        'credentials': (['title','issuer'], ['year']),
        'education': (['title','school'], ['period'])
    }
    for group,(bi,plain) in schemas.items():
        if not isinstance(data[group],list) or len(data[group])>60: raise ValueError('Too many entries')
        ids=set()
        for item in data[group]:
            if not re.fullmatch(r'[\w-]{1,80}',item['id']) or item['id'] in ids: raise ValueError('Invalid entry ID')
            ids.add(item['id'])
            for key in bi: bilingual(item[key])
            for key in plain: text(item[key])
            for key in (['company'] if group=='experience' else ['title']):
                value=item[key]
                if not (value.strip() if isinstance(value,str) else value['en'].strip() and value['th'].strip()):
                    raise ValueError('Title/company is required in both languages')
            if group in ('experience','projects'): image(item['logo'])


class Handler(BaseHTTPRequestHandler):
    server_version = 'CVLocal/1'

    def log_message(self, *_): pass  # No visitor log files or credential-bearing URLs.

    def respond(self, status, data, cookie=None):
        raw=json.dumps(data,ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        if cookie: self.send_header('Set-Cookie',cookie)
        self.end_headers(); self.wfile.write(raw)

    def host_ok(self):
        return self.headers.get('Host') == f'127.0.0.1:{self.server.server_port}'

    def session(self):
        try:
            jar=SimpleCookie();jar.load(self.headers.get('Cookie',''))
            token=jar['cv_owner'].value if 'cv_owner' in jar else ''
            record=SESSIONS.get(token)
            if record and record['expires']>time.monotonic(): return record
            SESSIONS.pop(token,None)
        except Exception: pass
        return None

    def body(self):
        length=int(self.headers.get('Content-Length','0'))
        if not 0<length<=16000000: raise ValueError('Request too large or empty')
        return json.loads(self.rfile.read(length))

    def do_GET(self):
        if not self.host_ok(): return self.respond(403,{'error':'Invalid host'})
        url=urlsplit(self.path);path=url.path
        if path=='/api/session':
            session=self.session()
            return self.respond(200,{'authenticated':bool(session),'csrf':session['csrf'] if session else None})
        if path=='/api/content': return self.respond(200,content())
        if path=='/api/notifications':
            if not self.session(): return self.respond(401,{'error':'Owner login required'})
            with LOCK: return self.respond(200,{'events':list(EVENTS),'memoryOnly':True})
        if path=='/api/download': return self.download(parse_qs(url.query))
        if path.startswith('/api/'): return self.respond(404,{'error':'Not found'})
        if path.startswith('/assets/pdf/'):
            return self.respond(403,{'error':'Please use the Download Resume button and company form'})
        if path.split('?')[0] in ('/assets/img/profile.jpg','/assets/img/profile-card.jpg'):
            current=content()['profile']
            if current.startswith('data:image/'):
                header,payload=current.split(',',1);raw=base64.b64decode(payload)
                self.send_response(200);self.send_header('Content-Type',header[5:].split(';')[0])
                self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store')
                self.end_headers();self.wfile.write(raw);return
        # Only the public page and its assets are served. Private files and code are never exposed.
        if path in ('/','/index.html'): file=ROOT/'index.html'
        elif path.startswith('/assets/'):
            file=(ROOT/path.lstrip('/')).resolve()
            if not file.is_relative_to(ROOT/'assets'): return self.respond(404,{'error':'Not found'})
        else: return self.respond(404,{'error':'Not found'})
        if not file.is_file(): return self.respond(404,{'error':'Not found'})
        raw=file.read_bytes();self.send_response(200)
        self.send_header('Content-Type',mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
        self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','same-origin')
        self.send_header('X-Frame-Options','DENY');self.end_headers();self.wfile.write(raw)

    def do_POST(self): self.mutate()
    def do_PUT(self): self.mutate()

    def mutate(self):
        if not self.host_ok() or self.headers.get('Origin') != f'http://127.0.0.1:{self.server.server_port}':
            return self.respond(403,{'error':'Same-origin request required'})
        try:
            path=urlsplit(self.path).path
            if self.headers.get_content_type()!='application/json': raise ValueError('JSON required')
            data=self.body()
            with LOCK:
                if path=='/api/login': return self.login(data)
                if path=='/api/download':
                    company=data.get('company','').strip()
                    if not 2<=len(company)<=120 or any(ord(c)<32 for c in company): raise ValueError('Enter your company name (2–120 characters)')
                    now=time.monotonic()
                    for key in list(TICKETS):
                        if TICKETS[key]['expires']<now: del TICKETS[key]
                    if len(TICKETS)>=100: return self.respond(429,{'error':'Please try again later'})
                    ticket=secrets.token_urlsafe(24)
                    TICKETS[ticket]={'company':company,'expires':now+120,'languages':set(),'event':None}
                    return self.respond(200,{'ticket':ticket})
                session=self.session()
                if not session: return self.respond(401,{'error':'Owner login required'})
                if not hmac.compare_digest(self.headers.get('X-CSRF-Token',''),session['csrf']): return self.respond(403,{'error':'Invalid session token'})
                if path=='/api/logout':
                    for token in list(SESSIONS):
                        if SESSIONS[token] is session: del SESSIONS[token]
                    return self.respond(200,{'ok':True},'cv_owner=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
                if path=='/api/notifications/read':
                    for event in EVENTS: event['read']=True
                    return self.respond(200,{'ok':True})
                if path=='/api/content' and self.command=='PUT':
                    validate(data);old=content()
                    if data['revision']!=old['revision']: return self.respond(409,{'error':'Content changed in another tab. Reload before editing.'})
                    if data['availability']['open']!=old['availability']['open'] or data.pop('_confirmAvailability',False):
                        data['availability']['updated']=datetime.now(TZ).isoformat(timespec='seconds')
                    elif data['availability'].get('updated')!=old['availability']['updated']:
                        data['availability']['updated']=datetime.now(TZ).isoformat(timespec='seconds')
                    data['revision']=old['revision']+1
                    atomic_json(PRIVATE/'content.json',data)
                    if data['profile']!=old['profile'] and data['profile'].startswith('data:image/'):
                        # The replacement is saved first. Keep no original photo copies.
                        for name in ('profile.jpg','profile-card.jpg','profile-avatar.jpg'):
                            (ROOT/'assets/img'/name).unlink(missing_ok=True)
                    return self.respond(200,data)
                return self.respond(404,{'error':'Not found'})
        except (ValueError,KeyError,TypeError,OverflowError) as error:
            return self.respond(400,{'error':str(error)[:180]})
        except Exception:
            return self.respond(500,{'error':'Unable to save. Your previous content is unchanged.'})

    def login(self,data):
        now=time.monotonic();attempts=ATTEMPTS.setdefault(self.client_address[0],deque())
        while attempts and attempts[0]<now-900: attempts.popleft()
        if len(attempts)>=5: return self.respond(429,{'error':'Too many attempts. Please wait 15 minutes.'})
        config=read_json(PRIVATE/'owner.json')
        password=data.get('password','')
        if not isinstance(password,str) or len(password)>256: raise ValueError('Invalid password')
        digest=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(config['salt']),600000).hex()
        if not hmac.compare_digest(digest,config['hash']):
            attempts.append(now);return self.respond(401,{'error':'รหัสผ่านไม่ถูกต้อง / Incorrect password'})
        attempts.clear()
        for key in list(SESSIONS):
            if SESSIONS[key]['expires']<now: del SESSIONS[key]
        token=secrets.token_urlsafe(32);csrf=secrets.token_urlsafe(24)
        SESSIONS[token]={'csrf':csrf,'expires':now+28800}
        return self.respond(200,{'authenticated':True,'csrf':csrf},f'cv_owner={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800')

    def download(self,query):
        ticket=query.get('ticket',[''])[0];lang=query.get('lang',[''])[0]
        with LOCK:
            record=TICKETS.get(ticket)
            if not record or record['expires']<time.monotonic() or lang not in ('en','th') or lang in record['languages']:
                return self.respond(403,{'error':'Please complete the company form again'})
            record['languages'].add(lang)
        file=ROOT/'assets/pdf'/f'CV_Panuwat_Puakroongrueng_{lang.upper()}_Updated.pdf'
        if not file.exists(): return self.respond(404,{'error':'PDF unavailable'})
        raw=file.read_bytes();self.send_response(200);self.send_header('Content-Type','application/pdf')
        self.send_header('Content-Disposition',f'attachment; filename="{file.name}"')
        self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.end_headers()
        try: self.wfile.write(raw)
        except (BrokenPipeError,ConnectionResetError): return
        with LOCK:
            if record['event'] is None:
                event={'id':secrets.token_hex(8),'company':record['company'],'time':datetime.now(TZ).isoformat(timespec='seconds'),'languages':[lang.upper()],'read':False}
                EVENTS.appendleft(event);record['event']=event
            else: record['event']['languages'].append(lang.upper())


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8124);args=parser.parse_args()
    PRIVATE.mkdir(exist_ok=True)
    if not (PRIVATE/'owner.json').exists(): raise SystemExit('Owner password hash is missing. Configure .local/owner.json before starting.')
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    print(f'CV editor ready at http://127.0.0.1:{args.port}/ (no database)',flush=True)
    server.serve_forever()
