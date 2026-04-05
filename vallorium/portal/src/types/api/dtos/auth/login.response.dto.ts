import { IUser } from 'src/types/api/models';

export interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
  user: Omit<IUser, 'password'>;
}
