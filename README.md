# Ledger.mono

A high-density, brutalist financial dashboard built with React and Tailwind CSS. Emphasizing a strict monospace aesthetic, it features real-time performance, client-side data states, zero heavy charting library dependencies, and an inline 3-month predictive linear regression engine.

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Lucide React](https://img.shields.io/badge/Lucide_React-000000?style=flat&logo=lucide&logoColor=white)

---

## Features

* **Brutalist Monospace UX:** High-contrast, zero-radius border design language using the `DM Mono` typeface for optimized scannability.
* **Mathematical Forecasting:** Built-in client-side trend projection computing 3 months into the future with calculated statistical confidence boundaries.
* **Pure SVG Data Visualizations:** Lightweight, ultra-performant charting built completely using native SVG vectors rather than bulky third-party libraries.
  * **Category Spending Radar:** An angular geometric plot mapping proportional variance across variable costs.
  * **Expense Distribution Donut:** Fast percentage breakdowns via stroke-dasharray tracking.
  * **Running Net Balance Sparkline:** Vector-mapped chronological cash flow baseline with custom linear gradient areas.
  * **Grouped Monthly Bars:** Parallel metrics identifying disparity between aggregate incomes and expenditures.
* **Granular Multi-Filtering:** Instant sorting states based across multi-category select tags and transactional directions.

---

## Tech Stack

* **Core UI Engine:** React 18 (Optimized using `useMemo` hooks for heavy analytical derivations)
* **Styling Framework:** Tailwind CSS
* **Iconography Library:** `lucide-react`
* **Typography Payload:** Google Fonts (`DM Mono`)

---

## Analytical Engine Under the Hood

Unlike flat ledger storage setups, this software runs automated analytical mathematical equations on historical trends to project potential financial runaways.

### 1. Trend Line Estimation
The linear regression engine isolates chronological data segments to deduce slope ($m$) and interception anchors ($b$) via the ordinary least squares technique:

$$m = \frac{n\sum(xy) - \sum x \sum y}{n\sum(x^2) - (\sum x)^2}$$

$$b = \frac{\sum y - m\sum x}{n}$$

### 2. Standard Deviation Volatility Thresholds
To prevent flat projections from masking erratic variance, the system computes structural confidence limits against future vectors. By extracting residuals from historic trends, it maps standard deviation bands ($\pm 1.5\sigma$) instantly using translucent SVG polygon polygons:

$$\sigma = \sqrt{\frac{\sum(y - \hat{y})^2}{n}}$$

---

## Getting Started

### Prerequisites
Make sure your development machine has **Node.js** and an npm package manager fully installed.

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/ledger-mono.git](https://github.com/yourusername/ledger-mono.git)
   cd ledger-mono
Install core visual dependencies:

Bash
npm install lucide-react
Verify Global Fonts: Ensure your document layer (index.html) calls the appropriate typography weight headers inside the parent <head> markup block:

HTML
<link href="[https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500;700&display=swap](https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500;700&display=swap)" rel="stylesheet">
Launch Local Server:

Bash
npm run dev
Project Structure
Code snippet
├── src/
│   ├── App.jsx            # Core Application Shell (Data state, calculations, and UI grid layout)
│   └── index.css          # Global styles alongside Tailwind directives
License
Distributed under the MIT License. See LICENSE for more information.
