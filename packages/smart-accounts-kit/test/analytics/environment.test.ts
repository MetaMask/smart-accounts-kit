/* eslint-disable @typescript-eslint/naming-convention -- analytics payload field names */
import { describe, beforeEach, it, expect } from 'vitest';

import {
  getInitializationContext,
  getSessionBaseProperties,
  resetAnalyticsSessionForTests,
} from '../../src/analytics/environment';

describe('analytics session (environment)', () => {
  beforeEach(() => {
    resetAnalyticsSessionForTests();
  });

  it('returns nodejs platform with required fields when window is not present', () => {
    const ctx = getInitializationContext({
      sdk_version: '9.9.9',
      anon_id: '11111111-2222-4333-8444-555555555555',
    });
    expect(ctx).toEqual({
      sdk_version: '9.9.9',
      anon_id: '11111111-2222-4333-8444-555555555555',
      platform: 'nodejs',
    });
  });

  it('generates anon_id when omitted on first call only', () => {
    const first = getInitializationContext({ sdk_version: '1.0.0' });
    expect(first.sdk_version).toBe('1.0.0');
    expect(first.platform).toBe('nodejs');
    expect(first.anon_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu,
    );

    const second = getInitializationContext({ sdk_version: '2.0.0' });
    expect(second.anon_id).toBe(first.anon_id);
    expect(second.sdk_version).toBe('2.0.0');
  });

  it('getSessionBaseProperties throws before session start', () => {
    expect(() => getSessionBaseProperties()).toThrow(
      /getInitializationContext/iu,
    );
  });

  it('getSessionBaseProperties returns copy after init', () => {
    getInitializationContext({ sdk_version: '0.1.0' });
    const a = getSessionBaseProperties();
    const b = getSessionBaseProperties();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
