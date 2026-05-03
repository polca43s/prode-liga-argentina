import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Team } from './Team';
import { Fixture } from './Fixture';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Team)
  local: Team;

  @ManyToOne(() => Team)
  visitante: Team;

  @Column({ nullable: true })
  resultado: string; // 'L' (Local), 'E' (Empate) o 'V' (Visitante)

  @ManyToOne(() => Fixture, fixture => fixture.partidos)
  fixture: Fixture;
}
