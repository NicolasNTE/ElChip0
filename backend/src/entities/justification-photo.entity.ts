import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, ForeignKey } from 'typeorm';
import { Justification } from './justification.entity';

@Entity('justification_photos')
export class JustificationPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Justification, (justification) => justification.photos, { onDelete: 'CASCADE' })
  @ForeignKey(() => Justification)
  justification: Justification;

  @Column('uuid')
  justificationId: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 255 })
  filePath: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mimeType: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @CreateDateColumn()
  createdAt: Date;
}
