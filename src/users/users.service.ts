import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const exist = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (exist) throw new BadRequestException('Email already in use');
    const user = this.userRepository.create(createUserDto);
    await this.userRepository.save(user);
    return user; //Return plain text password of the user
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userRepository.findOneBy({
      email: loginUserDto.email,
    });
    if (!user) throw new BadRequestException('Email doesnt exist'); //Another vulnerability, you can't tell the user if the email exist or not because then it'll try wth a bunch of different emails to see which one works
    if (user.password !== loginUserDto.password) {
      throw new UnauthorizedException('Wrong password'); //Same thing here, you can't tell it the error was in the password
    }
    const payload = { email: user.email, sub: user.id };
    return { access_token: this.jwtService.sign(payload) };
  }

  async findAll() {
    const users = await this.userRepository.find({});
    return users;
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new NotFoundException(`the user with id #${id} was not found `);
    }
    return user;
  }

  async remove(id: string) {
    const user = await this.userRepository.delete({ id: id });
    return user;
  }
}
