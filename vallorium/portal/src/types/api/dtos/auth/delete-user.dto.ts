import { IUser } from 'src/types/api/models';

export type DeleteUserDto = Pick<IUser, 'id'>;
