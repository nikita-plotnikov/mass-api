import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly email: string;
}
