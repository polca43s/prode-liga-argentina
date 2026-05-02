import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column()
  urlCopas: string;

  @Column({ default: 0 })
  cantidadDeDobles: number;

  @Column({ default: 0 })
  cantidadParaPremio: number;
}
