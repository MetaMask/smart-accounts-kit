import { DeleGatorCore } from '@metamask/delegation-abis';
import type { Address } from 'viem';
import { encodeFunctionData } from 'viem';
import { describe, it, expect } from 'vitest';

import { encodeCallsForCaller } from '../src/encodeCalls';
import { ExecutionMode, encodeExecutionCalldatas } from '../src/executions';
import type { ExecutionStruct } from '../src/executions';
import { type Call } from '../src/types';

describe('encodeCallsForCaller', () => {
  const caller: Address = '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC';

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
});
