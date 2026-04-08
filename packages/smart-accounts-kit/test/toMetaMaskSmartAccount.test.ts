import type { Account, PublicClient } from 'viem';
import {
  createNonceManager,
  createPublicClient,
  custom,
  hashTypedData,
  isAddress,
  isHex,
  recoverAddress,
} from 'viem';
import {
  toPackedUserOperation,
  toSmartAccount,
} from 'viem/account-abstraction';
import type * as viemAccountAbstraction from 'viem/account-abstraction';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { hardhat as chain } from 'viem/chains';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { randomAddress } from './utils';
import { Implementation } from '../src/constants';
import { toMetaMaskSmartAccount } from '../src/toMetaMaskSmartAccount';
import type {
  SmartAccountsEnvironment,
  MetaMaskSmartAccount,
} from '../src/types';
import { SIGNABLE_USER_OP_TYPED_DATA } from '../src/userOp';

vi.mock('viem/account-abstraction', async (importOriginal) => {
  const actual = await importOriginal<typeof viemAccountAbstraction>();
  return {
    ...actual,
    toSmartAccount: vi.fn(async (implementation) =>
      actual.toSmartAccount(implementation),
    ),
  };
});

describe('MetaMaskSmartAccount', () => {
  let publicClient: PublicClient;
  let alice: Account;
  let bob: Account;
  let environment: SmartAccountsEnvironment;

  beforeEach(async () => {
    vi.mocked(toSmartAccount).mockClear();

    const transport = custom({
      request: async () => '0x',
    });
    publicClient = createPublicClient({ transport, chain });

    environment = {
      SimpleFactory: randomAddress(),
      EntryPoint: randomAddress(),
      implementations: {
        HybridDeleGatorImpl: randomAddress(),
        MultiSigDeleGatorImpl: randomAddress(),
        Stateless7702DeleGatorImpl: randomAddress(),
      },
    } as unknown as SmartAccountsEnvironment;

    alice = privateKeyToAccount(generatePrivateKey());
    bob = privateKeyToAccount(generatePrivateKey());
  });

  describe('toMetaMaskSmartAccount()', () => {
    // note derivation of the correctness of counterfactual account data is validated in counterfactualAccountData.test.ts
    it('creates a MetaMaskSmartAccount for Hybrid implementation', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [alice.address, [], [], []],
        deploySalt: '0x0',
        signer: { account: alice },
        environment,
      });

      const factoryArgs = await smartAccount.getFactoryArgs();

      expect(isHex(factoryArgs.factory)).toBe(true);
      expect(isHex(factoryArgs.factoryData)).toBe(true);
      expect(isAddress(smartAccount.address)).toBe(true);
    });

    it('creates a MetaMaskSmartAccount for MultiSig implementation', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.MultiSig,
        deployParams: [[alice.address, bob.address], 2n],
        deploySalt: '0x0',
        signer: [{ account: alice }],
        environment,
      });

      const factoryArgs = await smartAccount.getFactoryArgs();

      expect(isHex(factoryArgs.factory)).toBe(true);
      expect(isHex(factoryArgs.factoryData)).toBe(true);
      expect(isAddress(smartAccount.address)).toBe(true);
    });

    it('creates a MetaMaskSmartAccount for Stateless7702 implementation with existing address', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Stateless7702,
        address: alice.address,
        signer: { account: alice },
        environment,
      });

      expect(smartAccount.address).to.equal(alice.address);

      // Verify the smart account has the correct ABI and functions
      expect(smartAccount).to.have.property('signUserOperation');
      expect(smartAccount).to.have.property('signDelegation');
      expect(smartAccount).to.have.property('getAddress');
      expect(smartAccount).to.have.property('getNonce');
      expect(smartAccount).to.have.property('encodeCalls');
    });

    it('throws error when creating Stateless7702 without address (counterfactual not supported)', async () => {
      await expect(
        toMetaMaskSmartAccount({
          client: publicClient,
          implementation: Implementation.Stateless7702,
          signer: { account: alice },
          environment,
        } as any),
      ).rejects.toThrow(
        'Stateless7702 does not support counterfactual accounts',
      );
    });

    it('throws an error for unsupported implementation', async () => {
      await expect(
        toMetaMaskSmartAccount({
          client: publicClient,
          implementation: 99 as any as Implementation,
          deployParams: [alice.address, [], [], []],
          deploySalt: '0x0',
          signer: { account: alice },
          environment,
        }),
      ).rejects.toThrow("Implementation type '99' not supported");
    });

    it('has a default for MetaMaskSmartAccount generic TImplementation parameter', async () => {
      // MetaMaskSmartAccount requires a generic parameter, and defaults to `Implementation` which covers all implementations
      const smartAccount: MetaMaskSmartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.MultiSig,
        deployParams: [[alice.address, bob.address], 2n],
        deploySalt: '0x0',
        signer: [{ account: alice }],
        environment,
      });

      expect(smartAccount).toBeInstanceOf(Object);
    });

    it('passes nonceKeyManager as undefined when not specified', async () => {
      await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [alice.address, [], [], []],
        deploySalt: '0x0',
        signer: { account: alice },
        environment,
      });

      expect(vi.mocked(toSmartAccount)).toHaveBeenCalledWith(
        expect.objectContaining({ nonceKeyManager: undefined }),
      );
    });

    it('passes nonceKeyManager into toSmartAccount when specified', async () => {
      const nonceKeyManager = createNonceManager({
        source: { get: () => 0, set: () => undefined },
      });

      await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [alice.address, [], [], []],
        deploySalt: '0x0',
        signer: { account: alice },
        environment,
        nonceKeyManager,
      });

      expect(vi.mocked(toSmartAccount)).toHaveBeenCalledWith(
        expect.objectContaining({ nonceKeyManager }),
      );
    });
  });
  describe('optional signer', () => {
    it('creates a MetaMaskSmartAccount for Hybrid implementation without signer', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [alice.address, [], [], []],
        deploySalt: '0x0',
        environment,
      });

      expect(isAddress(smartAccount.address)).toBe(true);
      expect(smartAccount).to.have.property('getAddress');
      expect(smartAccount).to.have.property('getNonce');
      expect(smartAccount).to.have.property('encodeCalls');
    });

    it('creates a MetaMaskSmartAccount for MultiSig implementation without signer', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.MultiSig,
        deployParams: [[alice.address, bob.address], 2n],
        deploySalt: '0x0',
        environment,
      });

      expect(isAddress(smartAccount.address)).toBe(true);
      expect(smartAccount).to.have.property('getAddress');
      expect(smartAccount).to.have.property('getNonce');
      expect(smartAccount).to.have.property('encodeCalls');
    });

    it('creates a MetaMaskSmartAccount for Stateless7702 implementation without signer', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Stateless7702,
        address: alice.address,
        environment,
      });

      expect(smartAccount.address).to.equal(alice.address);
      expect(smartAccount).to.have.property('getAddress');
      expect(smartAccount).to.have.property('getNonce');
      expect(smartAccount).to.have.property('encodeCalls');
    });

    it('allows non-signing operations without signer - getAddress', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [alice.address, [], [], []],
        deploySalt: '0x0',
        environment,
      });

      const address = await smartAccount.getAddress();
      expect(isAddress(address)).toBe(true);
    });

    it('allows non-signing operations without signer - encodeCalls', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [alice.address, [], [], []],
        deploySalt: '0x0',
        environment,
      });

      const encoded = await smartAccount.encodeCalls([
        { to: alice.address, data: '0x', value: 0n },
      ]);
      expect(isHex(encoded)).toBe(true);
    });

    it('throws error when signUserOperation is called without signer', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [alice.address, [], [], []],
        deploySalt: '0x0',
        environment,
      });

      const userOperation = {
        callData: '0x',
        sender: alice.address,
        nonce: 0n,
        callGasLimit: 1000000n,
        preVerificationGas: 1000000n,
        verificationGasLimit: 1000000n,
        maxFeePerGas: 1000000000000000000n,
        maxPriorityFeePerGas: 1000000000000000000n,
        signature: '0x',
      } as const;

      await expect(
        smartAccount.signUserOperation(userOperation),
      ).rejects.toThrow(
        'Cannot sign user operation: signer not provided. Specify a signer in toMetaMaskSmartAccount() to perform signing operations.',
      );
    });

    it('throws error when signDelegation is called without signer', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [alice.address, [], [], []],
        deploySalt: '0x0',
        environment,
      });

      const delegation = {
        delegate: alice.address,
        delegator: bob.address,
        authority:
          '0x0000000000000000000000000000000000000000000000000000000000000000' as const,
        caveats: [],
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000' as const,
      };

      await expect(smartAccount.signDelegation({ delegation })).rejects.toThrow(
        'Cannot sign delegation: signer not provided. Specify a signer in toMetaMaskSmartAccount() to perform signing operations.',
      );
    });
  });

  describe('signUserOperation()', () => {
    it('signs a user operation for MultiSig implementation', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.MultiSig,
        deployParams: [[alice.address, bob.address], 2n],
        deploySalt: '0x0',
        signer: [{ account: alice }],
        environment,
      });

      const userOperation = {
        callData: '0x',
        sender: alice.address,
        nonce: 0n,
        callGasLimit: 1000000n,
        preVerificationGas: 1000000n,
        verificationGasLimit: 1000000n,
        maxFeePerGas: 1000000000000000000n,
        maxPriorityFeePerGas: 1000000000000000000n,
        signature: '0x',
      } as const;

      const signature = await smartAccount.signUserOperation(userOperation);

      const packedUserOp = toPackedUserOperation(userOperation);

      const hash = hashTypedData({
        domain: {
          chainId: chain.id,
          name: 'MultiSigDeleGator',
          version: '1',
          verifyingContract: smartAccount.address,
        },
        types: SIGNABLE_USER_OP_TYPED_DATA,
        primaryType: 'PackedUserOperation',
        message: { ...packedUserOp, entryPoint: environment.EntryPoint },
      });

      const recovered = await recoverAddress({
        hash,
        signature,
      });

      expect(recovered).to.equal(alice.address);
    });

    it('signs a user operation for Hybrid implementation', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [alice.address, [], [], []],
        deploySalt: '0x0',
        signer: { account: alice },
        environment,
      });

      const userOperation = {
        callData: '0x',
        sender: alice.address,
        nonce: 0n,
        callGasLimit: 1000000n,
        preVerificationGas: 1000000n,
        verificationGasLimit: 1000000n,
        maxFeePerGas: 1000000000000000000n,
        maxPriorityFeePerGas: 1000000000000000000n,
        signature: '0x',
      } as const;

      const signature = await smartAccount.signUserOperation(userOperation);

      const packedUserOp = toPackedUserOperation(userOperation);

      const hash = hashTypedData({
        domain: {
          chainId: chain.id,
          name: 'HybridDeleGator',
          version: '1',
          verifyingContract: smartAccount.address,
        },
        types: SIGNABLE_USER_OP_TYPED_DATA,
        primaryType: 'PackedUserOperation',
        message: { ...packedUserOp, entryPoint: environment.EntryPoint },
      });

      const recovered = await recoverAddress({
        hash,
        signature,
      });

      expect(recovered).to.equal(alice.address);
    });

    it('signs a user operation for Stateless7702 implementation', async () => {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Stateless7702,
        address: alice.address,
        signer: { account: alice },
        environment,
      });

      const userOperation = {
        callData: '0x',
        sender: alice.address,
        nonce: 0n,
        callGasLimit: 1000000n,
        preVerificationGas: 1000000n,
        verificationGasLimit: 1000000n,
        maxFeePerGas: 1000000000000000000n,
        maxPriorityFeePerGas: 1000000000000000000n,
        signature: '0x',
      } as const;

      const signature = await smartAccount.signUserOperation(userOperation);

      const packedUserOp = toPackedUserOperation(userOperation);

      const hash = hashTypedData({
        domain: {
          chainId: chain.id,
          name: 'EIP7702StatelessDeleGator',
          version: '1',
          verifyingContract: smartAccount.address,
        },
        types: SIGNABLE_USER_OP_TYPED_DATA,
        primaryType: 'PackedUserOperation',
        message: { ...packedUserOp, entryPoint: environment.EntryPoint },
      });

      const recovered = await recoverAddress({
        hash,
        signature,
      });

      expect(recovered).to.equal(alice.address);
    });
  });
});
