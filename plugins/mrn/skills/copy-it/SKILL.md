---
name: copy-it
description: Clones a reference website the user sends. Researches it and reads its docs, explores every page and flow live in a browser (handing off to the user to log in where needed), writes a full rebuild plan, asks the user about look, stack, framework, hosting and scope, waits for confirmation, then rebuilds the site and QAs it page by page against the original. Use when the user says "copy-it", "copy this website", "clone this site", "ลอกเว็บนี้", "ก๊อปเว็บนี้", "ทำเว็บเหมือนอันนี้".
argument-hint: "<URL เว็บต้นแบบ> [หมายเหตุเพิ่มเติม]"
---

# Copy it

งานมี 4 ช่วง: สำรวจ → แผนและยืนยัน → ลอก → ทดสอบ **ห้ามเขียนโค้ดของเว็บใหม่ก่อนผู้ใช้ยืนยันแผนในช่วง 2**

## เครื่องมือ: ใช้ตัวที่มีจริง

ใช้ตัวแรกในลำดับที่มีอยู่จริงใน session นี้ ตรวจจากรายการ tool และ skill ที่โหลดอยู่ หรือ `command -v <ชื่อ>` ก่อนใช้ ถ้า CLAUDE.md หรือกฎของผู้ใช้กำหนดเครื่องมือไว้ ให้ใช้ตามนั้นก่อนตาราง การติดตั้งเครื่องมือใหม่ต้องถามผู้ใช้ก่อน

| งาน | ลำดับทางเลือก |
|---|---|
| **browser** | browser skill หรือ MCP ที่ผู้ใช้กำหนด (เช่น ego-browser) → browser automation ใดๆ ที่มี (Playwright, Chrome DevTools, Claude in Chrome) → หยุดแล้วบอกผู้ใช้ว่างานนี้ต้องเห็นเว็บจริง พร้อมเสนอให้ติดตั้ง browser automation (เช่น Playwright MCP) |
| **กฎ UX/UI และการทดสอบ** | กฎที่ผู้ใช้กำหนด (CLAUDE.md หรือกฎของผู้ใช้) → checklist ในช่วง 4 ของ skill นี้ |
| **ผู้ตรวจอิสระ** | review tool ภายนอกที่ผู้ใช้ใช้อยู่ (เช่น Codex) → subagent ใหม่ผ่าน Agent tool → ถ้าไม่มีทั้งคู่ ทำรอบ review แยกโดยอ่านแค่ diff แล้วระบุในรายงานว่าไม่ใช่ผู้ตรวจอิสระ |

## กติกาตลอดงาน

- **ที่เก็บงาน**: ทุกอย่างจากการสำรวจเก็บใน `copy-it/` ที่ root ของ project (`research.md`, `inventory.md`, `tokens.md`, `PLAN.md`, `screens/`) ถ้า cwd ไม่ใช่ project ให้สร้าง folder ใหม่ชื่อ `<ชื่อเว็บ>-clone/` แล้วทำงานในนั้น
- **browser**: ใช้ตาม **เครื่องมือ** ข้างบน ถ้าเป็น ego-browser ให้โหลด skill `ego-browser` แล้วทำตามคู่มือที่ `ego-browser skill` พิมพ์ออกมา
- **บัญชีจริงของผู้ใช้**: เปิดดูและกดสำรวจได้ แต่ห้ามทำสิ่งที่มีผลจริง ได้แก่ จ่ายเงิน, สั่งซื้อ, ส่งข้อความหรืออีเมล, ลบ, เชิญคน, publish และเปลี่ยน setting ถ้าต้องดู flow พวกนี้ ให้เดินไปถึงหน้าก่อนกดยืนยันแล้วหยุด หรือถามผู้ใช้ก่อน
- **ลิขสิทธิ์และแบรนด์**: ลอกโครงสร้าง, layout, flow และพฤติกรรมได้ ส่วน logo, ชื่อแบรนด์, รูป, บทความ, font ที่มี license และ icon set เฉพาะแบรนด์ ใช้ของเดิมได้เฉพาะเมื่อผู้ใช้ยืนยันว่าเป็นเจ้าของหรือมีสิทธิ์ (ถามในข้อ 2.2) นอกนั้นใช้ placeholder ห้ามทำหน้า login หรือหน้าชำระเงินที่เลียนแบรนด์จริงจนเอาไปหลอกคนได้
- **ขนาน**: แตก subagent ได้ตอนอ่านคู่มือ (แบ่งตาม section) และตอนลอก (แบ่งตาม module) ตัวหลักต้องอ่านและตรวจผลของทุกตัวเอง

## ช่วง 1: สำรวจ

### 1.1 ค้นและอ่านคู่มือ

WebSearch หา docs, help center, user guide, FAQ, changelog, pricing และ API docs ของเว็บนี้ แล้วอ่านทุกหน้าที่อธิบาย feature ถ้าคู่มือยาว ให้แตก subagent ตาม section

บันทึกลง `research.md` (ทุกข้อต้องมี URL ที่มา):
- feature ทั้งหมด, role และสิทธิ์, plan และขีดจำกัด
- business rule เช่น validation, limit, เงื่อนไขของสถานะต่างๆ
- integration ภายนอก (payment, email, map, social login)
- stack ที่เดาได้จาก header, `__NEXT_DATA__`, meta generator และ URL ของ script

ไม่มีคู่มือ ให้เขียนว่าไม่มีแล้วไปต่อ

เสร็จเมื่อ: `research.md` มี feature list พร้อมที่มาครบทุกข้อ

### 1.2 เล่นเว็บจริงให้ครบ

1. รวบรวมรายการหน้าจาก `sitemap.xml`, nav, footer และ link ภายในทุกหน้าที่เปิดเจอ
2. ทุกหน้า: screenshot ที่ความกว้าง 1440 และ 375 (เพิ่ม 768 ถ้า layout เปลี่ยน) เก็บเป็น `screens/<page>-<width>.png`
3. ทุก element ที่โต้ตอบได้: hover, menu, modal, dropdown, tab, search, filter, pagination, toast และ animation
4. ทุก form: ส่งแบบว่าง, ใส่ค่าผิดรูปแบบ, ใส่ภาษาไทย, ใส่ข้อความยาวมาก แล้วจดข้อความ validation ทุกอัน
5. state: empty, loading, error และ success ที่หาเจอ
6. network: endpoint ที่แต่ละหน้าเรียก และรูปแบบข้อมูลที่ได้กลับมา ใช้เดา data model
7. design token: อ่าน computed style ของ body, heading, ปุ่ม, link, input และ card (font, size, weight, line-height, สี, spacing, radius, shadow, breakpoint) บันทึกลง `tokens.md`

**ต้อง login**: เมื่อถึงหน้าที่ต้อง login ให้ส่งให้ผู้ใช้ login เองใน browser (ego-browser: `task.handOff()` ตามคู่มือ) แล้วบอกผู้ใช้ว่าต้อง login เว็บไหน จากนั้นจบรอบรอผู้ใช้ตอบ เมื่อผู้ใช้ยืนยันแล้วค่อยกลับมาสำรวจส่วนหลัง login ต่อ ถ้าเว็บมีหลาย role (เช่น admin กับ user) ให้ถามว่ามีบัญชี role อื่นให้สำรวจไหม ห้ามขอรหัสผ่านทางแชท

**หน้าที่ใช้ template เดียวกัน** (เช่น `/product/123`): ดู 2-3 หน้าที่ข้อมูลต่างกันพอ แล้วจดว่าเป็น template

บันทึกลง `inventory.md` เป็นตาราง: หน้า / URL / ต้อง login ไหม / องค์ประกอบหลัก / flow / state ที่เห็น / ไฟล์ screenshot

เสร็จเมื่อ: เปิดทุก link ภายในที่เจอแล้ว (หรือจดเหตุผลที่ข้าม) และทุก feature ใน `research.md` เห็นจริงแล้ว หรือจดว่าหาไม่เจอ

## ช่วง 2: แผนและยืนยัน

### 2.1 เขียน `PLAN.md`

- เว็บนี้ทำอะไร ใครใช้ และ flow หลักคืออะไร
- รายการหน้าและ feature แบ่งเป็น must / should / could
- data model, API และ auth/role ที่ต้องมี
- design token ที่จะใช้
- stack ที่แนะนำพร้อมเหตุผล เทียบกับ stack ของต้นฉบับ
- ลำดับงานเป็น phase และการแบ่ง module ที่แยกให้ subagent ทำขนานได้
- test plan: รายการหน้าและ flow ที่จะเทียบกับต้นฉบับ
- สิ่งที่ลอกไม่ได้หรือเสี่ยง เช่น logic หลังบ้านที่มองไม่เห็น, feature AI, การชำระเงิน

### 2.2 ถามผู้ใช้ให้ครบ

ใช้ AskUserQuestion ได้ครั้งละไม่เกิน 4 ข้อ ถามหลายรอบได้ วางตัวเลือกที่แนะนำไว้แรกพร้อม "(แนะนำ)" ข้อไหนรู้คำตอบจากบทสนทนาแล้ว ไม่ต้องถาม ให้ใส่เป็นสมมติฐานใน `PLAN.md` แทน

1. **หน้าตา**: เหมือนต้นฉบับทุกจุด / ใช้โครงเดิมแต่เปลี่ยนเป็นแบรนด์ของเรา / ออกแบบใหม่ (ถามต่อว่าทิศทางไหน)
2. **สิทธิ์ใน asset**: เป็นเจ้าของเว็บต้นฉบับไหม ใช้ logo, รูป และข้อความเดิมได้ไหม
3. **ขอบเขต**: ทุกหน้า / เฉพาะ must / frontend อย่างเดียวด้วย mock data / full-stack
4. **stack และ framework**: เหมือนต้นฉบับ / ตามที่แนะนำ / ที่ผู้ใช้เลือกเอง
5. **backend, database และ auth**
6. **deploy**: ที่ไหน (Vercel, Cloudflare, VPS หรือยังไม่ deploy) และใช้ domain อะไร
7. **ภาษาและเนื้อหา**: ไทย / อังกฤษ / หลายภาษา, ใช้เนื้อหาจริงหรือ placeholder, SEO และ analytics
8. **integration ภายนอก**: payment, email, map และอื่นๆ ที่เจอ ใช้ของจริงในโหมด test หรือ mock
9. **repo**: สร้าง repo ใหม่ที่ไหน หรือใส่ใน repo ที่มีอยู่แล้ว

### 2.3 ยืนยัน

อัปเดต `PLAN.md` ตามคำตอบ แล้วแสดงสรุปแผนสั้นๆ พร้อม path ของไฟล์ จากนั้นถามว่า "ยืนยันแผนนี้ไหม" ถ้าผู้ใช้ขอแก้ ให้แก้แล้วถามใหม่จนกว่าจะได้คำยืนยันที่ชัดเจน

## ช่วง 3: ลอก

1. **foundation ทำเองใน agent หลัก**: scaffold, design token, layout shell, component ที่ใช้ร่วมกัน, data model และ auth
2. **แตก subagent หรือ Workflow ตาม module** ที่ไม่แก้ไฟล์เดียวกัน (ถ้าชนกันให้ใช้ `isolation: "worktree"`) prompt ของแต่ละตัวต้องมี:
   - หน้าที่รับผิดชอบตาม `inventory.md`
   - path ของ screenshot ต้นฉบับ และ `tokens.md`
   - **กฎ UX/UI และการทดสอบ** ตาม **เครื่องมือ** (ถ้าเป็น checklist ช่วง 4 ให้ใส่ข้อความเต็ม)
   - คำสั่งให้เปิดงานของตัวเองเทียบกับ screenshot ต้นฉบับใน **browser** ก่อนส่ง
3. integration จริงใช้ sandbox หรือ test mode เท่านั้น
4. ตัวหลักรวมงานแล้วตรวจทุกชิ้นเอง

## ช่วง 4: ทดสอบแบบมืออาชีพ

- **เทียบกับต้นฉบับทีละหน้า**: เปิดต้นฉบับกับของเราที่ 1440, 768 และ 375 ถ่าย screenshot คู่กัน จดจุดที่ต่าง แล้วแก้จนตรงตามที่ตกลงไว้ (ถ้าเลือก "เหมือนต้นฉบับ" layout, spacing, font และสีต้องตรง ถ้าเลือกแบบอื่น flow และพฤติกรรมต้องตรง)
- **เดินทุก flow ใน test plan** ตั้งแต่ต้นจนจบ และตรวจว่าข้อมูลถูกบันทึกจริง
- **edge case**: ข้อมูลว่าง, ข้อความยาวมาก, ภาษาไทย, input ผิดรูปแบบ, กดซ้ำ, ย้อนกลับหรือ refresh กลางทาง, สิทธิ์ไม่พอ, network fail และจอ mobile
- **UX/UI**: ทุกหน้ามี empty, loading, error และ success state, ใช้ keyboard ได้และเห็น focus, contrast ผ่าน WCAG AA และ touch target ไม่ต่ำกว่า 44px
- ตรวจ console error, network request ที่ fail และ log ฝั่ง server
- รัน test, typecheck และ build ทั้งชุด logic เรื่องเงิน, auth หรือ data ให้ใช้ `/mrn:prove-it`
- review โค้ดด้วย **ผู้ตรวจอิสระ**
- deploy เฉพาะเมื่อแผนระบุไว้ และต้องถามยืนยันก่อน deploy ครั้งแรก

## รายงาน

- ตารางผลทีละหน้าหรือ flow: ต้นฉบับ vs ของเรา (screenshot คู่) / ผล / หมายเหตุ
- สิ่งที่ลอกไม่ได้ หรือตั้งใจให้ต่าง พร้อมเหตุผล
- วิธีรันในเครื่อง และ URL ที่ deploy (ถ้ามี)
