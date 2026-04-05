import { IUserAccount } from 'src/types/api/models';

export interface MeResponseDto {
  user: Omit<IUserAccount, 'password'>;
}
