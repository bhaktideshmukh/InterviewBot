# 🚀 InterviewBot - AI-Powered Interview Simulator

InterviewBot is a full-stack, AI-driven interview simulation platform designed to help candidates prepare for both behavioral and technical interviews. Using advanced Agentic AI workflows and Retrieval-Augmented Generation (RAG), the bot contextualizes interviews based on a user's actual uploaded resume and provides a live coding environment to evaluate Data Structures and Algorithms (DSA) solutions.

## ✨ Features

- **State-Driven AI Agent:** Utilizes LangGraph to manage dynamic interview states (Greeting ➔ Technical Assessment ➔ Feedback), ensuring a structured and hallucination-free interview flow.
- **Resume-Aware RAG Pipeline:** Upload a PDF resume to instantly generate vector embeddings via Google Gemini. The system queries a local Qdrant Vector Database to tailor interview questions specifically to your past projects and skills.
- **Live Code Execution Engine:** Includes an integrated Monaco Editor (Web IDE) that allows candidates to write and execute code in Python, JavaScript, Java, and C++ securely via a backend `subprocess` execution engine.
- **Strict Output Parsing:** Uses Pydantic to enforce strict JSON outputs from the LLM, enabling flawless routing logic and API reliability.
- **Historical Dashboard:** Logs interview transcripts and scores to a PostgreSQL database (via Supabase), allowing users to review past performances.

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js, React.js
- **Styling:** Tailwind CSS
- **Editor:** Monaco Editor (`@monaco-editor/react`)

### **Backend & AI**
- **Server:** FastAPI (Python)
- **AI/LLM:** Google Gemini API, LangChain, LangGraph
- **Vector Database:** Qdrant
- **Relational Database:** PostgreSQL (Supabase)

## ⚙️ Architecture Highlights
1. **Frontend-Backend Decoupling:** Next.js handles the client-side UI and IDE, while FastAPI manages CPU-heavy tasks like code compilation and vector generation.
2. **Memory Persistence:** Implements LangGraph's `MemorySaver` to retain conversational context across long interview sessions.
3. **Secure Code Execution:** User-submitted code is isolated into temporary files and executed with strict timeouts to prevent infinite loops and server crashes.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL Database URL (Supabase)
- Google Gemini API Key

### Backend Setup
1. Navigate to the backend folder: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the environment: `source venv/bin/activate` (Windows: `venv\Scripts\activate`)
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file and add your keys:
   ```env
   GEMINI_API_KEY=your_api_key_here
   DATABASE_URL=your_postgres_url
6. Start the FastAPI server: uvicorn main:app --reload

### Frontend Setup
- Navigate to the frontend folder: cd frontend
- Install dependencies: npm install
- Start the Next.js development server: npm run dev
- Open http://localhost:3000 in your browser.

### 👨‍💻 Author
Built by Bhakti Deshmukh
