import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Quote {
  @PrimaryGeneratedColumn('uuid') // Generates a unique ID (UUID)
  id: string;

  @Column()
  content: string;

  @Column({ nullable: true }) // 'author' is optional
  author: string;

  @Column({ default: 0 }) // Default votes to 0
  votes: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
