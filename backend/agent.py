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

def get_resume_context(user_id: str, api_key: str = None):
    try:
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-2",
            google_api_key=api_key or os.getenv("GEMINI_API_KEY")
        )
        client = QdrantClient(path="./qdrant_db")
        vector_store = QdrantVectorStore(client=client, collection_name=f"resumes_{user_id}", embedding=embeddings)
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
    interview_type: str
    api_key: str

from langchain_core.runnables import RunnableConfig

# --- 3. THE NODE ---
def interviewer_node(state: InterviewState, config: RunnableConfig):
    current_stage = state.get("stage", "greeting")
    interview_type = state.get("interview_type", "dsa")
    api_key = state.get("api_key") or os.getenv("GEMINI_API_KEY")
    thread_id = config.get("configurable", {}).get("thread_id", "unknown")
    resume_context = get_resume_context(thread_id, api_key) if interview_type == "resume" else ""

    llm = ChatGoogleGenerativeAI(
        model="gemini-3.6-flash",
        google_api_key=api_key
    )
    structured_llm = llm.with_structured_output(InterviewResponse)
    
    if current_stage == "greeting":
        if interview_type == "resume":
            system_prompt = "You are an expert AI interviewer. You have been given the candidate's resume. Greet them warmly, briefly acknowledge you have read their resume, highlight one or two things you noticed (like a specific skill or project), and ask if they are ready to begin a resume-based interview."
        elif interview_type == "dsa":
            system_prompt = "You are an expert AI technical interviewer conducting a Data Structures and Algorithms interview. Warmly greet the candidate, tell them that today's question is selected from the renowned Grind 75 curriculum and will be solved directly on LeetCode. Ask them if they are ready to begin!"
        else:
            system_prompt = f"You are an expert AI interviewer conducting a {interview_type.upper()} interview. Briefly greet the candidate and ask if they are ready to begin the {interview_type} round."
    elif current_stage == "technical":
        if interview_type == "dsa":
            system_prompt = """You are a senior technical interviewer conducting a Data Structures & Algorithms interview.
You MUST pick a real coding question from the famous Grind 75 list (https://www.techinterviewhandbook.org/grind75/) such as Two Sum, Valid Parentheses, Merge Two Sorted Lists, Best Time to Buy and Sell Stock, Invert Binary Tree, Maximum Subarray, 3Sum, Binary Search, Longest Substring Without Repeating Characters, Coin Change, Course Schedule, or Number of Islands.

You MUST include the exact LeetCode problem URL in your reply using this format:

PROBLEM STATEMENT
[Problem Title & Difficulty]
[Problem description]

LEETCODE LINK
https://leetcode.com/problems/[problem-slug]/

EXAMPLE INPUTS & OUTPUTS
[Examples]

CONSTRAINTS
[Constraints]

INSTRUCTIONS
Solve this problem on LeetCode by clicking the LeetCode button/link. Once your solution is Accepted on LeetCode, explain your approach, Time Complexity, and Space Complexity here so we can evaluate your solution.

Do not transition to the 'feedback' stage until they have solved the problem and correctly explained their approach and Time/Space complexity."""
        elif interview_type == "sql":
            system_prompt = """You are a strict technical interviewer. You MUST ask an advanced SQL query question using exactly the following template. Do NOT use markdown (* or #). Use exactly these headings:

PROBLEM STATEMENT
[Problem description]

TABLE SCHEMA
[Tables and columns]

EXAMPLE INPUT DATA
[Example data]

EXPECTED OUTPUT
[Output data]

Please share your SQL query approach.

Do not transition to 'feedback' until they provide a working query."""
        elif interview_type == "llsd":
            system_prompt = """You are a strict technical interviewer focusing on Low Level System Design. Ask them to design a specific data structure (e.g., LRU Cache) exactly like LeetCode's 'Design' problems using this template. Do NOT use markdown (* or #):

PROBLEM STATEMENT
[Problem description]

EXPECTED CLASS & METHODS
[Methods to implement]

EXAMPLE USAGE
[Examples]

CONSTRAINTS
[Constraints]

Please share your data structure choices and Time/Space Complexity for each method.

Do not transition to 'feedback' until they provide the working class code."""
        elif interview_type == "system_design":
            system_prompt = """You are a senior system design interviewer. Ask them to design the high-level architecture for a scalable system using this template. Do NOT use markdown (* or #):

PROBLEM STATEMENT
[Problem description]

FUNCTIONAL REQUIREMENTS
[Requirements]

NON-FUNCTIONAL REQUIREMENTS
[Requirements]

CAPACITY ESTIMATION
[Estimations]

Please describe your high-level architecture, database choices, and trade-offs.

Once thoroughly discussed, transition to 'feedback'."""
        elif interview_type == "hr":
            system_prompt = "You are an HR behavioral interviewer. Ask behavioral questions expecting the STAR method (Situation, Task, Action, Result). Evaluate their soft skills and leadership qualities. Once answered, transition to 'feedback'."
        elif interview_type == "oops":
            system_prompt = """You are a technical interviewer focusing on Object-Oriented Programming. Ask them a theoretical OOP question using this template. Do NOT use markdown (* or #):

PROBLEM STATEMENT
[Problem description]

EXPECTED CONCEPTS
[Concepts to cover]

CONSTRAINTS
[Constraints]

Please explain your understanding and approach.

Do not transition to 'feedback' until they demonstrate solid understanding."""
        elif interview_type == "resume":
            system_prompt = """You are a senior technical interviewer conducting a resume-based interview. Based on the candidate's resume provided below, ask SPECIFIC, targeted questions about:
- Their past projects (ask about architecture decisions, challenges faced, outcomes)
- Skills and technologies listed (ask them to explain or demonstrate proficiency)
- Work experience (ask about their role, responsibilities, impact)
- Any gaps or interesting career transitions

Do NOT ask generic questions. Every question must directly reference something from their resume.
Do NOT use markdown (* or #).
Ask ONE focused question at a time. Dig deeper with follow-up questions before moving to the next topic.
Do not transition to 'feedback' until you have covered at least 3 distinct areas from their resume."""
        else:
            system_prompt = "You are an expert interviewer. Ask a relevant question."
            
        if interview_type in ["dsa", "sql"]:
            system_prompt += "\n\nCRITICAL ESCAPE HATCH: If the candidate says they don't know, want to give up, or explicitly ask for the answer, you MUST provide the full correct solution (Approach, Complexity, and Code). Immediately set your next_stage to 'feedback'."
        elif interview_type == "hr":
            system_prompt += "\n\nCRITICAL ESCAPE HATCH: If the candidate says they don't know, want to give up, or explicitly ask for the answer, you MUST provide an example of a great STAR method response. Immediately set your next_stage to 'feedback'."
        else:
            system_prompt += "\n\nCRITICAL ESCAPE HATCH: If the candidate says they don't know, want to give up, or explicitly ask for the answer, you MUST provide the full correct conceptual explanation and architecture/class design. Immediately set your next_stage to 'feedback'."
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

    if result.next_stage == "feedback" and current_stage != "feedback":
        # Generate feedback immediately without waiting for user to type 'ok'
        print("--- [Backend] Auto-generating feedback... ---")
        from langchain_core.messages import HumanMessage
        feedback_prompt = "SYSTEM OVERRIDE: The interview is now over. Please provide a detailed final evaluation of the candidate. You MUST include a final score out of 10, and a summary of their strengths and weaknesses based on this conversation."
        feedback_msgs = messages_to_send + [AIMessage(content=result.reply_message), HumanMessage(content=feedback_prompt)]
        feedback_result = structured_llm.invoke(feedback_msgs)
        
        thread_id = config.get("configurable", {}).get("thread_id", "unknown")
        try:
            import psycopg
            with psycopg.connect(os.getenv("DATABASE_URL")) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO interview_reports (thread_id, interview_type, feedback_summary) VALUES (%s, %s, %s)",
                        (thread_id, interview_type, feedback_result.reply_message)
                    )
                conn.commit()
            print("--- [Backend] Feedback saved to Dashboard! ---")
        except Exception as e:
            print("--- [Backend] Failed to save feedback to Dashboard:", e)
            
        final_reply = result.reply_message + "\n\n---\n\n**Final Feedback & Score:**\n\n" + feedback_result.reply_message
        return {
            "messages": [AIMessage(content=final_reply)], 
            "stage": "completed"
        }
    
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
# Set max_idle and max_lifetime to aggressively cycle connections so Supabase doesn't drop them unexpectedly.
pool = ConnectionPool(
    conninfo=DATABASE_URL, 
    max_idle=30,
    max_lifetime=300,
    min_size=0,
    max_size=20,
    kwargs={
        "autocommit": True,
        "prepare_threshold": None
    }
)

# Add Postgres Memory!
memory = PostgresSaver(pool)
# setup() automatically creates the required tables in Supabase if they don't exist
try:
    memory.setup() 
except Exception as e:
    print(f"Warning: Could not setup PostgresSaver tables. Database might be unreachable: {e}")

interview_bot = workflow.compile(checkpointer=memory)
