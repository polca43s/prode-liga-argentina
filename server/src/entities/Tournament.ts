import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from './User';
import { Team } from './Team';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ default: 0 })
  cantidadDobles: number;

  @ManyToMany(() => User, user => user.tournaments)
  @JoinTable()
  users: User[];

  @ManyToMany(() => Team)
  @JoinTable()
  teams: Team[];

  @CreateDateColumn()
  createdAt: Date;
}
