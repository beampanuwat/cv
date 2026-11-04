# Local CV editor (no database)

Start from this folder:

```powershell
python server.py --port 8123
```

Open http://127.0.0.1:8123/. Click the lock in the header and sign in with the owner password already configured on this computer. Use the power icon to sign out.

- The Overview card contains the profile photo and experience editor. Saving a new photo replaces the header, overview and full-size photo together. The app retains no photo versions; original profile image files are removed after the replacement is saved. Existing Git history, browser caches and external copies are outside this replacement behavior.
- The availability button switches between open and closed. Saving confirms the status date using server time in Asia/Bangkok, including when confirming the same status again.
- Experience, Projects, Credentials and Education have Add, Edit and Delete controls. Forms include EN and TH fields. Existing card templates are reused. Experience and Projects include logo uploads.
- Contact changes apply to the visible contact links, location and email-copy actions.
- Resume download asks for a company and language, then serves the existing PDF files. Editing webpage content **does not regenerate these PDF files**. Update `assets/pdf/` before sharing when the PDF content changes.
- The bell is visible only to the authenticated owner. Notifications show the company entered by the visitor and the time the server delivered the file, in `dd/MM/yyyy HH:mm:ss` (Thailand). A company name is self-reported; delivery does not prove the visitor saved or read the file. EN + TH from one form is one notification.
- Notifications and read status exist only in server memory, with a limit of 200 entries. They disappear when the server restarts. No database, notification files or visitor access-log files are created.

## Private state

`.local/content.json` contains the current CV and replacement image data. Writes replace the same file; there is no version archive. `.local/owner.json` contains only a random salt and a PBKDF2-HMAC-SHA256 password hash (600,000 iterations). It does not contain the plaintext password. Both files are excluded from Git and are never served by `server.py`.

Every content write and notification read requires a server-validated owner session. Writes also require a matching origin and session token. The session cookie is HttpOnly and SameSite=Strict, expires after eight hours, and lives only on this loopback server. Five failed sign-in attempts pause sign-in for 15 minutes. The server binds only to 127.0.0.1.

Do not use a generic static file server for this folder: it lacks authentication and private-file restrictions. GitHub Pages alone cannot run this server, persist edits or deliver private download notifications. Choose server hosting before taking these interactive features online; the present server is intentionally for local review only.

## Verification

```powershell
python -m unittest test_server -v
node --check assets/js/editor.js
node --check assets/js/main.js
```

The server tests use temporary files under `.local/` and a separate test password; they do not change the real CV or owner credentials.
