from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
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
    return {"message": "Welcome to the AI Interview Bot API"}

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        # LangGraph requires a 'config' to know which memory thread to load
        config = {"configurable": {"thread_id": request.thread_id}}
        
        # We ONLY pass the user's message. We let the agent.py state handle the 'stage'
        input_state = {
            "messages": [HumanMessage(content=request.message)],
            "interview_type": request.interview_type
        }
        
        # Run the graph
        output_state = interview_bot.invoke(input_state, config=config)
        
        # The output_state contains the updated messages list. 
        # The last message is the AI's response.
        ai_response = output_state["messages"][-1].content
        
        return {"reply": ai_response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
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
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        QdrantVectorStore.from_documents(
            splits,
            embeddings,
            path="./qdrant_db",
            collection_name="resumes"
        )
        
        os.remove(temp_path)
        return {"message": "Resume uploaded and processed successfully!"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
