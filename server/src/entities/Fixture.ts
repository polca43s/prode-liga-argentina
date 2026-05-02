import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Tournament } from './Tournament';
import { Match } from './Match';

@Entity('fixtures')
export class Fixture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string; // Ej: "Fecha 9"

  @Column({ default: false })
  seeAll: boolean;

  @ManyToOne(() => Tournament)
  tournament: Tournament;

  @OneToMany(() => Match, match => match.fixture)
  partidos: Match[];
}
