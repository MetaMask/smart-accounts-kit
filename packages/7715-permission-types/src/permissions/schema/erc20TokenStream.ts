import {
  justificationSection,
  permissionInfoSection,
  requireStartTime,
  reviewSummaryAccountSection,
  streamDetailsSection,
  streamRateSection,
} from './sections';
import type { PermissionSchemaEntry } from './types';

export const erc20TokenStreamSchema: PermissionSchemaEntry = {
  tokenVariant: 'erc20',
  tokenResolution: {
    kind: 'erc20',
    getTokenAddress: (permission) => permission.data.tokenAddress as string,
  },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    streamDetailsSection('erc20-token-stream-details-section', 'tokenAddress'),
    streamRateSection('erc20-token-stream-stream-rate-section', 'tokenAddress'),
    reviewSummaryAccountSection,
  ],
};
