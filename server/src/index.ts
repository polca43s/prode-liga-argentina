import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import cors from 'cors';
import * as dotenv from 'dotenv';

// 1. Cargar variables de entorno PRIMERO
dotenv.config();

// 2. Bypass de SSL para Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 3. Importar Entidades
import { User } from './entities/User';
import { Team } from './entities/Team';
import { Tournament } from './entities/Tournament';
import { Fixture } from './entities/Fixture';
import { Match } from './entities/Match';
import { Prediction } from './entities/Prediction';
import { PredictionDetail } from './entities/PredictionDetail';
import { Standing } from './entities/Standing';

// 4. Importar Controladores
import UserController from './controllers/UserController';
import TournamentController from './controllers/TournamentController';
import TeamController from './controllers/TeamController';
import FixtureController from './controllers/FixtureController';
import MatchController from './controllers/MatchController';
import PredictionController from './controllers/PredictionController';

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/users', UserController);
app.use('/api/tournaments', TournamentController);
app.use('/api/teams', TeamController);
app.use('/api/fixtures', FixtureController);
app.use('/api/matches', MatchController);
app.use('/api/predictions', PredictionController);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: true,
  entities: [User, Team, Tournament, Fixture, Match, Prediction, PredictionDetail],
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});

const PORT = process.env.PORT || 3001;

AppDataSource.initialize()
  .then(() => {
    console.log('Base de datos conectada correctamente');
    app.listen(PORT, () => {
      console.log(`Servidor PRODE corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log('Error conectando a la base de datos:', error));
// Última actualización: 2026-05-03 - Forzando reinicio global de la aplicación
