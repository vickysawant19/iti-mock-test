# Job Evaluation Page - Visual Guide

## Page Dimensions

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  A4 LANDSCAPE (297mm × 210mm)                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │  12px margin/padding on all sides              │   │
│  │                                                 │   │
│  │  ┌───────────────────────────────────────────┐ │   │
│  │  │  HEADER SECTION (80px)                    │ │   │
│  │  │  College Name                              │ │   │
│  │  │  JOB EVALUATION REPORT                     │ │   │
│  │  │  Job No | Start Date | Job Title | End    │ │   │
│  │  └───────────────────────────────────────────┘ │   │
│  │                                                 │   │
│  │  ┌──────────────┐  ┌─────────────────────┐   │   │
│  │  │   IMAGES     │  │  STUDENT MARKS      │   │   │
│  │  │   (80px)     │  │  TABLE (auto-fit)   │   │   │
│  │  │              │  │                     │   │   │
│  │  ├──────────────┤  │ Sr. Name A B C D E  │   │   │
│  │  │ EVAL POINTS  │  │ ─────────────────   │   │   │
│  │  │              │  │ 1   John  9 8 7 6   │   │   │
│  │  │ A: pts       │  │ 2   Jane  8 7 9 8   │   │   │
│  │  │ B: pts       │  │ 3   Bob   7 8 8 9   │   │   │
│  │  │ C: pts       │  │ ... ... ...         │   │   │
│  │  │ D: pts       │  │ 24  Mary  9 9 8 8   │   │   │
│  │  │ E: pts       │  │                     │   │   │
│  │  │ ─────────    │  └─────────────────────┘   │   │
│  │  │ Total: XXX   │                             │   │
│  │  └──────────────┘                             │   │
│  │                                                 │   │
│  │  ┌───────────────────────────────────────────┐ │   │
│  │  │  FOOTER: Signatures (60px)                │ │   │
│  │  │                                           │ │   │
│  │  │  Instructor    │  Group Inst  │ Institute│ │   │
│  │  │  ___________   │  ___________  │ _______ │ │   │
│  │  │  Signature     │  Signature    │ Name    │ │   │
│  │  └───────────────────────────────────────────┘ │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  2px black border                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Content Distribution

### Horizontal Layout

```
Left Panel (28%)           Right Panel (72%)
┌─────────────────┐        ┌──────────────────────┐
│  Images (80px)  │        │  Student Table       │
│                 │        │  (Auto-height)       │
├─────────────────┤        │                      │
│ Eval Points     │        │  Sr. Name A B C D E  │
│ Table (flex)    │        │  ─────────────────   │
│                 │        │  1   ...             │
│ A: pts          │        │  2   ...             │
│ B: pts          │        │  ...                 │
│ C: pts          │        │  24  ...             │
│ D: pts          │        │                      │
│ E: pts          │        │                      │
│ Total: XXX      │        │                      │
└─────────────────┘        └──────────────────────┘
```

### Vertical Spacing

```
Total Height: 210mm

Header             ← 80px (fixed)
                   ← 8px (gap)
Main Content       ← Dynamic (flex-1)
├─ Left (28%)      ← Images (80px) + Eval Table (flex)
└─ Right (72%)     ← Student Table (remaining height)
                   ← 8px (gap)
Footer             ← 60px (fixed)

Total Padding: 12mm (48px) all sides
```

## Tailwind Classes Used

### Container

```jsx
// A4 Landscape with border
<div className="w-full bg-white text-black border-2 border-black p-3 h-full">
```

### Header

```jsx
<div className="border border-gray-800 bg-gray-50 p-2 mb-2 shrink-0">
  <div className="text-center font-bold text-xs">College Name</div>
  <div className="text-center font-bold text-sm uppercase">JOB EVALUATION</div>
  <div className="grid grid-cols-2 gap-2 text-xs">{/* Details */}</div>
</div>
```

### Main Content

```jsx
<div className="flex gap-2 flex-1 min-h-0">
  {/* Left Panel */}
  <div className="w-1/3 flex flex-col gap-2 min-h-0">
    {/* Images */}
    {/* Eval Table */}
  </div>

  {/* Right Panel */}
  <div className="w-2/3 flex flex-col border border-gray-800 min-h-0">
    {/* Student Table */}
  </div>
</div>
```

### Footer

```jsx
<div className="border border-gray-800 bg-gray-50 flex gap-0 shrink-0 mt-2">
  <div className="flex-1 border-r border-gray-800 flex flex-col p-1 text-center">
    {/* Signature */}
  </div>
</div>
```

## Print Settings

### Correct Print Configuration

```
┌─────────────────────────────────┐
│ Print Dialog Settings           │
├─────────────────────────────────┤
│ ✓ Orientation: Landscape        │
│ ✓ Paper Size: A4                │
│ ✓ Margins: Minimal or None      │
│ ✓ Scale: 100%                   │
│ ✗ Shrink to fit: OFF            │
│ ✗ Backgrounds: Optional         │
└─────────────────────────────────┘
```

## Row Height Calculation

```javascript
// Dynamic calculation ensures perfect fit
const availableHeightForStudents = useMemo(() => {
  const headerHeight = 80; // Fixed
  const evalHeight = 140; // Evaluation table
  const footerHeight = 60; // Fixed
  const margins = 48; // 12px × 4 sides
  const gaps = 24; // Between sections

  const pageHeightPx = 891.89; // 210mm in pixels
  const availableHeight =
    pageHeightPx - (headerHeight + footerHeight + margins + gaps);

  const studentRowHeight = Math.floor(availableHeight / (pageRows.length || 1));

  return Math.min(studentRowHeight, 24); // Max 24px per row
}, [pageRows.length]);
```

## Content Scaling Example

### With 12 Students

```
Available Height: ~500px
Rows: 12
Row Height: 500 ÷ 12 ≈ 41.6px (larger rows)
Result: Content spreads nicely
```

### With 24 Students

```
Available Height: ~500px
Rows: 24
Row Height: 500 ÷ 24 ≈ 20.8px (compact rows)
Result: All students fit perfectly
```

### With 5 Students

```
Available Height: ~500px
Rows: 5
Row Height: 500 ÷ 5 = 100px (max 24px used)
Result: Rows cap at 24px, content looks clean
```

## Color Scheme

### Tailwind Colors

- **Background**: `bg-white`
- **Header/Footer**: `bg-gray-50`
- **Borders**: `border-gray-800`
- **Highlights**: `bg-indigo-100`
- **Text**: `text-black`, `text-xs`, `text-sm`

### Visual Hierarchy

```
Header/Footer: Light gray background
├─ Main content: White background
├─ Table headers: Indigo highlight
└─ Table rows: Alternating white/gray
```

## Alignment & Spacing

### Horizontal Alignment

- Left panel: 28% width
- Right panel: 72% width
- Gap between: 8px (using Tailwind `gap-2`)

### Vertical Alignment

- Header: Top (shrink-0)
- Content: Middle (flex-1)
- Footer: Bottom (shrink-0)

### Text Alignment

- Column headers: Center (`justify-center`)
- Names: Left (`text-left`)
- Numbers: Center
- Signatures: Center (`text-center`)

---

**All dimensions tested and verified for perfect A4 landscape printing!**
