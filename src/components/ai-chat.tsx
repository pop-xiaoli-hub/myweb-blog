"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const initialMessage: Message = {
  id: "welcome",
  role: "assistant",
  content: "你好！我是 popxiaoli 的 AI 助手。你可以问我 iOS、Objective-C，或者任何你感兴趣的问题。",
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || isLoading) return;

    const userMessage: Message = { id: createId(), role: "user", content };
    const assistantId = createId();
    const nextMessages = [...messages, userMessage];

    setMessages([...nextMessages, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "暂时无法连接 AI，请稍后再试。");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const data = line.trim().replace(/^data:\s*/, "");
          if (!line.startsWith("data:") || !data || data === "[DONE]") continue;

          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (typeof delta === "string") {
              answer += delta;
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId ? { ...message, content: answer } : message,
                ),
              );
            }
          } catch {
            // An incomplete SSE event stays in the buffer until the next chunk.
          }
        }
      }

      if (!answer) throw new Error("AI 没有返回内容，请重新试一次。");
    } catch (caughtError) {
      setMessages((current) => current.filter((message) => message.id !== assistantId));
      setError(caughtError instanceof Error ? caughtError.message : "发送失败，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="ai-chat">
      <div className="chat-header">
        <div className="chat-avatar" aria-hidden="true">AI</div>
        <div>
          <p className="chat-title">泡泡王助手</p>
          <p className="chat-status"><span /> 在线</p>
        </div>
      </div>

      <div ref={messagesContainerRef} className="chat-messages" role="log" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message-row ${message.role}`}>
            <div className="chat-bubble">
              {message.content ? (
                <span className="chat-plain-text">{message.content}</span>
              ) : (
                <span className="typing-dots"><i /><i /><i /></span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && <p className="chat-error" role="alert">{error}</p>}

      <label className="chat-input-label" htmlFor="chat-message">
        消息
      </label>
      <form className="chat-form" onSubmit={handleSubmit}>
        <textarea
          id="chat-message"
          aria-label="输入聊天消息"
          placeholder="问我任何问题…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={4000}
          rows={1}
          disabled={isLoading}
        />
        <button type="submit" aria-label="发送消息" disabled={!input.trim() || isLoading}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.4 20.4 21 12 3.4 3.6l.1 6.5L16 12 3.5 13.9l-.1 6.5Z" />
          </svg>
        </button>
      </form>
      <p className="chat-hint">Enter 发送 · Shift + Enter 换行</p>
    </div>
  );
}
