// Usamos IMPORT porque tu package.json tiene "type": "module"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mensaje } = req.body;

    // 1. Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(mensaje);
    const response = await result.response;
    const text = response.text();

    // 2. Supabase (bloque seguro)
    try {
      if (process.env.SUPABASE_URL) {
        await supabase.from('historial_chat').insert({
          prompt: mensaje,
          respuesta: text
        });
      }
    } catch (dbError) {
      console.error("Error BD:", dbError);
    }

    return res.status(200).json({ respuesta: text });

  } catch (error) {
    console.error("Error API:", error);
    return res.status(500).json({ error: error.message || "Error interno" });
  }
}