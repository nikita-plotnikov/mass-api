import { CreateUserDto } from './dto/cretaeUser.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseInterface } from './types/userResponse.interface';
import { LoginUserDto } from './dto/loginUser.dto';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseModel } from './user.swagger.model';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { CustomRequest } from './types/customRequest.type';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';

@ApiTags('Auth')
@Controller()
export class UserContoller {
  constructor(private readonly userService: UserService) {}

  @Post('users/register')
  @ApiOperation({ summary: 'Registration of user.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Вам выслана ссылка на почту, для подтверждения регистрации',
  })
  @ApiResponse({
    status: 422,
    description: 'Email или телефон уже используются',
  })
  @UsePipes(new ValidationPipe())
  async createUser(@Body() createUserDto: CreateUserDto): Promise<string> {
    console.log('createUserDto', createUserDto);
    return await this.userService.createUser(createUserDto);
  }

  @Post('users/login')
  @ApiOperation({ summary: 'Authorization user' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: 201,
    description: 'Возвращает объект пользователя',
    type: UserResponseModel,
  })
  @ApiResponse({ status: 422, description: 'Учетная запись не подтверждена' })
  @ApiResponse({ status: 422, description: 'Неверный пароль' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @UsePipes(new ValidationPipe())
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.login(loginUserDto);
    return this.userService.buildUserResponse(user);
  }

  @Get('users/confirm/:confirmToken')
  @ApiParam({ name: 'confirmToken', type: 'string', required: true })
  @ApiOperation({ summary: "Confirm user's account" })
  @ApiResponse({ status: 200, description: 'Учетная запись подтверждена' })
  async confirmUserEmail(
    @Param() params: { confirmToken: string },
    @Res() res: Response,
  ) {
    await this.userService.confirmUserEmail(params.confirmToken);
    return res.redirect('http://localhost:3000/login');
  }

  @Post('users/setPassword')
  @ApiBody({ type: ResetPasswordDto })
  @ApiOperation({ summary: 'Set user password' })
  @ApiResponse({ status: 200, description: 'Пароль успешно изменен' })
  @ApiResponse({ status: 422, description: 'Невалидный токен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async setUserPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.userService.resetPassword(resetPasswordDto);
  }

  @Post('users/forgotPassword')
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOperation({ summary: 'Send email for reset password' })
  @ApiResponse({
    status: 200,
    description: 'Вам выслана ссылка на почту, для сброса пароля',
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.userService.forgotPassword(forgotPasswordDto.email);
  }
  @Post('users/changePassword')
  @ApiBody({ type: ChangePasswordDto })
  @ApiOperation({ summary: 'Change user password' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Пароль успешно изменен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 422, description: 'Неверный пароль' })
  async changeUserPassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: CustomRequest,
  ) {
    const email = request.email;
    return await this.userService.changePassword(
      changePasswordDto.oldPassword,
      changePasswordDto.password,
      email,
    );
  }
}
