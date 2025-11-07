import type { SmartAccountsEnvironment } from '../types';

export enum BalanceChangeType {
  Increase = 0x0,
  Decrease = 0x1,
}

export type UnitOfAuthorityBaseConfig = {
  environment: SmartAccountsEnvironment;
};
