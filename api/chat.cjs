// Usamos 'require' en lugar de 'import' para evitar conflictos
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");

// Inicializamos las librerías
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  // Configuración de CORS (Permisos de acceso)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder a la "pregunta" del navegador (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mensaje } = req.body;

    // 1. Llamar a Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(mensaje);
    const response = await result.response;
    const text = response.text();

    // 2. Intentar guardar en Supabase (sin detener si falla)
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        await supabase.from('historial_chat').insert({
          prompt: mensaje,
          respuesta: text
        });
      }
    } catch (dbError) {
      console.error("Error guardando en BD:", dbError);
    }

    // 3. Responder al frontend
    return res.status(200).json({ respuesta: text });

  } catch (error) {
    console.error("Error en API:", error);
    return res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
};