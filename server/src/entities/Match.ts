import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Team } from './Team';
import { Fixture } from './Fixture';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Team)
  localTeam: Team;

  @ManyToOne(() => Team)
  visitorTeam: Team;

  @Column({ nullable: true })
  localScore: number;

  @Column({ nullable: true })
  visitorScore: number;

  @Column({
    type: 'enum',
    enum: ['L', 'E', 'V'],
    nullable: true
  })
  resultadoReal: 'L' | 'E' | 'V';

  @ManyToOne(() => Fixture, fixture => fixture.partidos)
  fixture: Fixture;
}
