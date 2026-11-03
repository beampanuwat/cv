# CV — Panuwat Puakroongrueng

CV แบบเว็บไซต์ (HTML / CSS / JavaScript) สำหรับตำแหน่ง **Senior SAP Technical Support Engineer**
รองรับ **EN / TH** (ค่าเริ่มต้นเป็น EN), ธีมมืด–สว่าง, พิมพ์เป็น PDF และโฮสต์ฟรีได้

> ไม่ต้องใช้ Framework, ไม่ต้องติดตั้ง Node.js, ไม่ต้อง Build — แก้ไฟล์แล้วเปิดใน Browser ได้เลย

**เว็บที่เผยแพร่แล้ว:** https://beampanuwat.github.io/cv/  
**Repo:** https://github.com/beampanuwat/cv

---

## 1. เปิดดูในเครื่อง (VSCode)

1. เปิดโปรแกรม **Visual Studio Code**
2. เลือก `File → Open Folder…` แล้วเลือกโฟลเดอร์ `CV HTML`
3. VSCode จะแนะนำส่วนขยายที่ควรติดตั้ง (มุมขวาล่าง) กด **Install**
   - `Live Server` — สำหรับเปิดหน้าเว็บพร้อม auto-refresh
   - `Prettier` — จัดรูปแบบโค้ด (ไม่บังคับ)
4. คลิกขวาที่ไฟล์ `index.html` → **Open with Live Server**
   หรือกด `Go Live` ที่มุมขวาล่าง
5. Browser จะเปิดที่ `http://127.0.0.1:5500/index.html`

เปิดไฟล์ مباشريكครั้งก็ได้ (ดับเบิลคลิก `index.html`) แต่ Live Server ให้ประสบการณ์แก้ไขที่ดีกว่า

---

## 2. โครงสร้างไฟล์

```
CV HTML/
├─ index.html                 ← เนื้อหา CV (EN + TH อยู่ในไฟล์นี้)
├─ assets/
│  ├─ css/style.css           ← สี, ฟอนต์, layout, animation, print
│  ├─ js/main.js              ← สลับภาษา, ธีม, typing, command palette, copy email
│  └─ img/favicon.svg         ← ไอคอนแท็บ Browser
├─ .vscode/extensions.json    ← ส่วนขยายที่แนะนำ
├─ .gitignore
└─ README.md                  ← ไฟล์นี้
```

**แก้เนื้อหา:** เกือบทั้งหมดอยู่ใน `index.html`
**แก้หน้าตา/สี:** `assets/css/style.css` (ตัวแปรสีอยู่บนสุด)
**แก้ลูกเล่น:** `assets/js/main.js`

---

## 3. การแก้เนื้อหา EN / TH

ทุกข้อความที่ต้องมีสองภาษาใช้รูปแบบนี้:

```html
<span class="lang-en">English text</span>
<span class="lang-th">ข้อความภาษาไทย</span>
```

ภาษาไทยถูกซ่อนด้วย CSS เมื่อ `<html lang="en">` และสลับอัตโนมัติเมื่อกดปุ่ม **TH**

### เพิ่มประสบการณ์ทำงาน

คัดลอกบล็อก `<article class="job panel reveal"> … </article>` ในส่วน `id="experience"`
แล้วแก้:

- `job-period` — ช่วงเวลา (EN / TH)
- `job-company` — ชื่อบริษัท
- `job-role` — ตำแหน่ง (EN / TH)
- `job-tags` — เทคโนโลยีที่ใช้
- `job-points` — หน้าที่ความรับผิดชอบ (แต่ละ `<li>` ต้องมีทั้ง `lang-en` และ `lang-th`)

### เพิ่มใบรับรอง

คัดลอก `<li class="cert"> … </li>` ในส่วน `id="credentials"` แล้วแก้ปี, ชื่อ, หน่วยงาน

### เพิ่มทักษะ

แก้ `<li>` ภายใน `<ul class="chips">` (ชื่อเทคโนโลยีไม่ต้องแปล) หรือเพิ่มแท็บใหม่ใน
`role="tablist"` พร้อม `<div class="skill-panel panel" role="tabpanel">` ที่มี `id` ตรงกับ
`aria-controls` ของแท็บ

### เปลี่ยนสี / ฟอนต์

ใน `assets/css/style.css`:

```css
html[data-theme="dark"] {
  --accent: #38bdf8;      /* สีหลัก */
  --accent-2: #2dd4bf;    /* สีรอง (gradient) */
  --bg: #05070d;          /* พื้นหลัง */
}
html[data-theme="light"] { … }
```

ฟอนต์แก้ที่ตัวแปร `--font-sans` / `--font-mono` และ `<link>` Google Fonts ใน `index.html`
(ปัจจุบันใช้ Inter + JetBrains Mono + Noto Sans Thai — ฟรีทั้งหมด)

### เปลี่ยนข้อความใน Terminal / Command Palette

- Terminal: อาร์เรย์ `COMMANDS` ใน `assets/js/main.js`
- Command Palette: อาร์เรย์ `SECTION_COMMANDS` และฟังก์ชัน `buildCommands()`
- ข้อความ UI (ปุ่ม, toast, placeholder): อ็อบเจกต์ `UI` ใน `assets/js/main.js`

---

## 4. ลูกเล่นที่มีใน CV นี้

| ลูกเล่น | วิธีใช้ |
|---|---|
| สลับภาษา EN / TH | ปุ่ม `EN / TH` มุมขวา (จำค่าที่เลือกไว้) |
| ธีมมืด / สว่าง | ปุ่มพระอาทิตย์/พระจันทร์ (จำค่าไว้) |
| Command Palette | กด `Ctrl + K` (Mac: `Cmd + K`) เพื่อกระโดดไปหัวข้อ/สั่งงาน |
| Terminal typing | พิมพ์ข้อความอัตโนมัติเมื่อเปิดหน้า |
| แผนภาพ Integration | Animation แพ็กเก็ตวิ่งระหว่าง SAP ↔ Middleware ↔ ระบบภายนอก |
| Reveal on scroll | เนื้อหาค่อย ๆ ปรากฏเมื่อเลื่อนลง |
| นับตัวเลขสถิติ | ตัวเลขวิ่งเมื่อเข้ามาในหน้าจอ |
| Copy email | ปุ่มคัดลอกอีเมล + toast แจ้งผล |
| Download PDF | ปุ่มพิมพ์ → เลือก “Save as PDF” |
| Responsive | รองรับมือถือ แท็บเล็ต และ Desktop |
| Accessibility | Skip link, focus ring, `prefers-reduced-motion`, ปุ่มมี aria-label |

---

## 5. ทำ PDF จากหน้าเว็บ

1. กดปุ่ม **Download PDF** (หรือ `Ctrl + P`)
2. เลือกปลายทาง **Save as PDF**
3. กระดาษ **A4**, Margin **Default**, เปิด **Background graphics** (ถ้าต้องการ)
4. กด **Save**

ในโหมดพิมพ์ หน้าเว็บจะเปลี่ยนเป็นพื้นขาว ตัวหนังสือเข้ม ซ่อนเมนู/ปุ่ม/กราฟิกที่ไม่จำเป็น
และแสดงทักษะทุกหมวด (ไม่ใช่แค่แท็บที่เลือก) โดยอัตโนมัติ

> หมายเหตุ: เนื้อหาในหน้าเว็บละเอียดกว่า PDF เดิม 2 หน้า ปัจจุบันพิมพ์ออกมาประมาณ 4 หน้า A4
> ถ้าต้องการให้กระชับกว่านี้ ให้ปรับ `font-size` ในบล็อก `@media print` ท้าย `style.css`

---

## 6. เผยแพร่ให้ HR เปิดผ่าน Link — ฟรี 100%

เว็บนี้เป็น **Static Site** (HTML/CSS/JS ล้วน) จึงใช้โฮสต์ฟรีได้ ไม่ต้องเช่า Server
ไม่ต้องมีฐานข้อมูล และ **ไม่มีค่าใช้จ่ายรายเดือน**

### ตัวเลือกที่แนะนำ: GitHub Pages

**ค่าใช้จ่าย: ฟรี** (ต้องมีบัญชี GitHub ฟรี และ Repo ต้องเป็น Public ในแผนฟรี)

1. สมัคร/เข้าสู่ระบบ [github.com](https://github.com)
2. กด **New repository**
   - Repository name: `cv`
   - Visibility: **Public**
   - ไม่ต้องติ๊ก README / .gitignore (เพราะมีอยู่แล้ว)
   - กด **Create repository**
3. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น Repo
   - วิธีง่าย: กด **uploading an existing file** แล้วลากไฟล์/โฟลเดอร์ทั้งหมดเข้าไป
   - ห้ามอัปโหลดแค่ `index.html` ต้องมีโฟลเดอร์ `assets` ไปด้วย
4. ไปที่ **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** / **/(root)**
   - กด **Save**
5. รอ 1–2 นาที Link จะกลายเป็น:

   ```
   https://<ชื่อผู้ใช้-github>.github.io/cv/
   ```

   ตัวอย่าง: `https://beampanuwat.github.io/cv/`

6. เปิด Link ทดสอบ และส่งให้ HR / Recruitment ได้ทันที

**ทางเลือก:** ตั้งชื่อ Repo เป็น `<ชื่อผู้ใช้>.github.io` (เช่น `panuwat.github.io`)
Link จะสั้นกว่า: `https://panuwat.github.io/`

### ทางเลือกอื่น (ฟรีเช่นกัน)

- **Netlify Drop** — [app.netlify.com/drop](https://app.netlify.com/drop) ลากโฟลเดอร์ทั้ง folder ขึ้นไป
  ได้ Link ทันที (ฟรี 100 GB bandwidth/เดือน)
- **Cloudflare Pages** — [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages →
  Create → Pages → Upload assets (ฟรี, เหมาะกับคนที่ต้องการความเร็วระดับ CDN)
- **Vercel** — [vercel.com](https://vercel.com) import Git repo (ฟรีสำหรับ personal project)

### ใช้ Git CLI (ถ้าถนัด Terminal)

```bash
git init
git add .
git commit -m "Add bilingual SAP CV"
git branch -M main
git remote add origin https://github.com/<username>/cv.git
git push -u origin main
```

แล้วไปตั้งค่า Pages ตามข้อ 4

### ค่าใช้จ่ายจริง ๆ

| รายการ | ค่าใช้จ่าย |
|---|---|
| GitHub Pages / Netlify / Cloudflare Pages | **ฟรี** |
| ชื่อเว็บฟรี `*.github.io` / `*.netlify.app` | **ฟรี** |
| โดเมนส่วนตัว เช่น `panuwat.com` (ไม่จำเป็น) | ประมาณ 300–1,000 บาท/ปี ตามผู้ให้บริการ |
| SSL / HTTPS | **ฟรี** (โฮสต์มีให้อัตโนมัติ) |
| Server / Database | **ไม่มี** |

> สรุป: ใช้ Link ฟรีของ GitHub Pages ได้เลย — **ไม่ต้องเสียเงิน**
> ซื้อโดเมนเฉพาะเมื่ออยากได้ชื่อสวย ๆ เช่น `panuwat.dev` หรือ `panuwat.com`

---

## 7. ก่อนส่ง Link ให้ HR (Checklist)

- [ ] เปิด Link บนมือถือแล้วอ่านง่าย
- [ ] กดสลับ EN / TH แล้วข้อความไม่ล้น/ขาด
- [ ] ตรวจเบอร์โทร อีเมล และวันที่ทำงานอีกครั้ง
- [ ] กด **Download PDF** แล้วไฟล์ออกมาสวย (พื้นขาว, ไม่มีเมนู)
- [x] ตั้งค่า `og:url` ใน `index.html` เป็น `https://beampanuwat.github.io/cv/` แล้ว
- [ ] ทดสอบกด `Ctrl + K` และ Copy email
- [ ] เปิด Link ใน Chrome, Edge และ Safari (ถ้ามี)

---

## 8. แก้ปัญหาเบื้องต้น

| อาการ | วิธีแก้ |
|---|---|
| ฟอนต์ไม่สวย / ฟอนต์ไทยไม่แสดง | ต้องต่ออินเทอร์เน็ต (ฟอนต์มาจาก Google Fonts) หรือเปลี่ยนไปใช้ฟอนต์ในเครื่อง |
| เปิดไฟล์แล้วรูป/สีไม่ขึ้น | ตรวจว่ามีโฟลเดอร์ `assets/css`, `assets/js`, `assets/img` ครบและ path ถูก |
| กด Download PDF แล้วเนื้อหาขาด | ในหน้าต่าง Print เลือก A4, Margin default, เปิด Background graphics |
| สลับ TH แล้วตัวหนังสือลอย | ตรวจว่าแก้ `<span class="lang-th">` ครบทุกข้อความ และไม่ได้ลบ `lang-en` ออก |
| GitHub Pages ขึ้น 404 | ตรวจว่าไฟล์ `index.html` อยู่ที่ root ของ Repo และ Pages ตั้งเป็น `/(root)` |
| แก้แล้วเว็บไม่เปลี่ยน | กด `Ctrl + F5` เพื่อล้าง cache หรือรอ 1–2 นาทีหลัง push |

---

## 9. หมายเหตุด้านความเป็นส่วนตัว

Repo แบบ Public จะทำให้ไฟล์ทั้งหมด (รวมอีเมล/เบอร์โทรใน CV) ถูกมองเห็นได้
ซึ่งเป็นเรื่องปกติของ CV ที่ต้องการให้ HR ติดต่อ — แต่ไม่ควรใส่ข้อมูลที่ไม่ต้องการเปิดเผย
เช่น เลขบัตรประชาชน, ที่อยู่บ้านโดยละเอียด, เงินเดือนปัจจุบัน หรือเอกสารส่วนตัว

หากต้องการ Repo ส่วนตัวบน GitHub Pages ต้องใช้ GitHub Pro (มีค่าใช้จ่าย)
หรือใช้ Netlify/Cloudflare Pages ที่รองรับการป้องกันด้วยรหัสผ่านในบางแผน
สำหรับ CV ทั่วไป Repo Public บน GitHub Pages เป็นวิธีที่ง่ายและฟรีที่สุด

---

สร้างด้วย HTML, CSS และ JavaScript ล้วน — ปรับแต่งได้อิสระ ไม่มีค่าใช้จ่ายในการโฮสต์
