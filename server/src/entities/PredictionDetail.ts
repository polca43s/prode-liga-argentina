import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Prediction } from './Prediction';
import { Match } from './Match';

@Entity('prediction_details')
export class PredictionDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Prediction, prediction => prediction.detalles)
  prediction: Prediction;

  @ManyToOne(() => Match)
  match: Match;

  @Column({
    type: 'simple-array' // Almacena ['L', 'E'] para dobles
  })
  seleccion: string[];
}
