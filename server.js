import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const posts = [];

const moderationPrompt = `
Eres un sistema de moderación. Tu única tarea es analizar un texto
y decidir si debe ser aceptado o rechazado según estas reglas estrictas:

1. Rechaza cualquier texto que contenga lenguaje sexual explícito,
   incluso si no es violento ni de odio.
2. Rechaza insultos, groserías, vulgaridades o expresiones ofensivas,
   sin importar el contexto.
3. Rechaza incitaciones a violencia, odio, discriminación o autolesiones.
4. Si el texto es inofensivo, responde con "ACEPTADO".
5. Si el texto viola alguna regla, responde con "RECHAZADO".
6. No ignores ninguna palabra. No justifiques. Solo responde con ACEPTADO o RECHAZADO.
`;


// 1️⃣ Configurar cliente de OpenAI
const openai = new OpenAI({
  apiKey: ""
});

// 2️⃣ Endpoint para crear posts con moderación
app.post("/posts", async (req, res) => {
  const { author, content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({
      ok: false,
      message: "El contenido no puede ser vacío",
    });
  }

  try {
   const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: moderationPrompt },
    { role: "user", content: content }, // aquí va el texto del post
  ],
});

const decision = completion.choices[0].message.content;

if (decision === "RECHAZADO") {
  return res.status(400).json({
    ok: false,
    message: "El contenido fue rechazado por el sistema de moderación IA",
  });
}


    // 4️⃣ Si pasa la moderación, lo guardamos
    const post = {
      id: posts.length + 1,
      author: author || "anónimo",
      content,
    };

    posts.push(post);

    res.json({ ok: true, post });
  } catch (error) {
    console.error("Error con OpenAI:", error);
    res.status(500).json({
      ok: false,
      message: "Error al moderar el contenido",
    });
  }
});

// 5️⃣ Endpoint para obtener posts
app.get("/posts", (req, res) => {
  res.json({ ok: true, posts });
});

app.listen(3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
});
