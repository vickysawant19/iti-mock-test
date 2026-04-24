# Job Evaluation Page Layout Update

## Overview

The job evaluation page layout has been completely redesigned to generate a single-page per module report in landscape A4 format with proper margins, borders, and auto-scaling for up to 24 students.

## Key Changes

### 1. **JobEvaluationPrint.jsx** - Main Layout Component

#### Layout Structure

- **Single Page Design**: Each module now generates a single A4 landscape page (297mm × 210mm)
- **Proper Margins**: 12mm top and bottom, 15mm left and right
- **Border**: 2px solid black border around the entire page

#### Page Sections

**Header Section**

- College name at the top
- "JOB EVALUATION REPORT" title
- Module details in a 2x2 grid:
  - Job No. and Date of Starting
  - Job Title and Date of Finish
  - Duration

**Main Content** (Two-column layout)

- **Left Column (28% width)**:
  - Module images (70px height, auto-fit display)
  - Evaluation points table with scores
  - Evaluation criteria (A, B, C, D, E) with points
  - Total score row

- **Right Column (72% width)**:
  - Student marks table with up to 24 rows
  - Columns: Sr., Name, A, B, C, D, E, Total
  - Auto-scaled font sizes for optimal fit
  - Professional spacing and alignment

**Footer Section**

- Signature areas for:
  - Instructor Signature
  - Group Instructor Signature
  - Institute name

### 2. **PrintLayout.jsx** - Print Container Component

#### Improvements

- **Accurate A4 Dimensions**:
  - Portrait: 210mm × 297mm
  - Landscape: 297mm × 210mm
- **Print Media Styles**: Properly configured @page rules for landscape orientation
- **Preview Rendering**: Fixed height preview container that matches actual print dimensions
- **Better Page Break Handling**: Improved print styles with `page-break-inside: avoid`

#### CSS Updates

- Removed unnecessary padding
- Improved print media queries
- Better margin handling (set to 0 for full-page control)
- Fixed layout for dark mode compatibility

### 3. **Font & Spacing Optimization**

| Element       | Font Size | Notes                     |
| ------------- | --------- | ------------------------- |
| College Name  | 10px      | Header identification     |
| Report Title  | 9px       | Main heading              |
| Table Headers | 7-7.5px   | Consistent column headers |
| Data Cells    | 7-7.5px   | Optimized for 24-row fit  |
| Labels        | 7.5px     | Form labels               |
| Signatures    | 7px       | Footer signatures         |

### 4. **Styling Features**

- **Color Scheme**:
  - Header/Footer Background: #f8f9fa (light gray)
  - Table Headers: #e8eaf6 (light indigo)
  - Total Row: #e8eaf6 (highlighted)
  - Borders: Pure black (#000)

- **Typography**:
  - Font Family: Roboto, Arial, sans-serif
  - Line Height: 1.1-1.2 (compact for space efficiency)
  - Text Transform: Uppercase for names (professional look)

- **Table Layout**:
  - Column Widths: Fixed and proportional
  - Border Collapse: Enabled for clean grid
  - Vertical Alignment: Middle alignment for data cells

## Features

✅ **Single Page per Module**: Automatically fits up to 24 students on one page
✅ **Landscape Orientation**: Optimal for wide student tables
✅ **A4 Standard**: Proper 297mm × 210mm dimensions with borders and margins
✅ **Professional Layout**: Clear header, content, and footer sections
✅ **Auto-Scaling**: Font sizes and spacing adjusted for optimal fit
✅ **Print Ready**: Configured CSS media queries for accurate printing
✅ **Image Support**: Module images displayed in designated section
✅ **Evaluation Points**: Clear display of evaluation criteria and total scores
✅ **Signature Area**: Space for instructor and group instructor signatures

## Usage

The component maintains the same props interface:

```jsx
<JobEvaluationPrint
  studentsMap={studentMap}
  college={collegeData}
  selectedModule={moduleData}
  allModules={modulesList}
  studentAttendance={attendanceData}
  rowsPerPage={24}
  ref={printRef}
/>
```

## Print Instructions

1. Click the Print button in the Job Evaluation page
2. In the print dialog:
   - **Orientation**: Select "Landscape"
   - **Paper Size**: A4
   - **Margins**: Minimal or 0 (for proper border display)
   - **Scale**: 100% (to maintain exact dimensions)
3. Preview will show the exact page layout in landscape format
4. Print or save as PDF

## Responsive Scaling

The layout automatically scales to fit different scenarios:

- **Fewer Students**: Content is naturally spaced
- **More Students**: Font sizes remain readable (up to 24 students per page)
- **Different Screen Sizes**: Preview adjusts while maintaining proportions
- **Dark Mode**: Colors are properly inverted in preview

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: Print-friendly (landscape recommended)

---

**Last Updated**: 2024
**Component Path**: `src/private/teacher/batch/job-evalution/JobEvaluationPrint.jsx`
