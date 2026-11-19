# Lab 5 – Endpoint IA (Chat RAG)

App en React que se conecta a la API de Gemini (Google) para un chat tipo RAG sobre la información de un café ficticio ("Café Nube").

## Cómo funciona
1. **Documentos:** `server/docs/*.md` es la base de conocimiento; cada párrafo es un fragmento.
2. **Recuperación:** el endpoint `POST /api/chat` (Express, `server/index.js`) busca los 3 fragmentos con más palabras en común con la pregunta.
3. **Generación:** esos fragmentos se mandan como contexto a Gemini (`gemini-3.8-flash`), que responde solo con esa información.
4. **Frontend:** React (`src/App.jsx`) muestra el chat y las fuentes usadas.

La API key vive solo en el servidor (archivo `.env`), nunca en el navegador.

## Correr
La API key se saca gratis en https://aistudio.google.com/apikey

```bash
npm install
cp .env.example .env   # y pon tu GEMINI_API_KEY
npm run dev            # frontend en http://localhost:5173, API en :3001
```
