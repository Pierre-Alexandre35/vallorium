import { IUser } from 'src/types/api/models';
import { USER_TYPE } from '../../misc';

export interface CreateUserAccessDto extends Pick<IUser, 'email' | 'isActive'> {
  password: NonNullable<IUser['password']>;
  type: USER_TYPE;
}
