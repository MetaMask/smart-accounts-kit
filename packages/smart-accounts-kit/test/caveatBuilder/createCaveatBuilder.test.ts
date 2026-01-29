import { concat, encodePacked, isAddress, pad, toHex } from 'viem';
import type { Address } from 'viem/accounts';
import { expect, describe, it } from 'vitest';

import { createCaveatBuilder, CaveatBuilder } from '../../src/caveatBuilder';
import { BalanceChangeType } from '../../src/caveatBuilder/types';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress, randomBytes } from '../utils';

describe('createCaveatBuilder()', () => {
  const environment: SmartAccountsEnvironment = {
    caveatEnforcers: {
      AllowedMethodsEnforcer: randomBytes(20),
      AllowedTargetsEnforcer: randomBytes(20),
      DeployedEnforcer: randomBytes(20),
      AllowedCalldataEnforcer: randomBytes(20),
      ERC20BalanceChangeEnforcer: randomBytes(20),
      ValueLteEnforcer: randomBytes(20),
      LimitedCallsEnforcer: randomBytes(20),
      IdEnforcer: randomBytes(20),
      NonceEnforcer: randomBytes(20),
      TimestampEnforcer: randomBytes(20),
      BlockNumberEnforcer: randomBytes(20),
      NativeTokenTransferAmountEnforcer: randomBytes(20),
      NativeBalanceChangeEnforcer: randomBytes(20),
      NativeTokenPaymentEnforcer: randomBytes(20),
      ERC20TransferAmountEnforcer: randomBytes(20),
      RedeemerEnforcer: randomBytes(20),
      ArgsEqualityCheckEnforcer: randomBytes(20),
    },
  } as unknown as SmartAccountsEnvironment;

  describe('ctor', () => {
    it('should create a CaveatBuilder', () => {
      const builder = createCaveatBuilder(environment);

      expect(builder).to.be.instanceOf(CaveatBuilder);
    });

    it('should disallow empty caveats', () => {
      const builder = createCaveatBuilder(environment);

      expect(() => builder.build()).to.throw(
        'No caveats found. If you definitely want to create an empty caveat collection, set `allowInsecureUnrestrictedDelegation` to `true`.',
      );
    });

    it('should allow empty caveats, when configured', () => {
      const builder = createCaveatBuilder(environment, {
        allowInsecureUnrestrictedDelegation: true,
      });

      expect(() => builder.build()).to.not.throw();
    });
  });

  describe('individual caveat builders', () => {
    it("should add an 'allowedMethods' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const selectors = [randomBytes(4), randomBytes(4)];

      const caveats = builder
        .addCaveat('allowedMethods', { selectors })
        .build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.AllowedMethodsEnforcer,
          terms: concat(selectors),
          args: '0x00',
        },
      ]);

      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }
      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add an 'allowedTargets' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const targets: [Address, Address] = [randomAddress(), randomAddress()];

      const caveats = builder.addCaveat('allowedTargets', { targets }).build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.AllowedTargetsEnforcer,
          terms: targets[0] + targets[1]?.slice(2),
          args: '0x00',
        },
      ]);

      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add a 'deployed' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const contractAddress = randomAddress();
      const salt = randomBytes(32);
      const bytecode = randomBytes(256);

      const caveats = builder
        .addCaveat('deployed', { contractAddress, salt, bytecode })
        .build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.DeployedEnforcer,
          terms: concat([contractAddress, pad(salt, { size: 32 }), bytecode]),
          args: '0x00',
        },
      ]);

      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add an 'allowedCalldata' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const value = randomBytes(128);
      const startIndex = Math.floor(Math.random() * 2 ** 32);

      const caveats = builder
        .addCaveat('allowedCalldata', { startIndex, value })
        .build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.AllowedCalldataEnforcer,
          terms: concat([toHex(startIndex, { size: 32 }), value]),
          args: '0x00',
        },
      ]);

      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add an 'erc20BalanceChange' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const balance = BigInt(
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
      );

      const caveats = builder
        .addCaveat('erc20BalanceChange', {
          tokenAddress,
          recipient,
          balance,
          changeType: BalanceChangeType.Increase,
        })
        .build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.ERC20BalanceChangeEnforcer,
          terms: encodePacked(
            ['uint8', 'address', 'address', 'uint256'],
            [BalanceChangeType.Increase, tokenAddress, recipient, balance],
          ),
          args: '0x00',
        },
      ]);
      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add a 'valueLte' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const maxValue = BigInt(
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
      );

      const caveats = builder.addCaveat('valueLte', { maxValue }).build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.ValueLteEnforcer,
          terms: toHex(maxValue, { size: 32 }),
          args: '0x00',
        },
      ]);
      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add a 'limitedCalls' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const limit = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      const caveats = builder.addCaveat('limitedCalls', { limit }).build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.LimitedCallsEnforcer,
          terms: toHex(limit, { size: 32 }),
          args: '0x00',
        },
      ]);
      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add an 'id' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const idValue = BigInt(Math.floor(Math.random() * 2 ** 32));
      const caveats = builder.addCaveat('id', { id: idValue }).build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.IdEnforcer,
          terms: toHex(idValue, { size: 32 }),
          args: '0x00',
        },
      ]);
      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add a 'nonce' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const nonce = randomBytes(16);
      const caveats = builder.addCaveat('nonce', { nonce }).build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.NonceEnforcer,
          terms: pad(nonce, { size: 32 }),
          args: '0x00',
        },
      ]);
      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add a 'timestamp' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const afterThreshold = 1000;
      const beforeThreshold = 2000;

      const caveats = builder
        .addCaveat('timestamp', {
          afterThreshold,
          beforeThreshold,
        })
        .build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.TimestampEnforcer,
          terms: concat([
            toHex(afterThreshold, { size: 16 }),
            toHex(beforeThreshold, { size: 16 }),
          ]),
          args: '0x00',
        },
      ]);
      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add a 'blockNumber' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const afterThreshold = 1000n;
      const beforeThreshold = 2000n;

      const caveats = builder
        .addCaveat('blockNumber', {
          afterThreshold,
          beforeThreshold,
        })
        .build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.BlockNumberEnforcer,
          terms: concat([
            toHex(afterThreshold, { size: 16 }),
            toHex(beforeThreshold, { size: 16 }),
          ]),
          args: '0x00',
        },
      ]);
      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add a 'nativeTokenTransferAmount' caveat", () => {
      const builder = createCaveatBuilder(environment);
      const maxAmount = 1000000000000000000n; // 1 ETH in wei

      const caveats = builder
        .addCaveat('nativeTokenTransferAmount', { maxAmount })
        .build();

      expect(caveats).to.deep.equal([
        {
          enforcer:
            environment.caveatEnforcers.NativeTokenTransferAmountEnforcer,
          terms: toHex(maxAmount, { size: 32 }),
          args: '0x00',
        },
      ]);

      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add a 'nativeBalanceChange' caveat", () => {
      const builder = createCaveatBuilder(environment);
      const recipient = randomAddress();
      const minBalance = 500000000000000000n; // 0.5 ETH in wei

      const caveats = builder
        .addCaveat('nativeBalanceChange', {
          recipient,
          balance: minBalance,
          changeType: BalanceChangeType.Increase,
        })
        .build();
      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.NativeBalanceChangeEnforcer,
          terms: encodePacked(
            ['uint8', 'address', 'uint256'],
            [BalanceChangeType.Increase, recipient, minBalance],
          ),
          args: '0x00',
        },
      ]);

      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add a 'nativeTokenPayment' caveat", () => {
      const builder = createCaveatBuilder(environment);
      const amount = 1000000000000000000n; // 1 ETH in wei
      const recipient = randomAddress('lowercase');

      const caveats = builder
        .addCaveat('nativeTokenPayment', { recipient, amount })
        .build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.NativeTokenPaymentEnforcer,
          terms: concat([recipient, toHex(amount, { size: 32 })]),
          args: '0x00',
        },
      ]);
      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });

    it("should add an 'erc20TransferAmount' caveat", () => {
      const builder = createCaveatBuilder(environment);

      const tokenAddress = randomAddress();
      const maxAmount = 2000n;

      const caveats = builder
        .addCaveat('erc20TransferAmount', { tokenAddress, maxAmount })
        .build();

      expect(caveats).to.deep.equal([
        {
          enforcer: environment.caveatEnforcers.ERC20TransferAmountEnforcer,
          terms: concat([tokenAddress, toHex(maxAmount, { size: 32 })]),
          args: '0x00',
        },
      ]);
      const caveat = caveats[0];
      if (!caveat) {
        throw new Error('caveat is not set');
      }

      expect(isAddress(caveat.enforcer)).to.equal(true);
    });
  });

  it("should add a 'redeemer' caveat", () => {
    const builder = createCaveatBuilder(environment);
    const redeemerAddress = randomAddress();

    const caveats = builder
      .addCaveat('redeemer', { redeemers: [redeemerAddress] })
      .build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.RedeemerEnforcer,
        terms: redeemerAddress,
        args: '0x00',
      },
    ]);
    const caveat = caveats[0];
    if (!caveat) {
      throw new Error('caveat is not set');
    }

    expect(isAddress(caveat.enforcer)).to.equal(true);
  });

  it("should add an 'argsEqualityCheck' caveat", () => {
    const builder = createCaveatBuilder(environment);
    const args = '0x1234567890';

    const caveats = builder.addCaveat('argsEqualityCheck', { args }).build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.ArgsEqualityCheckEnforcer,
        terms: args,
        args: '0x00',
      },
    ]);
    const caveat = caveats[0];
    if (!caveat) {
      throw new Error('caveat is not set');
    }

    expect(isAddress(caveat.enforcer)).to.equal(true);
  });
});
