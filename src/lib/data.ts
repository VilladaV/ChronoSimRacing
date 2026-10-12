
import type { Game, Track, Car, Team, Pilot, Event, Result } from '@/lib/types';

export const games: Game[] = [
    { 
        id: 'game-1', 
        nombre: 'Assetto Corsa', 
        desarrollador: 'Kunos Simulazioni',
        imageUrl: 'https://images.unsplash.com/photo-1587573983358-b3b81469b35e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhc3NldHRvJTIwY29yc2F8ZW58MHx8fHwxNzE3NTk5MTI4fDA&ixlib=rb-4.0.3&q=80&w=1080'
    },
    { 
        id: 'game-2', 
        nombre: 'BeamNG.drive', 
        desarrollador: 'BeamNG',
        imageUrl: 'https://images.unsplash.com/photo-1568285577120-ac264353805c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxiZWFtbmclMjBkcml2ZXxlbnwwfHx8fDE3E3NjAwMTM0fDA&ixlib=rb-4.0.3&q=80&w=1080'
    },
    { 
        id: 'game-3', 
        nombre: 'Grand Prix Bikes', 
        desarrollador: 'PiBoSo',
        imageUrl: 'https://images.unsplash.com/photo-1593105343340-96a9d725a65c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
];

// --- Static data below is now empty to avoid confusion. Data should come from Firestore. ---

export const tracks: Track[] = [];

export const teams: Team[] = [];

export const pilots: Pilot[] = [];

export const cars: Car[] = [];

export const events: Event[] = [
    {
      id: 'event-1',
      nombre: '46KM Nevada Open',
      juegoId: 'game-2',
      tipo: 'Contrarreloj',
      estado: 'En curso',
      fechaInicio: new Date('2024-07-20T10:00:00Z').toISOString(),
      pistas: ['track-1'], // This could be dynamic in the future
      participantes: [], // Now empty, will be driven by results
      chronicle: 'The desert race awaits its champion. Import the results to begin the chronicle.'
    },
];

export const results: Result[] = [];

    