import express from "express";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // key del archivo .env
const app = express();
app.use(express.json());

// 1. Cargar documentos y partirlos en fragmentos (un párrafo = un fragmento)
const docsDir = path.join(here, "docs");
const chunks = fs.readdirSync(docsDir).flatMap((file) =>
  fs
    .readFileSync(path.join(docsDir, file), "utf8")
    .split(/\n\s*\n/)
    .map((text) => ({ source: file, text: text.trim() }))
    .filter((c) => c.text)
);

const normalize = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9]{3,}/g) ?? [];

// 2. Recuperación: puntaje = palabras de la pregunta que aparecen en el fragmento
function retrieve(question, k = 3) {
  const words = new Set(normalize(question));
  return chunks
    .map((c) => ({ ...c, score: normalize(c.text).filter((w) => words.has(w)).length }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// 3. Endpoint de chat: recupera contexto y se lo pasa a Gemini
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body; // [{ role: "user" | "assistant", content: "..." }]
  const question = messages.at(-1).content;
  const context = retrieve(question);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      config: {
        systemInstruction:
          "Eres el asistente del Café Nube. Responde en español, breve, usando SOLO el contexto dado. " +
          "Si la respuesta no está en el contexto, di que no tienes esa información.\n\nContexto:\n" +
          (context.map((c) => `[${c.source}] ${c.text}`).join("\n") || "(sin resultados)"),
      },
      // Gemini usa role "model" en vez de "assistant" y el texto va en parts
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });
    const answer = response.text;
    res.json({ answer, sources: context.map((c) => c.source) });
  } catch (error) {
    console.error(error);
    res.status(error.status ?? 500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log("API en http://localhost:3001"));
