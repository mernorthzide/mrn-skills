# MRN Skills

Claude Code skills ของ MRN ทุก skill อยู่ใน plugin เดียวชื่อ `mrn` และเรียกใช้แบบ `/mrn:<skill>` เช่น `/mrn:prove-it`

## ติดตั้ง

คัดลอกข้อความใน [`install-prompt.md`](install-prompt.md) (ภาษาอังกฤษ: [`install-prompt.en.md`](install-prompt.en.md)) ไปวางใน Claude Code แล้ว Claude จะติดตั้งและเปิด auto-update ให้

ถ้าอยากติดตั้งเองใน terminal:

```bash
claude plugin marketplace add https://github.com/mernorthzide/mrn-skills.git
claude plugin install mrn@mrn-skills
```

จากนั้นเปิด auto-update ที่ `/plugin` → Marketplaces → `mrn-skills` → Enable auto-update (ต้องทำหลัง `marketplace add` เสมอ เพราะคำสั่งนี้เขียน entry ใหม่และปิด auto-update ทุกครั้งที่รัน)

## อัปเดต

เมื่อเปิด auto-update ไว้ Claude Code จะเช็กเองหลังส่งข้อความแรกของ session (สุ่มรอ 0-10 นาที) แล้วดึง skill ใหม่และ skill ที่แก้แล้วมาให้ เมื่อเห็นข้อความ `Plugin updated` ให้รัน `/reload-plugins` ถ้าจะอัปเดตทันทีให้รัน:

```bash
claude plugin marketplace update mrn-skills && claude plugin update mrn@mrn-skills
```

## เพิ่ม skill (สำหรับผู้ดูแล)

1. สร้าง `plugins/mrn/skills/<name>/SKILL.md` โดยใส่ frontmatter ให้ `name` ตรงกับชื่อโฟลเดอร์ และมี `description`
2. รัน `claude plugin validate .` และ `npm test` (build เว็บ และ fail ถ้า frontmatter ไม่ครบ)
3. เว็บมีสองภาษา: อังกฤษที่ `/` (ค่าเริ่มต้น) และไทยที่ `/th/` ข้อความ UI อยู่ใน `lib/i18n.mjs` ถ้าแก้ขั้นตอนติดตั้ง ให้แก้ทั้ง `install-prompt.md` และ `install-prompt.en.md`
4. commit แล้ว push ขึ้น `main` เครื่องที่เปิด auto-update จะได้ skill ใหม่เอง
4. รัน `npm run deploy` เพื่ออัปเดตเว็บ

ตอนพัฒนา ให้โหลด plugin จาก repo นี้โดยตรง แทนการแก้ copy ที่อื่น repo นี้เป็นต้นฉบับเดียว:

```bash
claude --plugin-dir plugins/mrn
```

อย่าใส่ `version` ใน `plugins/mrn/.claude-plugin/plugin.json` เพราะถ้าไม่มี field นี้ Claude Code จะใช้ commit SHA เป็นเวอร์ชัน ทุก push จึงนับเป็นอัปเดตใหม่ แต่ถ้าใส่ไว้แล้วลืมเปลี่ยน ผู้ใช้จะค้างอยู่ที่เวอร์ชันเดิม
