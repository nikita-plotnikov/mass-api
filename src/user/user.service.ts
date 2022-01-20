import { CreateUserDto } from './dto/cretaeUser.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign, verify } from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { UserResponseInterface } from './types/userResponse.interface';
import { LoginUserDto } from './dto/loginUser.dto';
import { compare, hash } from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from './dto/resetPassword.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly mailerService: MailService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<string> {
    const userByEmail = await this.userRepository.findOne({
      email: createUserDto.email,
    });
    const userByPhone = await this.userRepository.findOne({
      phone: createUserDto.phone,
    });
    if (userByEmail || userByPhone) {
      throw new HttpException(
        'Email или телефон уже используются',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);
    await this.userRepository.save(newUser);
    await this.sendConfirmEmail(newUser.email);
    return 'Вам выслана ссылка на почту, для подтверждения регистрации';
  }

  async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      email: loginUserDto.email,
    });
    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }
    if (!user.isConfirm) {
      throw new HttpException(
        'Учетная запись не подтверждена',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const isPasswordCorrect = await compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new HttpException(
        'Неверный пароль',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    delete user.password;

    return user;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<string> {
    const decode = this.checkConfirmToken(resetPasswordDto.confirmToken);

    if (!decode) {
      throw new HttpException(
        'Невалидный токен',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const user = await this.userRepository.findOne({
      email: decode.email,
    });
    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }
    const hashPassword = await hash(resetPasswordDto.password, 10);
    await this.userRepository.update(
      { email: decode.email },
      { password: hashPassword },
    );
    return 'Пароль успешно изменен';
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await this.userRepository.findOne({
      email: email,
    });
    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }
    await this.sendForgotPasswordEmail(email);
    return 'Вам выслана ссылка на почту, для сброса пароля';
  }

  async changePassword(
    oldPassword: string,
    password: string,
    email: string,
  ): Promise<string> {
    const user = await this.userRepository.findOne({ email: email });
    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }
    const isPasswordCorrect = await compare(oldPassword, user.password);

    if (!isPasswordCorrect) {
      throw new HttpException(
        'Неверный пароль',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const hashPassword = await hash(password, 10);

    await this.userRepository.update(
      { email: email },
      { password: hashPassword },
    );

    return 'Пароль успешно изменен';
  }

  generateConfirmToken(email: string): string {
    return sign({ email: email }, JWT_SECRET, { expiresIn: '30d' });
  }

  sendConfirmEmail(email: string): Promise<void> {
    const confirmToken = this.generateConfirmToken(email);
    return this.mailerService.sendUserConfirmation(email, confirmToken);
  }

  sendForgotPasswordEmail(email: string): Promise<void> {
    const confirmToken = this.generateConfirmToken(email);
    return this.mailerService.sendForgotPasswordMail(email, confirmToken);
  }

  checkConfirmToken(confirmToken: string) {
    return verify(confirmToken, JWT_SECRET);
  }

  async confirmUserEmail(confirmToken: string) {
    const decode = verify(confirmToken, JWT_SECRET);
    return await this.userRepository.update(
      { email: decode.email },
      { isConfirm: true },
    );
  }

  async findById(id: number): Promise<UserEntity> {
    const user = this.userRepository.findOne(id);
    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  generateJwt(user: UserEntity): string {
    return sign(
      { id: user.id, email: user.email, phone: user.phone },
      JWT_SECRET,
    );
  }

  buildUserResponse(user: UserEntity): UserResponseInterface {
    return {
      ...user,
      token: this.generateJwt(user),
    };
  }
}
