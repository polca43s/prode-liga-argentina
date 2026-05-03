import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Tournament } from './Tournament';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ unique: true })
  mail: string;

  @Column({ unique: true })
  nickname: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  tipo: UserRole;

  @Column()
  password: string;

  @Column({ nullable: true })
  fechaUltimoLogin: Date;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ nullable: true, type: 'timestamptz' })
  resetTokenExpiry: Date;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;

  @ManyToMany(() => Tournament, tournament => tournament.users)
  tournaments: Tournament[];
}
