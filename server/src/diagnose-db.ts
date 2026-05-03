import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    await AppDataSource.initialize();
    console.log('--- DIAGNÓSTICO DE BASE DE DATOS ---');
    const queryRunner = AppDataSource.createQueryRunner();
    const table = await queryRunner.getTable('teams');
    
    if (table) {
      console.log('Columnas encontradas en la tabla "teams":');
      table.columns.forEach(col => {
        console.log(` - ${col.name} (${col.type})`);
      });
    } else {
      console.log('La tabla "teams" no existe.');
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error en el diagnóstico:', error);
  }
}

checkSchema();
