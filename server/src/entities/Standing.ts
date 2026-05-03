import { Entity, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { Tournament } from './Tournament';
import { User } from './User';

@Entity('standings')
export class Standing {
  @PrimaryColumn()
  id: string; // Ej: "Copa 2026-Polca"

  @Column()
  tournamentName: string;

  @Column()
  nickname: string;

  @Column()
  playerName: string;

  @ManyToOne(() => Tournament)
  tournament: Tournament;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: 0 })
  puntos: number;

  @Column({ default: 0 })
  fechasGanadas: number;

  @Column({ default: 0 })
  visita: number;

  @Column({ default: 0 })
  empate: number;

  @Column({ default: 0 })
  local: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdate: Date;
}
