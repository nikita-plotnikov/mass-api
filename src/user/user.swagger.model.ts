import { ApiProperty } from '@nestjs/swagger';

export class UserResponseModel {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  isConfirm: boolean;

  @ApiProperty()
  token: string;
}
