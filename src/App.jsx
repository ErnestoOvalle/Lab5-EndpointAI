import { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const history = [...messages, { role: "user", content: input }];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      const content = res.ok ? data.answer : `Error: ${data.error}`;
      setMessages([...history, { role: "assistant", content, sources: data.sources }]);
    } catch (err) {
      setMessages([...history, { role: "assistant", content: `Error: ${err.message}` }]);
    }
    setLoading(false);
  }

  return (
    <div className="chat">
      <h1>Chat RAG – Café Nube</h1>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <p>{m.content}</p>
            {m.sources?.length > 0 && <small>Fuentes: {[...new Set(m.sources)].join(", ")}</small>}
          </div>
        ))}
        {loading && <div className="msg assistant">Pensando...</div>}
      </div>
      <form onSubmit={send}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pregunta algo del café..." />
        <button disabled={loading}>Enviar</button>
      </form>
    </div>
  );
}
