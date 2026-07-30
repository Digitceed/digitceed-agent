"use client";

import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Onbekende fout");
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 min-h-[300px]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "self-end bg-white/10 rounded-lg px-4 py-2 max-w-[80%]"
                : "self-start bg-white/5 rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-wrap"
            }
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="self-start text-sm text-gray-400">Bezig met antwoorden...</div>}
        {error && <div className="self-start text-sm text-red-400">Fout: {error}</div>}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Stel een vraag..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black rounded-lg px-4 py-2 font-medium disabled:opacity-50"
        >
          Verstuur
        </button>
      </form>
    </div>
  );
}
