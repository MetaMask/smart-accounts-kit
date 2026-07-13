import type { Hex } from '@metamask/utils';

import type { PermissionType } from '../types';

export type I18nFunction = (
  key: string,
  args?: (string | number | undefined | null)[],
) => string;

/** A translatable value: an i18n key with optional interpolation args. */
export type I18nValue = {
  key: string;
  args?: (string | number)[];
};

/** Views in which a schema element can appear. */
export type FieldView = 'confirmation' | 'reviewDetail' | 'reviewSummary';

/** Gator review surfaces only. */
export type ReviewFieldView = Exclude<FieldView, 'confirmation'>;

/**
 * Context passed to schema accessors. Renderers build this from decoded
 * permission data plus any pre-resolved async data.
 */
export type PermissionRenderContext = {
  permission: {
    type: string;
    data: Record<string, unknown>;
    justification?: string;
  };
  /** Expiry timestamp in Unix seconds, or null if no expiry. */
  expiry: number | null;
  redeemerAddresses?: string[] | null;
  payeeAddresses?: string[] | null;
  /** Chain ID in hex format. */
  chainId: Hex;
  /** The origin URL of the request. Only required for confirmation views. */
  origin?: string;
  /** The recipient / delegate address, if present. */
  to?: string;
  /** Pre-resolved token info. Present when tokenResolution.kind is native or erc20. */
  tokenInfo?: {
    symbol: string;
    decimals: number | undefined;
    imageUrl?: string;
  };
  /**
   * Total exposure for stream permissions. Omitted for other permission types.
   * Null means unlimited.
   */
  streamTotalExposure?: bigint | null;
};

/** Whether an amount field is for a native token or an ERC20 token. */
export type TokenVariant = 'native' | 'erc20';

/** Shared config for schema rows that read a value from render context. */
export type BaseField<TType extends string, TValueType> = {
  type: TType;
  labelKey: string;
  testId: string;
  getValue: (ctx: PermissionRenderContext) => TValueType;
  isVisible: (ctx: PermissionRenderContext) => boolean;
  includeInViews: FieldView[];
};

type TooltipFieldConfig = {
  tooltip?: string;
};

/** An amount field. Renderers decide formatting. */
export type AmountField = BaseField<'amount', bigint> &
  TooltipFieldConfig & {
    /** For ERC20 amounts, returns the token contract address. */
    getTokenAddress?: (ctx: PermissionRenderContext) => Hex;
    /** If true, the review renderer appends "/sec" to the formatted value. */
    isRatePerSecond?: boolean;
  };

/** A plain text row. */
export type TextField = BaseField<'text', I18nValue> & TooltipFieldConfig;

/** A plain text row whose value is rendered verbatim. */
export type RawTextField = BaseField<'raw-text', string> & TooltipFieldConfig;

/** A list row whose values are i18n keys. */
export type ListField = BaseField<'list', string[]> & TooltipFieldConfig;

/** A date/time row. */
export type DateField = BaseField<'date', number> & TooltipFieldConfig;

/** An expiry row. Renderers handle the "never expires" case. */
export type ExpiryField = BaseField<'expiry', number | null>;

/** A visual divider between rows. */
export type DividerElement = {
  type: 'divider';
  includeInViews: FieldView[];
};

/** Displays the justification text. */
export type JustificationField = BaseField<'justification', string | I18nValue>;

/** Displays the account row. */
export type AccountField = BaseField<'account', undefined>;

/** Displays the request origin URL. */
export type OriginField = BaseField<'origin', string | undefined> &
  TooltipFieldConfig;

/** Displays a recipient / delegate address. */
export type AddressField = BaseField<'address', string | undefined>;

/** Displays addresses extracted from permission rules. */
export type RuleAddressField = BaseField<'rule-address', string[] | undefined>;

/** Displays the network row. */
export type NetworkField = {
  type: 'network';
  includeInViews: FieldView[];
};

/** Union of all renderable items within a section. */
export type SchemaElement =
  | AmountField
  | TextField
  | RawTextField
  | ListField
  | DateField
  | ExpiryField
  | DividerElement
  | JustificationField
  | AccountField
  | OriginField
  | AddressField
  | NetworkField
  | RuleAddressField;

/** A section groups elements visually. */
export type SchemaSection = {
  testId: string;
  elements: SchemaElement[];
};

/** Token data the renderer should resolve before rendering. */
export type TokenResolution =
  | { kind: 'native' }
  | {
      kind: 'erc20';
      getTokenAddress: (permission: {
        data: Record<string, unknown>;
      }) => string;
    }
  | { kind: 'none' };

/** A complete schema entry for one permission type. */
export type PermissionSchemaEntry = {
  tokenVariant: TokenVariant | 'none';
  tokenResolution: TokenResolution;
  /** Optional validation run before rendering. Throw to trigger renderer error handling. */
  validate?: (permission: { data: Record<string, unknown> }) => void;
  sections: SchemaSection[];
};

/**
 * Maps permission type strings to their schema entries.
 * `erc20-token-revocation` is deprecated in favor of `token-approval-revocation`
 * and intentionally excluded; it renders as an unknown permission type.
 */
export type PermissionSchemaRegistry = Record<
  Exclude<PermissionType, 'erc20-token-revocation'>,
  PermissionSchemaEntry
>;
