import { DelegationManager } from '@metamask/delegation-abis';
import { stub } from 'sinon';
import type {
  Account,
  Chain,
  PublicClient,
  Transport,
  WalletClient,
} from 'viem';
import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeFunctionData,
} from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia as chain } from 'viem/chains';
import { beforeEach, describe, expect, it } from 'vitest';

import { erc7710BundlerActions, erc7710WalletActions } from '../../src/actions';
import type {
  SendTransactionWithDelegationParameters,
  SendUserOperationWithDelegationParameters,
} from '../../src/actions/erc7710RedeemDelegationAction';
import { Implementation } from '../../src/constants';
import {
  createExecution,
  encodeExecutionCalldatas,
  ExecutionMode,
} from '../../src/executions';
import { overrideDeployedEnvironment } from '../../src/smartAccountsEnvironment';
import { toMetaMaskSmartAccount } from '../../src/toMetaMaskSmartAccount';
import type {
  SmartAccountsEnvironment,
  MetaMaskSmartAccount,
} from '../../src/types';
import { randomAddress, randomBytes } from '../utils';

describe('erc7710RedeemDelegationAction', () => {
  describe('sendUserOperationWithDelegationAction()', () => {
    const mockBundlerRequest = stub();
    let publicClient: PublicClient<Transport, Chain>;
    const simpleFactoryAddress = randomAddress();

    const owner = privateKeyToAccount(generatePrivateKey());
    let metaMaskSmartAccount: MetaMaskSmartAccount<Implementation.MultiSig>;

    beforeEach(async () => {
      mockBundlerRequest.reset();
      overrideDeployedEnvironment(chain.id, '1.3.0', {
        SimpleFactory: simpleFactoryAddress,
        implementations: {
          MultiSigDeleGatorImpl: randomAddress(),
        },
      } as any as SmartAccountsEnvironment);

      publicClient = createPublicClient({
        transport: custom({ request: async () => '0x' }),
        chain,
      });

      metaMaskSmartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.MultiSig,
        signer: [{ account: owner }],
        deployParams: [[owner.address], 1n],
        deploySalt: randomBytes(32),
      });
    });

    it('should call sendUserOperation() with the specified parameters', async () => {
      const bundlerClient = createBundlerClient({
        transport: custom({ request: mockBundlerRequest }),
        chain,
        account: metaMaskSmartAccount,
      });
      const extendedBundlerClient = bundlerClient.extend(
        erc7710BundlerActions(),
      );

      const sendUserOperationStub = stub(bundlerClient, 'sendUserOperation');

      const sendUserOperationWithDelegationArgs: SendUserOperationWithDelegationParameters<
        MetaMaskSmartAccount<Implementation.MultiSig>
      > = {
        calls: [{ to: randomAddress(), value: 0n }],
        publicClient,
      };

      await extendedBundlerClient.sendUserOperationWithDelegation(
        sendUserOperationWithDelegationArgs,
      );

      expect(sendUserOperationStub.firstCall.args[0]).to.deep.equal(
        sendUserOperationWithDelegationArgs,
      );
    });

    it('should append factory calls when accountMetadata is provided', async () => {
      const bundlerClient = createBundlerClient({
        transport: custom({ request: mockBundlerRequest }),
        chain,
      });
      const extendedBundlerClient = bundlerClient.extend(
        erc7710BundlerActions(),
      );

      const sendUserOperationStub = stub(bundlerClient, 'sendUserOperation');

      const calls = [
        {
          to: randomAddress(),
          value: 0n,
        },
      ];

      const accountMetadata = [
        {
          factory: simpleFactoryAddress,
          factoryData: randomBytes(128),
        },
        {
          factory: simpleFactoryAddress,
          factoryData: randomBytes(128),
        },
      ];
      const sendUserOperationWithDelegationArgs: SendUserOperationWithDelegationParameters =
        {
          publicClient,
          calls,
          accountMetadata,
        };

      await extendedBundlerClient.sendUserOperationWithDelegation(
        sendUserOperationWithDelegationArgs,
      );

      expect(sendUserOperationStub.firstCall.args[0]).to.deep.equal({
        ...sendUserOperationWithDelegationArgs,
        calls: [
          {
            to: accountMetadata[0]?.factory,
            data: accountMetadata[0]?.factoryData,
            value: 0n,
          },
          {
            to: accountMetadata[1]?.factory,
            data: accountMetadata[1]?.factoryData,
            value: 0n,
          },
          ...calls,
        ],
      });
    });

    it('should throw an error when SimpleFactory is provided as accountMetadata factory', async () => {
      const bundlerClient = createBundlerClient({
        transport: custom({ request: mockBundlerRequest }),
        chain,
      });
      const extendedBundlerClient = bundlerClient.extend(
        erc7710BundlerActions(),
      );

      const calls = [
        {
          to: randomAddress(),
          value: 0n,
        },
      ];

      const accountMetadata = [
        {
          factory: randomAddress(),
          factoryData: randomBytes(128),
        },
      ];

      const sendUserOperationWithDelegationArgs: SendUserOperationWithDelegationParameters =
        {
          publicClient,
          calls,
          accountMetadata,
        };

      const factoryAddress = accountMetadata[0]?.factory;

      if (!factoryAddress) {
        throw new Error('factoryAddress is not set');
      }

      await expect(
        extendedBundlerClient.sendUserOperationWithDelegation(
          sendUserOperationWithDelegationArgs,
        ),
      ).rejects.toThrow(
        `Invalid accountMetadata: ${factoryAddress} is not allowed.`,
      );
    });

    it('should not append factory calls for accounts that are already deployed', async () => {
      const bundlerClient = createBundlerClient({
        transport: custom({ request: mockBundlerRequest }),
        chain,
      });
      const extendedBundlerClient = bundlerClient.extend(
        erc7710BundlerActions(),
      );

      const sendUserOperationStub = stub(bundlerClient, 'sendUserOperation');

      const calls = [
        {
          to: randomAddress(),
          value: 0n,
        },
      ];

      const accountMetadata = [
        {
          factory: simpleFactoryAddress,
          factoryData: randomBytes(128),
        },
      ];

      const mockPublicClient = {
        ...publicClient,
        call: stub(),
      };

      mockPublicClient.call.rejects('Contract already deployed');

      const sendUserOperationWithDelegationArgs: SendUserOperationWithDelegationParameters =
        {
          publicClient: mockPublicClient as unknown as PublicClient<
            Transport,
            Chain
          >,
          calls,
          accountMetadata,
        };

      await extendedBundlerClient.sendUserOperationWithDelegation(
        sendUserOperationWithDelegationArgs,
      );

      expect(mockPublicClient.call.firstCall.args[0]).to.deep.equal({
        to: accountMetadata[0]?.factory,
        data: accountMetadata[0]?.factoryData,
      });

      expect(sendUserOperationStub.firstCall.args[0]).to.deep.equal({
        ...sendUserOperationWithDelegationArgs,
        calls,
      });
    });
  });

  describe('sendTransactionWithDelegationAction()', () => {
    let walletClient: WalletClient<Transport, Chain, Account>;
    let account: Account;

    beforeEach(async () => {
      const transport = custom({ request: async () => '0x' });

      account = privateKeyToAccount(generatePrivateKey());
      walletClient = createWalletClient({
        account,
        chain,
        transport,
      });
    });

    it('should encode the calldata with the specified parameters', async () => {
      const extendedWalletClient = walletClient.extend(erc7710WalletActions());

      const sendTransaction = stub(walletClient, 'sendTransaction');

      const args: SendTransactionWithDelegationParameters = {
        account,
        chain,
        to: randomAddress(),
        value: 0n,
        data: randomBytes(128),
        permissionsContext: randomBytes(128),
        delegationManager: randomAddress(),
      };

      await extendedWalletClient.sendTransactionWithDelegation(args);

      if (!args.to) {
        throw new Error('to is not set');
      }

      const redeemDelegationCallData = encodeFunctionData({
        abi: DelegationManager,
        functionName: 'redeemDelegations',
        args: [
          [args.permissionsContext],
          [ExecutionMode.SingleDefault],
          encodeExecutionCalldatas([
            [
              createExecution({
                target: args.to,
                value: args.value,
                callData: args.data,
              }),
            ],
          ]),
        ],
      });

      const { delegationManager } = args;

      const expectedArgs = {
        account,
        chain,
        to: delegationManager,
        // value is not passed to sendTransaction
        data: redeemDelegationCallData,
        // permissionsContext and delegationManager are not passed to sendTransaction
      };

      expect(sendTransaction.calledOnce).to.equal(true);

      expect(sendTransaction.firstCall.args[0]).to.deep.equal(expectedArgs);
    });

    it('should throw an error when `to` is not provided', async () => {
      const extendedWalletClient = walletClient.extend(erc7710WalletActions());

      await expect(
        extendedWalletClient.sendTransactionWithDelegation({
          account,
          chain,
          value: 0n,
          data: randomBytes(128),
          permissionsContext: randomBytes(128),
          delegationManager: randomAddress(),
        }),
      ).rejects.toThrow(
        '`to` is required. `sendTransactionWithDelegation` cannot be used to deploy contracts.',
      );
    });

    it('should not encode the specified `value`, `permissionsContext` and `delegationManager` into the resulting transaction', async () => {
      const extendedWalletClient = walletClient.extend(erc7710WalletActions());

      const sendTransaction = stub(walletClient, 'sendTransaction');

      const args: SendTransactionWithDelegationParameters = {
        account,
        chain,
        to: randomAddress(),
        value: 100n,
        data: randomBytes(128),
        permissionsContext: randomBytes(128),
        delegationManager: randomAddress(),
      };

      await extendedWalletClient.sendTransactionWithDelegation(args);

      expect(sendTransaction.calledOnce).to.equal(true);
      const sendTransactionArgs = sendTransaction.firstCall.args[0];
      expect(sendTransactionArgs.value).to.equal(undefined);
      expect((sendTransactionArgs as any).permissionsContext).to.equal(
        undefined,
      );
      expect((sendTransactionArgs as any).delegationManager).to.equal(
        undefined,
      );
    });
  });
});
