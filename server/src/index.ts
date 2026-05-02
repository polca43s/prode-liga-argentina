import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import cors from 'cors';
import * as dotenv from 'dotenv';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Entidades
import { User } from './entities/User';
import { Team } from './entities/Team';
import { Tournament } from './entities/Tournament';
import { Fixture } from './entities/Fixture';
import { Match } from './entities/Match';
import { Prediction } from './entities/Prediction';
import { PredictionDetail } from './entities/PredictionDetail';

// Controladores
import UserController from './controllers/UserController';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/users', UserController);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true, // ¡Solo para desarrollo! Crea las tablas automáticamente
  logging: true,
  entities: [User, Team, Tournament, Fixture, Match, Prediction, PredictionDetail],
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log('Base de datos conectada correctamente');
    app.listen(PORT, () => {
      console.log(`Servidor PRODE corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log('Error conectando a la base de datos:', error));
