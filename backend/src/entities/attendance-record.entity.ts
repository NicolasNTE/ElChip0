import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('attendance_records')
@Index(['employeeId', 'recordDate'])
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, (employee) => employee.attendanceRecords, { onDelete: 'CASCADE' })
  employee: Employee;

  @Column('uuid')
  employeeId: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'date' })
  recordDate: Date;

  @Column({ type: 'varchar', length: 10 })
  type: 'entrada' | 'salida';

  @Column({ type: 'varchar', length: 50, nullable: true })
  source: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
