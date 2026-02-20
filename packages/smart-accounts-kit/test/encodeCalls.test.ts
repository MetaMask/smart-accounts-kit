import { DeleGatorCore, DelegationManager } from '@metamask/delegation-abis';
import type { Address, Hex } from 'viem';
import { encodeFunctionData } from 'viem';
import { describe, it, expect } from 'vitest';

import type { DelegatedCall } from '../src/actions/erc7710RedeemDelegationAction';
import { encodeDelegations } from '../src/delegation';
import { encodeCallsForCaller } from '../src/encodeCalls';
import { ExecutionMode, encodeExecutionCalldatas } from '../src/executions';
import type { ExecutionStruct } from '../src/executions';
import { type Call, type Delegation } from '../src/types';

describe('encodeCallsForCaller', () => {
  const caller: Address = '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC';
  const delegation: Delegation = {
    delegate: '0x1111111111111111111111111111111111111111',
    delegator: '0x2222222222222222222222222222222222222222',
    authority: `0x1111111111111111111111111111111111111111111111111111111111111111`,
    caveats: [],
    salt: `0x${'22'.repeat(32)}`,
    signature: '0x',
  };

  it('should return the call data directly for a single call to the delegator', async () => {
    const calls: Call[] = [
      {
        to: caller,
        data: '0x1234',
      },
    ];

    const result = await encodeCallsForCaller(caller, calls);
    expect(result).to.equal('0x1234');
  });

  it('should return "0x" for a single call to the delegator with no data', async () => {
    const calls: Call[] = [
      {
        to: caller,
      },
    ];

    const result = await encodeCallsForCaller(caller, calls);
    expect(result).to.equal('0x');
  });

  it('should correctly encode multiple calls when one of the calls is to the caller', async () => {
    const calls: Call[] = [
      {
        to: caller,
        data: '0x1234',
      },
      {
        to: '0x2222222222222222222222222222222222222222',
        data: '0x5678',
        value: 200n,
      },
    ];

    const encodedCalls = await encodeCallsForCaller(caller, calls);

    const expectedExecutions: ExecutionStruct[] = [
      {
        target: caller,
        value: 0n,
        callData: '0x1234',
      },
      {
        target: '0x2222222222222222222222222222222222222222',
        value: 200n,
        callData: '0x5678',
      },
    ];

    const [expectedExecutionCalldata] = encodeExecutionCalldatas([
      expectedExecutions,
    ]);
    if (!expectedExecutionCalldata) {
      throw new Error('executionCalldata is not set');
    }
    const expectedEncodedCalls = encodeFunctionData({
      abi: DeleGatorCore,
      functionName: 'execute',
      args: [ExecutionMode.BatchDefault, expectedExecutionCalldata],
    });

    expect(encodedCalls).to.equal(expectedEncodedCalls);
  });

  it('should correctly encode multiple calls when all calls are to the caller', async () => {
    const calls: Call[] = [
      {
        to: caller,
        data: '0x1234',
        value: 100n,
      },
      {
        to: caller,
        data: '0x5678',
        value: 200n,
      },
    ];

    const encodedCalls = await encodeCallsForCaller(caller, calls);

    const expectedExecutions: ExecutionStruct[] = [
      {
        target: caller,
        value: 100n,
        callData: '0x1234',
      },
      {
        target: caller,
        value: 200n,
        callData: '0x5678',
      },
    ];

    const [expectedExecutionCalldata] = encodeExecutionCalldatas([
      expectedExecutions,
    ]);
    if (!expectedExecutionCalldata) {
      throw new Error('executionCalldata is not set');
    }
    const expectedEncodedCalls = encodeFunctionData({
      abi: DeleGatorCore,
      functionName: 'execute',
      args: [ExecutionMode.BatchDefault, expectedExecutionCalldata],
    });

    expect(encodedCalls).to.equal(expectedEncodedCalls);
  });

  it('should create executions and encode them for multiple calls', async () => {
    const calls: Call[] = [
      {
        to: '0x1111111111111111111111111111111111111111',
        data: '0xabcdef',
        value: 100n,
      },
      {
        to: '0x2222222222222222222222222222222222222222',
        data: '0x123456',
        value: 200n,
      },
    ];

    const encodedCalls = await encodeCallsForCaller(caller, calls);

    const expectedExecutions: ExecutionStruct[] = [
      {
        target: '0x1111111111111111111111111111111111111111',
        value: 100n,
        callData: '0xabcdef',
      },
      {
        target: '0x2222222222222222222222222222222222222222',
        value: 200n,
        callData: '0x123456',
      },
    ];

    const [expectedExecutionCalldata] = encodeExecutionCalldatas([
      expectedExecutions,
    ]);
    if (!expectedExecutionCalldata) {
      throw new Error('executionCalldata is not set');
    }
    const expectedEncodedCalls = encodeFunctionData({
      abi: DeleGatorCore,
      functionName: 'execute',
      args: [ExecutionMode.BatchDefault, expectedExecutionCalldata],
    });

    expect(encodedCalls).to.equal(expectedEncodedCalls);
  });

  it('should call the simple execute() function for a single call', async () => {
    const calls: Call[] = [
      {
        to: '0x1111111111111111111111111111111111111111',
        data: '0xabcdef',
        value: 100n,
      },
    ];

    const encodedCalls = await encodeCallsForCaller(caller, calls);

    const expectedCalldata = encodeFunctionData({
      abi: DeleGatorCore,
      functionName: 'execute',
      args: [
        {
          target: '0x1111111111111111111111111111111111111111',
          callData: '0xabcdef',
          value: 100n,
        },
      ],
    });

    expect(encodedCalls).to.equal(expectedCalldata);
  });

  it('should encode delegated calls with an encoded permissionContext', async () => {
    const permissionContext = `0x3333333333333333333333333333333333333333`;
    const encodedPermissionContext = encodeDelegations(permissionContext);
    const delegationManager: Address =
      '0x3333333333333333333333333333333333333333';
    const target: Address = '0x4444444444444444444444444444444444444444';

    const calls: DelegatedCall[] = [
      {
        to: target,
        data: '0xabcdef',
        value: 100n,
        permissionContext,
        delegationManager,
      },
    ];

    const encodedCalls = await encodeCallsForCaller(caller, calls);
    const redemptionCalldata = encodeFunctionData({
      abi: DelegationManager,
      functionName: 'redeemDelegations',
      args: [
        [encodedPermissionContext],
        [ExecutionMode.SingleDefault],
        encodeExecutionCalldatas([
          [
            {
              target,
              value: 100n,
              callData: '0xabcdef',
            },
          ],
        ]),
      ],
    });

    const expectedExecutionCalldatas = encodeExecutionCalldatas([
      [
        {
          target: delegationManager,
          value: 0n,
          callData: redemptionCalldata,
        },
      ],
    ]) as [Hex];

    const expectedEncodedCalls = encodeFunctionData({
      abi: DeleGatorCore,
      functionName: 'execute',
      args: [ExecutionMode.SingleDefault, expectedExecutionCalldatas[0]],
    });

    expect(encodedCalls).to.equal(expectedEncodedCalls);
  });

  it('should encode delegated calls with delegation arrays', async () => {
    const delegationManager: Address =
      '0x3333333333333333333333333333333333333333';
    const target: Address = '0x4444444444444444444444444444444444444444';
    const permissionContext = encodeDelegations([delegation]);

    const calls: DelegatedCall[] = [
      {
        to: target,
        data: '0xabcdef',
        value: 100n,
        permissionContext: [delegation],
        delegationManager,
      },
    ];

    const encodedCalls = await encodeCallsForCaller(caller, calls);
    const redemptionCalldata = encodeFunctionData({
      abi: DelegationManager,
      functionName: 'redeemDelegations',
      args: [
        [permissionContext],
        [ExecutionMode.SingleDefault],
        encodeExecutionCalldatas([
          [
            {
              target,
              value: 100n,
              callData: '0xabcdef',
            },
          ],
        ]),
      ],
    });

    const expectedExecutionCalldatas = encodeExecutionCalldatas([
      [
        {
          target: delegationManager,
          value: 0n,
          callData: redemptionCalldata,
        },
      ],
    ]) as [Hex];

    const expectedEncodedCalls = encodeFunctionData({
      abi: DeleGatorCore,
      functionName: 'execute',
      args: [ExecutionMode.SingleDefault, expectedExecutionCalldatas[0]],
    });

    expect(encodedCalls).to.equal(expectedEncodedCalls);
  });

  it('should encode mixed calls with a delegation array in batch execution', async () => {
    const delegationManager: Address =
      '0x3333333333333333333333333333333333333333';
    const target: Address = '0x4444444444444444444444444444444444444444';
    const otherTarget: Address = '0x5555555555555555555555555555555555555555';
    const permissionContext = encodeDelegations([delegation]);

    const calls: DelegatedCall[] = [
      {
        to: target,
        data: '0xabcdef',
        value: 100n,
        permissionContext: [delegation],
        delegationManager,
      },
      {
        to: otherTarget,
        data: '0x1234',
        value: 0n,
      },
    ];

    const encodedCalls = await encodeCallsForCaller(caller, calls);
    const redemptionCalldata = encodeFunctionData({
      abi: DelegationManager,
      functionName: 'redeemDelegations',
      args: [
        [permissionContext],
        [ExecutionMode.SingleDefault],
        encodeExecutionCalldatas([
          [
            {
              target,
              value: 100n,
              callData: '0xabcdef',
            },
          ],
        ]),
      ],
    });

    const expectedExecutions: ExecutionStruct[] = [
      {
        target: delegationManager,
        value: 0n,
        callData: redemptionCalldata,
      },
      {
        target: otherTarget,
        value: 0n,
        callData: '0x1234',
      },
    ];

    const expectedExecutionCalldata = encodeExecutionCalldatas([
      expectedExecutions,
    ])[0];
    if (!expectedExecutionCalldata) {
      throw new Error('expectedExecutionCalldata is not set');
    }

    const expectedEncodedCalls = encodeFunctionData({
      abi: DeleGatorCore,
      functionName: 'execute',
      args: [ExecutionMode.BatchDefault, expectedExecutionCalldata],
    });

    expect(encodedCalls).to.equal(expectedEncodedCalls);
  });
});
