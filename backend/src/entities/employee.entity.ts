import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, ForeignKey } from 'typeorm';
import { Company } from './company.entity';
import { AttendanceRecord } from './attendance-record.entity';
import { Justification } from './justification.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  employeeId: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'time' })
  scheduledStartTime: string;

  @Column({ type: 'time' })
  scheduledEndTime: string;

  @ManyToOne(() => Company, (company) => company.employees, { onDelete: 'CASCADE' })
  @ForeignKey(() => Company)
  company: Company;

  @Column('uuid')
  companyId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => AttendanceRecord, (record) => record.employee)
  attendanceRecords: AttendanceRecord[];

  @OneToMany(() => Justification, (justification) => justification.employee)
  justifications: Justification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
