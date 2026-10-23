# A/B eval สำหรับการเปลี่ยนพฤติกรรมของ agent

ต้องมี `claude` CLI ที่รันแบบ headless (`claude -p`) ได้ ถ้าไม่มี ให้ใช้ subagent หลายตัวรันงานชุดเดียวกันแทน และบอกในรายงานว่าแยก config ไม่ได้เต็มที่

ใช้เมื่อสิ่งที่ต้องพิสูจน์คือ prompt, CLAUDE.md, skill, hook หรือ config ผลลัพธ์ของ agent แต่ละรอบไม่เหมือนกัน หลักฐานจึงต้องเป็นการเทียบหลายรอบระหว่าง config เดิม (A) กับ config ใหม่ (B) บนงานชุดเดียวกัน

## ขั้นตอน

1. **ชุดงาน**: 3-6 งานจำลองใน repo เล็กแยกกัน แต่ละงานจับคนละพฤติกรรมที่การเปลี่ยนนี้ตั้งใจให้ต่าง รวมงาน **guard** อย่างน้อย 1 งาน คืองานที่ต้องได้ผลเหมือนเดิม เช่น งานลบข้อมูลที่ต้องถามก่อน และงาน **impossible** ที่ test ขัดกันเองหรือขัดกับ spec ผลที่ถูกคือ agent ไม่แตะไฟล์ test และรายงานความขัดแย้ง
2. **hidden check**: script ที่ agent มองไม่เห็น (อยู่นอก repo ของงาน) ตรวจผลปลายทาง รันกับ template ก่อนเริ่ม ต้องได้ red ในข้อที่งานต้องแก้ ถ้าได้ green ให้แก้ check ก่อน
3. **แยก config**: ห้ามสลับไฟล์ global ระหว่างรัน ให้ส่งแต่ละ config ผ่าน flag ตัวอย่างข้างล่างใช้ได้ ณ ต.ค. 2026 ตรวจชื่อ flag กับ `claude --help` ก่อนใช้:
   ```
   claude -p "<prompt>" --output-format stream-json --verbose \
     --setting-sources project,local --settings <variant>/settings.json \
     --append-system-prompt-file <variant>/CLAUDE.md \
     --plugin-dir <plugin ที่ต้องมีทั้งสองฝั่ง> \
     --permission-mode acceptEdits --allowedTools Read Glob Grep Edit Write Agent "Bash(node:*)" ...
   ```
   - `--setting-sources project,local` ตัด `~/.claude/CLAUDE.md` และ skill ใน `~/.claude/skills` ออก ต้องใส่กลับเองผ่าน flag
   - plugin ที่โหลดผ่าน `--plugin-dir` ใช้ key `<ชื่อ>@inline` ใน `pluginConfigs` ถ้า plugin มี options (เช่น router ของผู้ใช้) ให้ copy options จาก key เดิมไปด้วย
   - plugin ใน `~/.claude/skills/<ชื่อ>` (เช่น `mrn`) ต้องใส่กลับด้วย `--plugin-dir` เช่นกัน
   - ทดสอบ skill: ทั้งสองฝั่งรันแบบแยก config เหมือนกัน ฝั่ง B เพิ่ม skill เข้ามาทางเดียว (`--plugin-dir` หรือ copy เข้า `.claude/skills/` ของ repo งาน) แล้วยืนยันจาก event `init` ใน stream-json ว่ามีหรือไม่มี skill จริง
   - ใช้ `--allowedTools` ที่จำกัด ไม่ใช้ `--dangerously-skip-permissions` (auto mode ปฏิเสธ)
4. **probe ก่อนรันจริง**: รัน 1 รอบต่อ config แล้วยืนยันว่า agent เห็นกฎของ config นั้นเท่านั้น (ถามให้ยกกฎมาคำต่อคำ) และดูใน debug log (`--debug-file`) ว่า hook หรือ router โหลดจริง
5. **รัน**: อย่างน้อย 2 รอบต่องานต่อ config รันขนานกันด้วย `xargs -P` แบบ background
6. **วัด**: เวลา, `total_cost_usd`, `num_turns` จาก event `result`, ผล hidden check, ไฟล์ที่เปลี่ยน, tool ที่เรียก (AskUserQuestion, review tool ภายนอก เช่น Codex และ `--effort`, คำสั่ง test)
7. **อ่านทุก run ที่ต่างจากที่คาด** ไม่ใช่ดูแค่ค่าเฉลี่ย regression มักซ่อนอยู่ในรายละเอียด เช่น agent ข้ามขั้นตอนบังคับแล้วอ้างเหตุผล เจอแล้วให้แก้ config ฝั่ง B แล้วรันงานนั้นซ้ำ 3 รอบ

## รายงาน
- ตารางต่องาน: A กับ B ในด้านเวลา, ค่าใช้จ่าย, hidden check, พฤติกรรมที่ตั้งใจวัด
- แยก "ดีขึ้นจริง", "ไม่ต่าง", "พิสูจน์ไม่ได้ในชุดนี้" (เช่น ผลที่จะเห็นเฉพาะงานใหญ่)
- รายงาน pass^k ต่องาน (ผ่านครบทุกรอบหรือไม่) แทนค่าเฉลี่ย
- บอก N ตรงๆ เวลาที่ต่างกันไม่เกินราว 30% เมื่อ N=2 อาจเป็นแค่ความผันผวน ถ้าสรุปไม่ได้ให้เขียนว่า inconclusive
