---
name: qa
description: Tests an app, website, feature, API or CLI the way a senior QA tester does. Writes a test plan from the requirements and the code, walks every main flow for real (ego-browser for web), attacks edge cases, checks console, network, mobile and accessibility, logs each bug with severity, repro steps and evidence, and delivers a Thai test report as PDF with a go/no-go verdict. Reports bugs; does not fix them unless asked. Use when the user says "qa", "ทดสอบให้หน่อย", "เทสระบบ", "หา bug", "test this app", "ตรวจก่อนขึ้น production".
argument-hint: "<URL, path ของโปรเจกต์ หรือ feature ที่จะทดสอบ> [ขอบเขตหรือ requirement]"
---

# QA

งานนี้คือหาว่าอะไรพัง แล้วรายงานให้คนอ่านแล้วตัดสินใจได้ **ไม่ใช่การแก้** ห้ามแก้โค้ดของระบบที่ทดสอบ เว้นแต่ผู้ใช้สั่งหลังเห็นรายงาน (ถ้าสั่งแก้ ให้ใช้ `/mrn:prove-it`)

## กติกาตลอดงาน

- **ที่เก็บงาน**: `<cwd>/qa/<ชื่อระบบ>-<YYYYMMDD-HHMM>/` เก็บ `PLAN.md`, `screens/`, `logs/` และ `REPORT.md` ถ้า cwd เป็น `$HOME` หรืออยู่ใต้ `/tmp`, `/private/tmp` หรือ scratchpad ให้ใช้ `~/qa/` แทน ถ้าโปรเจกต์ใช้ git ให้เพิ่ม `qa/` ลง `.git/info/exclude` เพราะ screenshot อาจมีข้อมูลจริง
- **browser**: ใช้ ego-browser เท่านั้น (โหลด skill `ego-browser` แล้วทำตามคู่มือที่ `ego-browser skill` พิมพ์ออกมา) จอ mobile ให้ใช้ `page.cdp("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true })` แล้วเรียก `Emulation.clearDeviceMetricsOverride` ทุกครั้งหลังใช้ เพราะเป็นหน้าต่างเดียวกับที่ผู้ใช้เห็น
- **ระบบจริง**: ทดสอบบน local, staging หรือ preview ได้เต็มที่ ถ้าเป็น production ให้ทดสอบแบบอ่านอย่างเดียว ห้ามส่ง form ที่สร้างข้อมูลจริง ห้ามจ่ายเงิน ห้ามส่งอีเมลหรือข้อความถึงคนจริง ข้อมูลทดสอบที่สร้างขึ้นต้องตั้งชื่อให้รู้ว่าเป็นของทดสอบ (`qa-test-...`) และลบออกตอนจบ
- **login**: เรียก `task.handOff()` ให้ผู้ใช้ login เอง ห้ามขอรหัสผ่านทางแชท ถ้าระบบมีหลาย role ให้ถามว่ามีบัญชีของ role อื่นให้ทดสอบไหม
- **หลักฐาน**: ทุก bug ต้องมี screenshot หรือ output ที่บันทึกไว้ทันทีที่เจอ ข้อความในรายงานต้องมาจากไฟล์เหล่านี้ ห้ามมาจากความจำ

## 1. Test plan

อ่าน requirement ที่ผู้ใช้ให้, README, route หรือหน้าจอทั้งหมด และโค้ดของส่วนที่จะทดสอบ (ถ้ามี `graphify-out/graph.json` ให้ query graph ก่อน) แล้วเขียน `PLAN.md`:

- **ขอบเขต**: ทดสอบอะไร และไม่ทดสอบอะไร
- **สภาพแวดล้อม**: URL หรือคำสั่งรัน, browser, ขนาดจอ, บัญชี/role
- **flow หลัก**: สิ่งที่ผู้ใช้มาทำบ่อยที่สุด เรียงตามความเสี่ยง
- **test case**: ตาราง ID / flow / ขั้นตอน / ผลที่คาด / ประเภท (happy path, edge case, negative, regression)

ถ้าผู้ใช้ไม่ได้ให้ requirement ให้ใช้พฤติกรรมที่ระบบแสดงออก (ข้อความบนหน้าจอ, label, เอกสาร) เป็นผลที่คาด แล้วเขียนเป็นสมมติฐาน

## 2. ทดสอบ

ทำครบทุกข้อสำหรับแต่ละ flow หลัก:

1. **happy path** เดินตั้งแต่ต้นจนจบแบบผู้ใช้จริง ด้วยข้อมูลที่หน้าตาเหมือนข้อมูลจริง แล้วตรวจผลปลายทาง: ข้อมูลถูกบันทึกจริง ตัวเลขถูก และหน้าอื่นที่ใช้ข้อมูลนี้แสดงถูก
2. **edge case และ negative**:
   - ค่าว่าง, ช่องว่างล้วน, ข้อความยาวมาก (500+ ตัวอักษร)
   - ภาษาไทยที่มีสระบนล่าง (`ผู้ใช้ที่ปรึกษา`), emoji, อักขระพิเศษ (`<script>`, `' OR 1=1`, `../`)
   - ตัวเลขติดลบ, ศูนย์, ทศนิยม, ค่าที่ใหญ่มาก
   - รูปแบบผิด เช่น อีเมล วันที่ เบอร์โทร
3. **การใช้งานที่ผิดจังหวะ**: กดซ้ำเร็วๆ, ย้อนกลับหรือ refresh กลางทาง, เปิดสองแท็บพร้อมกัน, ใช้ลิงก์เก่าหลังลบข้อมูล
4. **state**: empty, loading, error และ success ของทุกหน้าจอ บังคับให้เกิด error เช่น ปิด network ด้วย `page.cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })` แล้วเปิดคืน
5. **mobile**: ทำ flow หลักซ้ำที่ 375px ตรวจ scroll แนวนอน (`document.documentElement.scrollWidth > innerWidth`), ปุ่มที่เล็กกว่า 44px และข้อความที่ถูกตัด
6. **accessibility**: ใช้ keyboard อย่างเดียว (Tab, Enter, Esc) ทำ flow หลักให้จบ ตรวจ focus ที่มองเห็นได้, label ของ input, alt ของรูป และ contrast ของข้อความหลัก
7. **console และ network**: อ่าน console error, request ที่ fail หรือได้ 4xx/5xx และ log ฝั่ง server (ถ้ารัน local) ทุก flow แม้หน้าจอจะดูปกติ
8. **regression**: รัน test ที่โปรเจกต์มีอยู่ (`npm test`, `pytest` ฯลฯ) หนึ่งครั้ง แล้วบันทึกผล

API หรือ CLI: ใช้หลักเดียวกันโดยเปลี่ยนจาก browser เป็น `curl` หรือคำสั่งจริง ตรวจ status code, รูปแบบ response, ข้อความ error และสิ่งที่ถูกบันทึก

ถ้ามี flow อิสระเกิน 4 flow ให้แตก subagent ทดสอบพร้อมกันได้ flow ละตัว แต่ละตัวใช้ TaskSpace ที่ตั้งชื่อของตัวเอง (skill นี้อนุญาต) และต้อง `finish()` ตอนจบ ส่วน flow ที่ต้อง login ให้ตัวหลักทดสอบเอง ทุกตัวต้องใส่กติกาในหัวข้อนี้และรูปแบบ bug ในข้อ 3 ไว้ใน prompt ตัวหลักต้องตรวจ bug ที่ตัวลูกรายงานซ้ำด้วยตัวเองก่อนใส่ในรายงาน

## 3. บันทึก bug

reproduce ทุก bug ซ้ำอย่างน้อย 2 ครั้งก่อนบันทึก ถ้าเกิดไม่ทุกครั้ง ให้บอกความถี่ (เช่น 2 ใน 5) แต่ละ bug มี:

- **ID** (`BUG-01`) และ **ชื่อ** ที่บอกอาการ ไม่ใช่สาเหตุที่เดา
- **ความรุนแรง**:
  - S1 วิกฤต: ข้อมูลหายหรือเสีย, ความปลอดภัย, flow หลักใช้ไม่ได้เลย
  - S2 สูง: flow หลักผิดแต่มีทางเลี่ยง
  - S3 กลาง: flow รองผิด หรือแสดงผลผิดจนสับสน
  - S4 ต่ำ: ความสวยงาม ข้อความ
- **สภาพแวดล้อม**: URL, ขนาดจอ, role
- **ขั้นตอน reproduce**: เป็นข้อ เริ่มจากสถานะที่ชัดเจน
- **ผลที่คาด** และ **ผลจริง**
- **หลักฐาน**: screenshot ฝังด้วย path เต็ม `![BUG-01](/abs/path/screens/bug-01.png)`, console error หรือ response ที่เกี่ยว
- **จุดที่น่าจะเป็นต้นเหตุ** (ถ้าดูจากโค้ดแล้วเห็น) เป็น `file:line` เขียนเป็นข้อสันนิษฐาน

## 4. รายงาน PDF

เขียน `REPORT.md` เป็นภาษาไทย:

1. **หัวเรื่อง** (`#` บรรทัดแรก) แล้วตามด้วยย่อหน้าแรก: คำตัดสิน **พร้อมขึ้น / ขึ้นได้ถ้าแก้ S1-S2 ก่อน / ยังไม่พร้อม** พร้อมจำนวน bug แยกตามความรุนแรง
2. **ตารางสรุป bug**: ID / ชื่อ / ความรุนแรง / flow / ความถี่
3. **ผลตาม test case**: ID / ผล (ผ่าน, ไม่ผ่าน, ทดสอบไม่ได้) / bug ที่เกี่ยว
4. **รายละเอียด bug** ทีละตัวตามข้อ 3
5. **ขอบเขตและสภาพแวดล้อม** และ **สิ่งที่ทดสอบไม่ได้** พร้อมเหตุผล
6. **ความเสี่ยงที่เหลือ**: ส่วนที่ทดสอบน้อย หรือมีกลิ่นว่าจะพังแต่ยัง reproduce ไม่ได้

แปลงเป็น PDF: `bash "{path_to_skill}/scripts/md-to-pdf.sh" "<โฟลเดอร์ qa>/REPORT.md"` (`{path_to_skill}` คือ directory ที่ SKILL.md นี้ถูกโหลดมา) แล้ว `open` PDF และบอก path ของทั้ง .md และ .pdf ถ้า script fail ให้ส่งแค่ .md พร้อมเหตุผล ก่อนส่ง ให้เปิด PDF ดูหน้าที่มีตาราง bug และหน้าที่มีรูป ว่าไม่ล้นขอบและรูปขึ้นครบ

ปิด TaskSpace ของ ego-browser (`finish()`) ลบข้อมูลทดสอบที่สร้างไว้ แล้วตอบในแชท: คำตัดสิน, ตารางสรุป bug และ path ของ PDF จากนั้นถามว่าจะให้แก้ bug ข้อไหนด้วย `/mrn:prove-it`
