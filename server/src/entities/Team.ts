import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ nullable: true })
  ciudad: string;

  @Column({ name: 'escudo', nullable: true }) // Explicitamos el nombre de la columna en la DB
  escudo: string; 
}
// Última actualización: 2026-05-03 - Forzando reinicio de Nodemon
