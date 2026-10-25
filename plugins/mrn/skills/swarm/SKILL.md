---
name: swarm
description: Finishes a large task as fast as possible by splitting it into every independent piece it really has and running one agent per piece in parallel through a Workflow, with each piece checked by its own done-criteria and a verify stage, then integrated and tested as a whole so quality does not drop. Use when the user says "swarm", "แตก agent ให้มากที่สุด", "ทำขนานให้เร็วที่สุด", "fan out", or hands over work with many independent parts (many files, modules, pages, services, items).
argument-hint: "<งานที่ต้องการให้เสร็จ>"
---

# Swarm

เป้าหมายคือ **เวลาจริงสั้นที่สุด โดยคุณภาพไม่ต่ำกว่าทำเองทีละชิ้น** ใช้ agent ให้มากที่สุด **เท่าที่งานแตกได้จริง** ไม่ใช่มากที่สุดเท่าที่ทำได้ เพราะ agent ที่แบ่งงานผิดหรือแก้ไฟล์ชนกัน ทำให้ช้าลงและงานแย่ลง

การเรียก skill นี้ถือว่าผู้ใช้ขอให้ใช้ Workflow และขยายขนาดตามจำนวนชิ้นงาน (เกิน guideline ขนาดปกติของ session ได้)

## เครื่องมือ: ใช้ตัวที่มีจริง

ใช้ตัวแรกในลำดับที่มีอยู่จริงใน session นี้ ตรวจจากรายการ tool และ skill ที่โหลดอยู่ หรือ `command -v <ชื่อ>` ก่อนใช้ ถ้า CLAUDE.md หรือกฎของผู้ใช้กำหนดเครื่องมือไว้ ให้ใช้ตามนั้นก่อนตาราง การติดตั้งเครื่องมือใหม่ต้องถามผู้ใช้ก่อน

| งาน | ลำดับทางเลือก |
|---|---|
| **รันขนาน** | Workflow tool → เรียก Agent tool หลายตัวใน message เดียว (แบ่งเป็นชุดตามจำนวนที่ session รับได้) → ทำเองทีละชิ้นตามลำดับ |
| **browser** (งาน UI) | browser skill หรือ MCP ที่ผู้ใช้กำหนด (เช่น ego-browser) → browser automation ใดๆ ที่มี (Playwright, Chrome DevTools, Claude in Chrome) → ตรวจ HTML/API ด้วย `curl` แล้วจดสิ่งที่ต้องเห็นหน้าจอไว้ในรายงานว่ายังไม่ได้ตรวจ |
| **ผู้ตรวจอิสระ** | review tool ภายนอกที่ผู้ใช้ใช้อยู่ (เช่น Codex) → subagent ใหม่ผ่าน Agent tool → ถ้าไม่มีทั้งคู่ ทำรอบ review แยกโดยอ่านแค่ diff แล้วระบุในรายงานว่าไม่ใช่ผู้ตรวจอิสระ |

## 1. สำรวจเอง (เร็วๆ)

หารายการงานจริงก่อนวางแผน: list ไฟล์, route, module, test ที่ fail หรือ item ที่ต้องทำ (ถ้ามี `graphify-out/graph.json` ให้ query graph ก่อน) ใช้ tool หลายตัวพร้อมกันใน message เดียว ส่วนนี้ไม่ต้องแตก agent เพราะทำเองเร็วกว่า

## 2. แตกงาน

เขียนตารางชิ้นงาน (ในแชทหรือ `SWARM.md` ถ้าเกิน 10 ชิ้น):

| id | ขอบเขต (ไฟล์ที่แก้) | ส่งมอบอะไร | เสร็จเมื่อ (คำสั่งตรวจ) | ขึ้นกับ | tier |

- **ชิ้นอิสระ** คือชิ้นที่ไม่ต้องรอผลของชิ้นอื่น และไม่แก้ไฟล์เดียวกัน ถ้าสองชิ้นต้องแก้ไฟล์เดียวกัน ให้รวมเป็นชิ้นเดียว หรือใช้ `isolation: 'worktree'` แล้ว merge ตอนท้าย
- **ชิ้นที่ต้องรอกัน** ให้จัดเป็น wave ส่วนกลางที่ทุกชิ้นใช้ร่วมกัน (type, interface, config, scaffold) ทำเป็น wave 0 ให้เสร็จก่อน เพื่อไม่ให้แต่ละ agent สร้างของซ้ำกันคนละแบบ
- **งานเล็กจำนวนมาก** (rename, แก้ข้อความ, เพิ่ม test case สั้นๆ) ให้รวมเป็นชุด ชุดละ 5-10 ชิ้นต่อ agent เพราะ agent ละชิ้นเสียเวลาเริ่มต้นมากกว่าตัวงาน
- **เสร็จเมื่อ** ต้องเป็นสิ่งที่รันได้: test ของชิ้นนั้น, typecheck, build หรือ script ตรวจ ห้ามเขียนว่า "ทำเสร็จ"
- **tier** ถ้ากฎของผู้ใช้กำหนด model หรือ effort ต่อ agent ไว้ (เช่น note ของ model router) ให้ทำตามนั้น ถ้าไม่มี ไม่ต้องระบุ model ให้ agent ใช้ model ของ session และเลือก effort ตามงาน: งาน mechanical `effort: 'medium'`, งานเขียนหรือแก้หลายไฟล์ `'high'`, งานเสี่ยง (เงิน, security, concurrency, data) หรือการตรวจรอบสุดท้าย `'xhigh'`

เลือกเครื่องมือ:
- 1 ชิ้น หรือทุกชิ้นต้องรอกันเป็นลำดับ: **ทำเอง** ไม่ต้องแตก
- 2 ชิ้นอิสระ: เรียก **Agent tool** 2 ตัวใน message เดียว
- 3 ชิ้นอิสระขึ้นไป: **Workflow** (ข้อ 4) ถ้าไม่มี Workflow tool ให้ใช้ทางเลือกถัดไปของ **รันขนาน**

## 3. Brief ของแต่ละชิ้น

agent รู้แค่สิ่งที่อยู่ใน prompt ทุก brief จึงต้องมีครบ:

```
เป้าหมาย: <ชิ้นนี้ทำอะไร และเป็นส่วนหนึ่งของงานใหญ่อะไร>
ขอบเขต: แก้ได้เฉพาะ <ไฟล์/โฟลเดอร์> ห้ามแตะไฟล์อื่น (ชิ้นอื่นกำลังแก้อยู่พร้อมกัน)
ของที่มีให้ใช้: <path ของ interface, type หรือตัวอย่างที่ต้องเลียนแบบ>
เสร็จเมื่อ: รัน `<คำสั่งตรวจ>` แล้วผ่าน ถ้าไม่ผ่านให้แก้จนผ่าน ห้ามแก้หรือปิด test เพื่อให้ผ่าน
ส่งกลับ: <schema> รวมไฟล์ที่แก้, output ของคำสั่งตรวจ และสิ่งที่ทำไม่ได้พร้อมเหตุผล
```

ไม่ต้องคัดกฎใน CLAUDE.md ใส่ brief เพราะ agent ได้รับ CLAUDE.md เองอยู่แล้ว ใส่เฉพาะกฎที่ชิ้นนั้นต้องใช้จริง (เช่น ชิ้นที่เป็น UI ให้ทดสอบใน **browser**)

## 4. Workflow

ใช้ `pipeline()` เป็นค่าเริ่มต้น ชิ้นที่ทำเสร็จก่อนจะเข้าขั้นตรวจทันที ไม่ต้องรอชิ้นที่ช้าที่สุด ใช้ `parallel()` (ซึ่งจะรอทุกชิ้นให้เสร็จก่อน) เฉพาะเมื่อขั้นถัดไปต้องเห็นผลทุกชิ้นพร้อมกันจริงๆ เช่น dedup

```js
export const meta = {
  name: 'swarm-<งาน>',
  description: '<หนึ่งบรรทัด>',
  phases: [{ title: 'Build' }, { title: 'Verify' }],
}
const RESULT = { type: 'object', properties: {
  files: { type: 'array', items: { type: 'string' } },
  check: { type: 'string' }, passed: { type: 'boolean' }, blocked: { type: 'string' } },
  required: ['files', 'check', 'passed'] }
const VERDICT = { type: 'object', properties: {
  ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok', 'problems'] }

const results = await pipeline(args.pieces,
  (p) => agent(p.brief, { label: p.id, phase: 'Build', schema: RESULT, effort: p.effort,
    ...(p.worktree ? { isolation: 'worktree' } : {}) }),
  async (r, p) => {
    if (!r) return { id: p.id, r: null, verdict: null }
    // ชิ้นที่ไม่ผ่านคำสั่งตรวจ ได้แก้อีกหนึ่งรอบพร้อม output ที่ fail
    if (!r.passed) r = await agent(`${p.brief}\n\nรอบก่อนไม่ผ่าน: ${r.check}\nแก้ต้นเหตุแล้วรันคำสั่งตรวจใหม่`,
      { label: `${p.id}-retry`, phase: 'Build', schema: RESULT, effort: p.effort })
    const verdict = r?.passed && p.verifyEffort ? await agent(
      `ตรวจงานชิ้น ${p.id} แบบอ่านอย่างเดียว ห้ามแก้ไฟล์\nเกณฑ์เสร็จ: ${p.done}\nไฟล์ที่แก้: ${r.files.join(', ')}\n` +
      `หาสิ่งที่ผิดจาก brief นี้: ${p.brief}\nตรวจ: ทำครบตาม brief ไหม, แก้นอกขอบเขตไหม, test ถูกปิดหรือถูกแก้ให้ผ่านง่ายไหม, edge case ที่ brief ระบุ`,
      { label: `${p.id}-verify`, phase: 'Verify', schema: VERDICT, effort: p.verifyEffort }) : null
    return { id: p.id, r, verdict }
  })
return results
```

- `args.pieces` คือ array ของ `{ id, brief, done, effort, verifyEffort, worktree }` ส่งผ่าน `args` ของ Workflow เป็น JSON จริง ไม่ใช่ string
- ขั้นตรวจ: ชิ้น mechanical ข้ามได้ (ให้ `verifyEffort` เป็น `null` แล้วข้าม) ชิ้นปกติใช้ตัวตรวจ 1 ตัว (`'high'`) ชิ้นเสี่ยงใช้ตัวตรวจ 2-3 ตัวต่างมุมมอง (`'xhigh'`)
- workflow รัน agent พร้อมกันได้สูงสุด min(16, CPU - 2) ตัว (เครื่องที่มี 10 CPU ได้ 8) ตัวที่เกินจะเข้าคิว ถ้ามีมากกว่า 8 ชิ้นให้ `log()` บอกจำนวนที่เข้าคิว
- wave ถัดไปค่อยเรียก Workflow รอบใหม่หลังอ่านผลของ wave ก่อน
- ระหว่างรอ workflow ห้ามนั่งรอเปล่า ให้เตรียมขั้นรวมงาน: เขียน test รวม, เตรียมคำสั่ง merge หรืออ่านไฟล์ที่ต้องต่อเข้าด้วยกัน

## 5. รวมงาน (ตัวหลักทำเอง)

1. อ่านผลทุกชิ้น ชิ้นที่ `passed: false` หลังแก้แล้ว, เป็น `null` หรือตัวตรวจบอก `ok: false` ให้ตัวหลักดูต้นเหตุเอง แล้วแก้หรือส่งกลับไปทำใหม่ครั้งเดียว ถ้ายังไม่ผ่านให้ใส่ในรายงานว่าค้าง
2. merge worktree (ถ้ามี) แล้วแก้ conflict เอง
3. ตรวจว่าไม่มีชิ้นไหนแก้นอกขอบเขต (`git diff --stat` เทียบกับตารางชิ้นงาน)
4. รัน test, typecheck และ build **ทั้งชุด** หนึ่งครั้ง ถ้าเป็นงาน UI ให้เปิดดูใน **browser** เอง
5. ให้ **ผู้ตรวจอิสระ** review diff ถ้า diff ใหญ่ให้แบ่งก้อนตามชิ้นงานแล้วรันพร้อมกัน

## 6. รายงาน

- ตาราง: ชิ้น / ผลคำสั่งตรวจ / ผลตัวตรวจ / หมายเหตุ
- จำนวน agent ที่ใช้, จำนวนที่รันพร้อมกันสูงสุด และเวลาจริงทั้งหมด
- ผล test ทั้งชุดและผล review
- ชิ้นที่ค้างหรือ fail พร้อมเหตุผล
