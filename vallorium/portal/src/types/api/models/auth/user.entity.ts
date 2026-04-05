import { USER_TYPE } from '../../misc';
import { IBaseModel } from '../base.model';
import { SafeOmit } from 'src/types/utilities';

export interface IUser extends IBaseModel {
  name: string;

  firstName: string;

  password?: string;

  email: string;

  isActive: boolean;

  type: USER_TYPE;

  avatarUrl: string | null;
}

export type IMaintainerAccount = SafeOmit<IUser, 'type'> & {
  type: USER_TYPE.MAINTAINER; // changes enum type to literal type
};

export type IClientAccount = SafeOmit<IUser, 'type'> & {
  type: USER_TYPE.CLIENT; // changes enum type to literal type
};

export type IUserAccount = IMaintainerAccount | IClientAccount;
