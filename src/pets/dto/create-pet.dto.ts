import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreatePetDto {
  @IsString()
  name!: string;

  @IsString()
  breed!: string;

  @IsString()
  size!: string;

  @IsOptional()
  @IsNumber()
  age?: number;
}
