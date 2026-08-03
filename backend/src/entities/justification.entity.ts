import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, ForeignKey } from 'typeorm';
import { Employee } from './employee.entity';
import { JustificationPhoto } from './justification-photo.entity';

@Entity('justifications')
export class Justification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, (employee) => employee.justifications, { onDelete: 'CASCADE' })
  @ForeignKey(() => Employee)
  employee: Employee;

  @Column('uuid')
  employeeId: string;

  @Column({ type: 'date' })
  justificationDate: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  status: 'pendiente' | 'aprobada' | 'rechazada';

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @OneToMany(() => JustificationPhoto, (photo) => photo.justification, { cascade: true })
  photos: JustificationPhoto[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
