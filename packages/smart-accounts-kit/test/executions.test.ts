import { isHex } from 'viem';
import type { Hex } from 'viem';
import { describe, it, expect } from 'vitest';

import { createExecution, encodeExecutionCalldatas } from '../src/executions';
import type { ExecutionStruct } from '../src/executions';

describe('executions', () => {
  describe('createExecution()', () => {
    it('should create an execution with default values', () => {
      const execution = createExecution({
        target: '0x0000000000000000000000000000000000000000',
      });
      expect(execution.target).to.equal(
        '0x0000000000000000000000000000000000000000',
      );
      expect(execution.value).to.equal(0n);
      expect(execution.callData).to.equal('0x');
    });

    it('should create an execution with provided values', () => {
      const execution = createExecution({
        target: '0x000000000000000000000000016345785d89Ffff',
        value: 11111n,
        callData: '0x7465737431',
      });
      expect(execution.target).to.equal(
        '0x000000000000000000000000016345785d89Ffff',
      );
      expect(execution.value).to.equal(11111n);
      expect(execution.callData).to.equal('0x7465737431');
    });
  });

  describe('encodeExecutionCalldatas()', () => {
    it('should encode executions', () => {
      const expectedExecutionCalldatas = [
        '0x000000000000000000000000016345785d89ffff0000000000000000000000000000000000000000000000000000000000002b677465737431',
        '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000016345785d89ffff0000000000000000000000000000000000000000000000000000000000002b670000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000574657374310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000027797f26d671c700000000000000000000000000000000000000000000000000000000000056ce000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000057465737432000000000000000000000000000000000000000000000000000000',
      ];

      const execution1 = {
        target: '0x000000000000000000000000016345785d89Ffff' as Hex,
        value: 11111n,
        callData: '0x7465737431' as Hex,
      };
      const execution2 = {
        target: '0x0000000000000000000000000027797F26D671c7' as Hex,
        value: 22222n,
        callData: '0x7465737432' as Hex,
      };

      const executionsBatch = [[execution1], [execution1, execution2]];
      const executionCalldatas = encodeExecutionCalldatas(executionsBatch);
      expect(executionCalldatas.length).to.equal(2);
      expect(isHex(executionCalldatas[0])).to.equal(true);
      expect(isHex(executionCalldatas[1])).to.equal(true);
      expect(expectedExecutionCalldatas).to.deep.equal(executionCalldatas);
    });

    it('should fail when executions batch is empty', () => {
      const executionsBatch: ExecutionStruct[][] = [];
      expect(() => encodeExecutionCalldatas(executionsBatch)).to.throw(
        'Error while getting the execution calldatas, executionsBatch is empty',
      );
    });

    it('should fail when executions is empty', () => {
      const executionsBatch: ExecutionStruct[][] = [[]];
      expect(() => encodeExecutionCalldatas(executionsBatch)).to.throw(
        'Error while getting the execution calldatas, executions is empty',
      );
    });
  });
});
