import {
  justificationSection,
  periodicDetailsSection,
  permissionInfoSection,
  requireStartTime,
  reviewSummaryAccountSection,
} from './sections';
import type { PermissionSchemaEntry } from './types';

export const nativeTokenPeriodicSchema: PermissionSchemaEntry = {
  tokenVariant: 'native',
  tokenResolution: { kind: 'native' },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    periodicDetailsSection('native-token-periodic-details-section'),
    reviewSummaryAccountSection,
  ],
};
