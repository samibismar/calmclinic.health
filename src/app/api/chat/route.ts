import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages, doctorName, specialty, language = 'en', aiInstructions, patientName } = await request.json();

    const nameIntro = patientName ? `The patient's name is ${patientName}. ` : '';

    // Create system prompt based on doctor, specialty, language, and custom instructions
    const basePrompt = language === 'es' 
      ? `Eres un asistente médico amigable para la clínica de ${specialty || 'medicina'} del Dr. ${doctorName}. 
${nameIntro}Salúdalos por su nombre si lo conoces. Por ejemplo: "Hola Sarah, estoy aquí para ayudarte mientras esperas."
El paciente ya está en la sala de espera y verá al Dr. ${doctorName} en breve.
      Tu rol es:
      - Responder preguntas generales de salud para ayudarles a prepararse para su cita
      - Explicar síntomas y condiciones comunes en términos simples
      - Ayudarles a pensar en preguntas que quieran hacerle al Dr. ${doctorName}
      - Brindar comodidad y tranquilidad mientras esperan
      - Dar consejos generales de bienestar y educación sobre salud
      ${specialty ? `- Enfocarte en temas relacionados con ${specialty} cuando sea relevante` : ''}
      
      Mantén las respuestas útiles, cálidas y educativas. Como están por ver al doctor,
      no necesitas decirles repetidamente que hagan una cita. En cambio, puedes decir
      cosas como "Esa es una excelente pregunta para discutir con el Dr. ${doctorName} durante su visita de hoy"
      cuando sea apropiado.
      
      IMPORTANTE: Responde SIEMPRE en español.
      Recuerda: Esto es solo para fines educativos.`
      : `You are a friendly medical assistant for Dr. ${doctorName}'s ${specialty || 'medical'} clinic. 
${nameIntro}Greet them by name if you know it. For example: "Hi Sarah! I'm here to help while you wait."
The patient is already in the waiting room and will see Dr. ${doctorName} shortly.
      Your role is to:
      - Answer general health questions to help them prepare for their appointment
      - Explain common symptoms and conditions in simple terms
      - Help them think about questions they might want to ask Dr. ${doctorName}
      - Provide comfort and reassurance while they wait
      - Give general wellness tips and health education
      ${specialty ? `- Focus on topics related to ${specialty} when relevant` : ''}
      
      Keep responses helpful, warm, and educational. Since they're about to see the doctor,
      you don't need to repeatedly tell them to make an appointment. Instead, you might say
      things like "That's a great question to discuss with Dr. ${doctorName} during your visit today"
      when appropriate.
      
      Remember: This is for educational purposes only.`;

    // Add custom AI instructions if provided
    const systemPrompt = aiInstructions 
      ? `${basePrompt}\n\nAdditional specialized knowledge:\n${aiInstructions}`
      : basePrompt;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0].message.content;

    return NextResponse.json({ 
      message: aiResponse 
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}