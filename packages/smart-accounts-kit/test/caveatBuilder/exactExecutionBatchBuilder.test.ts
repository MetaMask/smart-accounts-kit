import { encodeAbiParameters } from 'viem';
import type { Address, Hex } from 'viem';
import { expect, describe, it } from 'vitest';

import { exactExecutionBatchBuilder } from '../../src/caveatBuilder/exactExecutionBatchBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('exactExecutionBatchBuilder()', () => {
  const environment = {
    caveatEnforcers: { ExactExecutionBatchEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (
    executions: {
      target: Address;
      value: bigint;
      callData: Hex;
    }[],
  ) => {
    const config = { executions };
    return exactExecutionBatchBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with an empty executions array', () => {
      expect(() => buildWithParams([])).to.throw(
        'Invalid executions: array cannot be empty',
      );
    });

    it('should fail with an invalid target address', () => {
      const invalidAddress = 'invalid-address' as any;
      expect(() =>
        buildWithParams([
          {
            target: invalidAddress,
            value: 0n,
            callData: '0x',
          },
        ]),
      ).to.throw('Invalid target: must be a valid address');
    });

    it('should fail with a negative value', () => {
      expect(() =>
        buildWithParams([
          {
            target: randomAddress(),
            value: -1n,
            callData: '0x',
          },
        ]),
      ).to.throw('Invalid value: must be a non-negative number');
    });

    it('should fail with invalid callData format', () => {
      expect(() =>
        buildWithParams([
          {
            target: randomAddress(),
            value: 0n,
            callData: 'invalid' as any,
          },
        ]),
      ).to.throw('Invalid calldata: must be a hex string starting with 0x');
    });

    it('should allow valid addresses that are not checksummed', () => {
      const nonChecksummedAddress = randomAddress().toLowerCase() as Address;
      expect(() =>
        buildWithParams([
          {
            target: nonChecksummedAddress,
            value: 0n,
            callData: '0x',
          },
        ]),
      ).to.not.throw();
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters', () => {
      const executions = [
        {
          target: randomAddress(),
          value: 1000000000000000000n, // 1 ETH
          callData: '0x12345678' as const,
        },
        {
          target: randomAddress(),
          value: 0n,
          callData: '0xabcdef' as const,
        },
      ];

      const caveat = buildWithParams(executions);

      expect(caveat.enforcer).to.equal(
        environment.caveatEnforcers.ExactExecutionBatchEnforcer,
      );
      expect(caveat.args).to.equal('0x00');

      // Verify terms encoding
      const expectedTerms = encodeAbiParameters(
        [
          {
            type: 'tuple[]',
            components: [
              { type: 'address', name: 'target' },
              { type: 'uint256', name: 'value' },
              { type: 'bytes', name: 'callData' },
            ],
          },
        ],
        [executions],
      );
      expect(caveat.terms).to.equal(expectedTerms);
    });
  });
});
