

export interface Game {
  id: string;
  nombre: string;
  desarrollador: string;
  imageUrl?: string;
}

export interface Track {
  id: string;
  nombre: string;
  pais: string;
  longitudKm: number;
  juegoId: string;
}

export interface Car {
  id: string;
  nombre: string;
  notasRendimiento?: string;
  imageUrl?: string;
  potenciaCV?: number;
  pesoKG?: number;
}

export interface Team {
  id: string;
  nombre:string;
  logoUrl?: string;
  lema?: string;
  descripcion?: string;
  colorPrimario?: string;
  colorSecundario?: string;
}

export interface Pilot {
  id: string;
  nombre: string;
  nacionalidad: string;
  biografia: string;
  esJugador: boolean;
  avatarUrl?: string;
  teamId?: string;
}

export interface EventParticipant {
  pilotoId: string;
  cocheId: string;
}

export interface Event {
  id: string;
  nombre: string;
  juegoId: string;
  tipo: 'Campeonato' | 'Torneo' | 'Contrarreloj';
  estado: 'Planificado' | 'En curso' | 'Finalizado';
  fechaInicio: string;
  pistas: string[];
  participantes: EventParticipant[];
  chronicle?: string;
}

// This is the raw data that comes from the excel import
export interface RawResult {
    id: string;
    eventoId: string;
    teamName: string;
    pilotName: string;
    carName: string;
    tiempoMilisegundos: number;
    posicion: number;
}
export interface Result {
  id: string;
  eventoId: string;
  teamName: string;
  pilotName: string;
  carName: string;
  tiempoMilisegundos: number;
  posicion: number;
  fecha: string;
}

    

    

    
