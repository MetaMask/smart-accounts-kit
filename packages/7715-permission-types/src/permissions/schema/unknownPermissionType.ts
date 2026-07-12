import {
  alwaysVisible,
  justificationSection,
  permissionInfoSection,
} from './sections';
import type { PermissionSchemaEntry } from './types';

export const unknownPermissionTypeSchema: PermissionSchemaEntry = {
  tokenVariant: 'none',
  tokenResolution: { kind: 'none' },
  sections: [
    justificationSection,
    permissionInfoSection,
    {
      testId: 'unknown-permission-type-details-section',
      elements: [
        {
          type: 'raw-text',
          labelKey: 'unknownPermissionType',
          testId: 'review-gator-permission-unknown-type',
          getValue: (ctx) => ctx.permission.type,
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
      ],
    },
  ],
};
