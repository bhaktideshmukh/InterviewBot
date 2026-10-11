"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
  const [userApiKey, setUserApiKey] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [leetcodeUrl, setLeetcodeUrl] = useState("");
  const [leetcodeSlug, setLeetcodeSlug] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [isVerifyingLc, setIsVerifyingLc] = useState(false);
  const [isLcVerified, setIsLcVerified] = useState(false);
  const [lcVerifyResult, setLcVerifyResult] = useState<{ accepted?: boolean; message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    setInterviewType(""); // Always start with placeholder, don't restore old type

    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) setUserApiKey(savedKey);

    const savedLcUser = localStorage.getItem("leetcode_username");
    if (savedLcUser) setLeetcodeUsername(savedLcUser);

  }, []);

  const extractLeetCode = (text: string) => {
    const match = text.match(/https:\/\/leetcode\.com\/problems\/([a-zA-Z0-9_-]+)/i);
    if (match) {
      setLeetcodeUrl(match[0] + "/");
      setLeetcodeSlug(match[1]);
    }
  };

  // Load chat history for current thread
  useEffect(() => {
    if (!currentThreadId) return;
    const saved = localStorage.getItem(currentThreadId);
    if (saved) {
      const parsed: Message[] = JSON.parse(saved);
      setMessages(parsed);
      let verified = false;
      for (const m of parsed) {
        if (m.role === "bot") extractLeetCode(m.content);
        if (m.role === "user" && m.content.toLowerCase().includes("accepted on leetcode")) {
          verified = true;
        }
      }
      setIsLcVerified(verified);
    } else {
      setMessages([]);
      setLeetcodeUrl("");
      setLeetcodeSlug("");
      setIsLcVerified(false);
    }
  }, [currentThreadId]);

  // Save chat history safely
  useEffect(() => {
    if (activeThreadRef.current && messages.length > 0) {
      localStorage.setItem(activeThreadRef.current, JSON.stringify(messages));
    }
  }, [messages]);

  const startNewChat = (typeOverride?: string) => {
    const typeToUse = typeOverride !== undefined ? typeOverride : interviewType;
    if (typeOverride !== undefined) setInterviewType(typeOverride);
    
    const newThreadId = userId + "_thread_" + Math.random().toString(36).substring(2, 10);
    const newSession = { id: newThreadId, type: typeToUse, date: new Date().toLocaleDateString() };
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    localStorage.setItem(`sessions_${userId}`, JSON.stringify(updatedSessions));
    setCurrentThreadId(newThreadId);
    setMessages([]);
    setLeetcodeUrl("");
    setLeetcodeSlug("");
    setIsLcVerified(false);
    setLcVerifyResult(null);
    setResumeUploaded(false); // Reset so upload prompt shows again for resume type
  };

  const verifyLeetCode = async () => {
    if (!leetcodeUsername.trim()) {
      alert("Please enter your LeetCode username first.");
      return;
    }
    localStorage.setItem("leetcode_username", leetcodeUsername.trim());
    setIsVerifyingLc(true);
    setLcVerifyResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/verify-leetcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: leetcodeUsername.trim(),
          problem_slug: leetcodeSlug
        })
      });
      const data = await res.json();
      setLcVerifyResult(data);
      if (data.accepted) {
        setIsLcVerified(true);
        setInput(`My solution for ${leetcodeSlug || "the problem"} has been verified and Accepted on LeetCode! Here is my approach and time/space complexity: `);
      }
    } catch {
      setLcVerifyResult({ accepted: false, message: "Could not reach backend verification service." });
    } finally {
      setIsVerifyingLc(false);
    }
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
      // Extract LeetCode URL from bot reply for the shortcut button
      extractLeetCode(data.reply);
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
                 backgroundColor: "#000000",
                 color: "#ffffff",
                 padding: "10px 36px 10px 12px",
                 borderRadius: "8px",
                 border: "1px solid rgba(255,255,255,0.35)",
                 outline: "none",
                 cursor: "pointer",
                 fontSize: "14px",
                 width: "100%",
                 WebkitAppearance: "none",
                 MozAppearance: "none",
                 appearance: "none",
                 backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23ffffff' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                 backgroundRepeat: "no-repeat",
                 backgroundPosition: "calc(100% - 10px) center",
                 colorScheme: "dark"
               }}
             >
               <option value="" style={{ backgroundColor: "#000000", color: "#ffffff" }}>Type of interview</option>
               <option value="dsa" style={{ backgroundColor: "#000000", color: "#ffffff" }}>Data structures and algorithms</option>
               <option value="sql" style={{ backgroundColor: "#000000", color: "#ffffff" }}>SQL & Databases</option>
               <option value="llsd" style={{ backgroundColor: "#000000", color: "#ffffff" }}>Low Level System Design</option>
               <option value="system_design" style={{ backgroundColor: "#000000", color: "#ffffff" }}>High Level System Design</option>
               <option value="oops" style={{ backgroundColor: "#000000", color: "#ffffff" }}>OOPs Concepts</option>
               <option value="hr" style={{ backgroundColor: "#000000", color: "#ffffff" }}>HR & Behavioral</option>
               <option value="resume" style={{ backgroundColor: "#000000", color: "#ffffff" }}>Resume based</option>
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

        {/* LeetCode Grind 75 Problem Banner — visible when problem is assigned */}
        {interviewType === "dsa" && leetcodeUrl && (
          <div style={{
            background: "linear-gradient(135deg, rgba(248, 159, 27, 0.12), rgba(18, 18, 18, 0.95))",
            border: "1px solid rgba(248, 159, 27, 0.35)",
            borderRadius: "12px",
            padding: "12px 16px",
            margin: "0 16px 10px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "22px" }}>{isLcVerified ? "✅" : "🟧"}</span>
                <div>
                  <div style={{ color: isLcVerified ? "#4ade80" : "#f89f1b", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    LeetCode Problem: {leetcodeSlug ? leetcodeSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Grind 75 Problem"}
                    {isLcVerified && (
                      <span style={{ background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontSize: "11px", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(34, 197, 94, 0.4)" }}>
                        ✓ Accepted & Verified
                      </span>
                    )}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
                    {isLcVerified ? "Solution verified! Continue discussing your approach and complexity with the interviewer." : "Read on LeetCode, discuss your approach & complexities here, then code!"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <a
                  href={leetcodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#f89f1b",
                    color: "#000",
                    fontWeight: "bold",
                    padding: "7px 14px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "13px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  🚀 Solve on LeetCode ↗
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setInput("I have solved the problem on LeetCode and it was Accepted! My approach and complexity: ");
                  }}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                    padding: "7px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  I've Solved It 👍
                </button>
              </div>
            </div>

            {/* LeetCode Verification Form — eliminated once verified or after feedback */}
            {!isLcVerified && !messages.some(m => m.content.includes("Final Feedback & Score")) && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: "8px"
              }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Verify LeetCode:</span>
                <input
                  type="text"
                  placeholder="Your LeetCode username"
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  style={{
                    background: "#000",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "12px",
                    outline: "none",
                    flex: "1",
                    minWidth: "150px"
                  }}
                />
                <button
                  type="button"
                  onClick={verifyLeetCode}
                  disabled={isVerifyingLc}
                  style={{
                    background: isVerifyingLc ? "#666" : "#22c55e",
                    color: "#000",
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    cursor: isVerifyingLc ? "wait" : "pointer",
                    fontSize: "12px"
                  }}
                >
                  {isVerifyingLc ? "Checking..." : "Verify Acceptance"}
                </button>
                {lcVerifyResult && !lcVerifyResult.accepted && (
                  <span style={{
                    fontSize: "12px",
                    color: "#f87171",
                    fontWeight: "500",
                    marginLeft: "4px"
                  }}>
                    {lcVerifyResult.message}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Input Area — hidden for resume type until resume is uploaded */}
        <form onSubmit={sendMessage} className={styles.inputArea} style={{ display: interviewType === "resume" && !resumeUploaded ? "none" : undefined }}>
          {interviewType === "dsa" && leetcodeUrl && (
            <a href={leetcodeUrl} target="_blank" rel="noopener noreferrer" className={styles.sendButton}
              style={{ background: "#f89f1b", color: "black", padding: "0 14px", fontWeight: "bold", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", fontSize: "13px" }}>
              🔗 LeetCode
            </a>
          )}
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
                 <strong style={{ color: "#60a5fa", fontSize: "16px", display: "block", marginBottom: "4px" }}>3. DSA Interview (LeetCode)</strong>
                 When the bot gives you a DSA problem, open the <strong>🔗 LeetCode</strong> link to read the details. Discuss your approaches and time/space complexities with the bot first in the chat, and once agreed, code and verify your solution on LeetCode!
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

    </main>
  );
}
