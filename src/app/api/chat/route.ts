import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages, doctorName, specialty } = await request.json();

    // Create system prompt based on doctor and specialty
    const systemPrompt = `You are a friendly medical assistant for Dr. ${doctorName}'s ${specialty || 'medical'} clinic. 
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