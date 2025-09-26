'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate a session ID if one does not already exist.
 *
 * @exports generateSessionId - A function that returns a UUID.
 * @exports GenerateSessionIdOutput - The output type, a string representing the UUID.
 */

import { ai } from '@/ai/genkit';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const GenerateSessionIdOutputSchema = z.string().describe('A UUID representing the session ID.');
export type GenerateSessionIdOutput = z.infer<typeof GenerateSessionIdOutputSchema>;

export async function generateSessionId(): Promise<GenerateSessionIdOutput> {
  return generateSessionIdFlow();
}

const generateSessionIdFlow = ai.defineFlow({
  name: 'generateSessionIdFlow',
  outputSchema: GenerateSessionIdOutputSchema,
}, async () => {
  return uuidv4();
});
