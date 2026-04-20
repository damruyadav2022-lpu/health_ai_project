# 🧬 HealthAI (Dr.AI) Clinical Intelligence Platform

An enterprise-grade, real-time Clinical AI Platform combining multi-modal diagnostics, a generative AI medical scribe, OCR report scanning, and population health analytics into a single unified dashboard.

---

## 🏗️ Core Architecture & System Design

The platform follows a modern, decoupled architecture ensuring scalability and rapid deployment.

### 1. The Frontend (Clinical Nexus)
*   **Framework:** React 18+ with Vite for ultra-fast HMR and building.
*   **Styling:** Tailwind CSS for a utility-first design system and custom Glassmorphism.
*   **State Management:** React Context API (Auth, Notifications) for lightweight, global state handling.
*   **Visuals:** Framer Motion for micro-interactions and complex transitions; Recharts for data-driven clinical visualizations.
*   **Routing:** React Router DOM (v6) with lazy loading for optimized initial page loads.

### 2. The Backend (Neural Gateway)
*   **Framework:** FastAPI (Python 3.11+) for high-performance, asynchronous API endpoints.
*   **ORM:** SQLAlchemy with SQLite for reliable local data persistence.
*   **Security:** JWT (JSON Web Tokens) for session management with a "Resilient Demo Mode" that falls back to demo users if authentication is bypassed.
*   **Validation:** Pydantic (v2) for strict request/response schema enforcement.

---

## ✨ Key Feature Details

### 📝 AI Medical Scribe
*   **Concept:** Automated Clinical Documentation.
*   **Logic:** Uses Large Language Models (LLMs) like Anthropic Claude 3.5 to parse natural language conversations between doctors and patients, automatically structuring them into professional medical categories (SOAP notes) using formal terminology.

### 📄 Intelligent OCR Report Scanner
*   **Concept:** Digitization of Unstructured Health Data.
*   **Logic:** Uses OpenCV for image preprocessing combined with Tesseract OCR to convert physical blood tests or PDF reports into structured JSON data (e.g., mapping "Glucose: 110mg/dL" to a database-ready integer).

### 🩺 Advanced Prediction & Risk Scoring
*   **Concept:** Proactive Clinical Decision Support (CDS).
*   **Logic:** A custom-built disease prediction logic cross-references patient vitals (Blood Pressure, Heart Rate, HbA1c) and symptoms against a proprietary database of 500+ conditions to calculate "Risk Levels" (Low/Medium/High/Critical).

### 👥 Integrated Patient Management
*   **Concept:** Secure Electronic Health Record (EHR) lightweight solution.
*   **Logic:** Handles full Lifecycle Management (CRUD) for patients, allowing doctors to track health history, appointments, and recovery status over time.

---

## 🛠️ Technical Concepts & Patterns Used

1.  **Lazy Loading & Code Splitting:** Heavy pages (Dashboard, Analytics) are loaded on demand to minimize the initial JS bundle size.
2.  **Context Provider Pattern:** Deeply nested components share Authentication and Notification data without "Prop Drilling."
3.  **Interceptor Pattern:** Axios interceptors automatically attach security tokens to every outgoing API request.
4.  **Lifespan Context Managers:** FastAPI `lifespan` ensures database tables are verified and demo data is seeded automatically upon server startup.
5.  **Glassmorphism Design System:** Uses high-transparency backgrounds with `backdrop-filter: blur()`, saturated gradients, and border-glows to create a "futuristic cockpit" feel.
6.  **Parallel Service Launching:** A custom PowerShell launcher (`launch_healthai.ps1`) manages the lifecycle of both the Python Venv and Node_Modules, allowing one-click synchronization.

---

## 🚀 Installation Guide

### Prerequisites
*   **Python 3.11+** installed
*   **Node.js 20+** installed
*   *(Optional)* **Tesseract OCR** installed on Windows for the document scanner to work optimally.

### Step-by-Step Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/damruyadav2022-lpu/healthai-platformd.git
    cd healthai-platformd
    ```

2.  **Add your AI API Key:**
    Inside the `backend/` folder, create a file named `.env` and add your Anthropic Claude key:
    ```env
    ANTHROPIC_API_KEY=your_api_key_here
    ```

3.  **Run the automated launcher (Windows):**
    ```powershell
    .\launch_healthai.ps1
    ```
    *This script will automatically set up Python environments, install Node modules, and start both servers at once.*

---

## 🌐 API Endpoints

The full interactive Swagger documentation is available at `http://localhost:8000/api/docs`.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login and obtain JWT Token |
| `POST` | `/api/predict` | Structured lab data prediction |
| `POST` | `/api/ocr` | Upload medical report for scanning |
| `POST` | `/api/chat/extract-soap` | Real-time SOAP note generation |
| `GET`  | `/api/patients` | Retrieve all patient records |

---

## 📁 Repository Structure

```text
health_ai_project/
├── backend/                  # Python FastAPI Backend
│   ├── app/                  # Core API logic (auth, chat, ocr, patients)
│   ├── diseases.json         # 500+ Disease knowledge base
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React UI Application
│   ├── src/                  # React components, pages, context
│   ├── package.json          # Node dependencies
│   └── tailwind.config.js    # UI Styling rules
├── launch_healthai.ps1       # Automated Windows startup script
└── docker-compose.yml        # Docker production configuration
```

---

## 👨‍💻 Author

**Deepak Kumar Yadav**
*   GitHub: [@damruyadav2022-lpu](https://github.com/damruyadav2022-lpu)
*   LinkedIn: [Deepak Kumar Yadav](https://www.linkedin.com/in/)
