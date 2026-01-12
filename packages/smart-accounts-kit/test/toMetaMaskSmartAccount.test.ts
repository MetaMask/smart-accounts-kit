import type { Account, PublicClient } from 'viem';
import {
  createPublicClient,
  custom,
  hashTypedData,
  isAddress,
  isHex,
  recoverAddress,
} from 'viem';
import { toPackedUserOperation } from 'viem/account-abstraction';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { hardhat as chain } from 'viem/chains';
import { beforeEach, describe, expect, it } from 'vitest';

import { randomAddress } from './utils';
import { Implementation } from '../src/constants';
import { toMetaMaskSmartAccount } from '../src/toMetaMaskSmartAccount';
import type {
  SmartAccountsEnvironment,
  MetaMaskSmartAccount,
} from '../src/types';
import { SIGNABLE_USER_OP_TYPED_DATA } from '../src/userOp';

describe('MetaMaskSmartAccount', () => {
  let publicClient: PublicClient;
  let alice: Account;
  let bob: Account;
  let environment: SmartAccountsEnvironment;

  beforeEach(async () => {
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
