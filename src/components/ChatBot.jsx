import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';  // For table support
import { motion } from "framer-motion";
import "./ChatBot.css";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);  // Ref for textarea to keep focus
  const eventSourceRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup SSE
  useEffect(() => () => eventSourceRef.current?.close(), []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    inputRef.current.focus();  // Keep cursor in text box after sending
    setLoading(true);

    try {
      // Send full conversation history for context to avoid forgetting
      const response = await fetch("http://localhost:8080/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],  // Include full history + current
          prompt: input  // Current input
        })
      });

      const data = await response.json();

      const botMessage = {
        role: "assistant",
        content: data.text || "[[No response from server]]"
      };
      setMessages((prev) => [...prev, botMessage]);

      // Streaming DISABLED for now
      /*
      if (data.stream) {
        if (eventSourceRef.current) eventSourceRef.current.close();

        eventSourceRef.current = new EventSource(
          "http://localhost:8080/api/v1/chat/stream"
        );

        eventSourceRef.current.onmessage = (e) => {
          if (!e.data || e.data === "[DONE]") return;

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: e.data }
          ]);
        };

        eventSourceRef.current.onerror = () => {
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
        };
      }
      */
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "[[Error: Could not reach server]]"
        }
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

  return (
    <div className="chat-container">
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            className={`message ${msg.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}  // Ref for focus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask anything..."
            disabled={loading}
            rows="1"
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? "..." : "➤"}
          </button>
        </div>
      </div>
    </div>
  );
}
