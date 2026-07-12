import {
  allowanceDetailsSection,
  justificationSection,
  permissionInfoSection,
  requireStartTime,
  reviewSummaryAccountSection,
} from './sections';
import type { PermissionSchemaEntry } from './types';

export const erc20TokenAllowanceSchema: PermissionSchemaEntry = {
  tokenVariant: 'erc20',
  tokenResolution: {
    kind: 'erc20',
    getTokenAddress: (permission) => permission.data.tokenAddress as string,
  },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    allowanceDetailsSection(
      'erc20-token-allowance-details-section',
      'tokenAddress',
    ),
    reviewSummaryAccountSection,
  ],
};
