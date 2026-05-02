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
  urlEscudo: string;
}

export interface Tournament {
  id: string;
  nombre: string;
  urlCopas: string;
  cantidadDeDobles: number;
  cantidadParaPremio: number;
}

export interface Match {
  id: string;
  localTeamId: string;
  visitorTeamId: string;
  localScore?: number;
  visitorScore?: number;
  resultadoReal?: 'L' | 'E' | 'V';
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
