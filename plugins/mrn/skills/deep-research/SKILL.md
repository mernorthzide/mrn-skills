---
name: deep-research
description: Researches a question across many sources with parallel researcher subagents, then writes a cited narrative report in Thai and checks its citations against the sources before delivering it. Use when the user asks to research a topic in depth, compare options or alternatives, analyze a market, industry, trend or history, or review studies ("deep research", "research ให้หน่อย", "หาข้อมูลเชิงลึก", "เปรียบเทียบ ... ให้หน่อย", "วิเคราะห์ตลาด"). Preferred over anthropic-skills:deep-research.
argument-hint: "<คำถามหรือหัวข้อที่ต้องการ research>"
---

# Deep research

ตัวหลักเป็น **coordinator**: วิเคราะห์คำถาม แตก subagent และจัดการไฟล์ ไม่ research เอง ไม่เขียนรายงานเอง และไม่อ่านไฟล์ใน `references/` เอง เพื่อให้ context ของตัวหลักสะอาด

ถ้ามี task list tool ให้ใช้บอกความคืบหน้า โดยเขียนเป็นงาน ไม่ต้องพูดถึง subagent เช่น "ค้นข้อมูล" แทน "แตก research subagent"

## ขั้นตอน

1. ถามกลับ (เฉพาะเมื่อจำเป็น)
2. ตั้งชื่อเรื่องและสร้างโฟลเดอร์
3. แตกคำถามเป็นหัวข้อย่อย
4. แตก researcher ขนานกัน
5. research รอบเสริม (เฉพาะเมื่อจำเป็นจริงๆ และทำได้ครั้งเดียว)
6. แตก report writer
7. ตรวจ citation
8. ส่งรายงาน

ค่า model และ effort ของแต่ละ agent ใช้ตามตารางนี้เสมอ:

| agent | model | effort |
|---|---|---|
| researcher | `opus` | `high` |
| report writer | `opus` | `xhigh` |
| citation verifier | `opus` | `high` |

`{path_to_skill}` ด้านล่างคือ directory ที่ SKILL.md นี้ถูกโหลดมา

### 1. ถามกลับ (เฉพาะเมื่อจำเป็น)

ถามเฉพาะเมื่อคำตอบจะเปลี่ยนวิธี research จริง เช่น:
- คำย่อหรือศัพท์ที่มีหลายความหมาย
- คำถามที่คำตอบต่างกันมากตามประเทศ แต่ผู้ใช้ไม่ได้ระบุ (ถ้าไม่ระบุและเรื่องเกี่ยวกับตลาดหรือกฎหมาย ให้ถือว่าเป็นประเทศไทยก่อน แล้วค่อยถามถ้ายังกำกวม)
- ชื่อบริษัทหรือผลิตภัณฑ์ที่ซ้ำกันหลายราย

ถามด้วย AskUserQuestion เท่านั้น

### 2. ตั้งชื่อเรื่องและสร้างโฟลเดอร์

**ชื่อเรื่อง** ใช้เป็นชื่อโฟลเดอร์ notes และชื่อไฟล์รายงาน เขียนเป็นภาษาของผู้ใช้ 3-6 คำ ไม่เกิน 50 ตัวอักษร ใช้ได้แค่ตัวอักษร ตัวเลข และช่องว่างเดี่ยว ไม่มีเครื่องหมายวรรคตอน ขีด หรือ underscore เช่น "ผลกระทบ EU AI Act ต่อ startup"

**ที่เก็บ**: ใช้ directory เดียวกับที่ research ในบทสนทนานี้ใช้ไปแล้ว ถ้าเป็นครั้งแรก ให้ใช้ cwd ยกเว้น cwd เป็น `$HOME` หรืออยู่ใต้ `/tmp`, `/private/tmp` หรือ scratchpad (ซึ่งถูกลบเองได้) ให้ใช้ `~/research/` แทน

ก่อนตั้งชื่อ ให้นึกถึงรายงานที่ส่งไปแล้วในบทสนทนานี้ และ list `research_notes/` ถ้ามีอยู่ แล้วเลือกกรณี:
- **หัวข้อใหม่**: ตั้งชื่อใหม่
- **ต่อยอดหรืออัปเดตหัวข้อเดิม**: ตั้งชื่อที่ยังบอกหัวข้อเดิม และบอกว่ารอบนี้เพิ่มอะไร หรือใช้ชื่อเดิมต่อท้ายด้วยเลขถัดไป จด path ของรายงานและโฟลเดอร์ notes ล่าสุดของหัวข้อนั้นไว้ส่งให้ report writer ในขั้น 6
- **ผู้ใช้ขอให้ทำใหม่แบบอิสระ**: ตั้งชื่อแบบกรณีก่อนหน้า แต่ไม่ส่งของเดิมต่อ

ชื่อต้องไม่ซ้ำกับรายงานหรือโฟลเดอร์ที่มีอยู่ ห้ามเขียนทับ ย้าย หรือเปลี่ยนชื่อของเดิม

สร้าง `research_notes/{ชื่อเรื่อง}/` และ `reports/` ใส่ quote ทุกครั้งที่ใช้ path ใน shell เพราะชื่อมีช่องว่าง แล้วจด absolute path ของ directory ไว้

### 3. แตกคำถามเป็นหัวข้อย่อย

แบ่งคำถามเป็นหัวข้อย่อยที่ไม่ซ้อนกันและรวมกันแล้วครบ แล้วดูว่าหัวข้อไหนควรมีมุมมองอิสระหลายมุม

| จำนวน researcher | วิธีแบ่ง | ตัวอย่าง |
|---|---|---|
| 1 | แบ่งไม่ได้ เป็นคำถามข้อเท็จจริงข้อเดียว | "ใครชนะ Super Bowl 2024" |
| 3 | หัวข้อแคบที่มีไม่กี่มุม | "อุณหภูมิกับการอพยพของปลาแซลมอน" → กลไกชีวภาพ / ข้อมูลประชากร / การคาดการณ์สภาพอากาศ |
| 4 | หลายเกณฑ์ประเมิน | "เทียบ CRM สำหรับ SME" → ราคา / feature / integration / รีวิวผู้ใช้ |
| 5 | หลายประเทศหรือหลายโดเมน | "กฎหมาย AI ทั่วโลก" → สหรัฐ / EU / จีน / UK / การกำกับตัวเองของอุตสาหกรรม |
| 6+ | รายการใหญ่ที่ต้องไล่ให้ครบ | "อัตราการใช้รถ EV รายจังหวัด" → แบ่งตามภาค |

ถ้าไม่แน่ใจ ใช้ 3 คน ถ้ามี research เดิมให้ต่อยอด แตกเฉพาะส่วนที่รอบนี้เพิ่มหรือต้องตรวจซ้ำ

### 4. แตก researcher ขนานกัน

เรียก Agent ทุกตัวใน message เดียว เป็น foreground (`run_in_background: false`) ใส่ `subagent_type: "general-purpose"` พร้อม model และ effort ตามตาราง prompt ต้องชัดและเจาะจง และต้องส่งข้อจำกัดของคำถามเดิม (ช่วงเวลา ประเทศ) ต่อไปด้วย ใช้ format นี้ตรงตัว:

```
Research {หัวข้อย่อยที่เจาะจง}

Objective: {ผลลัพธ์ที่ต้องได้}

Key questions:
- {คำถามเจาะจง 1}
- {คำถามเจาะจง 2}

Suggested sources:
- {ประเภทแหล่งที่ควรใช้ก่อน}

Constraints:
- {ข้อจำกัดจากคำถามเดิม เช่น ช่วงเวลา ประเทศ}

Save your output notes to {absolute dir}/research_notes/{ชื่อเรื่อง}/{topic}.md

**As a first step, you must read {path_to_skill}/references/researcher.md for instructions on how to conduct research.**
```

### 5. research รอบเสริม (ทำได้ครั้งเดียว)

อ่านสรุปที่ researcher ส่งกลับ ถ้ามีช่องโหว่ที่ทำให้รายงานไม่ครบจริงๆ ค่อยแตก researcher เพิ่มแบบขนาน รอบนี้ทำให้ผู้ใช้รอนานขึ้น จึงต้องใช้อย่างระวัง และ **ทำได้ครั้งเดียวเท่านั้น** ถ้าเลือกทำ ให้พิมพ์ว่า "หลัง researcher ชุดนี้เสร็จ จะไปขั้นเขียนรายงานทันที" แล้วทำตามนั้นไม่ว่าผลจะออกมาเป็นอย่างไร

### 6. แตก report writer

แตก agent เดียว (foreground, general-purpose, model และ effort ตามตาราง) `{คำถามเต็ม}` คือคำถามที่รายงานต้องตอบให้ครบ ถ้าเป็นการต่อยอด ให้รวมคำถามเดิมกับส่วนที่เพิ่ม ไม่ใช่แค่ข้อความล่าสุด ใช้ format นี้:

```
Read the notes in {absolute dir}/research_notes/{ชื่อเรื่อง}/ and synthesize into a research report that answers: {คำถามเต็ม}

Earlier research in this conversation to build on: {absolute path ของรายงานและโฟลเดอร์ notes เดิมจากขั้น 2 หรือ "none"}

Save your final report to this exact path: {absolute dir}/reports/{ชื่อเรื่อง}.md

**As a first step, you must read {path_to_skill}/references/report-writer.md for instructions on how to write your research report.**
```

### 7. ตรวจ citation

แตก agent เดียว (foreground, general-purpose, model และ effort ตามตาราง):

```
Verify the citations in {absolute dir}/reports/{ชื่อเรื่อง}.md and fix the report in place.

Research notes for reference: {absolute dir}/research_notes/{ชื่อเรื่อง}/

Save your verification log to {absolute dir}/research_notes/{ชื่อเรื่อง}/_citation-check.md

**As a first step, you must read {path_to_skill}/references/verifier.md for instructions.**
```

### 8. ส่งรายงาน

แปลงรายงานเป็น PDF ไว้ข้างกัน: `bash "{path_to_skill}/../../scripts/to-pdf.sh" "{absolute dir}/reports/{ชื่อเรื่อง}.md"` script จะพิมพ์ path ของ PDF ออกมา แล้ว `open` PDF ให้ผู้ใช้ ถ้า script fail (ไม่มี Chrome หรือ npx) ให้ส่งแค่ .md และบอกเหตุผล

อ่านรายงานฉบับสุดท้ายกับบรรทัดสรุปใน `_citation-check.md` แล้วตอบผู้ใช้เป็นภาษาไทย 3-5 ประโยค: คำตอบหลัก, สิ่งที่ยังไม่แน่นอน, จำนวน claim ที่ตรวจแล้วกับที่แก้ไป และ absolute path ของทั้ง .md และ .pdf ถ้ามีเครื่องมือส่งไฟล์ให้ผู้ใช้ ให้ส่ง PDF ด้วย
