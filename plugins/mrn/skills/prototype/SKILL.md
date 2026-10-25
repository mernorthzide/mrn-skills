---
name: prototype
description: Turns a client-demo idea into a working Next.js prototype people can actually click through. Brainstorms with the requester until the demo's goal, story and scope are clear, writes the plan and demo script, waits for approval, builds the app (pages in parallel), tests it end to end (in a browser, mrn:qa) and hardens it until it is safe to demo live to a client. Use when the user says "prototype", "ทำ demo ให้ลูกค้า", "ทำต้นแบบเว็บ", "mockup ที่กดได้จริง", "POC".
argument-hint: "<ไอเดียหรือโจทย์ของ demo>"
---

# Prototype

งานจบเมื่อผู้สั่งเปิด demo ต่อหน้าลูกค้าได้ทันที: เดิน flow หลักได้จริงตั้งแต่ต้นจนจบ ข้อมูลดูสมจริง ไม่มีหน้าพัง ไม่มี error และ reset กลับสถานะเริ่มต้นได้ในคลิกเดียว **ห้ามเขียนโค้ดก่อนผู้สั่งยืนยันแผนในขั้น 2** (ถ้าผู้สั่งเขียนมาแล้วว่า "อนุมัติแผน" หรือ "ลงมือได้เลย" ถือว่ายืนยันแล้ว)

## เครื่องมือ: ใช้ตัวที่มีจริง

ใช้ตัวแรกในลำดับที่มีอยู่จริงใน session นี้ ตรวจจากรายการ tool และ skill ที่โหลดอยู่ หรือ `command -v <ชื่อ>` ก่อนใช้ ถ้า CLAUDE.md หรือกฎของผู้ใช้กำหนดเครื่องมือไว้ ให้ใช้ตามนั้นก่อนตาราง การติดตั้งเครื่องมือใหม่ต้องถามผู้ใช้ก่อน

| งาน | ลำดับทางเลือก |
|---|---|
| **browser** | browser skill หรือ MCP ที่ผู้ใช้กำหนด (เช่น ego-browser) → browser automation ใดๆ ที่มี (Playwright, Chrome DevTools, Claude in Chrome) → หยุดแล้วบอกผู้ใช้ว่างานนี้ต้องเห็นเว็บจริง พร้อมเสนอให้ติดตั้ง browser automation (เช่น Playwright MCP) |
| **กฎ UX/UI และการทดสอบ** | กฎที่ผู้ใช้กำหนด (CLAUDE.md หรือกฎของผู้ใช้) → checklist ในขั้น 4 ของ skill นี้ |
| **skill ออกแบบ** | `impeccable` ถ้าติดตั้งไว้ → `frontend-design` → checklist ในขั้น 4 ของ skill นี้ |

## กติกาตลอดงาน

- **ที่เก็บงาน**: สร้างโปรเจกต์ใน `<cwd>/<ชื่อ-demo>/` ถ้า cwd เป็น `$HOME` หรืออยู่ใต้ `/tmp`, `/private/tmp` หรือ scratchpad ให้ใช้ `~/prototypes/<ชื่อ-demo>/` เอกสาร (`BRIEF.md`, `PLAN.md`, `DEMO.md`) อยู่ที่ root ของโปรเจกต์
- **งานออกแบบ**: ใช้ **กฎ UX/UI และการทดสอบ** ตาม **เครื่องมือ** ทั้งหมด และโหลด **skill ออกแบบ** ก่อนสร้างหน้าแรก
- **browser**: ใช้ตาม **เครื่องมือ** ข้างบน ถ้าเป็น ego-browser ให้โหลด skill `ego-browser` แล้วทำตามคู่มือของมัน
- **ห้ามใช้ของจริงของลูกค้า** (ข้อมูลส่วนตัว, บัตรเครดิต, API ที่คิดเงิน) ถ้าไม่ได้รับอนุญาต ข้อมูลตัวอย่างต้องแต่งขึ้น และ integration ภายนอกต้องเป็น mock หรือ sandbox
- **deploy**: ต้องถามก่อนทุกครั้ง

## 1. Brainstorm

ช่วยผู้สั่งคิดให้จบก่อนลงมือ ไม่ใช่แค่ถามตามแบบฟอร์ม ข้อไหนผู้สั่งตอบไว้แล้วหรือเดาได้แน่จากบริบทไม่ต้องถาม ถามเป็นรอบด้วย AskUserQuestion (ไม่เกิน 4 ข้อต่อรอบ) ทุกข้อมีตัวเลือกที่แนะนำไว้แรกพร้อมคำว่า "(แนะนำ)" และถามเฉพาะข้อที่คำตอบจะเปลี่ยนสิ่งที่สร้าง

**รอบ 1: demo นี้เพื่ออะไร**
- ลูกค้าคือใคร อยู่ธุรกิจอะไร และใครจะนั่งดู demo
- หลังดู demo อยากให้ลูกค้าตัดสินใจอะไร (เซ็นสัญญา, เลือก scope, เห็นภาพระบบใหม่)
- **hero flow**: เรื่องเดียวที่ต้องเดินให้ลูกค้าเห็นแล้วว้าว เขียนเป็นขั้นตอนที่ผู้ใช้ทำ
- **wow moment**: จังหวะไหนใน demo ที่ต้องทำให้ลูกค้าประทับใจที่สุด

**รอบ 2: ขอบเขต**
- ผู้ใช้มีกี่ role (เช่น ลูกค้าปลายทาง, พนักงาน, admin) แต่ละ role ทำอะไรใน demo
- หน้าที่ต้องมี และหน้าที่ตัดออกได้
- อุปกรณ์ที่ใช้ demo (จอ projector, laptop, มือถือ, tablet)
- ภาษา (ไทย / อังกฤษ / สองภาษา)

**รอบ 3: ความสมจริงและข้อจำกัด**
- **ข้อมูลเก็บที่ไหน**:
  - เก็บใน browser + ปุ่ม reset (แนะนำสำหรับ demo: เร็ว ไม่มี backend ให้ล่มกลางห้องประชุม)
  - backend จริงด้วย Next.js route handler + SQLite ตอนรัน local หรือ Postgres ตอน deploy
  - เชื่อม API จริงของลูกค้า
- login: บัญชี demo ที่กดสลับ role ได้ (แนะนำ) / login จริง
- แบรนด์: ชื่อ, โลโก้, สี ของลูกค้า / แบรนด์กลาง
- จะ demo ที่ไหน: เครื่องตัวเอง (`npm start`) / Vercel preview / server ของลูกค้า และ deadline

**อ้างอิง**: หาผลิตภัณฑ์ชั้นนำในหมวดเดียวกัน 2-3 ราย (WebSearch หรือเปิดใน **browser**) แล้วจด pattern ที่ผู้ใช้คุ้นเคยอยู่แล้ว เพื่อให้ demo ดูน่าเชื่อถือ

เขียนผลลงใน `BRIEF.md`: เป้าหมาย, ผู้ชม, hero flow, wow moment, role, ขอบเขต, สิ่งที่ตัดออก, การตัดสินใจทุกข้อพร้อมเหตุผล และ pattern ที่ได้จากผลิตภัณฑ์อ้างอิง

## 2. แผนและยืนยัน

เขียน `PLAN.md`:
- **หน้าและ route**: ตาราง route / role / หน้าที่ / state ที่ต้องมี (empty, loading, error, success)
- **data model และข้อมูลตัวอย่าง**: entity, field และจำนวนข้อมูลตัวอย่าง ข้อมูลต้องดูจริง (ชื่อคนไทย, ราคา, วันที่ใกล้วันนี้) ห้ามใช้ lorem ipsum หรือ "test1"
- **อะไรจริง อะไรจำลอง**: ส่วนที่ทำงานจริง และส่วนที่เป็น mock พร้อมเหตุผล
- **stack**: Next.js (App Router, TypeScript, Tailwind) เวอร์ชันล่าสุดที่ stable (`npm view next version`) และ library เพิ่มเฉพาะที่จำเป็น
- **แบ่งงาน**: foundation ที่ต้องทำก่อน และหน้าที่แยกกันทำพร้อมกันได้
- **demo script** (ร่างของ `DEMO.md`): ขั้นตอนที่ผู้สั่งกดตอนนำเสนอ พร้อมสิ่งที่ควรพูด
- **test plan**: hero flow ทุก role และ edge case ที่ลูกค้าอาจลองกดเอง

แสดงสรุปแผน (ตารางหน้า, hero flow, อะไรจริง/จำลอง, ที่ deploy) แล้วถามว่า "ยืนยันแผนนี้ไหม" แก้จนได้คำยืนยันชัดเจน

## 3. สร้าง

1. **scaffold**: `npx -y create-next-app@<เวอร์ชันจาก npm view> <ชื่อ> --ts --tailwind --eslint --app --src-dir --use-npm --yes` (ดู flag ใน `--help` ก่อนถ้าเวอร์ชันเปลี่ยน) แล้ว `git init` และ commit แรก
2. **foundation ทำเองใน agent หลัก**: design token, font ที่อ่านภาษาไทยได้ดี (`next/font/google` เช่น IBM Plex Sans Thai หรือ Noto Sans Thai), layout, navigation, component กลาง, data model, ข้อมูลตัวอย่าง (`src/lib/seed.ts`), ที่เก็บข้อมูลตามที่ตกลง, ตัวสลับ role และ **ปุ่ม reset demo** (เช่น `/demo/reset` หรือเมนูซ่อน) แล้ว commit
3. **หน้าต่างๆ**: ถ้ามีหน้าที่แยกกันได้ตั้งแต่ 3 หน้า ให้แตก agent ทำพร้อมกันตามวิธีของ `mrn:swarm` (Read `{path_to_skill}/../swarm/SKILL.md` ข้อ 2-5 แล้วทำตาม) brief ของแต่ละหน้าต้องมี: route, role, ข้อมูลที่ใช้, component กลางที่ต้องใช้, state ที่ต้องมี, **กฎ UX/UI และการทดสอบ** ตาม **เครื่องมือ** (ถ้าเป็น checklist ขั้น 4 ให้ใส่ข้อความเต็ม), คำสั่งตรวจ (`npm run build` ผ่าน + หน้าเปิดได้) และให้ทดสอบหน้าของตัวเองใน **browser** ก่อนส่ง ถ้าน้อยกว่า 3 หน้าให้ทำเอง
4. **ต่อ hero flow ให้ครบ**: ตัวหลักเดินตั้งแต่ต้นจนจบเอง แล้วแก้รอยต่อระหว่างหน้า

`{path_to_skill}` คือ directory ที่ SKILL.md นี้ถูกโหลดมา

## 4. ทดสอบจนพร้อม demo

1. `npm run lint` และ `npm run build` ต้องผ่านโดยไม่มี error
2. รันแบบ production (`npm run build && npm start`) แล้วเดิน hero flow ทุก role ใน **browser** ทั้ง desktop และ mobile (375px) ถ่าย screenshot ทุกขั้นของ hero flow
3. เรียก `mrn:qa` กับ URL ที่รันอยู่ (Skill tool) แล้วส่ง `BRIEF.md` กับ test plan เป็นขอบเขต
4. แก้ bug S1 และ S2 ทุกตัว แก้ S3 ที่อยู่ใน hero flow แล้วรัน QA ซ้ำเฉพาะส่วนที่แก้ จนไม่เหลือ S1-S2
5. **demo checklist** ต้องผ่านทุกข้อ:
   - hero flow เดินได้ครบ 3 รอบติดกันโดยไม่สะดุด (reset ระหว่างรอบ)
   - refresh กลาง flow แล้วข้อมูลไม่หาย (ถ้าเลือกเก็บใน browser)
   - reset demo กลับข้อมูลตัวอย่างเดิมได้
   - ทุกหน้ามี empty, loading, error และ success state, ใช้ keyboard ได้และเห็น focus, contrast ผ่าน WCAG AA, touch target ไม่ต่ำกว่า 44px และใช้งานได้บน mobile
   - ไม่มี console error และไม่มี request ที่ fail
   - ไม่มีข้อความ placeholder, lorem ipsum, "TODO" หรือ "test"
   - title, favicon และชื่อแบรนด์ถูกต้อง
   - เปิดหน้าแรกเร็ว (production build) และใช้ได้บนอุปกรณ์ที่จะใช้ demo
6. **deploy** (ถ้าตกลงไว้): ถามยืนยันก่อน แล้ว deploy (เช่น `vercel deploy` ซึ่งได้ preview URL) จากนั้นเดิน hero flow บน URL จริงซ้ำหนึ่งรอบ

## 5. ส่งมอบ

- `DEMO.md`: วิธีเปิด (คำสั่งหรือ URL), บัญชี demo, ขั้นตอนนำเสนอทีละขั้นพร้อมสิ่งที่ควรพูด, วิธี reset, สิ่งที่ยังไม่ทำงานจริง (กันไม่ให้กดหน้างาน) และแผนสำรองถ้าเน็ตล่ม
- commit งานทั้งหมด
- ตอบผู้สั่ง: วิธีเปิด demo, screenshot ของ hero flow (desktop และ mobile), ผล QA (bug ที่แก้แล้ว และที่เหลือพร้อมความรุนแรง), สิ่งที่จำลองไว้ และ path ของโปรเจกต์กับ `DEMO.md`
