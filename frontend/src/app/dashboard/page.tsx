"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import styles from "../page.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

type Report = {
  id: number;
  thread_id: string;
  interview_type: string;
  feedback_summary: string;
  created_at: string;
};

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("bhakti_user_id");
    fetch(`${BACKEND_URL}/api/dashboard${userId ? "?user_id=" + userId : ""}`)
      .then(r => r.json())
      .then(data => {
        setReports(data.reports || []);
        setIsLoading(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoading(false);
      });
  }, []);

  const chartData = useMemo(() => {
    // Reverse reports so oldest is first
    const chronological = [...reports].reverse();
    return chronological.map((r, idx) => {
      // Attempt to extract score
      const match = r.feedback_summary.match(/(?:Score|score|SCORE)[\s\w]*:?\s*(\d+(?:\.\d+)?)(?:\s*\/\s*10)?/);
      let score = match ? parseFloat(match[1]) : 0;
      if (score > 10) score = 10;
      return {
        name: `Int ${idx + 1}`,
        score,
        type: r.interview_type.toUpperCase()
      };
    }).filter(d => d.score > 0);
  }, [reports]);

  return (
    <div className={styles.container}>
      <div className={styles.chatWrapper} style={{ padding: "32px", overflowY: "auto", display: "block" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "24px", fontWeight: "600" }}>Interview Dashboard</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginTop: "4px" }}>Review your past interview feedback and scores.</p>
          </div>
          <Link href="/">
            <button className={styles.sendButton} style={{ padding: "10px 20px" }}>Back to Chat</button>
          </Link>
        </div>
        
        {isLoading ? (
          <p style={{ color: "white", opacity: 0.7 }}>Loading reports...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {chartData.length > 0 && (
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "16px" }}>
                <h2 style={{ color: "white", fontSize: "16px", marginBottom: "16px", fontWeight: "600" }}>Score Progression</h2>
                <div style={{ width: "100%", height: "250px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: "rgba(255,255,255,0.5)"}} />
                      <YAxis domain={[0, 10]} stroke="rgba(255,255,255,0.5)" tick={{fill: "rgba(255,255,255,0.5)"}} />
                      <Tooltip contentStyle={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white" }} />
                      <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {reports.map((r, i) => (
              <div key={i} style={{ background: "rgba(0,0,0,0.3)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
                      {r.interview_type}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>ID: {r.thread_id}</span>
                  </div>
                  <span style={{ opacity: 0.6, fontSize: "13px" }}>{new Date(r.created_at).toLocaleString()}</span>
                </div>
                
                <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.7", fontSize: "15px", color: "rgba(255,255,255,0.9)" }}>
                  {r.feedback_summary}
                </div>
              </div>
            ))}
            
            {reports.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", background: "rgba(0,0,0,0.2)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.2)" }}>
                <p style={{ color: "white", opacity: 0.7, fontSize: "16px" }}>No interviews completed yet.</p>
                <p style={{ color: "white", opacity: 0.5, fontSize: "14px", marginTop: "8px" }}>Complete an interview in the chat to see your feedback here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
