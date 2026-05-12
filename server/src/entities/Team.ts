import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Tournament } from './Tournament';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ nullable: true })
  ciudad: string;

  @Column({ name: 'escudo', nullable: true })
  escudo: string;

  @ManyToMany(() => Tournament, tournament => tournament.teams)
  tournaments: Tournament[];
}
// Última actualización: 2026-05-03 - Forzando reinicio de Nodemon
