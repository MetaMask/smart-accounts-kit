import {
  allowanceDetailsSection,
  justificationSection,
  permissionInfoSection,
  requireStartTime,
  reviewSummaryAccountSection,
} from './sections';
import type { PermissionSchemaEntry } from './types';

export const nativeTokenAllowanceSchema: PermissionSchemaEntry = {
  tokenVariant: 'native',
  tokenResolution: { kind: 'native' },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    allowanceDetailsSection('native-token-allowance-details-section'),
    reviewSummaryAccountSection,
  ],
};
