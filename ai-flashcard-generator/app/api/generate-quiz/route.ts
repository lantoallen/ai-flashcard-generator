import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { z } from 'zod';

const quizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctAnswer: z.string(),
      explanation: z.string(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const { notes } = await req.json();

    if (!notes || typeof notes !== 'string') {
      return Response.json({ error: 'Notes are required' }, { status: 400 });
    }
    if (notes.length > 8000) {
      return Response.json(
        { error: 'Notes are too long. Please paste under 8000 characters.' },
        { status: 400 }
      );
    }

    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: quizSchema,
      prompt: `Based on the following notes, generate 5 multiple-choice quiz questions. Each question should have exactly 4 options, one correct answer, and a short explanation.\n\nNotes:\n${notes}`,
    });

    return Response.json(object);
  } catch (error) {
    console.error('Quiz generation error:', error);
    return Response.json(
      { error: 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
}