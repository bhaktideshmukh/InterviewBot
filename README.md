# 🚀 InterviewBot - AI-Powered Technical & Behavioral Interview Simulator

**InterviewBot** is an agentic, full-stack interview preparation platform designed to simulate realistic technical and behavioral interviews. Powered by **LangGraph**, **Google Gemini**, and a **Retrieval-Augmented Generation (RAG)** pipeline, InterviewBot challenges candidates with conceptual depth, evaluates time/space complexities, verifies live submissions on **LeetCode**, and provides tailored questions based on your uploaded resume.

---

## ✨ Key Features

- **🧠 State-Driven AI Agent (LangGraph):** Orchestrates dynamic interview stages (`greeting` ➔ `technical assessment` ➔ `feedback & score`) using structured output parsing with Pydantic for deterministic routing and zero hallucinations.
- **💻 Grind 75 & Live LeetCode Verification:** 
  - Randomly selects problems from the renowned **Grind 75** curriculum.
  - Requires candidates to discuss intuition, edge cases, and Time & Space Complexities before coding.
  - Live LeetCode verification via LeetCode's GraphQL API, checking for an **Accepted** submission within the last 1 hour under the candidate's username.
- **📄 Resume-Aware RAG Pipeline:** Upload your PDF resume to generate dense embeddings using `gemini-embedding-2` stored in a local **Qdrant Vector Database**. The bot asks personalized, deep-dive questions targeting your actual projects, tech stacks, and career history.
- **🏗️ Unified System Design Track:** Seamlessly combines high-level architecture, capacity estimations, functional/non-functional requirements, API design, and component-level trade-offs into a single comprehensive interview module.
- **🛟 "Escape Hatch" Unstuck Mechanism:** If you are stuck or ask to give up, the AI interviewer provides complete optimal solutions, code/architectural diagrams, and concludes with structured scoring.
- **⚡ Zero-Downtime Failover Chain:** High-throughput `gemini-3.5-flash-lite` (~30 RPM) as primary with automated fallback to `gemini-3.8-flash`.
- **🔑 Bring Your Own Key (BYOK):** Allows users to supply their own free Gemini API Key (stored 100% locally in browser memory) to avoid shared free tier quotas.
- **📊 Performance Dashboard & Long-Term Memory:** All interview transcripts, scores out of 10, strengths, and areas of improvement are persisted to a PostgreSQL database (Supabase) via LangGraph connection pooling.

---

## 🎯 Supported Interview Tracks

| Track | Description |
|---|---|
| **💻 Data Structures & Algorithms** | Random Grind 75 problems, complexity analysis, edge cases, and live LeetCode verification. |
| **🏗️ System Design** | Scalable architectures, throughput/storage estimations, microservices, database choices, and trade-offs. |
| **🗄️ SQL & Databases** | Advanced query design, schema modeling, joins, window functions, and indexing strategies. |
| **☕ OOPs Concepts** | Core object-oriented principles, design patterns, polymorphism, and class modeling. |
| **🤝 HR & Behavioral** | Situational and leadership questions evaluated against the structured **STAR** method. |
| **📄 Resume Based** | Deep contextual interview based on projects, skills, and experience extracted from your uploaded PDF resume. |

---

## 📸 Screenshots & Application Preview

### 1. Welcome & Interview Domain Selection
When launching InterviewBot, select your desired interview track from the sidebar. The interviewer dynamically adapts its greeting to your chosen topic.

![Welcome Screen](docs/screenshots/01-welcome-screen.png)

---

### 2. DSA Interview (Grind 75) & Live LeetCode Verification
The AI randomly assigns a problem from the Grind 75 curriculum, prompts for complexity and conceptual intuition first, presents a direct LeetCode link, and verifies live submissions within 1 hour via GraphQL.

| Assigned Problem & LeetCode Banner | Complexity Discussion & Approach Analysis |
|:---:|:---:|
| ![DSA Problem Assignment](docs/screenshots/04-dsa-interview-session.png) | ![Approach Discussion](docs/screenshots/05-approach-discussion.png) |

#### Verified Acceptance & Final Evaluation (Score 10/10)
Once the problem is solved and verified, the problem banner dismisses cleanly, and the AI produces a detailed performance breakdown and final score.

![LeetCode Verification and Score](docs/screenshots/06-leetcode-verification-and-score.png)

---

### 3. Resume-Aware RAG Interview
Upload your PDF resume to generate dense embeddings via `gemini-embedding-2` stored in Qdrant. The interviewer extracts your real-world experience to ask pointed architectural questions.

| Resume Upload Screen | Contextual RAG Questioning |
|:---:|:---:|
| ![Resume Upload Screen](docs/screenshots/07-resume-upload-screen.png) | ![Resume RAG Interview](docs/screenshots/08-resume-rag-interview.png) |

---

### 4. Candidate Dashboard & Analytics
Review your performance history, score progression charts across attempts, strengths, and areas for improvement stored permanently in Supabase PostgreSQL.

![Interview Dashboard](docs/screenshots/09-interview-dashboard.png)

---

### 5. Escape Hatch & Getting Unstuck
If a candidate gets stuck, typing *"I give up"* triggers the AI to provide the optimal solution (full code, STAR response, or architecture) along with constructive scoring.

| HR Behavioral Escape Hatch (STAR Method) | In-App Interactive Guide |
|:---:|:---:|
| ![HR Escape Hatch](docs/screenshots/10-escape-hatch-behavioral.png) | ![How to Use Guide](docs/screenshots/03-how-to-use-guide.png) |

---

### 6. Bring Your Own Key (BYOK) Security
Store your free Google Gemini API key securely in browser local storage for private, rate-limit-free interviews.

![API Key Modal](docs/screenshots/02-api-key-modal.png)

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 15 (React 19, TypeScript)
- **Styling:** Modern Vanilla CSS Modules (Glassmorphism, curated dark mode, responsive layout)
- **Storage:** LocalStorage for client-side thread management and BYOK API keys

### **Backend & AI Architecture**
- **Web Framework:** FastAPI (Python 3.10+)
- **Agent Orchestration:** LangGraph (StateGraph, RunnableConfig)
- **LLM / AI:** Google Gemini (`gemini-3.5-flash-lite` with failover to `gemini-3.8-flash`), LangChain Google GenAI
- **Embeddings & Vector Store:** Google Generative AI Embeddings (`models/gemini-embedding-2`), Qdrant
- **State Checkpointing & Storage:** Supabase (PostgreSQL) with `psycopg_pool.ConnectionPool`
- **Verification Engine:** LeetCode GraphQL API integration for real-time submission verification

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **Google Gemini API Key** ([Get free key here](https://aistudio.google.com/app/apikey))
- **PostgreSQL Database** (e.g., free tier on [Supabase](https://supabase.com))

---

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   DATABASE_URL=postgresql://postgres:your_password@your_supabase_host:5432/postgres
   ```

5. **Start the FastAPI server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   Backend will be running at `http://localhost:8000`.

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Launch the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 How to Use

1. **Set API Key:** Click **⚙️ API Key** in the sidebar to add your Gemini API key.
2. **Pick a Track:** Choose your interview type from the sidebar dropdown (DSA, System Design, SQL, OOPs, HR, or Resume-based).
3. **Start Interview:** Click **+ New Chat** to begin. The AI interviewer will greet you and guide you through the session.
4. **Solve & Verify (DSA):**
   - Discuss your approach and time/space complexities first in chat.
   - Click **🚀 Solve on LeetCode** to solve the problem.
   - Enter your LeetCode username and click **Verify Acceptance** to verify your recent submission.
5. **View Reports:** Once complete, check the **📊 Dashboard** to view your final scores and AI-generated performance breakdown.

---

## 👨‍💻 Author
Built by **Bhakti Deshmukh**
