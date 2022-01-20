import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly oldPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly password: string;
}
