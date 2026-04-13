import { ensureSmartAccountsKitAnalyticsBootstrapped } from '../analytics';

ensureSmartAccountsKitAnalyticsBootstrapped();

export {
  DelegationStorageClient,
  DelegationStorageEnvironment,
  type DelegationStoreFilter,
  type Environment,
  type DelegationStorageConfig,
} from './delegationStorage';
