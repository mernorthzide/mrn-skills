---
name: loop
description: Hardens a plan with Claude and Codex working as a pair, then builds it and has the other model inspect the code. Claude settles requirements and writes PLAN.md, Codex reviews the plan read-only until it approves (or the round cap is hit), the chosen builder (Claude by default, Codex on request) implements it, and a fresh session of the model that did not build inspects the final diff. Every finding is checked against the code before it is acted on, and approval is bound to the exact plan hash. Use when the user says "loop", "claudex", "ให้ codex ช่วยตรวจแผน", "วางแผนแล้วให้อีกตัวตรวจ", "plan แล้วสร้างแบบ cross review", or for a feature, refactor or migration where a wrong plan is expensive. Not for small edits or recurring/interval tasks.
argument-hint: "<งานที่ต้องการ หรือ path ของแผน> [builder=claude|codex] [mode=full|review] [rounds=3]"
---

# Loop

งานจบเมื่อ Codex อนุมัติแผนฉบับสุดท้าย (hash ตรงกับไฟล์จริง), โค้ดผ่านคำสั่งพิสูจน์ในแผน และ model ที่ไม่ได้เขียนโค้ดตรวจ diff สุดท้ายแล้วไม่มี finding ระดับ high ค้าง หรือถึงเพดานรอบแล้วรายงานสิ่งที่ค้างตรงๆ

แนวคิดหลัก: **คนเขียนไม่ตรวจงานตัวเอง** Claude ใน session นี้เป็นผู้ประสานงาน (คุยกับผู้ใช้ เขียนแผน ตัดสิน finding) ส่วน Codex เป็น reviewer ของแผน และ model ที่ไม่ได้ build เป็นผู้ตรวจโค้ด

| บทบาท | ใคร |
|---|---|
| requirement, แผน, ตัดสิน finding | Claude (session นี้) |
| review แผน | Codex แบบ read-only, session เดิมทุกรอบ |
| builder | Claude (ค่าเริ่มต้น) หรือ Codex ถ้า `builder=codex` |
| ตรวจโค้ด | ฝั่งตรงข้ามกับ builder, session ใหม่ทุกครั้ง |

## กติกาตลอดงาน

- **เรียก Codex**: ผ่าน `codex:codex-rescue` ตาม `~/.claude/agent-skills/codex.md` (อ่านก่อนเรียกครั้งแรก) ใช้ `--model gpt-6.1-sol --effort high` และ `xhigh` เมื่องานแตะ security, เงิน/บัญชี, data/migration หรือ concurrency/cache รันเป็น background แล้วรอ task-notification
  - review และตรวจโค้ด: ไม่ใส่ `--write` (read-only) ในข้อความสั่งให้ห้ามแก้ไฟล์และไม่รัน test ชุดใหญ่
  - รอบถัดไปของ reviewer เดิม: ใส่ `--resume` ส่วนการตรวจโค้ดใช้ `--fresh` เสมอ ห้ามเรียก Codex งานอื่นใน repo นี้คั่นระหว่างรอบ review เพราะ `--resume` ต่อจาก task ล่าสุด
- **Claude เป็นผู้ตรวจ**: ส่ง Agent ใหม่ (`general-purpose`) ที่ไม่มีบริบทของงานนี้ ให้แค่แผน, base commit และคำสั่งให้อ่านอย่างเดียว
- **ผลที่ต้องได้จากผู้ตรวจทุกครั้ง** (ใส่ใน prompt): `verdict` = APPROVED / REVISE / BLOCKED, `findings` (id, severity high/medium/low, path:line, หลักฐาน, วิธีแก้), `coverage` (ไฟล์และ requirement ที่อ่านจริง), `limitations` APPROVED ที่มี finding high หรือ medium ค้าง ไม่นับว่าอนุมัติ ผลว่าง, error หรือ timeout ไม่นับว่าอนุมัติ
- **ตัดสิน finding เอง**: ตรวจทุกข้อกับโค้ดจริงก่อนทำ ข้อที่จริงให้แก้ ข้อที่ไม่จริงให้ปฏิเสธพร้อมหลักฐาน แล้วส่งเหตุผลให้ reviewer ในรอบถัดไป ห้ามรื้อข้อที่ตัดสินแล้วถ้าไม่มีหลักฐานใหม่
- **บันทึก**: `LOOP-LOG.md` ข้าง `PLAN.md` เขียนต่อท้ายอย่างเดียว ทุกรอบมี: รอบ, ผู้ตรวจและโมเดล, verdict, hash ของแผน, finding พร้อมคำตัดสิน (แก้ / ปฏิเสธเพราะ...) ห้าม commit `LOOP-LOG.md` และผลดิบของ CLI (เพิ่มลง `.git/info/exclude`)
- **สิทธิ์**: สั่งแค่วางแผน = ทำถึงขั้น 3 แล้วหยุดถาม สั่งทำทั้งงาน = build ต่อได้ไม่ต้องถามซ้ำ commit, push และ deploy ทำเมื่อผู้ใช้สั่งเท่านั้น
- **ทดสอบ**: ตามระดับงานใน CLAUDE.md งาน UI ทดสอบใน ego-browser ทั้ง desktop และ mobile งานใหญ่หรือเสี่ยงใช้ `mrn:prove-it` เป็นคำสั่งพิสูจน์ การตรวจโค้ดในขั้น 5 นับเป็น Codex review ของงานนี้แล้ว ไม่ต้อง review ซ้ำ

| เพดาน | ค่าเริ่มต้น |
|---|---|
| รอบ review แผน (`rounds`) | 3 |
| รอบแก้หลัง build ที่ proof ไม่ผ่าน | 2 |
| รอบตรวจโค้ด | 2 (รอบแรก + รอบตรวจการแก้ ตาม codex.md) |

ก่อนเริ่ม แสดงบทบาท, path ของแผน, เพดานรอบ และโมเดลที่จะใช้ในตารางเดียว

## 1. สำรวจ (recon)

- โปรเจกต์ที่มีอยู่: อ่านโค้ดที่เกี่ยว, caller และตัวที่เขียน state ร่วม (ใช้ graphify ถ้ามี `graphify-out/graph.json`), `CONTEXT.md` และ `docs/adr/` ถ้ามี
- งานใหม่: หา prior art, stack ที่เหมาะ และจุดที่มักพัง ด้วย WebSearch (`mode: "standard"`) ส่ง `mrn:deep-research` เฉพาะเมื่อผู้ใช้ขอ
- ถ้า `builder=codex` เช็กว่า Codex มีเครื่องมือที่งานต้องใช้ (MCP, browser, credential ของ session นี้ไม่ตามไปด้วย)

แสดง **ตารางสมมติฐาน**: สมมติฐาน / ที่มา (path หรือ URL) / ถ้าผิดจะเสียอะไร

## 2. ตั้ง requirement และเขียนแผน

ถามรอบเดียว (AskUserQuestion ไม่เกิน 4 ข้อ ตัวเลือกที่แนะนำไว้แรก) เฉพาะเรื่องที่คำตอบเปลี่ยนสิ่งที่สร้างและโค้ดตอบไม่ได้ เรื่องที่ย้อนได้ให้เลือกเองแล้วใส่ `(สมมติ)` ถ้าคำศัพท์ของโดเมนกำกวม หรือเจอการตัดสินใจที่ย้อนยาก ให้ใช้ `mattpocock-skills:domain-modeling` บันทึกลง `CONTEXT.md` หรือ ADR

เขียน `PLAN.md`:
- **เป้าหมาย** และ acceptance criteria ที่สังเกตได้
- **วิธีทำ**: การตัดสินใจหลัก, trade-off, สิ่งที่ไม่ทำ, ไฟล์ที่จะแตะ
- **สมมติฐาน** พร้อมที่มา และความเสี่ยงที่เหลือ
- **พิสูจน์**: คำสั่งที่รันได้พร้อมผลที่คาด และสิ่งที่ต้องดูด้วยตา (หน้าไหน จอไหน)

`mode=review`: โหลดแผนที่ผู้ใช้ให้มา เติมเฉพาะช่องที่ขาด แล้วไปขั้น 3 เลย

เสร็จเมื่อ: ทุก acceptance criteria มีคำสั่งพิสูจน์หรือวิธีตรวจผูกไว้

## 3. Codex review แผน

1. บันทึก `shasum -a 256 PLAN.md` ลง log
2. ส่ง Codex (read-only) พร้อมเนื้อหาแผน สั่งให้อ่านโค้ดที่เกี่ยวได้ หาสิ่งที่ทำให้แผนพังหรือขาด พร้อมหลักฐานจากไฟล์จริง และคืนผลตามรูปแบบในกติกา
3. ตาม verdict:
   - **APPROVED**: ตรวจว่า hash ยังตรงกับไฟล์ แผนที่แก้หลังอนุมัติต้อง review ใหม่
   - **REVISE**: ตัดสินทีละ finding แก้แผน จดคำตัดสินลง log แล้วส่งรอบถัดไปด้วย `--resume` พร้อมคำตัดสิน
   - **BLOCKED หรือเรียกไม่สำเร็จ**: บอกผู้ใช้ว่าติดอะไร ห้าม retry ซ้ำแบบเดิม และห้ามเปลี่ยนไปใช้ reviewer อื่นเงียบๆ
4. ครบเพดานรอบแล้วยังไม่ APPROVED: แสดง finding ที่ค้างพร้อมจุดยืนของ Claude ให้ผู้ใช้ตัดสินว่าจะแก้ต่อหรือไปต่อ ถ้าไปต่อให้จดใน log ว่า "ไปต่อโดยแผนยังไม่ได้รับอนุมัติ" และห้ามเรียกว่าอนุมัติ

เสร็จเมื่อ: APPROVED ที่ hash ตรงกับ `PLAN.md` ปัจจุบัน หรือผู้ใช้สั่งไปต่อและบันทึกไว้แล้ว

## 4. Build

1. จด base commit (`git rev-parse HEAD`) งานที่ค้างในโฟลเดอร์ซึ่งไม่เกี่ยวกับงานนี้ ให้ build ใน worktree แยก (`EnterWorktree` หรือ `git worktree add`) ห้าม stash งานของคนอื่น
2. builder ตามบทบาท:
   - **Claude**: ทำตามแผนด้วย tool ปกติ งานที่แตกเป็น module อิสระได้ใช้ `mrn:swarm`
   - **Codex**: ส่ง `codex:codex-rescue` พร้อม `--write` ใน worktree ที่สะอาด แนบแผนฉบับที่อนุมัติ, acceptance criteria และคำสั่งพิสูจน์ รอบแก้ใช้ `--resume` พร้อมรายการที่ต้องแก้
3. Claude รันคำสั่งพิสูจน์เอง (ไม่เชื่อรายงานของ builder) และอ่านทุกไฟล์ที่เปลี่ยนจาก base รวมไฟล์ใหม่และไฟล์ที่ลบ test ที่เปลี่ยนต้องยังวัด acceptance criteria จริง ไม่ใช่แก้ให้ตรงกับสิ่งที่โค้ดทำ proof ไม่ผ่าน: แก้ได้ตามเพดาน ถ้ายังไม่ผ่านให้หยุดแล้วรายงาน

เสร็จเมื่อ: คำสั่งพิสูจน์ทุกตัวผ่านจากการรันของ Claude เอง

## 5. ตรวจโค้ดแบบไขว้

1. ส่งผู้ตรวจฝั่งตรงข้ามกับ builder ใน session ใหม่ พร้อมแผน, base commit, `git diff <base>` และรายการไฟล์ใหม่ที่ยังไม่ track สั่งให้เปิดไฟล์ใหม่ทุกไฟล์
2. ตัดสิน finding แล้วแก้ รันคำสั่งพิสูจน์ที่เกี่ยวใหม่ แล้วตรวจรอบ 2 ด้วย session ใหม่อีกครั้ง
3. **ใครแก้ ฝั่งตรงข้ามตรวจ**: ถ้า Claude เข้าไปแก้โค้ดที่ Codex build ส่วนนั้นต้องให้ Codex ตรวจ ถ้าทั้งสองฝั่งเขียนโค้ด ให้จดใน log ว่าใครเขียนไฟล์ไหน แล้วให้แต่ละฝั่งตรวจส่วนของอีกฝั่ง ผลตรวจครอบคลุมแค่โค้ด ณ ตอนที่ตรวจ การแก้หลังจากนั้นถือว่ายังไม่ได้ตรวจ
4. รอบ 2 ยังเจอ high หรือ critical ที่ตรวจแล้วว่าจริง: หยุดและรายงานว่าส่วนนั้นต้องออกแบบใหม่ ระดับ medium ลงไปให้แก้แล้วจบ

## 6. รายงาน

ประโยคแรกบอกสถานะ (แผนอนุมัติไหม, proof ผ่านไหม, ตรวจโค้ดผ่านไหม) แล้วตาม:

| ขั้น | ผู้ทำ / ผู้ตรวจ | รอบ | ผล | หลักฐาน |
|---|---|---|---|---|

- สิ่งที่แผนเปลี่ยนไปเพราะ review (finding ที่มีค่าที่สุด 2-3 ข้อ)
- diff สรุปตามไฟล์, ผลคำสั่งพิสูจน์, finding ที่ค้าง, ส่วนที่ยังไม่ได้ตรวจ และจุดที่ทำต่างจากแผน
- path ของ `PLAN.md` และ `LOOP-LOG.md`
- ถ้ายังไม่ได้รับสิทธิ์ commit ให้ทิ้ง diff ไว้พร้อมให้ผู้ใช้ดู แล้วเสนอ `mrn:ship` หรือ `mrn:finish-worktree`
