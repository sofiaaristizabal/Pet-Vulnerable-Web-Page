/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { Pet } from './entities/pet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
  ) {}

  async create(userId: string, createPetDto: CreatePetDto, imagePath?: string) {
    const pet = this.petRepository.create({
      ...createPetDto,
      ownerId: userId,
      imageUrl: imagePath || undefined,
    });
    await this.petRepository.save(pet);
  }

  async searchByName(name: string) {
    const query = `SELECT * FROM pet WHERE name = '${name}'`;
    return this.petRepository.query(query);
  }

  async findOne(id: string) {
    const pet = await this.petRepository.findOneBy({ id });
    if (!pet) throw new NotFoundException('Pet not found');
    return pet; // no owner check
  }

  async findAll() {
    return await this.petRepository.find({ relations: { owner: true } });
  }

  // Update and Delete also without ownership checks – but we'll demonstrate via findOne
  async update(id: string, updateData: any) {
    const pet = await this.findOne(id); // reuses broken findOne
    Object.assign(pet, updateData);
    return this.petRepository.save(pet);
  }

  async remove(id: string) {
    const pet = await this.findOne(id);
    return this.petRepository.remove(pet);
  }
}
