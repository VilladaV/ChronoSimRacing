'use server';

/**
 * @fileOverview An AI agent for generating racing team details.
 *
 * - generateTeamDetails - A function that handles the team detail generation process for a single team.
 * - generateMultipleTeamDetails - A function that handles the team detail generation process for multiple teams in a batch.
 * - GenerateTeamDetailsInput - The input type for the generateTeamDetails function.
 * - GenerateTeamDetailsOutput - The return type for the generateTeamDetails function.
 * - GenerateMultipleTeamDetailsInput - The input type for the generateMultipleTeamDetails function.
 * - GenerateMultipleTeamDetailsOutput - The return type for the generateMultipleTeamDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// --- SINGLE TEAM GENERATION ---

const GenerateTeamDetailsInputSchema = z.object({
  teamName: z.string().describe('The name of the racing team.'),
});
export type GenerateTeamDetailsInput = z.infer<typeof GenerateTeamDetailsInputSchema>;

const GenerateTeamDetailsOutputSchema = z.object({
  lema: z.string().describe('The generated motto for the team.'),
  descripcion: z.string().describe('The generated description for the team.'),
});
export type GenerateTeamDetailsOutput = z.infer<typeof GenerateTeamDetailsOutputSchema>;

export async function generateTeamDetails(input: GenerateTeamDetailsInput): Promise<GenerateTeamDetailsOutput> {
  return generateTeamDetailsFlow(input);
}

const singleTeamPrompt = ai.definePrompt({
  name: 'generateTeamDetailsPrompt',
  input: {schema: GenerateTeamDetailsInputSchema},
  output: {schema: GenerateTeamDetailsOutputSchema},
  prompt: `You are a creative sports writer specializing in motorsports. Your task is to provide a motto ('lema') and a description ('descripcion') for a given racing team name.

- If the team "{{teamName}}" is a real, well-known racing team (e.g., 'Ferrari', 'Red Bull Racing', 'Mercedes-AMG Petronas'), provide their actual, official motto and a brief, factual description of the team's history and achievements.
- If the team "{{teamName}}" sounds fictional or is not a widely recognized professional racing team, invent a creative, plausible, and inspiring motto and a short, compelling backstory or description for it. The tone should be professional and exciting, suitable for a competitive racing team.

Provide the output in Spanish.
`,
});

const generateTeamDetailsFlow = ai.defineFlow(
  {
    name: 'generateTeamDetailsFlow',
    inputSchema: GenerateTeamDetailsInputSchema,
    outputSchema: GenerateTeamDetailsOutputSchema,
  },
  async input => {
    const {output} = await singleTeamPrompt(input);
    return output!;
  }
);


// --- BATCH TEAM GENERATION ---

const GenerateMultipleTeamDetailsInputSchema = z.object({
  teamNames: z.array(z.string()).describe('A list of racing team names.'),
});
export type GenerateMultipleTeamDetailsInput = z.infer<typeof GenerateMultipleTeamDetailsInputSchema>;

const TeamDetailsSchema = z.object({
    teamName: z.string().describe('The original team name from the input list.'),
    lema: z.string().describe('The generated motto for the team.'),
    descripcion: z.string().describe('The generated description for the team.'),
});

const GenerateMultipleTeamDetailsOutputSchema = z.object({
  teams: z.array(TeamDetailsSchema).describe('An array of teams with their generated details.'),
});
export type GenerateMultipleTeamDetailsOutput = z.infer<typeof GenerateMultipleTeamDetailsOutputSchema>;

export async function generateMultipleTeamDetails(input: GenerateMultipleTeamDetailsInput): Promise<GenerateMultipleTeamDetailsOutput> {
  if (input.teamNames.length === 0) {
    return { teams: [] };
  }
  return generateMultipleTeamDetailsFlow(input);
}

const multipleTeamsPrompt = ai.definePrompt({
    name: 'generateMultipleTeamDetailsPrompt',
    input: {schema: GenerateMultipleTeamDetailsInputSchema},
    output: {schema: GenerateMultipleTeamDetailsOutputSchema},
    prompt: `You are a creative sports writer specializing in motorsports. For each team name in the provided list, you must generate a motto ('lema') and a description ('descripcion').

Your task is to follow these rules:
1.  **For Real Teams**: If a team name is a real, well-known racing team (like 'Ferrari', 'Red Bull Racing', 'McLaren'), provide their actual, official motto and a brief, factual description of their history and key achievements.
2.  **For Fictional/Unknown Teams**: If a team name seems fictional, is not a widely recognized professional team, or is a generic name, you must invent a creative, plausible, and inspiring motto and a short, compelling backstory or description for it. The tone should be professional and exciting, fitting for a competitive racing environment.
3.  **Language**: All output (lemas and descripciones) must be in Spanish.
4.  **Format**: Ensure the final output is a valid JSON object that strictly adheres to the provided output schema. For each team name provided in the input, there must be a corresponding entry in the output array.

Here is the list of team names to process:
{{#each teamNames}}
- {{{this}}}
{{/each}}
`
});


const generateMultipleTeamDetailsFlow = ai.defineFlow(
  {
    name: 'generateMultipleTeamDetailsFlow',
    inputSchema: GenerateMultipleTeamDetailsInputSchema,
    outputSchema: GenerateMultipleTeamDetailsOutputSchema,
  },
  async input => {
    const {output} = await multipleTeamsPrompt(input);
    return output!;
  }
);
