from typing import Annotated, TypedDict
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, SystemMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langgraph.checkpoint.memory import MemorySaver
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
import os
from dotenv import load_dotenv

def get_resume_context():
    try:
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-2",
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        client = QdrantClient(path="./qdrant_db")
        vector_store = QdrantVectorStore(client=client, collection_name="resumes", embedding=embeddings)
        docs = vector_store.similarity_search("skills experience projects", k=3)
        return "\n".join([d.page_content for d in docs])
    except Exception:
        return ""

load_dotenv()

# --- 1. STRUCTURED OUTPUT (The magic routing trick) ---
# We force Gemini to reply in exactly this format, allowing it to control the stage!
class InterviewResponse(BaseModel):
    reply_message: str = Field(description="The actual message you want to speak to the candidate.")
    next_stage: str = Field(
        description="The stage of the interview. Choose 'greeting' if still introducing. Choose 'technical' when asking the DSA question or discussing the solution. Choose 'feedback' ONLY when the interview is over and you are giving the final score."
    )

# --- 2. THE STATE ---
class InterviewState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    stage: str # Notice there is no 'add' reducer here, so it will get overwritten!

# Initialize our Gemini Model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# Bind our Pydantic model to the LLM
structured_llm = llm.with_structured_output(InterviewResponse)

# --- 3. THE NODE ---
def interviewer_node(state: InterviewState):
    current_stage = state.get("stage", "greeting")
    resume_context = get_resume_context()
    
    if current_stage == "greeting":
        system_prompt = "You are an expert AI interviewer. Briefly greet the candidate. Tell them you have read their resume and ask them a specific question about one of their past experiences."
    elif current_stage == "technical":
        system_prompt = "You are a strict technical interviewer. Ask a technical question related to the candidate's skills. If they answer it, evaluate it and change the next_stage to 'feedback'."
    elif current_stage == "feedback":
        system_prompt = "The interview is over. Give the candidate a final score out of 10 and a brief feedback summary of how they did."
    else:
        system_prompt = "You are an expert technical interviewer."

    if resume_context:
        system_prompt += f"\n\nCandidate's Resume Context:\n{resume_context}"

    messages_to_send = [SystemMessage(content=system_prompt)] + state["messages"]
    
    print(f"\n--- [Backend] AI is analyzing the conversation (Current Stage: {current_stage}) ---")
    
    # Call the LLM (it will return our InterviewResponse object)
    result = structured_llm.invoke(messages_to_send)
    
    print(f"--- [Backend] AI decided Next Stage should be: {result.next_stage} ---\n")
    
    # We convert the string reply back into an AIMessage
    ai_message = AIMessage(content=result.reply_message)
    
    # We return the new message AND the new stage!
    return {
        "messages": [ai_message], 
        "stage": result.next_stage
    }

# --- 4. THE GRAPH ---
workflow = StateGraph(InterviewState)
workflow.add_node("interviewer", interviewer_node)
workflow.add_edge(START, "interviewer")
workflow.add_edge("interviewer", END)

from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool

# Connect to Supabase
DATABASE_URL = os.getenv("DATABASE_URL")
# Enable autocommit for LangGraph index creation.
# Set prepare_threshold=None to prevent "prepared statement already exists" errors when using Supabase Transaction Pooler!
pool = ConnectionPool(conninfo=DATABASE_URL, kwargs={
    "autocommit": True,
    "prepare_threshold": None
})

# Add Postgres Memory!
memory = PostgresSaver(pool)
# setup() automatically creates the required tables in Supabase if they don't exist
memory.setup() 

interview_bot = workflow.compile(checkpointer=memory)
