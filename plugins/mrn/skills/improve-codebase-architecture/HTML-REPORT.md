# รูปแบบ HTML report

report เป็นไฟล์ HTML ไฟล์เดียวใน temp directory ดึง Tailwind, Mermaid และ font มาจาก CDN โดยระบุ version ตายตัว ใช้ Mermaid กับ diagram ที่เป็น graph และใช้ div หรือ inline SVG ที่วาดเองกับภาพแบบ editorial (mass diagram, cross-section) ใช้ทั้งสองแบบปนกัน ถ้าใช้ Mermaid ทุกอัน report จะดูจืด

## Scaffold

```html
<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Architecture review: {{repo}}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com/3.4.17"></script>
    <script>
      tailwind.config = { theme: { extend: { fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'sans-serif'], mono: ['"IBM Plex Mono"', 'monospace'] } } } };
    </script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose",
        fontFamily: '"IBM Plex Sans Thai", sans-serif' });
    </script>
    <style>
      body { line-height: 1.7; }
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: #1e293b; color: #f8fafc; }
      @page { size: A4; margin: 12mm; }
      @media print {
        /* avoid breaking only the diagram row; a whole card can be taller than the space left on a page */
        .before-after, .before-after > * { break-inside: avoid; }
        h2, h3 { break-after: avoid; }
        .mermaid svg { max-width: 100%; height: auto; }
      }
    </style>
  </head>
  <body class="bg-stone-50 print:bg-white text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## Header

ชื่อ repo, วันที่, ขอบเขตที่ดู (hot spot หรือทิศทางที่ผู้ใช้ระบุ) และคำอธิบายสัญลักษณ์สั้นๆ: กล่องเส้นทึบ = module, เส้นประ = seam, ลูกศรแดง = รั่วข้าม seam, กล่องเข้มหนา = deep module ไม่ต้องมีย่อหน้าเกริ่นนำ ให้เข้าเรื่อง candidate เลย

## การ์ด candidate

diagram ต้องสื่อความเป็นหลัก ส่วนข้อความให้สั้น ตรง และใช้ศัพท์จาก codebase-design

แต่ละ candidate คือ `<article>` หนึ่งอัน:

- **ชื่อ**: สั้น บอกว่าจะทำให้อะไรลึกขึ้น เช่น "รวม Order intake ให้เป็น module เดียว"
- **แถว badge**: ระดับความมั่นใจ (`Strong` = emerald, `Worth exploring` = amber, `Speculative` = slate) และหมวดของ dependency (`in-process`, `local-substitutable`, `ports & adapters`, `mock`) ถ้า skeptic ลดระดับข้อนี้ลง ให้ใส่ badge "ลดระดับหลังตรวจ"
- **ไฟล์และหลักฐาน**: รายการ `file:line` ใช้ `font-mono text-sm` พร้อมบอกสั้นๆ ว่าแต่ละจุดแสดงอะไร
- **Before / After diagram**: หัวใจของการ์ด วางสองคอลัมน์คู่กัน (`before-after grid md:grid-cols-2 print:grid-cols-2` บนมือถือจะซ้อนลงมา แต่ใน PDF ยังวางคู่กัน ต้องมี class `before-after` เพื่อไม่ให้ PDF ตัด diagram กลางหน้า)
- **ปัญหา**: หนึ่งประโยค
- **ทางแก้**: หนึ่งประโยค
- **ได้อะไร**: bullet สั้นๆ เช่น "test ผ่าน interface เดียว", "logic ราคาไม่รั่วข้าม seam อีก", "ลบ module ตื้น 4 ตัว"
- **Test**: สถานะ test ตอนนี้ และ test แบบไหนจะเขียนได้หลังแก้
- **ADR callout** (ถ้ามี): หนึ่งบรรทัดในกล่องสีอำพันอ่อน

ไม่ต้องมีย่อหน้าอธิบายยาว ถ้า diagram ต้องมีย่อหน้าช่วยถึงจะเข้าใจ ให้วาด diagram ใหม่

## รูปแบบ diagram

เลือกให้เหมาะกับแต่ละ candidate และอย่าให้ทุกอันหน้าตาเหมือนกัน

### Mermaid graph (ใช้บ่อยที่สุด สำหรับ dependency และ call flow)

ใช้ `flowchart` เมื่อจะบอกว่า "X เรียก Y เรียก Z แล้วยุ่งเหยิงแบบนี้" ห่อด้วยการ์ด และใช้ classDef ทำเส้นรั่วเป็นสีแดง และ deep module เป็นสีเข้ม sequence diagram เหมาะกับ "ก่อน: ไปกลับ 6 รอบ หลัง: 1 รอบ"

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.รั่ว.-> D[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

กันพัง: label ที่มีวงเล็บ, `:`, `/` หรือภาษาไทยปนสัญลักษณ์ ให้ครอบด้วย `"..."` เช่น `A["parseInput(raw)"]`

อ่านได้ใน PDF: diagram อยู่ในคอลัมน์ครึ่งหน้า A4 (กว้างราว 330px) ถ้ามีเกิน 3 node ต่อแถว ให้ใช้ `flowchart TD` แทน `LR` ไม่อย่างนั้นจะถูกย่อจนตัวอักษรเล็กเกินอ่าน

### กล่องและลูกศรที่วาดเอง (เมื่อ layout ของ Mermaid ไม่ได้ดั่งใจ)

ใช้ `<div>` ที่มีขอบเป็น module และ inline SVG `<line>` หรือ `<path>` เป็นลูกศร ใช้เมื่ออยากให้ diagram ฝั่ง "หลัง" เป็น deep module ขอบหนาหนึ่งกล่องที่ข้างในเป็นสีจาง

### Cross-section (เหมาะกับ module ตื้นที่ซ้อนกันหลายชั้น)

เรียงแถบแนวนอน (`h-12 border-l-4`) แทนแต่ละ module ที่ call ต้องผ่าน ก่อน: 6 แถบบางที่แทบไม่ทำอะไร หลัง: 1 แถบหนาที่ติดป้ายหน้าที่รวม

### Mass diagram (เหมาะกับ "interface กว้างเกือบเท่า implementation")

module ละสองสี่เหลี่ยม: อันหนึ่งคือขนาด interface อีกอันคือขนาด implementation ก่อน: สองอันสูงเกือบเท่ากัน (shallow) หลัง: interface เตี้ย implementation สูง (deep)

### Call-graph collapse

ก่อน: tree ของ function call เป็นกล่องซ้อนกัน หลัง: tree เดิมรวมเป็นกล่องเดียว และ call ที่กลายเป็นภายในแสดงเป็นสีจางอยู่ข้างใน

## Style

- ให้ความรู้สึกเหมือนบทความ ไม่ใช่ dashboard องค์กร เว้นที่ว่างให้พอ
- ใช้สีน้อย: accent หนึ่งสี (emerald หรือ indigo) + แดงสำหรับการรั่ว + อำพันสำหรับคำเตือน ห้ามใช้ gradient, glow หรือเงาฟุ้ง
- diagram สูงราว 320px เพื่อให้ before/after วางคู่กันได้โดยไม่ต้อง scroll
- ป้ายชื่อ module ใน diagram ใช้ `text-xs uppercase tracking-wider` ให้ดูเป็นแผนผัง
- script มีแค่ Tailwind, config ของ Tailwind และ Mermaid report นอกนั้นเป็น static

## ส่วนแนะนำให้ทำก่อน

การ์ดใหญ่หนึ่งใบ: ชื่อ candidate, เหตุผลหนึ่งประโยค และลิงก์ไปที่การ์ดของมัน

## น้ำเสียง

ภาษาไทยเรียบง่าย กระชับ แต่คำนามและคำกริยาด้านสถาปัตยกรรมใช้ตามศัพท์ของ codebase-design ตรงตัว

**ใช้ตรงตัว:** module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality

**ห้ามใช้แทน:** component, service, unit (แทน module) · API, signature (แทน interface) · boundary (แทน seam) · layer, wrapper (แทน module)

**ตัวอย่างประโยค:**
- "Order intake module เป็น shallow: interface แทบเท่ากับ implementation"
- "Pricing รั่วข้าม seam"
- "ทำให้ลึก: interface เดียว test ที่เดียว"
- "มี adapter สองตัว seam จึงคุ้ม: HTTP ตอน production และ in-memory ตอน test"

bullet "ได้อะไร" ให้บอกเป็นศัพท์ใน glossary เช่น *"locality: bug รวมอยู่ใน module เดียว"*, *"leverage: interface เดียวใช้ได้ N call site"* ห้ามเขียนว่า *"ดูแลง่ายขึ้น"* หรือ *"โค้ดสะอาดขึ้น"* เพราะไม่ได้บอกอะไร
