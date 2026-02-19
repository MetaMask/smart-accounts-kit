import { beforeEach, test, expect } from 'vitest';
import {
  encodeDelegations,
  encodeExecutionCalldatas,
  getDelegationHashOffchain,
  createCaveatBuilder,
} from '@metamask/smart-accounts-kit/utils';
import {
  createExecution,
  Implementation,
  toMetaMaskSmartAccount,
  ExecutionMode,
  type MetaMaskSmartAccount,
  type Delegation,
  ROOT_AUTHORITY,
} from '@metamask/smart-accounts-kit';
import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  publicClient,
  randomAddress,
  fundAddress,
  stringToUnprefixedHex,
} from '../utils/helpers';
import {
  Address,
  concat,
  encodeFunctionData,
  Hex,
  parseEther,
  zeroAddress,
} from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;

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

  bobSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [bob.address, [], [], []],
    deploySalt: '0x1',
    signer: { account: bob },
  });

  await fundAddress(bobSmartAccount.address, parseEther('2'));
});

/*
  Main test cases:

  Alice creates a DeleGatorSmartAccount for a deployed Hybrid Delegator Account.
  Bob creates a DeleGatorSmartAccount for a counterfactual Hybrid Delegator Account.

  Alice creates a delegation to Bob's delegator account, with a NativeTokenPayment
  caveat that specifies a recipient and a required value for native token payments.

  Bob redeems the delegation with a valid permissions context allowing payment.
*/

test('maincase: Bob redeems the delegation with a permissions context allowing payment', async () => {
  const recipient = randomAddress();
  const requiredValue = parseEther('1');

  const delegationRequiringNativeTokenPayment: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenPayment', {
        recipient,
        amount: requiredValue,
      })
      .build(),
    signature: '0x',
  };

  const delegationHash = getDelegationHashOffchain(
    delegationRequiringNativeTokenPayment,
  );

  const args = concat([delegationHash, bobSmartAccount.address]);

  const paymentDelegation: Delegation = {
    delegate:
      bobSmartAccount.environment.caveatEnforcers.NativeTokenPaymentEnforcer!,
    delegator: bobSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('argsEqualityCheck', {
        args,
      })
      .build(),
    signature: '0x',
  };

  const signedPaymentDelegation = {
    ...paymentDelegation,
    signature: await bobSmartAccount.signDelegation({
      delegation: paymentDelegation,
    }),
  };

  const permissionContext = encodeDelegations([signedPaymentDelegation]);

  await runTest_expectSuccess(
    delegationRequiringNativeTokenPayment,
    permissionContext,
    recipient,
    requiredValue,
  );
});

test('Bob attempts to redeem the delegation without an argsEqualityCheckEnforcer', async () => {
  const recipient = randomAddress();
  const requiredValue = parseEther('1');

  const delegationRequiringNativeTokenPayment: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenPayment', {
        recipient,
        amount: requiredValue,
      })
      .build(),
    signature: '0x',
  };

  const paymentDelegation: Delegation = {
    delegate:
      bobSmartAccount.environment.caveatEnforcers.NativeTokenPaymentEnforcer!,
    delegator: bobSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment, {
      allowInsecureUnrestrictedDelegation: true,
    }).build(),
    signature: '0x',
  };

  const signedPaymentDelegation = {
    ...paymentDelegation,
    signature: await bobSmartAccount.signDelegation({
      delegation: paymentDelegation,
    }),
  };

  const permissionContext = encodeDelegations([signedPaymentDelegation]);

  await runTest_expectFailure(
    delegationRequiringNativeTokenPayment,
    permissionContext,
    recipient,
    'NativeTokenPaymentEnforcer:missing-argsEqualityCheckEnforcer',
  );
});

test('Bob attempts to redeem the delegation without providing a valid permissions context', async () => {
  const recipient = randomAddress();
  const requiredValue = parseEther('1');

  const delegationRequiringNativeTokenPayment: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenPayment', {
        recipient,
        amount: requiredValue,
      })
      .build(),
    signature: '0x',
  };

  const permissionContext = '0x' as const;

  await runTest_expectFailure(
    delegationRequiringNativeTokenPayment,
    permissionContext,
    recipient,
    undefined, // The NativeTokenPaymentEnforcer rejects when it fails to decode the permissions context
  );
});

test('Bob attempts to redeem with invalid terms length', async () => {
  const recipient = randomAddress();
  const requiredValue = parseEther('1');
  const { environment } = aliceSmartAccount;

  const caveats = createCaveatBuilder(environment)
    .addCaveat('nativeTokenPayment', {
      recipient,
      amount: requiredValue,
    })
    .build();

  // Create invalid terms length by appending an empty byte
  caveats[0].terms = concat([caveats[0].terms, '0x00']);

  const delegationRequiringNativeTokenPayment: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats,
    signature: '0x',
  };

  const delegationHash = getDelegationHashOffchain(
    delegationRequiringNativeTokenPayment,
  );

  const args = concat([delegationHash, bobSmartAccount.address]);

  const paymentDelegation: Delegation = {
    delegate:
      bobSmartAccount.environment.caveatEnforcers.NativeTokenPaymentEnforcer!,
    delegator: bobSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('argsEqualityCheck', {
        args,
      })
      .build(),
    signature: '0x',
  };

  const signedPaymentDelegation = {
    ...paymentDelegation,
    signature: await bobSmartAccount.signDelegation({
      delegation: paymentDelegation,
    }),
  };

  const permissionContext = encodeDelegations([signedPaymentDelegation]);

  await runTest_expectFailure(
    delegationRequiringNativeTokenPayment,
    permissionContext,
    recipient,
    'NativeTokenPaymentEnforcer:invalid-terms-length',
  );
});

test('Bob attempts to redeem with empty allowance delegations', async () => {
  const recipient = randomAddress();
  const requiredValue = parseEther('1');
  const { environment } = aliceSmartAccount;

  const delegationRequiringNativeTokenPayment: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('nativeTokenPayment', {
        recipient,
        amount: requiredValue,
      })
      .build(),
    signature: '0x',
  };

  // Create empty allowance delegations array
  const permissionContext = encodeDelegations([]);

  await runTest_expectFailure(
    delegationRequiringNativeTokenPayment,
    permissionContext,
    recipient,
    'NativeTokenPaymentEnforcer:invalid-allowance-delegations-length',
  );
});

const runTest_expectSuccess = async (
  delegation: Delegation,
  permissionContext: Hex,
  recipient: Address,
  requiredValue: bigint,
) => {
  const balanceBefore = await publicClient.getBalance({
    address: recipient,
  });

  const userOpHash = await submitUserOpForTest(delegation, permissionContext);

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  await expectUserOperationToSucceed(receipt);

  const balanceAfter = await publicClient.getBalance({
    address: recipient,
  });

  expect(
    balanceAfter,
    'Expected balance to be increased by the specified amount',
  ).toEqual(balanceBefore + requiredValue);
};

const runTest_expectFailure = async (
  delegation: Delegation,
  permissionContext: Hex,
  recipient: Address,
  expectedError: string | undefined,
) => {
  const balanceBefore = await publicClient.getBalance({
    address: recipient,
  });

  const rejects = expect(
    submitUserOpForTest(delegation, permissionContext),
  ).rejects;

  if (expectedError) {
    await rejects.toThrow(stringToUnprefixedHex(expectedError));
  } else {
    await rejects.toThrow();
  }

  const balanceAfter = await publicClient.getBalance({
    address: recipient,
  });

  expect(balanceAfter, 'Expected balance to remain unchanged').toEqual(
    balanceBefore,
  );
};

const submitUserOpForTest = async (
  delegation: Delegation,
  permissionContext: Hex,
) => {
  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({ delegation }),
  };

  // we need to assign the permissions context to the caveat in order for it to process the payment
  // here we assume that the first caveat is the nativeTokenPayment caveat
  signedDelegation.caveats[0].args = permissionContext;

  const execution = createExecution({
    target: zeroAddress,
  });

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([[execution]]),
    ],
  });

  return sponsoredBundlerClient.sendUserOperation({
    account: bobSmartAccount,
    calls: [
      {
        to: bobSmartAccount.address,
        data: redeemData,
      },
    ],
    ...gasPrice,
  });
};
