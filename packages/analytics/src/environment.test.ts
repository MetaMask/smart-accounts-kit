/* eslint-disable @typescript-eslint/naming-convention -- analytics payload field names */
/* eslint-disable-next-line id-length */
import * as t from 'vitest';

import {
  getInitializationContext,
  getSessionBaseProperties,
  resetAnalyticsSessionForTests,
} from './environment';

t.describe('analytics session (environment)', () => {
  t.beforeEach(() => {
    resetAnalyticsSessionForTests();
  });

  t.it(
    'returns nodejs platform with required fields when window is not present',
    () => {
      const ctx = getInitializationContext({
        sdk_version: '9.9.9',
        anon_id: '11111111-2222-4333-8444-555555555555',
      });
      t.expect(ctx).toEqual({
        sdk_version: '9.9.9',
        anon_id: '11111111-2222-4333-8444-555555555555',
        platform: 'nodejs',
      });
    },
  );

  t.it('generates anon_id when omitted on first call only', () => {
    const first = getInitializationContext({ sdk_version: '1.0.0' });
    t.expect(first.sdk_version).toBe('1.0.0');
    t.expect(first.platform).toBe('nodejs');
    t.expect(first.anon_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu,
    );

    const second = getInitializationContext({ sdk_version: '2.0.0' });
    t.expect(second.anon_id).toBe(first.anon_id);
    t.expect(second.sdk_version).toBe('2.0.0');
  });

  t.it('getSessionBaseProperties throws before session start', () => {
    t.expect(() => getSessionBaseProperties()).toThrow(
      /getInitializationContext/iu,
    );
  });

  t.it('getSessionBaseProperties returns copy after init', () => {
    getInitializationContext({ sdk_version: '0.1.0' });
    const a = getSessionBaseProperties();
    const b = getSessionBaseProperties();
    t.expect(a).toEqual(b);
    t.expect(a).not.toBe(b);
  });
});
