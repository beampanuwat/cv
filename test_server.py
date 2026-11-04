"""Security and persistence checks use a temporary workspace and test password."""
import base64
import copy
import hashlib
import io
import json
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, build_opener, HTTPCookieProcessor
from http.cookiejar import CookieJar
import server


class EditorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        test_root=server.ROOT/'.local'
        test_root.mkdir(exist_ok=True)
        cls.temp=tempfile.TemporaryDirectory(prefix='test-',dir=test_root)
        cls.original_root=server.ROOT;cls.original_private=server.PRIVATE
        cls.root=Path(cls.temp.name);server.ROOT=cls.root;server.PRIVATE=cls.root/'.local'
        server.PRIVATE.mkdir();(cls.root/'assets/data').mkdir(parents=True);(cls.root/'assets/pdf').mkdir(parents=True);(cls.root/'assets/img').mkdir(parents=True)
        cls.seed=json.loads((cls.original_root/'assets/data/cv-seed.json').read_text(encoding='utf-8'))
        server.atomic_json(cls.root/'assets/data/cv-seed.json',cls.seed)
        salt=b'test-salt-only';server.atomic_json(server.PRIVATE/'owner.json',{'salt':salt.hex(),'hash':hashlib.pbkdf2_hmac('sha256',b'test-only-password',salt,600000).hex()})
        for l in ('EN','TH'):(cls.root/'assets/pdf'/f'CV_Panuwat_Puakroongrueng_{l}_Updated.pdf').write_bytes(b'%PDF-1.4\nTest fixture')
        (cls.root/'index.html').write_text('<html>CV</html>')
        cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
        cls.base=f'http://127.0.0.1:{cls.http.server_port}'
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();server.ROOT=cls.original_root;server.PRIVATE=cls.original_private
        assert cls.root.resolve().is_relative_to((cls.original_root/'.local').resolve())
        cls.temp.cleanup()

    def setUp(self):
        server.SESSIONS.clear();server.ATTEMPTS.clear();server.TICKETS.clear();server.EVENTS.clear()
        (server.PRIVATE/'content.json').unlink(missing_ok=True)
        self.client=build_opener(HTTPCookieProcessor(CookieJar()))

    def request(self,path,method='GET',data=None,csrf=None,origin=True):
        headers={'Content-Type':'application/json'}
        if origin:headers['Origin']=self.base
        if csrf:headers['X-CSRF-Token']=csrf
        req=Request(self.base+path,data=json.dumps(data).encode() if data is not None else None,headers=headers,method=method)
        try:
            with self.client.open(req) as res:return res.status,res.read(),res.headers
        except HTTPError as e:return e.code,e.read(),e.headers

    def login(self):
        status,raw,headers=self.request('/api/login','POST',{'password':'test-only-password'})
        self.assertEqual(status,200);self.assertIn('HttpOnly',headers['Set-Cookie']);self.assertIn('SameSite=Strict',headers['Set-Cookie'])
        return json.loads(raw)['csrf']

    def test_public_cannot_write_or_read_notifications(self):
        self.assertEqual(self.request('/api/content','PUT',self.seed)[0],401)
        self.assertEqual(self.request('/api/notifications')[0],401)
        self.assertEqual(self.request('/.local/owner.json')[0],404)
        self.assertEqual(self.request('/server.py')[0],404)

    def test_auth_origin_csrf_and_logout(self):
        self.assertEqual(self.request('/api/login','POST',{'password':'wrong'})[0],401)
        csrf=self.login()
        self.assertEqual(self.request('/api/content','PUT',self.seed)[0],403)
        self.assertEqual(self.request('/api/content','PUT',self.seed,csrf,origin=False)[0],403)
        self.assertEqual(self.request('/api/logout','POST',{},csrf)[0],200)
        self.assertEqual(self.request('/api/notifications')[0],401)

    def test_save_persistence_timestamp_and_conflict(self):
        csrf=self.login();next=copy.deepcopy(self.seed);next['availability']['open']=False
        status,raw,_=self.request('/api/content','PUT',next,csrf);self.assertEqual(status,200)
        saved=json.loads(raw);self.assertFalse(saved['availability']['open']);self.assertEqual(saved['revision'],2)
        self.assertNotEqual(saved['availability']['updated'],self.seed['availability']['updated'])
        self.assertTrue((server.PRIVATE/'content.json').exists())
        self.assertEqual(json.loads(self.request('/api/content')[1]),saved)
        self.assertEqual(self.request('/api/content','PUT',next,csrf)[0],409)

    def test_validation_rejects_script_image(self):
        csrf=self.login();next=copy.deepcopy(self.seed);next['profile']='javascript:alert(1)'
        self.assertEqual(self.request('/api/content','PUT',next,csrf)[0],400)
        self.assertFalse((server.PRIVATE/'content.json').exists())

    def test_profile_replaces_original_files(self):
        from PIL import Image
        raw=io.BytesIO();Image.new('RGB',(5,5),'blue').save(raw,'JPEG')
        for name in ('profile.jpg','profile-card.jpg'):(self.root/'assets/img'/name).write_bytes(b'old')
        csrf=self.login();next=copy.deepcopy(self.seed);next['profile']='data:image/jpeg;base64,'+base64.b64encode(raw.getvalue()).decode()
        self.assertEqual(self.request('/api/content','PUT',next,csrf)[0],200)
        self.assertFalse((self.root/'assets/img/profile.jpg').exists());self.assertFalse((self.root/'assets/img/profile-card.jpg').exists())
        self.assertEqual(self.request('/assets/img/profile.jpg')[1],raw.getvalue())

    def test_download_log_private_memory_only_and_deduplicated(self):
        status,raw,_=self.request('/api/download','POST',{'company':'Test Company'})
        self.assertEqual(status,200);ticket=json.loads(raw)['ticket'];self.assertEqual(len(server.EVENTS),0)
        for l in ('en','th'):self.assertEqual(self.request(f'/api/download?ticket={ticket}&lang={l}')[0],200)
        self.assertEqual(len(server.EVENTS),1);self.assertEqual(server.EVENTS[0]['company'],'Test Company')
        self.assertEqual(server.EVENTS[0]['languages'],['EN','TH'])
        self.assertEqual(self.request('/api/notifications')[0],401)
        csrf=self.login();self.assertEqual(len(json.loads(self.request('/api/notifications')[1])['events']),1)
        self.assertEqual(self.request('/api/notifications/read','POST',{},csrf)[0],200);self.assertTrue(server.EVENTS[0]['read'])
        self.assertFalse((server.PRIVATE/'notifications.json').exists())
        self.assertEqual(self.request('/assets/pdf/CV_Panuwat_Puakroongrueng_EN_Updated.pdf')[0],403)
        self.assertEqual(self.request(f'/api/download?ticket={ticket}&lang=en')[0],403)

    def test_login_throttled(self):
        for _ in range(5):self.assertEqual(self.request('/api/login','POST',{'password':'wrong'})[0],401)
        self.assertEqual(self.request('/api/login','POST',{'password':'test-only-password'})[0],429)


if __name__=='__main__': unittest.main()
