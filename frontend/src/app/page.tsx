"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import styles from "./page.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

function TypingText({ text, isNew }: { text: string, isNew: boolean }) {
  const [displayed, setDisplayed] = useState(isNew ? "" : text);
  useEffect(() => {
    if (!isNew) { setDisplayed(text); return; }
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      if (i > text.length) i = text.length;
      setDisplayed(text.substring(0, i));
      if (i === text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text, isNew]);
  return <span style={{ whiteSpace: "pre-wrap" }}>{displayed}</span>;
}

type Message = {
  role: "user" | "bot";
  content: string;
};

type ChatSession = {
  id: string;
  type: string;
  date: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [interviewType, setInterviewType] = useState("");
  const [userId, setUserId] = useState("guest");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editorLang, setEditorLang] = useState("javascript");
  const [editorCode, setEditorCode] = useState("// Write your code here...");
  const [testCases, setTestCases] = useState("");
  const [executionOutput, setExecutionOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const activeThreadRef = useRef("");

  useEffect(() => {
    activeThreadRef.current = currentThreadId;
  }, [currentThreadId]);

  // User initialization & Sessions Load
  useEffect(() => {
    let id = localStorage.getItem("bhakti_user_id");
    if (!id) {
      id = "user_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("bhakti_user_id", id);
    }
    setUserId(id);

    // Load sessions
    const savedSessions = localStorage.getItem(`sessions_${id}`);
    let loadedSessions: ChatSession[] = [];
    if (savedSessions) {
      loadedSessions = JSON.parse(savedSessions);
    } else {
      // Migrate old chats if any
      const dsaChat = localStorage.getItem(`chat_${id}_dsa`);
      if (dsaChat) {
         const oldThread = id + "_thread_" + Math.random().toString(36).substring(2, 10);
         loadedSessions.push({ id: oldThread, type: "dsa", date: new Date().toLocaleDateString() });
         localStorage.setItem(oldThread, dsaChat);
      }
    }
    
    if (loadedSessions.length === 0) {
      const newThreadId = id + "_thread_" + Math.random().toString(36).substring(2, 10);
      loadedSessions = [{ id: newThreadId, type: "", date: new Date().toLocaleDateString() }];
    }
    
    setSessions(loadedSessions);
    setCurrentThreadId(loadedSessions[0].id);
    setInterviewType(loadedSessions[0].type);

    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) setUserApiKey(savedKey);

    // Setup Web Speech API
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput(prev => prev + (prev ? " " : "") + transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("Microphone not supported in this browser.");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    
    // Do not speak the final feedback summary because it's too long
    if (text.includes("Final Feedback & Score")) return;
    
    const cleanText = text.replace(/[*#`_]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.speak(utterance);
  };

  // Load chat history for current thread
  useEffect(() => {
    if (!currentThreadId) return;
    const saved = localStorage.getItem(currentThreadId);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([]);
    }
  }, [currentThreadId]);

  // Save chat history safely
  useEffect(() => {
    if (activeThreadRef.current && messages.length > 0) {
      localStorage.setItem(activeThreadRef.current, JSON.stringify(messages));
    }
  }, [messages]);

  const startNewChat = (typeOverride?: string) => {
    const typeToUse = typeOverride || interviewType;
    if (typeOverride) setInterviewType(typeOverride);
    
    const newThreadId = userId + "_thread_" + Math.random().toString(36).substring(2, 10);
    const newSession = { id: newThreadId, type: typeToUse, date: new Date().toLocaleDateString() };
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    localStorage.setItem(`sessions_${userId}`, JSON.stringify(updatedSessions));
    setCurrentThreadId(newThreadId);
    setMessages([]);
    setResumeUploaded(false); // Reset so upload prompt shows again for resume type
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userApiKey) {
       setShowApiKeyModal(true);
       return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", currentThreadId || userId);
    
    try {
      const response = await fetch(`${BACKEND_URL}/upload-resume`, {
        method: "POST",
        headers: { "X-Gemini-Key": userApiKey },
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      setResumeUploaded(true);
      // Auto-kick off the interview with a greeting message
      const greeting: Message = { role: "user", content: "Hi, I have uploaded my resume. Please start the interview." };
      setMessages([greeting]);
      setIsLoading(true);
      try {
        const chatRes = await fetch(`${BACKEND_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Gemini-Key": userApiKey },
          body: JSON.stringify({ message: greeting.content, thread_id: currentThreadId, interview_type: "resume" }),
        });
        const data = await chatRes.json().catch(() => ({}));
        if (chatRes.ok) {
          setMessages(prev => [...prev, { role: "bot", content: data.reply }]);
          speakText(data.reply);
        }
      } catch {}
      finally { setIsLoading(false); }
    } catch (error) {
      console.error(error);
      alert("Failed to upload resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // Stop any ongoing speech when sending a new message
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Add user message to UI immediately
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (!userApiKey) {
       setShowApiKeyModal(true);
       setIsLoading(false);
       setMessages((prev) => prev.filter(m => m !== userMessage)); // Revert
       return;
    }

    try {
      // Send message to our FastAPI backend
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-Key": userApiKey
        },
        body: JSON.stringify({ 
            message: userMessage.content, 
            thread_id: currentThreadId,
            interview_type: interviewType
        }),
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.detail || "API failed");
      }
      
      // Add AI response to UI
      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
      speakText(data.reply);
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message === "Failed to fetch" 
        ? "Error: Could not connect to backend. Is Uvicorn running?" 
        : `Backend Error: ${error.message}`;
      setMessages((prev) => [...prev, { role: "bot", content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.mainLayout}>
      
      {/* Left Sidebar */}
      <div className={styles.sidebar}>
        <button onClick={() => startNewChat()} style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
          <span style={{ fontSize: "18px" }}>+</span> New Chat
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
             <select 
               value={interviewType}
               onChange={(e) => startNewChat(e.target.value)}
               style={{
                 background: "rgba(0,0,0,0.5)", color: interviewType ? "white" : "rgba(255,255,255,0.4)", padding: "10px 12px",
                 borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", outline: "none",
                 cursor: "pointer", fontSize: "14px", width: "100%"
               }}
             >
               <option value="" disabled hidden>Type of interview</option>
               <option value="dsa">Data structures and algorithms</option>
               <option value="sql">SQL & Databases</option>
               <option value="llsd">Low Level System Design</option>
               <option value="system_design">High Level System Design</option>
               <option value="oops">OOPs Concepts</option>
               <option value="hr">HR & Behavioral</option>
               <option value="resume">Resume based</option>
             </select>

             <button onClick={() => setShowApiKeyModal(true)} style={{ background: userApiKey ? "rgba(0,255,0,0.05)" : "rgba(255,0,0,0.05)", color: userApiKey ? "#4ade80" : "#f87171", border: `1px solid ${userApiKey ? "rgba(74, 222, 128, 0.3)" : "rgba(248, 113, 113, 0.3)"}`, padding: "10px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", textAlign: "left" }}>
               ⚙️ API Key {userApiKey ? "(Set)" : "(Missing)"}
             </button>

             <Link href="/dashboard" style={{ textDecoration: "none", display: "block" }}>
                <button style={{
                  background: "rgba(255,255,255,0.05)", color: "white", padding: "10px 12px", borderRadius: "8px",
                  cursor: "pointer", fontSize: "14px", border: "1px solid rgba(255,255,255,0.1)",
                  transition: "all 0.2s", width: "100%", textAlign: "left"
                }}>
                  📊 Dashboard
                </button>
             </Link>

             <button onClick={() => setShowHelpModal(true)} style={{ background: "rgba(59, 130, 246, 0.05)", color: "#60a5fa", border: "1px solid rgba(96, 165, 250, 0.3)", padding: "10px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", textAlign: "left" }}>
               📖 How to Use
             </button>
        </div>

        <div style={{ fontSize: "12px", color: "#888", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600" }}>Recent Interviews</div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
           {sessions.map(s => (
              <div key={s.id} onClick={() => { setCurrentThreadId(s.id); setInterviewType(s.type); }} style={{ padding: "12px", background: currentThreadId === s.id ? "rgba(255,255,255,0.1)" : "transparent", borderRadius: "8px", cursor: "pointer", color: "white", fontSize: "14px", transition: "background 0.2s", display: "flex", flexDirection: "column", gap: "4px", border: "1px solid transparent", borderColor: currentThreadId === s.id ? "rgba(255,255,255,0.2)" : "transparent" }} onMouseEnter={e => { if (currentThreadId !== s.id) e.currentTarget.style.background="rgba(255,255,255,0.05)"; }} onMouseLeave={e => { if (currentThreadId !== s.id) e.currentTarget.style.background="transparent"; }}>
                 <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.type.toUpperCase()} Interview</span>
                 <span style={{ fontSize: "11px", color: "#aaa" }}>{s.date}</span>
              </div>
           ))}
        </div>
      </div>

      <div className={styles.chatWrapper} style={{ flex: 1, height: "100%", borderRadius: 0, position: "relative" }}>
        
        {/* Header */}
        <header className={styles.header} style={{ justifyContent: "center", position: "relative", padding: "16px", borderBottom: "1px solid #333", background: "#1e1e1e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexDirection: "column", justifyContent: "center" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
               <div className={styles.avatar}>AI</div>
               <div className={styles.headerText} style={{ textAlign: "left" }}>
                 <h1 style={{ fontSize: "20px", margin: 0 }}>InterviewBot</h1>
                 <p style={{ margin: 0, fontSize: "13px", opacity: 0.7 }}>{isLoading ? "Analyzing..." : "Ready for your interview"}</p>
               </div>
             </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className={styles.messagesContainer}>
          {/* Resume upload prompt — shown only for resume type before upload */}
          {interviewType === "resume" && !resumeUploaded && messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "24px", padding: "40px" }}>
              <div style={{ fontSize: "48px" }}>📄</div>
              <div style={{ textAlign: "center", color: "white" }}>
                <h2 style={{ margin: "0 0 8px 0", fontSize: "22px" }}>Resume Based Interview</h2>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "14px", maxWidth: "380px" }}>
                  Upload your PDF resume and I will read it, then ask you tailored interview questions based on your experience, skills, and projects.
                </p>
              </div>
              <label style={{
                background: isUploading ? "rgba(79,70,229,0.5)" : "#4f46e5",
                color: "white", padding: "14px 32px", borderRadius: "10px",
                cursor: isUploading ? "wait" : "pointer", fontSize: "15px",
                fontWeight: "bold", transition: "background 0.2s",
                display: "inline-flex", alignItems: "center", gap: "8px",
                border: "none"
              }}>
                {isUploading ? "⏳ Processing your resume..." : "📤 Upload Resume (PDF)"}
                <input type="file" accept=".pdf" onChange={uploadResume} disabled={isUploading} style={{ display: "none" }} />
              </label>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: 0 }}>Only PDF files are supported</p>
            </div>
          )}

          {/* Default welcome message for non-resume types */}
          {interviewType !== "resume" && messages.length === 0 && (
            <div className={styles.messageRow + " " + styles.bot}>
              <div className={styles.messageBubble}>
                Hello! I am your AI Interviewer. Please tell me your name and what domain you would like to be interviewed on.
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`${styles.messageRow} ${msg.role === "user" ? styles.user : styles.bot}`}>
              <div className={styles.messageBubble}>
                {msg.role === "bot" ? <TypingText text={msg.content} isNew={index === messages.length - 1} /> : msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area — hidden for resume type until resume is uploaded */}
        <form onSubmit={sendMessage} className={styles.inputArea} style={{ display: interviewType === "resume" && !resumeUploaded ? "none" : undefined }}>
          <button type="button" onClick={() => setIsEditorOpen(true)} className={styles.sendButton} style={{ background: "#4f46e5", padding: "0 16px" }}>
            &lt;/&gt; Code
          </button>
          <button type="button" onClick={toggleListening} className={styles.sendButton} style={{ background: isListening ? "#ef4444" : "rgba(255,255,255,0.1)", color: isListening ? "white" : "#ccc", padding: "0 16px", transition: "all 0.2s" }} title="Click to speak">
            {isListening ? "🎙️ Listening..." : "🎤"}
          </button>
          <input
            type="text"
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            autoFocus
          />
          <button type="submit" className={styles.sendButton} disabled={isLoading || !input.trim()}>
            Send
          </button>
        </form>

      </div>

      {showHelpModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "650px", maxHeight: "80vh", overflowY: "auto", background: "#1e1e1e", borderRadius: "16px", padding: "32px", color: "white", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
               <h2 style={{ margin: 0, fontSize: "24px" }}>📖 How to Use InterviewBot</h2>
               <button onClick={() => setShowHelpModal(false)} style={{ background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", fontSize: "28px", cursor: "pointer" }}>&times;</button>
             </div>
             
             <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontSize: "15px", lineHeight: "1.6", color: "rgba(255,255,255,0.8)" }}>
               <div>
                 <strong style={{ color: "#60a5fa", fontSize: "16px", display: "block", marginBottom: "4px" }}>1. Resume Based Interview</strong>
                 Select <strong>Resume based</strong> from the interview type dropdown. You will be prompted to upload your PDF resume directly in the chat. The bot will read your resume and ask highly personalized questions based on your skills, experience, and projects.
               </div>
               
               <div>
                 <strong style={{ color: "#60a5fa", fontSize: "16px", display: "block", marginBottom: "4px" }}>2. Choosing a Topic</strong>
                 Use the dropdown in the top right to select your interview type (DSA, System Design, OOPs, HR). Click <strong>+ New Chat</strong> to start a completely fresh session. All sessions are saved in the sidebar.
               </div>

               <div>
                 <strong style={{ color: "#60a5fa", fontSize: "16px", display: "block", marginBottom: "4px" }}>3. Writing Code (DSA / SQL)</strong>
                 When asked to code, click the <strong>&lt;/&gt; Open Code Editor</strong> button near the chat input. A full IDE will pop up where you can write code, run test cases, and securely submit it back to the AI for evaluation.
               </div>

               <div>
                 <strong style={{ color: "#60a5fa", fontSize: "16px", display: "block", marginBottom: "4px" }}>4. The "Escape Hatch" (Getting Unstuck)</strong>
                 If you are completely stuck, simply type <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", color: "#f87171" }}>"I give up"</code> or <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", color: "#f87171" }}>"Please provide the solution"</code>. The bot will instantly end the interview and provide:
                 <ul style={{ marginTop: "8px", paddingLeft: "24px" }}>
                   <li><strong>DSA/SQL:</strong> The optimal approach, Time/Space Complexity, and full Code.</li>
                   <li><strong>System Design/OOPs:</strong> A complete architectural breakdown and Class Design.</li>
                   <li><strong>HR:</strong> A perfect example using the STAR Method.</li>
                 </ul>
               </div>

               <div>
                 <strong style={{ color: "#60a5fa", fontSize: "16px", display: "block", marginBottom: "4px" }}>5. Final Score & Dashboard</strong>
                 When an interview successfully concludes (or when you use the escape hatch), the AI will automatically generate a final score out of 10 and a feedback summary. This is permanently saved. Click the <strong>📊 Dashboard</strong> button in the left sidebar to review your past performances!
               </div>
             </div>
             
             <div style={{ marginTop: "32px", textAlign: "right" }}>
               <button onClick={() => setShowHelpModal(false)} style={{ background: "#4f46e5", color: "white", padding: "10px 24px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Got it!</button>
             </div>
          </div>
        </div>
      )}

      {showApiKeyModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "500px", background: "#1e1e1e", borderRadius: "16px", padding: "24px", color: "white", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
             <h2 style={{ marginBottom: "16px" }}>⚙️ Set Your Gemini API Key</h2>
             <p style={{ fontSize: "14px", color: "#ccc", marginBottom: "16px", lineHeight: "1.5" }}>
               To keep this app free and prevent rate limits, you must provide your own Google Gemini API Key. It is stored securely and 100% locally on your browser.
             </p>
             <div style={{ background: "rgba(0,0,0,0.5)", padding: "16px", borderRadius: "8px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
               <h3 style={{ fontSize: "14px", marginBottom: "12px" }}>How to get your free key:</h3>
               <ol style={{ fontSize: "13px", color: "#aaa", paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                 <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "bold" }}>Google AI Studio</a>.</li>
                 <li>Sign in with your Google account.</li>
                 <li>Click the blue <strong>Create API key</strong> button.</li>
                 <li>Copy the generated key and paste it below.</li>
               </ol>
             </div>
             <input 
               type="password" 
               placeholder="Paste your Gemini API Key here (AIzaSy...)" 
               value={userApiKey}
               onChange={(e) => setUserApiKey(e.target.value)}
               style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white", marginBottom: "16px", outline: "none", fontFamily: "monospace" }}
             />
             <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
               <button onClick={() => setShowApiKeyModal(false)} style={{ background: "transparent", color: "white", padding: "10px 16px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>Cancel</button>
               <button onClick={() => { localStorage.setItem("gemini_api_key", userApiKey); setShowApiKeyModal(false); }} style={{ background: "#4f46e5", color: "white", padding: "10px 24px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="#4338ca"} onMouseLeave={e => e.currentTarget.style.background="#4f46e5"}>Save Key</button>
             </div>
          </div>
        </div>
      )}

      {isEditorOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "85%", height: "85%", background: "#1e1e1e", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
            <div style={{ padding: "16px 24px", background: "#2d2d2d", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <h3 style={{ color: "white", margin: 0 }}>Code Editor</h3>
                <select value={editorLang} onChange={(e) => setEditorLang(e.target.value)} style={{ background: "#444", color: "white", padding: "8px 12px", borderRadius: "8px", border: "none", outline: "none", cursor: "pointer" }}>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="sql">SQL</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" onClick={() => setIsEditorOpen(false)} style={{ background: "transparent", color: "white", border: "none", cursor: "pointer", padding: "8px 16px", borderRadius: "8px" }}>Cancel</button>
                <button type="button" disabled={isExecuting} onClick={async () => {
                  setIsExecuting(true);
                  try {
                    const res = await fetch(`${BACKEND_URL}/api/execute`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ language: editorLang, code: editorCode, test_cases: testCases })
                    });
                    const data = await res.json();
                    setExecutionOutput(data.output);
                  } catch(e) {
                    setExecutionOutput("Network Error or Backend Down");
                  } finally {
                    setIsExecuting(false);
                  }
                }} style={{ background: "#10b981", color: "white", border: "none", padding: "8px 24px", borderRadius: "8px", cursor: isExecuting ? "wait" : "pointer", fontWeight: "600" }}>{isExecuting ? "Running..." : "Run Code"}</button>
                <button type="button" onClick={() => {
                  setInput("Here is my code:\n\n```" + editorLang + "\n" + editorCode + "\n```");
                  setIsEditorOpen(false);
                }} style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Submit Code</button>
              </div>
            </div>
            <div style={{ flex: 1, padding: "8px 0", display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 2 }}>
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={editorLang}
                  value={editorCode}
                  onChange={(value) => setEditorCode(value || "")}
                  options={{ minimap: { enabled: false }, fontSize: 15, padding: { top: 16 } }}
                />
              </div>
              <div style={{ flex: 1, display: "flex", borderTop: "1px solid #333", background: "#000" }}>
                <div style={{ flex: 1, borderRight: "1px solid #333", padding: "12px", display: "flex", flexDirection: "column" }}>
                  <div style={{ color: "#6b7280", marginBottom: "8px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Test Cases (Python Auto-run)</div>
                  <textarea 
                    value={testCases} 
                    onChange={e => setTestCases(e.target.value)}
                    placeholder="e.g.\n[[1,3],[2,6]]\n[1,2,3], 5"
                    style={{ flex: 1, background: "transparent", border: "none", color: "white", fontFamily: "monospace", resize: "none", outline: "none", fontSize: "14px" }}
                  />
                </div>
                <div style={{ flex: 1, padding: "12px", overflowY: "auto", fontFamily: "monospace", color: "#10b981", fontSize: "14px", whiteSpace: "pre-wrap" }}>
                  <div style={{ color: "#6b7280", marginBottom: "8px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Execution Output</div>
                  <div style={{ color: executionOutput.includes("Error") || executionOutput.includes("failed") ? "#ef4444" : "#10b981" }}>
                    {isExecuting ? "Executing code..." : (executionOutput || "Output will appear here.")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
