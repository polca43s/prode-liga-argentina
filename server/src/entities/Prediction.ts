import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { Fixture } from './Fixture';
import { PredictionDetail } from './PredictionDetail';

@Entity('predictions')
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Fixture)
  fixture: Fixture;

  @OneToMany(() => PredictionDetail, detail => detail.prediction, { cascade: true })
  detalles: PredictionDetail[];

  @Column({ default: 0 })
  puntosTotales: number;

  @Column({ default: false })
  confirmada: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;
}
