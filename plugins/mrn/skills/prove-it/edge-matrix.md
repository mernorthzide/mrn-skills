# Edge matrix

เลือกเฉพาะแถวที่โค้ดที่แก้แตะจริง แต่ละแถวที่เลือกต้องกลายเป็น oracle หนึ่งตัวขึ้นไป

## ข้อมูลเข้า (ทุกงาน)
- ว่าง: `''`, `[]`, `{}`, `null`/`undefined`, field หาย
- ยาวมาก: ข้อความ 10k ตัวอักษร, list 10k รายการ
- ภาษาไทยและอักขระพิเศษ: สระลอย วรรณยุกต์ เลขไทย ๐-๙, emoji, `'"<>&`, ช่องว่างหัวท้าย, zero-width space
- รูปแบบผิด: string แทน number, `"1,200.50"`, วันที่ผิดรูป, timezone ต่าง
- ขอบ: 0, ติดลบ, ค่าสูงสุด, ค่าต่ำกว่า/เกินขอบ 1 หน่วย
- parser และสูตรเงิน: ถ้า repo มี library property-based (fast-check, Hypothesis) อยู่แล้ว ให้เขียน property แทนการไล่ตัวอย่างทีละค่า เช่น parse(format(x)) === x

## เงินและตัวเลข
- float: `0.1 * 3`, ยอดรวมหลายรายการมีสตางค์, ส่วนลดเป็น % ที่ทำให้เกินทศนิยม 2 ตำแหน่ง
- คืนเงินบางส่วนหลายครั้งจนครบยอด ต้องเหลือ 0 พอดี
- ปัดเศษ: ครึ่งสตางค์ (`1.255`), ยอดรวมต้องเท่ากับผลรวมรายการที่ปัดแล้ว
- ยอดติดลบ, ยอดเกินที่จ่ายได้, สกุลเงินต่าง

## UI (browser ตามตารางเครื่องมือใน SKILL.md)
- desktop และ mobile (ราว 390px)
- empty, loading, error, success state
- กดซ้ำเร็ว, double submit, back/refresh กลาง flow
- keyboard only และ focus, contrast, touch target ≥ 44px
- network ช้าหรือ fail ระหว่างบันทึก
- ข้อความไทยยาวตัดบรรทัดถูกต้อง

## API / backend
- สิทธิ์ไม่พอ, token หมดอายุ, user อื่นเข้าถึงข้อมูลคนละคน
- request ซ้ำ (idempotency), retry หลัง timeout
- dependency ภายนอก fail หรือช้า
- ข้อมูลถูกเขียนจริง: query DB หลังเรียก ไม่ใช่เชื่อ response อย่างเดียว

## Concurrency / cache
- สอง request แก้ข้อมูลเดียวกันพร้อมกัน
- cache เก่าหลังเขียนใหม่, invalidate ข้าม worker
- ลำดับ event สลับกัน

## Data / migration
- รันบน copy ของข้อมูลหน้าตาเหมือนจริง, นับ row ก่อนและหลัง
- รันซ้ำได้ (idempotent), rollback ได้
- ข้อมูลเก่าที่ไม่ตรง schema ใหม่

## CLI / script
- exit code ถูกเมื่อ fail
- path มีช่องว่างหรือภาษาไทย
- รันซ้ำได้ผลเท่าเดิม
