'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/automate-race-chronicles.ts';
import '@/ai/flows/generate-pilot-bio.ts';
import '@/ai/flows/generate-pilot-nationality.ts';
import '@/ai/flows/generate-team-details.ts';
import '@/ai/flows/query-event-data.ts';
