from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import subprocess
import tempfile
import sys
from langchain_core.messages import HumanMessage
from agent import interview_bot
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

app = FastAPI(title="AI Interview Bot API")

# Allow the Next.js frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    stage: str = "greeting" # We default to greeting stage
    thread_id: str = "test_user_1" # In the future, this will be the User ID
    interview_type: str = "dsa"

@app.get("/")
def read_root():
    return {"message": "Welcome to the Interview Bot API"}

from fastapi import Header

@app.post("/chat")
def chat(request: ChatRequest, x_gemini_key: str = Header(None)):
    try:
        # LangGraph requires a 'config' to know which memory thread to load
        config = {"configurable": {"thread_id": request.thread_id}}
        
        # We ONLY pass the user's message. We let the agent.py state handle the 'stage'
        input_state = {
            "messages": [HumanMessage(content=request.message)],
            "interview_type": request.interview_type,
            "api_key": x_gemini_key
        }
        
        # Run the graph
        output_state = interview_bot.invoke(input_state, config=config)
        
        # The output_state contains the updated messages list. 
        # The last message is the AI's response.
        ai_response = output_state["messages"][-1].content
        dsa_problem = output_state.get("dsa_problem") or {}
        
        return {
            "reply": ai_response,
            "leetcode_url": dsa_problem.get("url"),
            "leetcode_slug": dsa_problem.get("slug"),
            "leetcode_title": dsa_problem.get("title"),
        }
    except Exception as e:
        error_msg = str(e)
        if "429 RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            if "GenerateRequestsPerDay" in error_msg:
                friendly_msg = "API Quota Exceeded. You have reached your daily Gemini Free Tier limit. Your quota will reset at midnight Pacific Time, or you can supply an API key in the top settings."
            else:
                import re
                from datetime import datetime, timedelta
                match = re.search(r"Please retry in (\d+\.?\d*)s", error_msg)
                if match:
                    seconds_to_wait = float(match.group(1))
                    retry_time = datetime.now() + timedelta(seconds=seconds_to_wait)
                    friendly_msg = f"API Quota Exceeded. You can use the AI again at {retry_time.strftime('%I:%M:%S %p')}."
                else:
                    friendly_msg = "API Quota Exceeded. You have reached your Gemini Free Tier limits. Please try again later."
            raise HTTPException(status_code=429, detail=friendly_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), user_id: str = Form(...), x_gemini_key: str = Header(None)):
    try:
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        loader = PyPDFLoader(temp_path)
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-2",
            google_api_key=x_gemini_key or os.getenv("GEMINI_API_KEY")
        )
        QdrantVectorStore.from_documents(
            splits,
            embeddings,
            path="./qdrant_db",
            collection_name=f"resumes_{user_id}"
        )
        
        os.remove(temp_path)
        return {"message": "Resume uploaded and processed successfully!"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

import psycopg
from psycopg.rows import dict_row
import os

@app.get("/api/dashboard")
def get_dashboard(user_id: str = None):
    try:
        with psycopg.connect(os.getenv("DATABASE_URL")) as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                if user_id:
                    cur.execute("SELECT * FROM interview_reports WHERE thread_id LIKE %s ORDER BY created_at DESC", (f"{user_id}_%",))
                else:
                    cur.execute("SELECT * FROM interview_reports ORDER BY created_at DESC")
                reports = cur.fetchall()
                return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class LeetCodeVerifyRequest(BaseModel):
    username: str
    problem_slug: str = ""
    problem_title: str = ""

@app.post("/api/verify-leetcode")
def verify_leetcode(req: LeetCodeVerifyRequest):
    import urllib.request, json, re, time
    username = req.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="LeetCode username is required")

    graphql_query = """query recentAcSubmissions($user: String!, $limit: Int!) {
      recentAcSubmissionList(username: $user, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }"""
    req_body = json.dumps({"query": graphql_query, "variables": {"user": username, "limit": 20}}).encode("utf-8")
    http_req = urllib.request.Request(
        "https://leetcode.com/graphql",
        data=req_body,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://leetcode.com"
        }
    )
    try:
        resp = urllib.request.urlopen(http_req, timeout=10)
        data = json.loads(resp.read().decode("utf-8"))
        submissions = data.get("data", {}).get("recentAcSubmissionList") or []

        target_slug = req.problem_slug.strip().lower()
        target_title = req.problem_title.strip().lower()

        if not target_slug and target_title:
            target_slug = re.sub(r"[^a-z0-9]+", "-", target_title).strip("-")

        now = int(time.time())
        ONE_HOUR = 3600
        found_old_submission = None

        for sub in submissions:
            sub_slug = (sub.get("titleSlug") or "").lower()
            sub_title = (sub.get("title") or "").lower()
            is_match = (
                (target_slug and (target_slug == sub_slug or target_slug in sub_slug or sub_slug in target_slug)) or
                (target_title and (target_title == sub_title or target_title in sub_title))
            )
            if is_match:
                sub_ts = int(sub.get("timestamp") or 0)
                time_diff = now - sub_ts
                if time_diff <= ONE_HOUR:
                    mins_ago = max(1, time_diff // 60)
                    return {
                        "accepted": True,
                        "title": sub.get("title"),
                        "titleSlug": sub.get("titleSlug"),
                        "timestamp": sub.get("timestamp"),
                        "message": f"Verified! Solution for '{sub.get('title')}' was Accepted on LeetCode ({mins_ago} min{'s' if mins_ago > 1 else ''} ago)."
                    }
                else:
                    hours_ago = round(time_diff / 3600, 1)
                    found_old_submission = f"Found an accepted submission for '{sub.get('title')}', but it was submitted {hours_ago} hours ago. Please submit a fresh Accepted solution on LeetCode during this interview session (within the last 1 hour) to verify."

        if found_old_submission:
            return {
                "accepted": False,
                "message": found_old_submission
            }

        return {
            "accepted": False,
            "message": f"No recent accepted submission found for '{req.problem_slug or req.problem_title}' under username '{username}' within the last hour. Please solve and submit on LeetCode, then click verify."
        }
    except Exception as e:
        return {
            "accepted": False,
            "message": f"Could not verify LeetCode profile '{username}': {str(e)}"
        }

class ExecuteRequest(BaseModel):
    language: str
    code: str
    test_cases: str = ""

@app.post("/api/execute")
def execute_code(req: ExecuteRequest):
    if req.language not in ["python", "javascript", "java", "cpp"]:
        return {"output": "Error: Unsupported language."}
    
    try:
        import tempfile, os, sys, subprocess
        
        if req.language == "python":
            final_code = req.code
            if req.test_cases.strip():
                final_code += f"""\n
import inspect
target_func = None
if 'Solution' in locals():
    sol = Solution()
    methods = [m for m in dir(sol) if not m.startswith('_')]
    if methods: target_func = getattr(sol, methods[-1])
else:
    funcs = [obj for name, obj in locals().items() if inspect.isfunction(obj) and obj.__module__ == '__main__']
    if funcs: target_func = funcs[-1]

if target_func:
    tests = '''{req.test_cases}'''
    for line in tests.strip().split('\\n'):
        if not line.strip(): continue
        try:
            args = eval(f"({{line.strip()}})")
            if not isinstance(args, tuple): args = (args,)
            res = target_func(*args)
            print(f"Input: {{line}}\\nOutput: {{res}}\\n")
        except Exception as e:
            print(f"Input: {{line}}\\nError: {{e}}\\n")
"""
            with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
                f.write(final_code.encode("utf-8"))
                temp_path = f.name
            result = subprocess.run([sys.executable, temp_path], capture_output=True, text=True, timeout=5)
            os.remove(temp_path)
            return {"output": result.stdout + ("\nError:\n" + result.stderr if result.stderr else "")}
            
        elif req.language == "javascript":
            with tempfile.NamedTemporaryFile(suffix=".js", delete=False) as f:
                f.write(req.code.encode("utf-8"))
                temp_path = f.name
            result = subprocess.run(["node", temp_path], capture_output=True, text=True, timeout=5)
            os.remove(temp_path)
            return {"output": result.stdout + ("\nError:\n" + result.stderr if result.stderr else "")}
            
        elif req.language == "java":
            final_code = req.code
            if "class" not in final_code:
                final_code = f"public class Main {{\n {req.code} \n public static void main(String[] args) {{ System.out.println(\"To test Java code without a main method, please write 'public static void main(String[] args)' or use Python.\"); }} \n}}"
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = os.path.join(temp_dir, "Main.java")
                with open(temp_path, "w", encoding="utf-8") as f:
                    f.write(final_code)
                compile_res = subprocess.run(["javac", "Main.java"], cwd=temp_dir, capture_output=True, text=True)
                if compile_res.returncode != 0: return {"output": "Compilation Error:\n" + compile_res.stderr}
                result = subprocess.run(["java", "Main"], cwd=temp_dir, capture_output=True, text=True, timeout=5)
                return {"output": result.stdout + ("\nError:\n" + result.stderr if result.stderr else "")}
                
        elif req.language == "cpp":
            final_code = req.code
            if "int main" not in final_code:
                final_code = f"#include <iostream>\nusing namespace std;\n{req.code}\n\nint main() {{\n    cout << \"[System] C++ Code compiled successfully!\\n\";\n    cout << \"Note: Because C++ is statically typed, it is impossible to dynamically parse raw text test cases into complex types (like vector<int>) without hand-writing a custom parser for your specific problem.\\n\";\n    cout << \"To run custom test cases in C++, please quickly add an 'int main()' function to manually instantiate and call your class.\\n\";\n    return 0;\n}}"
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = os.path.join(temp_dir, "main.cpp")
                with open(temp_path, "w", encoding="utf-8") as f:
                    f.write(final_code)
                compile_res = subprocess.run(["g++", "main.cpp", "-o", "main.exe"], cwd=temp_dir, capture_output=True, text=True)
                if compile_res.returncode != 0: return {"output": "Compilation Error:\n" + compile_res.stderr}
                result = subprocess.run([os.path.join(temp_dir, "main.exe")], cwd=temp_dir, capture_output=True, text=True, timeout=5)
                return {"output": result.stdout + ("\nError:\n" + result.stderr if result.stderr else "")}
                
    except subprocess.TimeoutExpired:
        return {"output": "Error: Execution timed out."}
    except Exception as e:
        return {"output": f"Execution failed: {str(e)}"}
