'use server';

/**
 * @fileOverview An AI agent for generating pilot biographies.
 *
 * - generatePilotBio - A function that handles the pilot biography generation process.
 * - GeneratePilotBioInput - The input type for the generatePilotBio function.
 * - GeneratePilotBioOutput - The return type for the generatePilotBio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePilotBioInputSchema = z.object({
  name: z.string().describe('The name of the racing pilot.'),
  nationality: z.string().describe('The nationality of the racing pilot.'),
  drivingStyle: z.string().describe('The driving style of the racing pilot. This can be empty.').optional(),
});
export type GeneratePilotBioInput = z.infer<typeof GeneratePilotBioInputSchema>;

const GeneratePilotBioOutputSchema = z.object({
  biography: z.string().describe('The generated biography of the racing pilot.'),
});
export type GeneratePilotBioOutput = z.infer<typeof GeneratePilotBioOutputSchema>;

export async function generatePilotBio(input: GeneratePilotBioInput): Promise<GeneratePilotBioOutput> {
  return generatePilotBioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePilotBioPrompt',
  input: {schema: GeneratePilotBioInputSchema},
  output: {schema: GeneratePilotBioOutputSchema},
  prompt: `You are a creative writer specializing in crafting compelling biographies for racing pilots.

  Given the following information about a pilot, generate an engaging and informative biography.

  Name: {{{name}}}
  Nationality: {{{nationality}}}

  Biography:`,
});

const generatePilotBioFlow = ai.defineFlow(
  {
    name: 'generatePilotBioFlow',
    inputSchema: GeneratePilotBioInputSchema,
    outputSchema: GeneratePilotBioOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
