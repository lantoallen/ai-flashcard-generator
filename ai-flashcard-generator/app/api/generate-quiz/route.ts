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
    const { notes, topic } = await req.json();

    // Must have exactly one of notes or topic
    const hasNotes = typeof notes === 'string' && notes.trim().length > 0;
    const hasTopic = typeof topic === 'string' && topic.trim().length > 0;

    if (!hasNotes && !hasTopic) {
      return Response.json(
        { error: 'Please provide either notes or a topic.' },
        { status: 400 }
      );
    }

    if (hasNotes && notes.length > 8000) {
      return Response.json(
        { error: 'Notes are too long. Please paste under 8000 characters.' },
        { status: 400 }
      );
    }

    if (hasTopic && topic.length > 200) {
      return Response.json(
        { error: 'Topic is too long. Please keep it under 200 characters.' },
        { status: 400 }
      );
    }

    const prompt = hasNotes
      ? `Based on the following notes, generate 5 multiple-choice quiz questions. Each question should have exactly 4 options, one correct answer, and a short explanation.\n\nNotes:\n${notes}`
      : `Generate 5 multiple-choice quiz questions to help someone learn about the topic: "${topic}". Cover key concepts a student should know. Each question should have exactly 4 options, one correct answer, and a short explanation.`;

    const { object } = await generateObject({
      model: groq('openai/gpt-oss-120b'),
      schema: quizSchema,
      prompt,
    });

    // Drop any question whose correct answer isn't one of its options
    const questions = object.questions.filter((q) =>
      q.options.includes(q.correctAnswer)
    );

    if (questions.length === 0) {
      return Response.json(
        { error: 'Failed to generate a valid quiz. Please try again.' },
        { status: 502 }
      );
    }

    return Response.json({ questions });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return Response.json(
      { error: 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
}