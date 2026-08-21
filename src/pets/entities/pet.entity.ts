import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  breed!: string;

  @Column()
  size!: string; // small, medium, large

  @Column({ nullable: true })
  age!: number;

  @Column({ nullable: true })
  imageUrl!: string; // path to uploaded file

  @ManyToOne(() => User, (user) => user.pets)
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @Column()
  ownerId!: string;
}
