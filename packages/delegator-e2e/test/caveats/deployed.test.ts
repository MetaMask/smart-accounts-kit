import { beforeEach, test, expect } from 'vitest';
import {
  createExecution,
  Implementation,
  toMetaMaskSmartAccount,
  ExecutionMode,
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
  publicClient,
  randomBytes,
  stringToUnprefixedHex,
} from '../utils/helpers';
import {
  encodeFunctionData,
  getCreate2Address,
  Hex,
  hexToBigInt,
  isHex,
} from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import CounterMetadata from '../utils/counter/metadata.json';

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
});

/*
  Main test case:

  Alice creates a DeleGatorSmartAccount for a deployed Hybrid Delegator Account.

  Bob creates a DeleGatorSmartAccount for a counterfactual Hybrid Delegator Account.

  Alice creates a delegation to Bob's delegator account, with a Deployed
  caveat that specifies a Counter contract to be deployed.

  Bob redeems the delegation, which deploys the Counter contract and calls
  setCount() on it.
*/

test('maincase: Bob redeems the delegation, calling setCount() on the Counter that is deployed via the caveat', async () => {
  const salt = randomBytes(32);
  const deployedAddress = getCreate2Address({
    salt,
    from: aliceSmartAccount.environment.caveatEnforcers.DeployedEnforcer!,
    bytecode: CounterMetadata.bytecode.object as Hex,
  });

  const code = await publicClient.getCode({
    address: deployedAddress,
  });

  expect(code).toBeUndefined();

  await runTest_expectSuccess(deployedAddress, salt);
});

test('Bob redeems the delegation, even though the counter is already deployed', async () => {
  const salt = randomBytes(32);
  const deployedAddress = getCreate2Address({
    salt,
    from: aliceSmartAccount.environment.caveatEnforcers.DeployedEnforcer!,
    bytecode: CounterMetadata.bytecode.object as Hex,
  });

  await runTest_expectSuccess(deployedAddress, salt);

  const code = await publicClient.getCode({
    address: deployedAddress,
  });

  expect(isHex(code), 'Counter contract should be deployed').toBeTruthy();

  // we now run the test again, but this time the counter is already deployed
  await runTest_expectSuccess(deployedAddress, salt);
});

test('Bob attempts to redeem the delegation, but provides the wrong address', async () => {
  const salt = randomBytes(32);
  const deployedAddress = randomBytes(20);

  const code = await publicClient.getCode({
    address: deployedAddress,
  });

  expect(code).toBeUndefined();

  await runTest_expectFailure(
    deployedAddress,
    salt,
    'DeployedEnforcer:deployed-address-mismatch',
  );
});

test('Bob attempts to redeem the delegation, but provides the wrong bytecode', async () => {
  const salt = randomBytes(32);
  const bytecode = randomBytes(32);
  const deployedAddress = getCreate2Address({
    salt,
    from: aliceSmartAccount.environment.caveatEnforcers.DeployedEnforcer!,
    bytecode,
  });

  const code = await publicClient.getCode({
    address: deployedAddress,
  });

  expect(code).toBeUndefined();

  await runTest_expectFailure(
    deployedAddress,
    salt,
    'DeployedEnforcer:deployed-address-mismatch',
  );
});

const runTest_expectSuccess = async (deployedAddress: Hex, salt: Hex) => {
  const newCount = hexToBigInt(randomBytes(32));

  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('deployed', {
        contractAddress: deployedAddress,
        salt,
        bytecode: CounterMetadata.bytecode.object as Hex,
      })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const calldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'setCount',
    args: [newCount],
  });

  const execution = createExecution({
    target: deployedAddress,
    callData: calldata,
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

  expectUserOperationToSucceed(receipt);

  const counterCodeAfter = await publicClient.getCode({
    address: deployedAddress,
  });

  expect(
    isHex(counterCodeAfter),
    'Counter contract should be deployed',
  ).toBeTruthy();

  const countAfter = await publicClient.readContract({
    address: deployedAddress,
    abi: CounterMetadata.abi,
    functionName: 'count',
  });

  expect(countAfter).toEqual(newCount);
};

const runTest_expectFailure = async (
  deployedAddress: Hex,
  salt: Hex,
  expectedError: string,
) => {
  const newCount = hexToBigInt(randomBytes(32));

  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('deployed', {
        contractAddress: deployedAddress,
        salt,
        bytecode: CounterMetadata.bytecode.object as Hex,
      })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const calldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'setCount',
    args: [newCount],
  });

  const execution = createExecution({
    target: deployedAddress,
    callData: calldata,
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

  const counterCodeAfter = await publicClient.getCode({
    address: deployedAddress,
  });

  expect(
    counterCodeAfter,
    'Counter contract should still not be deployed',
  ).toBeUndefined();
};
