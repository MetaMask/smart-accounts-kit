import {
  justificationSection,
  periodicDetailsSection,
  permissionInfoSection,
  requireStartTime,
  reviewSummaryAccountSection,
} from './sections';
import type { PermissionSchemaEntry } from './types';

export const erc20TokenPeriodicSchema: PermissionSchemaEntry = {
  tokenVariant: 'erc20',
  tokenResolution: {
    kind: 'erc20',
    getTokenAddress: (permission) => permission.data.tokenAddress as string,
  },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    periodicDetailsSection(
      'erc20-token-periodic-details-section',
      'tokenAddress',
    ),
    reviewSummaryAccountSection,
  ],
};
