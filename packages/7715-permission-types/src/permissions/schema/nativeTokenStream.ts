import {
  justificationSection,
  permissionInfoSection,
  requireStartTime,
  reviewSummaryAccountSection,
  streamDetailsSection,
  streamRateSection,
} from './sections';
import type { PermissionSchemaEntry } from './types';

export const nativeTokenStreamSchema: PermissionSchemaEntry = {
  tokenVariant: 'native',
  tokenResolution: { kind: 'native' },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    streamDetailsSection('native-token-stream-details-section'),
    streamRateSection('native-token-stream-stream-rate-section'),
    reviewSummaryAccountSection,
  ],
};
