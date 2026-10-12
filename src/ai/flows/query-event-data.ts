'use server';

/**
 * @fileOverview A flow that answers questions about race event data.
 *
 * - queryEventData - A function that handles answering questions about a race.
 * - QueryEventDataInput - The input type for the queryEventData function.
 * - QueryEventDataOutput - The return type for the queryEventData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResultSchema = z.object({
  pilotName: z.string().describe('The name of the pilot.'),
  teamName: z.string().describe('The name of the team.'),
  carName: z.string().describe('The name of the car.'),
  tiempoMilisegundos: z.number().describe('The final time in milliseconds. 1,800,000 means DNF (Did Not Finish). 0 means no time registered.'),
  posicion: z.number().describe('The final position in the race.'),
});

const QueryEventDataInputSchema = z.object({
  eventName: z.string().describe('The name of the event.'),
  results: z.array(ResultSchema).describe('An array of race results.'),
  question: z.string().describe('The user\'s question about the race results.'),
});
export type QueryEventDataInput = z.infer<typeof QueryEventDataInputSchema>;

const QueryEventDataOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the question, written in Spanish.'),
});
export type QueryEventDataOutput = z.infer<typeof QueryEventDataOutputSchema>;

export async function queryEventData(input: QueryEventDataInput): Promise<QueryEventDataOutput> {
  return queryEventDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'queryEventDataPrompt',
  input: {schema: QueryEventDataInputSchema},
  output: {schema: QueryEventDataOutputSchema},
  prompt: `You are a world-class race analyst and commentator. Your name is "Chrono". You are sharp, insightful, and you have a deep understanding of motorsports.

You have been given the results for an event and a specific question from the user. Your task is to answer the question based *only* on the data provided.

Event Name: {{{eventName}}}

Results Data:
{{#each results}}
  - Pilot: {{{pilotName}}}, Team: {{{teamName}}}, Car: {{{carName}}}, Time (ms): {{{tiempoMilisegundos}}}, Position: {{{posicion}}}
{{/each}}

User's Question: "{{{question}}}"

Analyze the data and provide a clear, concise, and insightful answer in Spanish. Address the user's question directly. You can make calculations, comparisons, and observations based on the times, positions, teams, and drivers.
If the question cannot be answered with the given data, say so clearly and explain what information is missing.
`,
});

const queryEventDataFlow = ai.defineFlow(
  {
    name: 'queryEventDataFlow',
    inputSchema: QueryEventDataInputSchema,
    outputSchema: QueryEventDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
