import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column()
  urlEscudo: string;
}
