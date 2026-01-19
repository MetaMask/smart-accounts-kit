import {
  type MetaMaskSmartAccount,
  Implementation,
} from '@metamask/smart-accounts-kit';

import {
  bytesToHex,
  Client,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  getContract,
  GetContractReturnType,
  http,
  parseEther,
  stringToHex,
  type Abi,
  type Address,
  type Hex,
} from 'viem';
import {
  generatePrivateKey,
  privateKeyToAccount,
  privateKeyToAddress,
} from 'viem/accounts';

import CounterMetadata from '../utils/counter/metadata.json';
import * as ERC20Token from '../../contracts/out/ERC20Token.sol/ERC20Token.json';
import * as ERC721Token from '../../contracts/out/ERC721Token.sol/ERC721Token.json';
import * as PayableReceiver from '../../contracts/out/PayableReceiver.sol/PayableReceiver.json';
import {
  chain,
  nodeUrl,
  deployPk,
  bundlerUrl,
  paymasterUrl,
} from '../../src/config';
import {
  createPaymasterClient,
  createBundlerClient as createAABundlerClient,
  BundlerClient,
} from 'viem/account-abstraction';

const {
  abi: erc20TokenAbi,
  bytecode: { object: erc20TokenBytecode },
} = ERC20Token;

const {
  abi: erc721TokenAbi,
  bytecode: { object: erc721TokenBytecode },
} = ERC721Token;

const {
  abi: payableReceiverAbi,
  bytecode: { object: payableReceiverBytecode },
} = PayableReceiver;

export const transport = http(nodeUrl);
const deployerAccount = privateKeyToAccount(deployPk);

export const gasPrice = {
  // gas price is 1n because test network.
  maxFeePerGas: 1n,
  maxPriorityFeePerGas: 1n,
};

export const publicClient = createPublicClient({ transport, chain });
export const deployerClient = createWalletClient({
  transport,
  chain,
  account: deployerAccount,
});
const paymasterClient = createPaymasterClient({
  transport: http(paymasterUrl),
});

const sendUserOperationImmediately = (client: Client) => ({
  sendUserOperation: async (
    ...args: Parameters<BundlerClient['sendUserOperation']>
  ) => {
    const result = await (client as BundlerClient).sendUserOperation(...args);
    // we request the bundler to send the bundle now, causing the useroperation to be executed immediately
    await (client as any).request({
      method: 'debug_bundler_sendBundleNow',
    });
    return result;
  },
});

export const sponsoredBundlerClient = createAABundlerClient({
  transport: http(bundlerUrl),
  paymaster: paymasterClient,
  chain,
  pollingInterval: 100,
}).extend(sendUserOperationImmediately);

export const unsponsoredBundlerClient = createAABundlerClient({
  transport: http(bundlerUrl),
  chain,
  pollingInterval: 100,
}).extend(sendUserOperationImmediately);

export const randomSalt = () => randomBytes(32);

export const randomBytes = (byteLength: number): Hex => {
  const randomBytes = new Uint8Array(byteLength).map(() =>
    Math.floor(Math.random() * 256),
  );
  return bytesToHex(randomBytes);
};

export const fundAddress = async (
  to: Address,
  value: bigint = parseEther('1'),
) => {
  const txHash = await deployerClient.sendTransaction({
    to,
    value,
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
};

export const deploySmartAccount = async (
  account: MetaMaskSmartAccount<Implementation>,
) => {
  const { factory, factoryData } = await account.getFactoryArgs();

  const transactionHash = await deployerClient.sendTransaction({
    to: factory,
    data: factoryData,
  });

  await publicClient.waitForTransactionReceipt({ hash: transactionHash });
};

export type CounterContract = GetContractReturnType<
  typeof CounterMetadata.abi,
  Client,
  Address
>;

export const deployCounter = async (owner: Hex) => {
  // Deploy the counter contract using Viem's deployContract
  const hash = await deployerClient.deployContract({
    abi: CounterMetadata.abi,
    bytecode: CounterMetadata.bytecode.object as Hex,
  });

  // Wait for the transaction receipt to get the deployed contract address
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (!receipt.contractAddress) {
    throw new Error(
      'Failed to deploy counter contract - no contract address in receipt',
    );
  }

  const aliceCounter = getContract({
    abi: CounterMetadata.abi,
    address: receipt.contractAddress,
    client: deployerClient,
  });

  await aliceCounter.write.transferOwnership([owner]);

  return aliceCounter;
};

export const deployErc20Token = async () => {
  // Deploy the ERC20 token contract using Viem's deployContract with constructor args
  const hash = await deployerClient.deployContract({
    abi: erc20TokenAbi as Abi,
    bytecode: erc20TokenBytecode as Hex,
    args: [parseEther('1000000000')],
  });

  // Wait for the transaction receipt to get the deployed contract address
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (!receipt.contractAddress) {
    throw new Error(
      'Failed to deploy ERC20 token contract - no contract address in receipt',
    );
  }

  return receipt.contractAddress;
};

export const fundAddressWithErc20Token = async (
  to: Address,
  erc20TokenAddress: Hex,
  value: bigint = parseEther('100'),
) => {
  const data = encodeFunctionData({
    abi: [
      {
        name: 'mint',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
      },
    ],
    functionName: 'mint',
    args: [to, value],
  });

  const txHash = await deployerClient.sendTransaction({
    to: erc20TokenAddress,
    data,
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
};

export const getErc20Balance = async (address: Hex, erc20TokenAddress: Hex) => {
  return publicClient.readContract({
    address: erc20TokenAddress,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: [address],
  });
};

export const randomAddress = (lowerCase: boolean = false) => {
  const address = privateKeyToAddress(generatePrivateKey());
  if (!lowerCase) {
    return address;
  }

  return address.toLowerCase() as Hex;
};

export const stringToUnprefixedHex = (value: string) => {
  return stringToHex(value).slice(2);
};

export const deployErc721Token = async (name = 'TestNFT', symbol = 'TNFT') => {
  // Deploy the ERC721 token contract using Viem's deployContract with constructor args
  const hash = await deployerClient.deployContract({
    abi: erc721TokenAbi as Abi,
    bytecode: erc721TokenBytecode as Hex,
    args: [name, symbol],
  });

  // Wait for the transaction receipt to get the deployed contract address
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (!receipt.contractAddress) {
    throw new Error(
      'Failed to deploy ERC721 token contract - no contract address in receipt',
    );
  }

  return receipt.contractAddress;
};

export const mintErc721Token = async (
  to: Address,
  erc721TokenAddress: Hex,
  tokenId?: bigint,
) => {
  let data: Hex;

  if (tokenId !== undefined) {
    // Use mintTokenId if specific tokenId is provided
    data = encodeFunctionData({
      abi: [
        {
          name: 'mintTokenId',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      functionName: 'mintTokenId',
      args: [to, tokenId],
    });
  } else {
    // Use regular mint which auto-assigns tokenId
    data = encodeFunctionData({
      abi: [
        {
          name: 'mint',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [{ name: 'to', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'mint',
      args: [to],
    });
  }

  const txHash = await deployerClient.sendTransaction({
    to: erc721TokenAddress,
    data,
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  // If using regular mint, extract tokenId from logs
  if (tokenId === undefined && receipt.logs.length > 0) {
    // Parse Transfer event to get tokenId
    const transferLog = receipt.logs.find((log) => log.topics.length === 4);
    if (transferLog && transferLog.topics[3]) {
      return BigInt(transferLog.topics[3]);
    }
  }

  return tokenId;
};

export const getErc721Balance = async (
  address: Hex,
  erc721TokenAddress: Hex,
) => {
  return publicClient.readContract({
    address: erc721TokenAddress,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: [address],
  });
};

export const getErc721Owner = async (
  tokenId: bigint,
  erc721TokenAddress: Hex,
) => {
  return publicClient.readContract({
    address: erc721TokenAddress,
    abi: [
      {
        name: 'ownerOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
      },
    ],
    functionName: 'ownerOf',
    args: [tokenId],
  });
};

export const getContractOwner = async (contractAddress: Hex) => {
  return publicClient.readContract({
    address: contractAddress,
    abi: [
      {
        name: 'owner',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
      },
    ],
    functionName: 'owner',
    args: [],
  });
};

export const transferContractOwnership = (newOwner: Hex) => {
  return encodeFunctionData({
    abi: [
      {
        name: 'transferOwnership',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'newOwner', type: 'address' }],
        outputs: [],
      },
    ],
    functionName: 'transferOwnership',
    args: [newOwner],
  });
};

export const deployPayableReceiver = async () => {
  // Deploy the PayableReceiver contract
  const hash = await deployerClient.deployContract({
    abi: payableReceiverAbi as Abi,
    bytecode: payableReceiverBytecode as Hex,
  });

  // Wait for the transaction receipt to get the deployed contract address
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (!receipt.contractAddress) {
    throw new Error(
      'Failed to deploy PayableReceiver contract - no contract address in receipt',
    );
  }

  return receipt.contractAddress;
};

export const getPayableReceiverBalance = async (
  contractAddress: Hex,
): Promise<bigint> => {
  return publicClient.readContract({
    address: contractAddress,
    abi: payableReceiverAbi as Abi,
    functionName: 'getBalance',
    args: [],
  }) as Promise<bigint>;
};

export const getPayableReceiverTotalReceived = async (
  contractAddress: Hex,
): Promise<bigint> => {
  return publicClient.readContract({
    address: contractAddress,
    abi: payableReceiverAbi as Abi,
    functionName: 'totalReceived',
    args: [],
  }) as Promise<bigint>;
};

export const getPayableReceiverCallCount = async (
  contractAddress: Hex,
): Promise<bigint> => {
  return publicClient.readContract({
    address: contractAddress,
    abi: payableReceiverAbi as Abi,
    functionName: 'callCount',
    args: [],
  }) as Promise<bigint>;
};

export const encodeReceiveEthCalldata = () => {
  return encodeFunctionData({
    abi: payableReceiverAbi as Abi,
    functionName: 'receiveEth',
    args: [],
  });
};

export const encodeReceiveEthAlternativeCalldata = () => {
  return encodeFunctionData({
    abi: payableReceiverAbi as Abi,
    functionName: 'receiveEthAlternative',
    args: [],
  });
};
