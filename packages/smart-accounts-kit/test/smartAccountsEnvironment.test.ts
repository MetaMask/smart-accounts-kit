import { describe, it, expect } from 'vitest';

import {
  getSmartAccountsEnvironment,
  overrideDeployedEnvironment,
} from '../src/smartAccountsEnvironment';
import type { SmartAccountsEnvironment } from '../src/types';

describe('SmartAccountsEnvironment', () => {
  describe('overrideDeployedEnvironment', () => {
    // this is a chainId that never be used - it's negative, and it's dead beef
    // it's important, because these tests may pollute overridden environments
    // for other tests.
    const overriddenChainId = -0xdeadb33f;
    const overriddenVersion = '1.3.0';
    const overriddenEnvironment = {} as SmartAccountsEnvironment;

    it('should override the environment for a given chainId and version', () => {
      overrideDeployedEnvironment(
        overriddenChainId,
        overriddenVersion,
        overriddenEnvironment,
      );

      const resolvedEnvironment = getSmartAccountsEnvironment(
        overriddenChainId,
        overriddenVersion,
      );

      expect(resolvedEnvironment).equals(overriddenEnvironment);
    });

    it('should not override the environment for a different version', () => {
      overrideDeployedEnvironment(
        overriddenChainId,
        overriddenVersion,
        overriddenEnvironment,
      );
      const wrongVersion = '1.0.0';

      expect(() =>
        getSmartAccountsEnvironment(overriddenChainId, wrongVersion),
      ).to.throw(
        `No contracts found for version ${wrongVersion} chain ${overriddenChainId}`,
      );
    });

    it('should not override the environment for a different chainId', () => {
      overrideDeployedEnvironment(
        overriddenChainId,
        overriddenVersion,
        overriddenEnvironment,
      );
      const wrongChainId = 0xdeadb33f;

      expect(() =>
        getSmartAccountsEnvironment(wrongChainId, overriddenVersion),
      ).to.throw(
        `No contracts found for version ${overriddenVersion} chain ${wrongChainId}`,
      );
    });
  });
});
