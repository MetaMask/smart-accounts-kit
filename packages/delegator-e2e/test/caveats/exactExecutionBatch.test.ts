import { beforeEach, test, expect } from 'vitest';
import {
  Implementation,
  toMetaMaskSmartAccount,
  ExecutionMode,
  type ExecutionStruct,
  type MetaMaskSmartAccount,
  ROOT_AUTHORITY,
  type Delegation,
} from '@metamask/smart-accounts-kit';
import {
  createCaveatBuilder,
  encodeExecutionCalldatas,
  encodeDelegations,
} from '@metamask/smart-accounts-kit/utils';
import {
  transport,
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  deployCounter,
  CounterContract,
  fundAddress,
  randomAddress,
  stringToUnprefixedHex,
  publicClient,
} from '../utils/helpers';
import { encodeFunctionData, type Hex, parseEther } from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import CounterMetadata from '../utils/counter/metadata.json';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let aliceCounter: CounterContract;

/**
 * These tests verify the exact execution batch caveat functionality.
 *
 * The exact execution batch caveat ensures that each execution in the batch matches exactly
 * with the expected execution (target, value, and calldata).
 *
 * Alice creates a delegation to Bob with an exact execution batch caveat.
 * Bob redeems the delegation with a batch of executions that must match exactly.
 */

beforeEach(async () => {
  const alice = privateKeyToAccount(generatePrivateKey());
  const bob = privateKeyToAccount(generatePrivateKey());

  aliceSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [alice.address, [], [], []],
    deploySalt: '0x1',
    signer: { account: alice },
  });

  await deploySmartAccount(aliceSmartAccount);
  await fundAddress(aliceSmartAccount.address, parseEther('10'));

  bobSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [bob.address, [], [], []],
    deploySalt: '0x1',
    signer: { account: bob },
  });

  aliceCounter = await deployCounter(aliceSmartAccount.address);
});

const runTest_expectSuccess = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  executions: ExecutionStruct[],
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('exactExecutionBatch', { executions })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await delegator.signDelegation({
      delegation,
    }),
  };

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.BatchDefault],
      encodeExecutionCalldatas([executions]),
    ],
  });

  const userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: bobSmartAccount,
    calls: [
      {
        to: bobSmartAccount.address,
        data: redeemData,
      },
    ],
    ...gasPrice,
  });

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  await expectUserOperationToSucceed(receipt);
};

const runTest_expectFailure = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  expectedExecutions: ExecutionStruct[],
  actualExecutions: ExecutionStruct[],
  expectedError: string,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('exactExecutionBatch', { executions: expectedExecutions })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await delegator.signDelegation({
      delegation,
    }),
  };

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.BatchDefault],
      encodeExecutionCalldatas([actualExecutions]),
    ],
  });

  await expect(
    sponsoredBundlerClient.sendUserOperation({
      account: bobSmartAccount,
      calls: [
        {
          to: bobSmartAccount.address,
          data: redeemData,
        },
      ],
      ...gasPrice,
    }),
  ).rejects.toThrow(stringToUnprefixedHex(expectedError));
};

test('maincase: Bob redeems the delegation with exact matching batch executions', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const executions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
  ];

  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    executions,
  );
});

test('Bob attempts to redeem the delegation with mismatched target address', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const expectedExecutions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 1n,
      callData: incrementCalldata,
    },
  ];

  const actualExecutions = [
    {
      target: randomAddress(),
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 1n,
      callData: incrementCalldata,
    },
  ];

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    expectedExecutions,
    actualExecutions,
    'ExactExecutionBatchEnforcer:invalid-execution',
  );
});

test('Bob attempts to redeem the delegation with mismatched value', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const expectedExecutions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 1n,
      callData: incrementCalldata,
    },
  ];

  const actualExecutions = [
    {
      target: aliceCounter.address,
      value: parseEther('1'), // Different value
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 1n,
      callData: incrementCalldata,
    },
  ];

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    expectedExecutions,
    actualExecutions,
    'ExactExecutionBatchEnforcer:invalid-execution',
  );
});

test('Bob attempts to redeem the delegation with mismatched calldata', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const setCountCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'setCount',
    args: [1n],
  });

  const expectedExecutions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
  ];

  const actualExecutions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: setCountCalldata, // Different calldata
    },
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
  ];

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    expectedExecutions,
    actualExecutions,
    'ExactExecutionBatchEnforcer:invalid-execution',
  );
});

test('Bob attempts to redeem the delegation with different number of executions', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const expectedExecutions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
  ];

  const actualExecutions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
  ];

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    expectedExecutions,
    actualExecutions,
    'ExactExecutionBatchEnforcer:invalid-batch-size',
  );
});
