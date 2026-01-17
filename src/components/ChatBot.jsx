import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import "./ChatBot.css";

import { postChat } from "../utils/chatApi";
import { useAuth } from "../auth/AuthContext";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRgbAnimation, setShowRgbAnimation] = useState(true); // For RGB animation on input
  const [theme, setTheme] = useState("light"); // Theme state: "light" or "dark"

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /* ============================
     ✅ REQUIRED SAFE DEFINITIONS
     ============================ */

  const deviceInfo = {
    os: navigator.platform || "Unknown",
    browser: navigator.userAgent || "Unknown",
  };

  const deviceFingerprint = btoa(
      navigator.userAgent +
      navigator.language +
      screen.width +
      screen.height
  ).substring(0, 32);

  const geoInfo = {
    ip: "unknown",
    city: "unknown",
    country: "unknown",
  };

  /* ============================
     🔐 Auth safety redirect
     ============================ */

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /* ============================
     🔽 Auto-scroll
     ============================ */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ============================
     🌈 RGB Animation for Input (One round, then away; back on refresh)
     ============================ */

  useEffect(() => {
    const hasPlayed = sessionStorage.getItem("rgbAnimationPlayed");
    if (!hasPlayed) {
      setShowRgbAnimation(true);
      const timer = setTimeout(() => {
        setShowRgbAnimation(false);
        sessionStorage.setItem("rgbAnimationPlayed", "true");
      }, 3000); // 3 seconds for one round
      return () => clearTimeout(timer);
    } else {
      setShowRgbAnimation(false);
    }
  }, []);

  /* ============================
     🚪 Signout handler (renamed from Logout)
     ============================ */

  const handleSignout = useCallback(async () => {
    const token = localStorage.getItem("jwtToken");

    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          deviceFingerprint,
          deviceName: `${deviceInfo.os} / ${deviceInfo.browser}`,
          deviceOs: deviceInfo.os,
          ipAddress: geoInfo.ip,
          city: geoInfo.city,
          country: geoInfo.country,
        }),
      });
    } catch (err) {
      console.warn("Signout tracking failed:", err);
    }

    // ✅ Clear AFTER request
    localStorage.clear();
    sessionStorage.clear();
    logout();

    navigate("/login", { replace: true });
  }, [deviceInfo, deviceFingerprint, geoInfo, logout, navigate]);

  /* ============================
     💬 Send message
     ============================ */

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    inputRef.current?.focus();
    setLoading(true);

    try {
      const data = await postChat("/v1/chat", {
        messages: [...messages, userMessage],
        prompt: input,
      });

      const botMessage = {
        role: "assistant",
        content: data?.text || "[[No response from server]]",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "[[Error: Could not reach server]]" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ============================
     🎨 Theme Toggle
     ============================ */

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  /* ============================
     🖥️ UI (Fixed Layout for No Scrolling Issues, Particles Removed in Dark Mode, RGB Same)
     ============================ */

  return (
      <div className={`chat-page ${theme}`}>
        {/* Particles only in Light Mode */}
        {theme === "light" && (
            <div className="particles">
              {[...Array(15)].map((_, i) => (
                  <div key={i} className="particle" style={{ animationDelay: `${i * 0.6}s` }} />
              ))}
            </div>
        )}

        {/* Left Sidebar: Fixed Position */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h3>AI Options</h3>
          </div>
          <div className="sidebar-options">
            <button className="option-btn" onClick={() => setMessages([])}>
              New Chat
            </button>
            <button className="option-btn" onClick={() => alert("Chat History - Coming Soon!")}>
              History
            </button>
            <button className="option-btn" onClick={() => alert("Settings - Coming Soon!")}>
              Settings
            </button>
          </div>
        </div>

        {/* Main Chat Area: Fixed Layout */}
        <div className="chat-main">
          {/* Top Header: Fixed */}
          <div className="chat-header">
            <h1>AI Chat</h1>
            <div className="header-actions">
              <button className="theme-toggle-btn" onClick={toggleTheme}>
                {theme === "light" ? "🌙" : "☀️"}
              </button>
              <button className="signout-btn" onClick={handleSignout}>
                Signout
              </button>
            </div>
          </div>

          {/* Chat Window: Scrolls Internally */}
          <div className="chat-window">
            {messages.length === 0 && (
                <div className="welcome-message">
                  <h2>Welcome to AI Chat</h2>
                  <p>Type a message to start.</p>
                </div>
            )}
            {messages.map((msg, idx) => (
                <motion.div
                    key={idx}
                    className={`message ${msg.role}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input: Fixed at Bottom */}
          <div className="chat-input">
            <div className="input-wrapper">
              <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type here..."
                  disabled={loading}
                  rows={1}
                  className={showRgbAnimation ? "rgb-animation" : ""}
              />
              <button
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}