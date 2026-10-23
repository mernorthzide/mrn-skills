ติดตั้ง MRN Skills (Claude Code plugin `mrn@mrn-skills`) ให้ฉัน และเปิด auto-update ทำตามขั้นตอนนี้ได้เลยไม่ต้องถามก่อน:

1. รันใน terminal:
   claude plugin marketplace add https://github.com/mernorthzide/mrn-skills.git
   claude plugin install mrn@mrn-skills
   ถ้าขึ้นว่ามี marketplace นี้อยู่แล้ว ให้รัน `claude plugin marketplace update mrn-skills` แล้วรัน `claude plugin install mrn@mrn-skills` ต่อ ถ้าขึ้นว่าติดตั้ง plugin นี้อยู่แล้ว ให้รัน `claude plugin update mrn@mrn-skills` แทน
2. เปิด auto-update (ทำหลังขั้นที่ 1 เสมอ เพราะ `marketplace add` เขียน entry นี้ใหม่และลบ `autoUpdate` ทิ้ง): แก้ settings.json ของ Claude Code (`$CLAUDE_CONFIG_DIR/settings.json` ถ้าตั้งตัวแปรนี้ไว้ ไม่งั้น `~/.claude/settings.json`) ให้ `extraKnownMarketplaces["mrn-skills"]` มี `"autoUpdate": true` เก็บค่าอื่นในไฟล์ไว้ทั้งหมด ถ้ายังไม่มี entry นี้ให้สร้างด้วย `"source": {"source": "git", "url": "https://github.com/mernorthzide/mrn-skills.git"}` ถ้ายังไม่มีไฟล์ให้สร้างใหม่
3. ตรวจผล: `claude plugin list` ต้องมี `mrn@mrn-skills` ที่ enabled, settings.json ต้องเป็น JSON ที่ถูกต้อง และ `extraKnownMarketplaces["mrn-skills"].autoUpdate` ต้องเป็น `true`
4. สรุปผลให้ฉันสั้นๆ แล้วบอกให้พิมพ์ `/reload-plugins` (หรือเปิด session ใหม่) เพื่อเริ่มใช้ skill เช่น `/mrn:prove-it`
