'use server';

/**
 * @fileOverview A flow that automatically generates race chronicles based on race results.
 *
 * - generateRaceChronicle - A function that handles the race chronicle generation process.
 * - GenerateRaceChronicleInput - The input type for the generateRaceChronicle function.
 * - GenerateRaceChronicleOutput - The return type for the generateRaceChronicle function.
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

const GenerateRaceChronicleInputSchema = z.object({
  eventName: z.string().describe('The name of the event.'),
  results: z.array(ResultSchema).describe('An array of race results.'),
});
export type GenerateRaceChronicleInput = z.infer<typeof GenerateRaceChronicleInputSchema>;

const GenerateRaceChronicleOutputSchema = z.object({
  chronicle: z.string().describe('The generated race chronicle, written in Spanish.'),
});
export type GenerateRaceChronicleOutput = z.infer<typeof GenerateRaceChronicleOutputSchema>;

export async function generateRaceChronicle(input: GenerateRaceChronicleInput): Promise<GenerateRaceChronicleOutput> {
  return generateRaceChronicleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRaceChroniclePrompt',
  input: {schema: GenerateRaceChronicleInputSchema},
  output: {schema: GenerateRaceChronicleOutputSchema},
  prompt: `You are a creative and sharp-witted sports journalist specializing in racing. Your task is to write a compelling and insightful analysis of a race event based on the results provided. Write in Spanish.

Your analysis should go beyond a dry summary. Find the story within the data. Look for interesting narratives, rivalries, and remarkable performances.

Event Name: {{{eventName}}}

Consider these points for your analysis:
- The Winner and The Podium: Who won? By how much? Describe the fight for the top positions.
- Surprises and Disappointments: Was there an underdog who performed exceptionally well? Did a favorite fail to meet expectations (e.g., a DNF)?
- Team Performance: Analyze the team results. Which team was dominant? Were there any internal team battles?
- Interesting Gaps: Highlight any particularly close finishes or large time gaps that tell a story.
- Be Creative: Use metaphors and exciting language. If you see a name that seems female, or a famous name, feel free to incorporate that into the narrative to make it more engaging. Give the chronicle a catchy title.

Here are the results:
{{#each results}}
  - Pilot: {{{pilotName}}}, Team: {{{teamName}}}, Car: {{{carName}}}, Time (ms): {{{tiempoMilisegundos}}}, Position: {{{posicion}}}
{{/each}}

Now, write a compelling race chronicle.
`,
});

const generateRaceChronicleFlow = ai.defineFlow(
  {
    name: 'generateRaceChronicleFlow',
    inputSchema: GenerateRaceChronicleInputSchema,
    outputSchema: GenerateRaceChronicleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
