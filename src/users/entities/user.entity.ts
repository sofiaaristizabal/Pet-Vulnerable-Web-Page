import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Pet } from 'src/pets/entities/pet.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  fullName!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => Pet, (pet) => pet.owner)
  pets?: Pet[];
}
