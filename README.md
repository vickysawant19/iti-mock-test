<div align="center">

<!-- Animated Header -->
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=40&pause=1000&color=2563EB&center=true&vCenter=true&width=600&lines=ITI+Mitra;Empowering+ITI+Students;Smart+Mock+Exams;Real-time+Attendance" alt="Typing SVG" />

<p align="center">
  <b>The Ultimate Educational Platform for ITI Students & Instructors</b>
</p>

<!-- Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Appwrite-F02E65?style=for-the-badge&logo=Appwrite&logoColor=white" alt="Appwrite" />
  <img src="https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white" alt="Redux" />
</p>

</div>

---

## 🌟 Overview

**ITI Mitra** (formerly *ITI Mock Test*) is a comprehensive, modern web application engineered to bridge the gap between ITI (Industrial Training Institute) students and instructors. 

With a sleek, responsive UI and a highly optimized backend, ITI Mitra serves as a centralized hub for **Practice Exams**, **Real-time Attendance Tracking**, and **Student Performance Analytics**.

---

## ✨ Key Features

<table width="100%">
  <tr>
    <td width="50%">
      <h3>🎓 For Students</h3>
      <ul>
        <li><b>Dynamic Mock Tests:</b> Interactive exams that simulate real NCVT/SCVT assessments.</li>
        <li><b>Instant Grading:</b> Real-time feedback and performance analytics.</li>
        <li><b>Syllabus Tracking:</b> Stay aligned with the latest ITI curriculums.</li>
        <li><b>Beautiful Mobile UI:</b> Practice on the go with a native-feeling PWA interface.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>👨‍🏫 For Instructors</h3>
      <ul>
        <li><b>Smart Attendance Register:</b> Real-time, bulk-markable attendance grids.</li>
        <li><b>Batch Management:</b> Effortlessly organize students by trade, year, and batch.</li>
        <li><b>Automated Statistics:</b> Auto-calculated monthly attendance percentages.</li>
        <li><b>Holiday Configuration:</b> Custom calendar integrations for academic holidays.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🚀 Tech Stack

ITI Mitra is built for speed, scalability, and developer experience.

- **Frontend Framework:** React 18 + Vite
- **Styling & UI:** Tailwind CSS (with Dark Mode support) + Lucide Icons
- **State Management:** Redux Toolkit
- **Backend as a Service (BaaS):** Appwrite (Auth, TablesDB, Realtime subscriptions)
- **Routing:** React Router v6
- **Date Handling:** Date-fns

---

## ⚙️ Architecture Highlights

### ⚡ Real-time Data Sync
The platform utilizes Appwrite's WebSocket subscriptions to ensure that when an instructor updates attendance, it reflects instantly across all connected clients without a page refresh.

### 🛡️ Constraint-Based Logic
Strict architectural constraints prevent race-conditions during network requests, utilizing `AbortController` patterns to keep the UI perfectly synced even on slow 3G mobile networks.

---

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/iti-mitra.git
   cd iti-mitra
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory and add your Appwrite credentials:
   ```env
   VITE_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
   VITE_APPWRITE_PROJECT_ID="your_project_id"
   VITE_APPWRITE_DATABASE_ID="your_database_id"
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

---

<div align="center">
  <i>Built with ❤️ for the future technicians and engineers of tomorrow.</i>
</div>