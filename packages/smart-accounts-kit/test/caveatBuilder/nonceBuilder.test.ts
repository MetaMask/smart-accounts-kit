import { pad, size, type Hex } from 'viem';
import { expect, describe, it } from 'vitest';

import { nonceBuilder } from '../../src/caveatBuilder/nonceBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('nonceBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 32; // 32 bytes for the nonce

  const environment = {
    caveatEnforcers: { NonceEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithNonce = (nonce: Hex) => {
    const config = { nonce };
    return nonceBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with an empty nonce', () => {
      expect(() => buildWithNonce('0x')).to.throw(
        'Invalid nonce: must not be empty',
      );
    });

    it('should fail with a null nonce', () => {
      expect(() => buildWithNonce(null as any as Hex)).to.throw(
        'Value must be a Uint8Array',
      );
    });

    it('should fail with an invalid hex string', () => {
      expect(() => buildWithNonce('0xinvalid' as Hex)).to.throw(
        'Invalid nonce: must be a valid BytesLike value',
      );
    });

    it('should fail with a nonce longer than 32 bytes', () => {
      const longNonce = `0x${'1'.repeat(65)}`;
      expect(() => buildWithNonce(longNonce as Hex)).to.throw(
        'Invalid nonce: must be 32 bytes or less in length',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with a valid nonce', () => {
      const nonce = '0x1';
      const caveat = buildWithNonce(nonce);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.NonceEnforcer,
        terms: pad(nonce, { size: 32 }),
        args: '0x00',
      });
    });

    it('should build a caveat with a large nonce', () => {
      const nonce = '0xffffffff';
      const caveat = buildWithNonce(nonce);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.NonceEnforcer,
        terms: pad(nonce, { size: 32 }),
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const nonce = '0x1';
    const caveat = buildWithNonce(nonce);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
