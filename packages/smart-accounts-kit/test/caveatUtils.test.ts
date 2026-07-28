import { createPublicClient, http } from 'viem';
import type { PublicClient, Hex } from 'viem';
import { readContract } from 'viem/actions';
import { sepolia } from 'viem/chains';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { randomAddress, randomBytes } from './utils';
import { createCaveatEnforcerClient } from '../src/actions/caveatEnforcerClient';
import type { CaveatEnforcerClient } from '../src/actions/caveatEnforcerClient';
import {
  getErc20PeriodTransferEnforcerAvailableAmount,
  getErc20StreamingEnforcerAvailableAmount,
  getMultiTokenPeriodEnforcerAvailableAmount,
  getNativeTokenPeriodTransferEnforcerAvailableAmount,
  getNativeTokenStreamingEnforcerAvailableAmount,
} from '../src/actions/getCaveatAvailableAmount';
import type { CaveatEnforcerParams } from '../src/actions/getCaveatAvailableAmount';
import {
  ERC20PeriodTransferEnforcer,
  MultiTokenPeriodEnforcer,
  NativeTokenPeriodTransferEnforcer,
  ERC20StreamingEnforcer,
  NativeTokenStreamingEnforcer,
  ERC20TransferAmountEnforcer,
  NativeTokenTransferAmountEnforcer,
} from '../src/contracts';
import type { SmartAccountsEnvironment } from '../src/types';

// Mock the readContract function
vi.mock('viem/actions', async () => {
  const actual = await vi.importActual('viem/actions');
  return {
    ...actual,
    readContract: vi.fn(),
  };
});

// Helper function to generate random bytes32
const randomBytes32 = (): Hex => randomBytes(32);

describe('Caveat Contract Methods', () => {
  let publicClient: PublicClient;
  let mockEnvironment: SmartAccountsEnvironment;
  let caveatClient: CaveatEnforcerClient;

  const createParams = (caveat: {
    enforcer: string;
    terms: Hex;
    args?: Hex;
  }): CaveatEnforcerParams => {
    const enforcer = mockEnvironment.caveatEnforcers[caveat.enforcer];
    if (!enforcer) {
      throw new Error(`Enforcer ${caveat.enforcer} not found`);
    }

    const { terms, args = '0x' } = caveat;

    return {
      delegation: {
        delegator: randomAddress(),
        delegate: randomAddress(),
        authority: randomBytes32(),
        caveats: [
          {
            enforcer,
            terms,
            args,
          },
        ],
        salt: '0x00',
        signature: randomBytes32(),
      },
    };
  };

  beforeEach(() => {
    publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    mockEnvironment = {
      SimpleFactory: randomAddress(),
      EntryPoint: randomAddress(),
      DelegationManager: randomAddress(),
      implementations: {
        HybridDeleGatorImpl: randomAddress(),
        MultiSigDeleGatorImpl: randomAddress(),
        Stateless7702DeleGatorImpl: randomAddress(),
      },
      caveatEnforcers: {
        ERC20PeriodTransferEnforcer: randomAddress(),
        ERC20StreamingEnforcer: randomAddress(),
        ERC20TransferAmountEnforcer: randomAddress(),
        MultiTokenPeriodEnforcer: randomAddress(),
        NativeTokenPeriodTransferEnforcer: randomAddress(),
        NativeTokenStreamingEnforcer: randomAddress(),
        NativeTokenTransferAmountEnforcer: randomAddress(),
        // Add other enforcers as needed
      },
    } as SmartAccountsEnvironment;

    caveatClient = createCaveatEnforcerClient({
      client: publicClient,
      environment: mockEnvironment,
    });

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('ERC20PeriodTransferEnforcer', () => {
    it('should call getAvailableAmount with correct parameters', async () => {
      const mockResult = {
        availableAmount: 100n,
        isNewPeriod: true,
        currentPeriod: 1n,
      };

      const getAvailableAmountSpy = vi
        .spyOn(ERC20PeriodTransferEnforcer.read, 'getAvailableAmount')
        .mockResolvedValue(mockResult);

      const contractAddress = randomAddress();
      const delegationHash = randomBytes32();
      const delegationManager = randomAddress();
      const terms = '0x1234' as Hex;

      const result = await ERC20PeriodTransferEnforcer.read.getAvailableAmount({
        client: publicClient,
        contractAddress,
        delegationHash,
        delegationManager,
        terms,
      });

      expect(getAvailableAmountSpy).toHaveBeenCalledWith({
        client: publicClient,
        contractAddress,
        delegationHash,
        delegationManager,
        terms,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('MultiTokenPeriodEnforcer', () => {
    it('should call getAvailableAmount with correct parameters including args', async () => {
      const mockResult = {
        availableAmount: 200n,
        isNewPeriod: false,
        currentPeriod: 2n,
      };

      const getAvailableAmountSpy = vi
        .spyOn(MultiTokenPeriodEnforcer.read, 'getAvailableAmount')
        .mockResolvedValue(mockResult);

      const contractAddress = randomAddress();
      const delegationHash = randomBytes32();
      const delegationManager = randomAddress();
      const terms = '0x1234' as Hex;
      const args = '0x5678' as Hex;

      const result = await MultiTokenPeriodEnforcer.read.getAvailableAmount({
        client: publicClient,
        contractAddress,
        delegationHash,
        delegationManager,
        terms,
        args,
      });

      expect(getAvailableAmountSpy).toHaveBeenCalledWith({
        client: publicClient,
        contractAddress,
        delegationHash,
        delegationManager,
        terms,
        args,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('NativeTokenPeriodTransferEnforcer', () => {
    it('should call getAvailableAmount with correct parameters', async () => {
      const mockResult = {
        availableAmount: 300n,
        isNewPeriod: true,
        currentPeriod: 3n,
      };

      const getAvailableAmountSpy = vi
        .spyOn(NativeTokenPeriodTransferEnforcer.read, 'getAvailableAmount')
        .mockResolvedValue(mockResult);

      const contractAddress = randomAddress();
      const delegationHash = randomBytes32();
      const delegationManager = randomAddress();
      const terms = '0x9abc' as Hex;

      const result =
        await NativeTokenPeriodTransferEnforcer.read.getAvailableAmount({
          client: publicClient,
          contractAddress,
          delegationHash,
          delegationManager,
          terms,
        });

      expect(getAvailableAmountSpy).toHaveBeenCalledWith({
        client: publicClient,
        contractAddress,
        delegationHash,
        delegationManager,
        terms,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('ERC20StreamingEnforcer', () => {
    it('should call getAvailableAmount with correct parameters', async () => {
      const mockResult = {
        availableAmount: 500n,
      };

      const getAvailableAmountSpy = vi
        .spyOn(ERC20StreamingEnforcer.read, 'getAvailableAmount')
        .mockResolvedValue(mockResult);

      const contractAddress = randomAddress();
      const delegationManager = randomAddress();
      const delegationHash = randomBytes32();
      const terms = '0x1234' as Hex;

      const result = await ERC20StreamingEnforcer.read.getAvailableAmount({
        client: publicClient,
        contractAddress,
        delegationManager,
        delegationHash,
        terms,
      });

      expect(getAvailableAmountSpy).toHaveBeenCalledWith({
        client: publicClient,
        contractAddress,
        delegationManager,
        delegationHash,
        terms,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('NativeTokenStreamingEnforcer', () => {
    it('should call getAvailableAmount with correct parameters', async () => {
      const mockResult = {
        availableAmount: 300n,
      };

      const getAvailableAmountSpy = vi
        .spyOn(NativeTokenStreamingEnforcer.read, 'getAvailableAmount')
        .mockResolvedValue(mockResult);

      const contractAddress = randomAddress();
      const delegationManager = randomAddress();
      const delegationHash = randomBytes32();
      const terms = '0x1234' as Hex;

      const result = await NativeTokenStreamingEnforcer.read.getAvailableAmount(
        {
          client: publicClient,
          contractAddress,
          delegationManager,
          delegationHash,
          terms,
        },
      );

      expect(getAvailableAmountSpy).toHaveBeenCalledWith({
        client: publicClient,
        contractAddress,
        delegationManager,
        delegationHash,
        terms,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('Individual Functions vs Client Extension', () => {
    it('should return identical results for ERC20PeriodTransferEnforcer', async () => {
      const mockResult = {
        availableAmount: 100n,
        isNewPeriod: true,
        currentPeriod: 1n,
      };

      const getAvailableAmountSpy = vi
        .spyOn(ERC20PeriodTransferEnforcer.read, 'getAvailableAmount')
        .mockResolvedValue(mockResult);

      const terms = '0x1234';

      const params = createParams({
        enforcer: 'ERC20PeriodTransferEnforcer',
        terms,
      });

      // Test both approaches
      const [clientResult, functionResult] = await Promise.all([
        caveatClient.getErc20PeriodTransferEnforcerAvailableAmount(params),
        getErc20PeriodTransferEnforcerAvailableAmount(
          publicClient,
          mockEnvironment,
          params,
        ),
      ]);

      expect(clientResult).toEqual(functionResult);
      expect(clientResult).toEqual(mockResult);
      expect(getAvailableAmountSpy).toHaveBeenCalledTimes(2);
    });

    it('should return identical results for ERC20StreamingEnforcer', async () => {
      const mockResult = {
        availableAmount: 500n,
      };

      const getAvailableAmountSpy = vi
        .spyOn(ERC20StreamingEnforcer.read, 'getAvailableAmount')
        .mockResolvedValue(mockResult);

      const params = createParams({
        enforcer: 'ERC20StreamingEnforcer',
        terms: '0x1234' as Hex,
        args: '0x5678' as Hex,
      });

      // Test both approaches
      const [clientResult, functionResult] = await Promise.all([
        caveatClient.getErc20StreamingEnforcerAvailableAmount(params),
        getErc20StreamingEnforcerAvailableAmount(
          publicClient,
          mockEnvironment,
          params,
        ),
      ]);

      expect(clientResult).toEqual(functionResult);
      expect(clientResult).toEqual(mockResult);
      expect(getAvailableAmountSpy).toHaveBeenCalledTimes(2);
    });

    it('should return identical results for MultiTokenPeriodEnforcer', async () => {
      const mockResult = {
        availableAmount: 200n,
        isNewPeriod: false,
        currentPeriod: 2n,
      };

      const getAvailableAmountSpy = vi
        .spyOn(MultiTokenPeriodEnforcer.read, 'getAvailableAmount')
        .mockResolvedValue(mockResult);

      const params = createParams({
        enforcer: 'MultiTokenPeriodEnforcer',
        terms: '0x1234' as Hex,
        args: '0x5678' as Hex,
      });

      // Test both approaches
      const [clientResult, functionResult] = await Promise.all([
        caveatClient.getMultiTokenPeriodEnforcerAvailableAmount(params),
        getMultiTokenPeriodEnforcerAvailableAmount(
          publicClient,
          mockEnvironment,
          params,
        ),
      ]);

      expect(clientResult).toEqual(functionResult);
      expect(clientResult).toEqual(mockResult);
      expect(getAvailableAmountSpy).toHaveBeenCalledTimes(2);
    });

    it('should return identical results for NativeTokenPeriodTransferEnforcer', async () => {
      const mockResult = {
        availableAmount: 300n,
        isNewPeriod: true,
        currentPeriod: 3n,
      };

      const getAvailableAmountSpy = vi
        .spyOn(NativeTokenPeriodTransferEnforcer.read, 'getAvailableAmount')
        .mockResolvedValue(mockResult);

      const params = createParams({
        enforcer: 'NativeTokenPeriodTransferEnforcer',
        terms: '0x9abc',
      });

      // Test both approaches
      const [clientResult, functionResult] = await Promise.all([
        caveatClient.getNativeTokenPeriodTransferEnforcerAvailableAmount(
          params,
        ),
        getNativeTokenPeriodTransferEnforcerAvailableAmount(
          publicClient,
          mockEnvironment,
          params,
        ),
      ]);

      expect(clientResult).toEqual(functionResult);
      expect(clientResult).toEqual(mockResult);
      expect(getAvailableAmountSpy).toHaveBeenCalledTimes(2);
    });

    it('should return identical results for NativeTokenStreamingEnforcer', async () => {
      const mockResult = {
        availableAmount: 600n,
      };

      const getAvailableAmountSpy = vi
        .spyOn(NativeTokenStreamingEnforcer.read, 'getAvailableAmount')
        .mockResolvedValue(mockResult);

      const params = createParams({
        enforcer: 'NativeTokenStreamingEnforcer',
        terms: '0x1234',
      });

      // Test both approaches
      const [clientResult, functionResult] = await Promise.all([
        caveatClient.getNativeTokenStreamingEnforcerAvailableAmount(params),
        getNativeTokenStreamingEnforcerAvailableAmount(
          publicClient,
          mockEnvironment,
          params,
        ),
      ]);

      expect(clientResult).toEqual(functionResult);
      expect(clientResult).toEqual(mockResult);
      expect(getAvailableAmountSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle errors identically', async () => {
      const mockError = new Error('Contract call failed');

      vi.spyOn(
        ERC20PeriodTransferEnforcer.read,
        'getAvailableAmount',
      ).mockRejectedValue(mockError);

      const params = createParams({
        enforcer: 'ERC20PeriodTransferEnforcer',
        terms: '0x1234',
      });

      // Both approaches should throw the same error
      await expect(
        caveatClient.getErc20PeriodTransferEnforcerAvailableAmount(params),
      ).rejects.toThrow('Contract call failed');

      await expect(
        getErc20PeriodTransferEnforcerAvailableAmount(
          publicClient,
          mockEnvironment,
          params,
        ),
      ).rejects.toThrow('Contract call failed');
    });
  });

  describe('ERC20TransferAmountEnforcer', () => {
    it('should call getTermsInfo method correctly', async () => {
      const mockAllowedContract = randomAddress();
      const mockMaxTokens = 1000000n;

      vi.mocked(readContract).mockResolvedValue([
        mockAllowedContract,
        mockMaxTokens,
      ]);

      const params = createParams({
        enforcer: 'ERC20TransferAmountEnforcer',
        terms:
          '0x1234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000001',
      });

      // Test direct function call
      const contractAddress =
        mockEnvironment.caveatEnforcers.ERC20TransferAmountEnforcer;
      const firstCaveat = params.delegation.caveats[0];

      if (!contractAddress) {
        throw new Error('ERC20TransferAmountEnforcer not found');
      }
      if (!firstCaveat) {
        throw new Error('No caveats found');
      }

      const result = await ERC20TransferAmountEnforcer.read.getTermsInfo({
        client: publicClient,
        contractAddress,
        terms: firstCaveat.terms,
      });

      expect(readContract).toHaveBeenCalledWith(publicClient, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getTermsInfo',
        args: [firstCaveat.terms],
      });

      expect(result).toEqual({
        allowedContract: mockAllowedContract,
        maxTokens: mockMaxTokens,
      });
    });

    it('should call getSpentAmount method correctly', async () => {
      const mockSpentAmount = 250000n;

      vi.mocked(readContract).mockResolvedValue(mockSpentAmount);

      const delegationHash = randomBytes32();
      const delegationManager = randomAddress();
      const contractAddress =
        mockEnvironment.caveatEnforcers.ERC20TransferAmountEnforcer;

      if (!contractAddress) {
        throw new Error('ERC20TransferAmountEnforcer not found');
      }

      // Test direct function call
      const result = await ERC20TransferAmountEnforcer.read.getSpentAmount({
        client: publicClient,
        contractAddress,
        delegationManager,
        delegationHash,
      });

      expect(readContract).toHaveBeenCalledWith(publicClient, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'spentMap',
        args: [delegationManager, delegationHash],
      });

      expect(result).toBe(mockSpentAmount);
    });
  });

  describe('NativeTokenTransferAmountEnforcer', () => {
    it('should call getTermsInfo method correctly', async () => {
      const mockAllowance = 1000000000000000000n; // 1 ETH in wei

      vi.mocked(readContract).mockResolvedValue(mockAllowance);

      const params = createParams({
        enforcer: 'NativeTokenTransferAmountEnforcer',
        terms:
          '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      });

      // Test direct function call
      const contractAddress =
        mockEnvironment.caveatEnforcers.NativeTokenTransferAmountEnforcer;
      const firstCaveat = params.delegation.caveats[0];

      if (!contractAddress) {
        throw new Error('NativeTokenTransferAmountEnforcer not found');
      }
      if (!firstCaveat) {
        throw new Error('No caveats found in delegation');
      }

      const result = await NativeTokenTransferAmountEnforcer.read.getTermsInfo({
        client: publicClient,
        contractAddress,
        terms: firstCaveat.terms,
      });

      expect(readContract).toHaveBeenCalledWith(publicClient, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getTermsInfo',
        args: [firstCaveat.terms],
      });

      expect(result).toBe(mockAllowance);
    });

    it('should call getSpentAmount method correctly', async () => {
      const mockSpentAmount = 500000000000000000n; // 0.5 ETH in wei

      vi.mocked(readContract).mockResolvedValue(mockSpentAmount);

      const delegationHash = randomBytes32();
      const delegationManager = randomAddress();
      const contractAddress =
        mockEnvironment.caveatEnforcers.NativeTokenTransferAmountEnforcer;

      if (!contractAddress) {
        throw new Error('NativeTokenTransferAmountEnforcer not found');
      }

      // Test direct function call
      const result =
        await NativeTokenTransferAmountEnforcer.read.getSpentAmount({
          client: publicClient,
          contractAddress,
          delegationManager,
          delegationHash,
        });

      expect(readContract).toHaveBeenCalledWith(publicClient, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'spentMap',
        args: [delegationManager, delegationHash],
      });

      expect(result).toBe(mockSpentAmount);
    });
  });
});
