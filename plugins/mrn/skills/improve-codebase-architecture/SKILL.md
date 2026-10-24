---
name: improve-codebase-architecture
description: Scans a codebase for deepening opportunities with parallel read-only explorers, checks each candidate's evidence with a skeptic, presents them as a visual HTML report in Thai, then grills through whichever one the user picks and hands off to an issue or a TDD implementation.
disable-model-invocation: true
argument-hint: "[module, subsystem หรือ pain point ที่อยากให้ดู (ว่างไว้ = หาจาก hot spot)]"
---

# Improve codebase architecture

หา **deepening opportunity**: refactor ที่เปลี่ยน module ตื้นให้ลึก เพื่อให้ test ง่ายขึ้นและ AI อ่านโค้ดเข้าใจง่ายขึ้น

**ภาษา**: คุยกับผู้ใช้และเขียน report เป็นภาษาไทย แต่ศัพท์สถาปัตยกรรมใช้คำอังกฤษตรงตัว
- เรียก Skill tool ด้วย `mattpocock-skills:codebase-design` ก่อนเริ่ม (ไม่มี: ดู **skill ภายนอก**) เพื่อโหลดศัพท์ (**module**, **interface**, **implementation**, **depth**, **deep**, **shallow**, **seam**, **adapter**, **leverage**, **locality**) และหลักการ (deletion test, "the interface is the test surface", "one adapter = hypothetical seam, two = real")
- ห้ามใช้คำแทน เช่น component, service, API, boundary, layer หรือ wrapper (เมื่อหมายถึง module)

**เอกสาร domain**: อ่าน `CONTEXT.md` หรือ `CONTEXT-MAP.md` ที่ root ถ้ามี (ถ้าไม่มีให้ดู `GLOSSARY.md`) และ ADR ใน `docs/adr/` ของส่วนที่จะดู ถ้าไม่มีไฟล์เหล่านี้ให้ข้ามไปเงียบๆ ชื่อของ domain concept ต้องตรงกับในเอกสารนี้

**ห้ามแก้โค้ดในขั้น 1-3** งานแก้เกิดหลังผู้ใช้เลือกในขั้น 5 เท่านั้น

## เครื่องมือ: ใช้ตัวที่มีจริง

ใช้ตัวแรกในลำดับที่มีอยู่จริงใน session นี้ ตรวจจากรายการ tool และ skill ที่โหลดอยู่ หรือ `command -v <ชื่อ>` ก่อนใช้ ถ้า CLAUDE.md หรือกฎของผู้ใช้กำหนดเครื่องมือไว้ ให้ใช้ตามนั้นก่อนตาราง การติดตั้งเครื่องมือใหม่ต้องถามผู้ใช้ก่อน

| งาน | ลำดับทางเลือก |
|---|---|
| **skill ภายนอก** (`codebase-design`, `grilling`, `domain-modeling`, `tdd`) | plugin `mattpocock-skills` ซึ่งควรติดตั้งไว้ (`claude plugin install mattpocock-skills@claude-plugins-official`) → ทำขั้นนั้นเองตามที่ skill นี้เขียนไว้: ใช้ศัพท์และหลักการในหัวข้อ **ภาษา**, grilling คือถามผู้ใช้ทีละคำถามพร้อมคำตอบที่แนะนำจนทุกกิ่งของ decision tree ตัดสินแล้ว, domain-modeling คือแก้เอกสาร domain และเขียน ADR ใน `docs/adr/` ตามขั้น 5, TDD คือเขียน test ที่ fail ผ่าน interface ใหม่ทีละตัวแล้วแก้จนผ่านก่อน refactor |
| **browser** (ตรวจ HTML report) | browser skill หรือ MCP ที่ผู้ใช้กำหนด (เช่น ego-browser) → browser automation ใดๆ ที่มี (Playwright, Chrome DevTools, Claude in Chrome) → ตรวจจาก PDF อย่างเดียว |
| **issue tracker** | `docs/agents/issue-tracker.md` ของ repo ถ้ามี → GitHub issue ของ repo ปัจจุบันด้วย `gh` → ไม่มี `gh`: เขียนเนื้อหา issue ให้ผู้ใช้เปิดเอง |
| **กฎการทดสอบ** | กฎที่ผู้ใช้กำหนด (CLAUDE.md หรือกฎของผู้ใช้) → test เดิมต้องผ่านโดยไม่แก้ assertion, รัน test ที่เกี่ยวระหว่าง refactor และ test ทั้งชุดก่อนรายงาน |
| **ผู้ตรวจอิสระ** | review tool ภายนอกที่ผู้ใช้ใช้อยู่ (เช่น Codex) → subagent ใหม่ผ่าน Agent tool → ถ้าไม่มีทั้งคู่ ทำรอบ review แยกโดยอ่านแค่ diff แล้วระบุในรายงานว่าไม่ใช่ผู้ตรวจอิสระ |

## 1. กำหนดขอบเขตก่อนสำรวจ (YAGNI)

module ที่ทำให้ลึกขึ้นจะคุ้มเมื่อมันถูกแก้บ่อย จึงให้น้ำหนักกับส่วนที่เปลี่ยนบ่อย:

- ผู้ใช้ระบุทิศทางมา (module, subsystem หรือ pain point): ใช้ตามนั้น แล้วข้ามการหา hot spot
- ไม่ได้ระบุ: หา hot spot จาก git

```bash
git log --since="6 months ago" --name-only --format= | grep -v '^$' | sort | uniq -c | sort -rn | head -30
```

ถ้าไม่มี git, มี commit น้อยกว่าราว 20 ครั้ง หรือการแก้กระจายจนไม่มี hot spot ให้ขยายไปดูทั้ง repo โดยเริ่มจากจุดที่โค้ดหนาแน่นที่สุด

ถ้ามี `graphify-out/graph.json` ให้ใช้ graph ก่อน grep (`graphify query "..."`, `graphify explain "X"`, `graphify affected "X" --depth 4` ใส่ `--graph graphify-out/graph.json`) เพื่อหา node ที่มีคนเรียกเยอะและกลุ่มที่ผูกกันแน่น graph อาจเก่ากว่าโค้ด ถ้าชี้ไปที่โค้ดที่ไม่มีแล้วให้รัน `graphify update .` แล้ว query ใหม่

แบ่ง hot spot เป็น 1-4 พื้นที่ที่ไม่ทับกัน

## 2. สำรวจแบบขนาน

แตก Agent หนึ่งตัวต่อหนึ่งพื้นที่ใน message เดียว (`subagent_type: "general-purpose"`, `model: "opus"`, `effort: "high"`, foreground) สั่งให้อ่านอย่างเดียว ห้ามแก้ไฟล์ ใน prompt ให้ใส่ path ของพื้นที่, ศัพท์จาก codebase-design, ชื่อ domain จาก CONTEXT.md และคำถามเหล่านี้:

- ตรงไหนที่ต้องเข้าใจ concept เดียวแต่ต้องกระโดดไปมาหลาย module เล็กๆ
- module ไหน **shallow** คือ interface ซับซ้อนเกือบเท่า implementation
- ตรงไหนที่แยก pure function ออกมาเพื่อ test แต่ bug จริงซ่อนอยู่ตรงที่เรียกใช้ (ไม่มี **locality**)
- module ไหนผูกกันแน่นจนรั่วข้าม seam
- ส่วนไหนไม่มี test หรือ test ผ่าน interface ปัจจุบันได้ยาก

ให้ใช้ **deletion test** กับทุกจุดที่สงสัยว่า shallow: ถ้าลบทิ้ง ความซับซ้อนจะมารวมอยู่ที่เดียว หรือแค่ย้ายไปที่อื่น ถ้ามารวมที่เดียวคือสัญญาณที่ต้องการ

ให้แต่ละตัวส่งกลับ candidate ไม่เกิน 4 ข้อ แต่ละข้อมี:
- ไฟล์ที่เกี่ยว
- **หลักฐาน `file:line`** อย่างน้อย 2 จุด
- จำนวน call site
- สถานะ test ของส่วนนั้น
- ผล deletion test
- ระดับความมั่นใจ (`Strong` / `Worth exploring` / `Speculative`)

## 3. ตรวจหลักฐาน

แตก Agent หนึ่งตัวเป็น skeptic (`model: "opus"`, `effort: "xhigh"`, read-only) ส่ง candidate ระดับ `Strong` และ `Worth exploring` ทั้งหมดไป สั่งให้เปิด `file:line` ทุกจุด แล้วพยายามหักล้างแต่ละข้อ:
- หลักฐานมีอยู่จริงและตรงกับที่อ้างไหม
- ความซับซ้อนนั้นจำเป็นอยู่แล้วหรือเปล่า
- ADR หรือ test ที่มีอยู่ขัดกับข้อเสนอไหม

ให้ส่งกลับคำตัดสินรายข้อ: `ยืนยัน` / `ลดระดับ` / `ตัดทิ้ง` พร้อมเหตุผล ตัวหลักอ่านผลแล้วปรับรายการเอง candidate ที่หลักฐานไม่จริงห้ามอยู่ใน report

## 4. เขียน HTML report

เขียนไฟล์ HTML ไฟล์เดียวไว้ที่ `${TMPDIR:-/tmp}/architecture-review-<repo>-<YYYYMMDD-HHMM>.html` เพื่อไม่ให้มีไฟล์ใหม่ใน repo ดู scaffold, รูปแบบ diagram และ style ได้ที่ [HTML-REPORT.md](HTML-REPORT.md)

จากนั้นแปลงเป็น PDF ไว้ข้างกัน: `bash "{path_to_skill}/../../scripts/to-pdf.sh" "<html>"` (`{path_to_skill}` คือ directory ที่ SKILL.md นี้ถูกโหลดมา) script จะรอให้ Tailwind กับ Mermaid render ก่อนพิมพ์ แล้วพิมพ์ path ของ PDF ออกมา `open` PDF ให้ผู้ใช้ และบอก absolute path ของทั้ง PDF และ HTML ถ้า script fail เพราะหา Chrome ไม่เจอ ให้ส่ง HTML อย่างเดียวและบอกเหตุผล

แต่ละ candidate เป็นการ์ดหนึ่งใบ มี:
- ไฟล์ที่เกี่ยว และหลักฐาน `file:line`
- ปัญหา: หนึ่งประโยค
- ทางแก้: หนึ่งประโยค
- ประโยชน์: อธิบายด้วย locality และ leverage และบอกว่า test จะดีขึ้นอย่างไร
- diagram before/after วางคู่กัน
- badge ระดับความมั่นใจ

ปิดท้ายด้วยส่วน **แนะนำให้ทำก่อน**: เลือก candidate ที่ควรทำก่อนพร้อมเหตุผล

ถ้า candidate ขัดกับ ADR ให้ใส่เฉพาะเมื่อปัญหาหนักพอจะเปิด ADR ใหม่ และใส่ callout ว่า _"ขัดกับ ADR-0007 แต่ควรเปิดใหม่เพราะ…"_ ไม่ต้องไล่ refactor เชิงทฤษฎีทุกข้อที่ ADR ห้ามไว้

ก่อนส่ง ให้เปิด HTML ใน **browser** แล้วถ่าย screenshot ตรวจว่า mermaid ทุกอัน render ได้ (ไม่มีข้อความ "Syntax error") และภาษาไทยไม่แตก แล้วดู PDF อย่างน้อยหน้าแรกกับหน้าที่มี diagram เยอะที่สุด ว่าตัวอักษรใน diagram ยังอ่านได้และการ์ดไม่ถูกตัดกลางหน้า ถ้าพังให้แก้ HTML แล้วสร้าง PDF ใหม่

**ยังไม่ต้องเสนอ interface** เขียนไฟล์เสร็จแล้ว ให้ถามผู้ใช้ว่า "อยากสำรวจข้อไหน" แล้วหยุดรอ

## 5. Grilling loop

เมื่อผู้ใช้เลือกแล้ว ให้เรียก Skill tool ด้วย `mattpocock-skills:grilling` (ไม่มี: ดู **skill ภายนอก**) แล้วไล่ decision tree กับผู้ใช้เป็นภาษาไทย: constraint, dependency, หน้าตาของ module ที่ลึกขึ้น, อะไรอยู่หลัง seam และ test ไหนจะยังอยู่ ถ้าต้องหาข้อเท็จจริงในโค้ด ให้หาเอง ห้ามถามผู้ใช้

ระหว่างคุย ถ้าเกิดการตัดสินใจเรื่องชื่อหรือเรื่องสำคัญ ให้เรียก Skill tool ด้วย `mattpocock-skills:domain-modeling` (ไม่มี: ดู **skill ภายนอก**) แล้วบันทึกทันที:
- **ตั้งชื่อ module ใหม่ด้วย concept ที่ยังไม่อยู่ในเอกสาร domain**: เพิ่มคำนั้นลงใน `CONTEXT.md` (หรือ `GLOSSARY.md` ถ้า repo ใช้ไฟล์นั้นอยู่แล้ว) ถ้ายังไม่มีไฟล์ ให้สร้าง `CONTEXT.md`
- **ทำให้คำที่กำกวมชัดขึ้น**: อัปเดตเอกสาร domain ทันที
- **ผู้ใช้ปฏิเสธ candidate ด้วยเหตุผลที่สำคัญต่ออนาคต**: เสนอว่า _"บันทึกเป็น ADR ไว้ไหม รอบหน้าจะได้ไม่เสนอซ้ำ"_ ไม่ต้องเสนอถ้าเหตุผลเป็นเรื่องชั่วคราว เช่น "ตอนนี้ยังไม่คุ้ม"
- **อยากลองหลาย interface**: ใช้รูปแบบ design-it-twice ของ `mattpocock-skills:codebase-design` ซึ่งแตก subagent หลายตัวออกแบบพร้อมกัน

ห้ามลงมือจนกว่าผู้ใช้ยืนยันว่าเข้าใจตรงกันแล้ว

## 6. ส่งต่อ

เมื่อผู้ใช้ยืนยันแล้ว ให้ใช้ AskUserQuestion ถามว่าจะไปทางไหนต่อ:
1. **เปิด issue** ตาม **issue tracker** ใส่ label `ready-for-agent` เนื้อหาคือข้อสรุปจาก grilling, interface ที่ตกลงกัน และ test ที่ต้องมี
2. **ลงมือเลย**: ใช้ `mattpocock-skills:tdd` (ไม่มี: ดู **skill ภายนอก**) เขียน test ผ่าน interface ใหม่ก่อน แล้ว refactor ตาม **กฎการทดสอบ** และให้ **ผู้ตรวจอิสระ** review diff รัน test ทั้งชุดก่อนรายงานว่าเสร็จ
3. **จบแค่นี้**: สรุปการตัดสินใจ และบอก path ของ report กับไฟล์ domain ที่แก้ไป
