export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  mail: string;
  nickname: string;
  fechaCreacion: Date;
  fechaUltimoLogin?: Date;
  tipo: UserRole;
  password?: string;
}

export interface Team {
  id: string;
  nombre: string;
  ciudad: string;
  escudo: string;
}

export interface Tournament {
  id: string;
  nombre: string;
  descripcion: string;
  cantidadDobles: number;
  cantidadParaPremio: number;
  createdAt?: Date;
  users: User[];
  teams: Team[];
}

export interface Match {
  id: string;
  local: Team;
  visitante: Team;
  resultado?: string; // El resultado real oficial
}

export interface Fixture {
  id: string;
  nombre: string; // Ej: "Fecha 1"
  tournamentId: string;
  partidos: Match[];
  seeAll: boolean; // Si los usuarios pueden ver las jugadas de otros
}

export interface Prediction {
  id: string;
  userId: string;
  fixtureId: string;
  resultados: {
    matchId: string;
    seleccion: ('L' | 'E' | 'V')[]; // Array para soportar dobles (ej: ['L', 'E'])
  }[];
  confirmada: boolean;
  fechaEnvio?: Date;
}
