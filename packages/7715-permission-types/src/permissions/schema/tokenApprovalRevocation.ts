import {
  alwaysVisible,
  getData,
  justificationSection,
  permissionInfoSection,
  reviewSummaryAccountSection,
} from './sections';
import type { PermissionRenderContext, PermissionSchemaEntry } from './types';

const TOKEN_APPROVAL_REVOCATION_METHODS: {
  key: string;
  translationKey: string;
}[] = [
  {
    key: 'erc20Approve',
    translationKey: 'gatorPermissionsErc20ApproveRevocation',
  },
  {
    key: 'erc721Approve',
    translationKey: 'gatorPermissionsErc721ApproveRevocation',
  },
  {
    key: 'erc721SetApprovalForAll',
    translationKey: 'gatorPermissionsSetApprovalForAllRevocation',
  },
  {
    key: 'permit2Approve',
    translationKey: 'gatorPermissionsPermit2ApproveRevocation',
  },
  {
    key: 'permit2Lockdown',
    translationKey: 'gatorPermissionsPermit2Lockdown',
  },
  {
    key: 'permit2InvalidateNonces',
    translationKey: 'gatorPermissionsPermit2InvalidateNonces',
  },
];

const TOKEN_APPROVAL_REVOCATION_PRIMITIVE_KEYS =
  TOKEN_APPROVAL_REVOCATION_METHODS.map(({ key }) => key);

/**
 * Gets translation keys for enabled token approval revocation methods.
 *
 * @param ctx - Permission render context.
 * @returns Translation keys for enabled revocation methods.
 */
function getEnabledTokenApprovalRevocationMethods(
  ctx: PermissionRenderContext,
): string[] {
  return TOKEN_APPROVAL_REVOCATION_METHODS.filter(({ key }) =>
    Boolean(getData<boolean | undefined>(ctx, key)),
  ).map(({ translationKey }) => translationKey);
}

/**
 * Checks whether all token approval revocation primitives are enabled.
 *
 * @param ctx - Permission render context.
 * @returns True when every token approval revocation primitive is enabled.
 */
function hasAllTokenApprovalRevocationPrimitivesEnabled(
  ctx: PermissionRenderContext,
): boolean {
  return TOKEN_APPROVAL_REVOCATION_PRIMITIVE_KEYS.every((key) =>
    Boolean(getData<boolean | undefined>(ctx, key)),
  );
}

export const tokenApprovalRevocationSchema: PermissionSchemaEntry = {
  tokenVariant: 'none',
  tokenResolution: { kind: 'none' },
  sections: [
    justificationSection,
    permissionInfoSection,
    {
      testId: 'token-approval-revocation-details-section',
      elements: [
        {
          type: 'text',
          labelKey: 'revokeTokenApprovals',
          testId: 'review-gator-permission-amount-label',
          getValue: () => ({ key: 'allTokens' }),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionsRevocationMethods',
          testId:
            'review-gator-permission-all-token-approval-revocation-primitives',
          getValue: () => ({
            key: 'gatorPermissionsAllTokenApprovalRevocationPrimitives',
          }),
          isVisible: (ctx) =>
            hasAllTokenApprovalRevocationPrimitivesEnabled(ctx),
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'list',
          labelKey: 'gatorPermissionsRevocationMethods',
          testId: 'review-gator-permission-revocation-methods',
          getValue: (ctx) => getEnabledTokenApprovalRevocationMethods(ctx),
          isVisible: (ctx) =>
            !hasAllTokenApprovalRevocationPrimitivesEnabled(ctx),
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        { type: 'divider', includeInViews: ['confirmation'] },
        {
          type: 'expiry',
          labelKey: 'gatorPermissionsExpirationDate',
          testId: 'review-gator-permission-expiration-date',
          getValue: (ctx) => ctx.expiry,
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
    reviewSummaryAccountSection,
  ],
};
