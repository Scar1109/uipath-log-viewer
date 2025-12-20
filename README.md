# 🤖 UiPath Log Viewer

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-Fast-646cff.svg?style=flat-square&logo=vite)
![Ant Design](https://img.shields.io/badge/Ant%20Design-UI-0170fe.svg?style=flat-square&logo=ant-design)

A modern, high-performance web application designed to parse, view, and analyze **UiPath Execution Logs** with ease. Built for speed and usability, handling large log files entirely in your browser without data leaving your machine.

---

## ✨ Key Features

### 🚀 High Performance Core
-   **Web Worker Parsing**: Offloads heavy log parsing to a background thread, ensuring the UI never freezes even with massive files.
-   **Virtual Scrolling**: Utilizes `react-window` to render millions of log lines smoothly with zero lag.

### 🔍 Advanced Search & Navigation
-   **"Find in Page" Context**: A browser-like search experience that highlights active matches in **Orange** and others in **Yellow**, jumping to the exact context without filtering out surrounding logs.
-   **Deep Filtering**: Filter by Log Level (Info, Error, Fatal), Date Range, or specific text content.

### 📊 Analytics Dashboard
-   **Interactive Charts**: Visualize your data with a beautiful Dashboard popup.
    -   **Log Level Distribution**: Pie chart breakdown of Errors, Warnings, and Info logs.
    -   **Timeline**: See execution flow over time.
    -   **Transaction Stats**: Identify longest-running processes.

### 🎨 Stylish & Accessible UI
-   **Dark Mode**: Fully supported dark theme for late-night debugging sessions.
-   **Responsive Design**: Fluid layout that adapts to different screen sizes.
-   **Modern Typography**: Clean, readable interface using *Product Sans* and *Inter* fonts.
-   **Customizable Grid**: Toggle "Readable Timestamps" or "Row Colors" to suit your preference.

### 💾 Data Management
-   **Excel Export**: Export your filtered view to `.xlsx` files for external reporting (currently supported for sets < 100 rows).
-   **Drag & Drop**: Simple file upload mechanism.

---

## 🛠️ Installation & Usage

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Scar1109/uipath-log-viewer.git
    cd uipath-log-viewer
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

4.  **Build for Production**
    ```bash
    npm run build
    ```

---

## 🔮 Future Enhancements

We are constantly improving! Here is what's on the roadmap:

-   [ ] **Streaming Export**: Support directly writing massive Excel files (100k+ rows) using streaming via `exceljs` or Worker streams.
-   [ ] **Multiple File Merge**: Upload multiple day logs and merge them into a single timeline view.
-   [ ] **Saved Layouts**: Persist your column visibility and filter preferences to `localStorage`.
-   [ ] **Advanced Regex Filtering**: Power-user support for Regex-based search queries.
-   [ ] **Log Comparison**: Diff view to compare two execution runs side-by-side.
-   [ ] **AI Insights**: Integrate local LLM analysis to automatically detect root causes of failures.
-   [ ] **Cloud Sync**: Optional integration to sync logs across devices for team collaboration.
-   [ ] **Custom Parsing Rules**: Visual editor to define custom parsing logic for non-standard log formats.

---

## 💻 Tech Stack

-   **Frontend**: React 19, Vite
-   **UI Framework**: Ant Design
-   **Visualization**: Recharts
-   **Performance**: Web Workers, React-Window
-   **Utilities**: Lodash, XLSX

---

Developed with ❤️ for the Automation Community.
