import { LessonParams } from "../types";

// NOTA: Ya no importamos GoogleGenAI aquí porque la conexión se hace en el backend.

export const generateLessonContent = async (params: LessonParams): Promise<string> => {
  // 1. CONSERVAMOS TU LÓGICA DE NARRATIVA ORIGINAL
  const chosenNarrative = params.narrative === 'Personalizada' ? params.customNarrative : params.narrative;
  const narrativeInstruction = params.narrative === 'Random' 
    ? "SE EXTREMADAMENTE CREATIVO: Elige una narrativa sorpresa (ciencia ficción, espionaje, etc.) para toda la clase."
    : `Toda la clase debe girar en torno a la narrativa: "${chosenNarrative}". Adapta el lenguaje y las dinámicas a este tema.`;

  // 2. CONSERVAMOS TU PROMPT MAESTRO (EL "ALMA" DE LA APP)
  // He combinado tu 'systemInstruction' y tu 'prompt' en un solo mensaje para enviarlo al backend.
  const fullPrompt = `
    ROL: Eres un asistente pedagógico experto en la Nueva Escuela Mexicana (Plan de Estudios 2022).
    
    INSTRUCCIÓN: Genera la planeación para el tema "${params.topic}" dirigida a ${params.grade} (${params.groupSize} alumnos).
    Enfoque: ${params.tone}. Estado del grupo: ${params.status}.
    Narrativa: ${chosenNarrative || 'libre'}. ${narrativeInstruction}

    POLÍTICA DE SEGURIDAD ESCOLAR (CRÍTICA):
    - Prohibido contenido de violencia, odio, racismo, sexismo.
    - Si el tema es peligroso o inapropiado, RESPONDE ÚNICAMENTE: "SEGURIDAD_BLOQUEADA".

    REGLAS DE FORMATO (IMPORTANTE PARA EL PDF):
    - NO incluyas introducciones ni texto extra.
    - Sigue EXACTAMENTE esta estructura:

    # PLANEACIÓN DIDÁCTICA NEM
    Generado por MAÑANA · ${new Date().toLocaleDateString('es-MX')}

    ---

    ## TARJETA DE DATOS RÁPIDOS
    Tema: ${params.topic}
    Grado: ${params.grade}
    Duración: ${params.duration} min
    Enfoque: ${params.tone}
    Narrativa: ${chosenNarrative || 'Sorpresa'}

    ---

    ## ALINEACIÓN NEM
    Campo formativo: [campo]
    Ejes articuladores: [ejes]
    PDA sugerido: [1 enunciado máximo]

    ---

    ## INICIO / ACTIVACIÓN
    Actividad: [nombre creativo]
    Qué hacer:
    – [Acción 1]
    – [Acción 2]
    Qué decir:
    “[Frase motivadora]”

    ---

    ## ACTIVIDAD CENTRAL
    Actividad: [nombre del reto]
    Organización: [agrupamiento]
    Paso a paso:
    1. [Paso 1]
    2. [Paso 2]
    3. [Paso 3]
    4. [Paso 4]

    ---

    ## CIERRE / EVALUACIÓN
    Actividad: [nombre]
    Cómo evaluar:
    – [Indicador]
    – [Pregunta clave]

    ---

    ## 📝 MATERIALES (CHECKLIST)
    ☐ [Material 1]
    ☐ [Material 2]
  `;

  // 3. AQUÍ ESTÁ EL CAMBIO: USAMOS FETCH EN LUGAR DE LA LIBRERÍA DE GOOGLE
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: fullPrompt }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Error al conectar con el servidor");

    const text = data.respuesta || "";

    // Tu validación de seguridad original
    if (text.includes("SEGURIDAD_BLOQUEADA")) {
      throw new Error("CONTENIDO_INAPROPIADO");
    }

    return text;
  } catch (error: any) {
    if (error.message === "CONTENIDO_INAPROPIADO") {
      throw new Error("El tema o la narrativa elegida no es apta para un entorno escolar por razones de seguridad.");
    }
    console.error("Error generating lesson:", error);
    throw new Error("Error al conectar con la IA. Intenta de nuevo.");
  }
};

export const generatePlanBContent = async (params: LessonParams): Promise<string> => {
  // 4. LO MISMO PARA EL PLAN B: CONSERVAMOS TU PROMPT
  const fullPrompt = `
    Eres un maestro experto en manejo de grupos difíciles. 
    Da un "PLAN B" de rescate rápido para ${params.grade} sobre "${params.topic}".
    Considera un grupo de ${params.groupSize} alumnos que están "${params.status}".
    Sin materiales extras. 3 pasos claros y directos. Estilo scannable. No incluyas objetivos.
    Si el tema es violento o inapropiado, responde "SEGURIDAD_BLOQUEADA".
  `;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: fullPrompt }),
    });

    const data = await response.json();
    const text = data.respuesta || "";

    if (text.includes("SEGURIDAD_BLOQUEADA")) {
      throw new Error("CONTENIDO_INAPROPIADO");
    }
    return text;
  } catch (error) {
    throw new Error("Error al generar Plan B.");
  }
};