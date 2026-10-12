'use server';

/**
 * @fileOverview An AI agent for generating pilot nationalities based on their names in batches.
 *
 * - generatePilotNationalities - A function that handles the pilot nationality generation process for multiple pilots.
 * - GeneratePilotNationalitiesInput - The input type for the generatePilotNationalities function.
 * - GeneratePilotNationalitiesOutput - The return type for the generatePilotNationalities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GeneratePilotNationalitiesInputSchema = z.object({
  names: z.array(z.string()).describe('A list of racing pilot names.'),
});
export type GeneratePilotNationalitiesInput = z.infer<typeof GeneratePilotNationalitiesInputSchema>;

const PilotNationalityPairSchema = z.object({
    name: z.string().describe('The original pilot name.'),
    nationality: z.string().describe('The generated nationality of the racing pilot in Spanish. If not possible to determine, respond with "Unknown".'),
});

const GeneratePilotNationalitiesOutputSchema = z.object({
  results: z.array(PilotNationalityPairSchema).describe('An array of pilot names with their corresponding generated nationalities.'),
});
export type GeneratePilotNationalitiesOutput = z.infer<typeof GeneratePilotNationalitiesOutputSchema>;


export async function generatePilotNationalities(input: GeneratePilotNationalitiesInput): Promise<GeneratePilotNationalitiesOutput> {
  if (input.names.length === 0) {
    return { results: [] };
  }
  return generatePilotNationalitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePilotNationalitiesPrompt',
  input: {schema: GeneratePilotNationalitiesInputSchema},
  output: {schema: GeneratePilotNationalitiesOutputSchema},
  prompt: `You are an expert in onomastics and cultural naming conventions. Your task is to determine the most probable country of origin (nationality) for a list of names.

For well-known public figures (e.g., 'Fernando Alonso'), use your knowledge.
For unknown or generic names (e.g., 'Juanito Andres', 'John Smith'), deduce the most likely origin based on linguistic patterns, common name structures, and cultural context.

Respond with the country name in Spanish. If a reasonable deduction is not possible, use "Unknown".

Here is the list of names:
{{#each names}}
- {{{this}}}
{{/each}}

Please provide the output as a structured JSON object, following the required schema.
`,
});

const generatePilotNationalitiesFlow = ai.defineFlow(
  {
    name: 'generatePilotNationalitiesFlow',
    inputSchema: GeneratePilotNationalitiesInputSchema,
    outputSchema: GeneratePilotNationalitiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
