import { compareVersions } from 'compare-versions';
import { createPublicClient, http } from 'viem';
import * as allChains from 'viem/chains';
import { mainnet, bsc, bscTestnet } from 'viem/chains';
import type { Chain } from 'viem/chains';

import { DELEGATOR_CONTRACTS } from '../src';
/*
  This test validates that the DeleGator contracts are deployed on the specified chains, 
  as specified in the @metamask-private/delegation-deployments package.

  It does this by getting the SmartAccountsEnvironment for each chain and then ensuring that 
  code is found at the expected address for each contract.
*/

const megaEthMainnetChain: Chain = {
  id: 4326,
  name: 'MegaEth Mainnet',
  rpcUrls: {
    default: {
      // tbd: megaeth is not yet live
      http: ['https://mainnet.megaeth.com/rpc'],
    },
  },
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

const megaEthTestNetChain: Chain = {
  id: 6343,
  name: 'MegaEth Testnet',
  rpcUrls: {
    default: {
      http: ['https://carrot.megaeth.com/rpc'],
    },
  },
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

const berachainMainnetChain: Chain = {
  id: 80094,
  name: 'Berachain',
  rpcUrls: {
    default: {
      http: ['https://rpc.berachain.com/'],
    },
  },
  nativeCurrency: {
    name: 'Bera',
    symbol: 'BERA',
    decimals: 18,
  },
};

const bepoliaTestnetChain: Chain = {
  id: 80069,
  name: 'Berachain Bepolia',
  rpcUrls: {
    default: {
      http: ['https://bepolia.rpc.berachain.com/'],
    },
  },
  nativeCurrency: {
    name: 'Bera',
    symbol: 'BERA',
    decimals: 18,
  },
};

const unichainChain: Chain = {
  id: 130,
  name: 'Unichain',
  rpcUrls: {
    default: {
      http: ['https://mainnet.unichain.org'],
    },
  },
  nativeCurrency: {
    name: 'Unichain',
    symbol: 'UNI',
    decimals: 18,
  },
};

const monadTestnetChain: Chain = {
  id: 10143,
  name: 'Monad Testnet',
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
};

const monadMainnetChain: Chain = {
  id: 143,
  name: 'Monad Mainnet',
  rpcUrls: {
    default: {
      // tbd: monad is not yet live
      // this should fail
      http: ['https://rpc.monad.xyz'],
    },
  },
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
};

const tempoModeratoTestnetChain: Chain = {
  id: 42431,
  name: 'Tempo Testnet Moderato',
  rpcUrls: {
    default: {
      http: ['https://rpc.moderato.tempo.xyz'],
    },
  },
  // There is no concept of native currency on Tempo,
  // which is one of the challenges of this implementation.
  // Gas can be paid using pathUSD (TIP20/ERC20)
  // from Tempo's faucet: https://docs.tempo.xyz/quickstart/faucet
  // pathUSD gets selected automatically when it is in the account.
  // Information as dispensed by chainlist:
  nativeCurrency: {
    name: 'USD',
    symbol: 'USD',
    decimals: 18,
  },
};

const tempoMainnetChain: Chain = {
  id: 4217,
  name: 'Tempo Mainnet',
  rpcUrls: {
    default: {
      // Currently behind authwall (contract deployment tested with QuickNode endpoint)
      http: ['https://rpc.tempo.xyz'],
    },
  },
  // There is no concept of native currency on Tempo,
  // which is one of the challenges of this implementation.
  // Gas can be paid using pathUSD (TIP20/ERC20)
  // from Tempo's faucet: https://docs.tempo.xyz/quickstart/faucet
  // pathUSD gets selected automatically when it is in the account.
  // Information as dispensed by chainlist:
  nativeCurrency: {
    name: 'USD',
    symbol: 'USD',
    decimals: 18,
  },
};

const citreaTestnetChain: Chain = {
  id: 5115,
  name: 'Citrea Testnet',
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
  },
  nativeCurrency: {
    name: 'cBTC',
    symbol: 'cBTC',
    decimals: 18,
  },
};

const inkMainnetChain: Chain = {
  id: 57073,
  name: 'Ink Mainnet',
  rpcUrls: {
    default: {
      http: ['https://rpc-qnd.inkonchain.com'],
    },
  },
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

const inkSepoliaChain: Chain = {
  id: 763373,
  name: 'Ink Sepolia',
  rpcUrls: {
    default: {
      http: ['https://ink-sepolia.drpc.org'],
    },
  },
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

const sonicTestnetChain: Chain = {
  id: 14601,
  name: 'Sonic Testnet',
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.soniclabs.com'],
    },
  },
  nativeCurrency: {
    name: 'Sonic',
    symbol: 'SONIC',
    decimals: 18,
  },
};

const roninSaigonChain: Chain = {
  id: 202601,
  name: 'Ronin Saigon',
  rpcUrls: {
    default: {
      http: ['https://ronin-saigon.drpc.org'],
    },
  },
  nativeCurrency: {
    name: 'Ronin',
    symbol: 'RON',
    decimals: 18,
  },
};

const citreaMainnetChain: Chain = {
  id: 4114,
  name: 'Citrea Mainnet',
  rpcUrls: {
    default: {
      http: ['https://rpc.mainnet.citrea.xyz'],
    },
  },
  nativeCurrency: {
    name: 'cBTC',
    symbol: 'cBTC',
    decimals: 18,
  },
};

const mantleMainnetChain: Chain = {
  id: 5000,
  name: 'Mantle Mainnet',
  rpcUrls: {
    default: {
      http: ['https://rpc.mantle.xyz'],
    },
  },
  nativeCurrency: {
    name: 'Mantle',
    symbol: 'MNT',
    decimals: 18,
  },
};

const mantleSepoliaChain: Chain = {
  id: 5003,
  name: 'Mantle Sepolia',
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  nativeCurrency: {
    name: 'Mantle',
    symbol: 'MNT',
    decimals: 18,
  },
};

const katanaMainnet: Chain = {
  id: 	747474,
  name: 'Katana Mainnet',
  rpcUrls: {
    default: {
      http: ['https://rpc.katana.network'],
    },
  },
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

const katanaBokuto: Chain = {
  id: 737373,
  name: 'Katana Bokuto',
  rpcUrls: {
    default: {
      http: ['https://rpc-bokuto.katanarpc.com'],
    },
  },
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const chains = {
  ...allChains,
  megaEthTestNet: megaEthTestNetChain,
  berachainMainnet: berachainMainnetChain,
  bepoliaTestnet: bepoliaTestnetChain,
  unichain: unichainChain,
  monadTestnet: monadTestnetChain,
  citreaTestnet: citreaTestnetChain,
  inkMainnet: inkMainnetChain,
  inkSepolia: inkSepoliaChain,
  sonicTestnet: sonicTestnetChain,
  monad: monadMainnetChain,
  megaEthMainnet: megaEthMainnetChain,
  roninSaigon: roninSaigonChain,
  tempoModeratoTestnet: tempoModeratoTestnetChain,
  tempoMainnet: tempoMainnetChain,
  citreaMainnet: citreaMainnetChain,
  mantleMainnet: mantleMainnetChain,
  mantleSepolia: mantleSepoliaChain,
  katanaMainnet: katanaMainnet,
  katanaBokuto: katanaBokuto,
} as any as { [key: string]: Chain };

// The default rpc urls for these chains are not reliable, so we override them
// This may be a game of cat and mouse, so a better solution may be needed.
export const rpcUrlOverrides = {
  [mainnet.id]: 'https://eth.merkle.io',
  [bsc.id]: 'https://bsc-dataseed1.binance.org/',
  [bscTestnet.id]: 'https://bsc-testnet-rpc.publicnode.com',
} as Record<number, string>;

const latestVersion = Object.keys(DELEGATOR_CONTRACTS).reduce(
  (acc, version) => {
    if (compareVersions(version, acc) === 1) {
      return version;
    }
    return acc;
  },
  '0.0.0',
);

const latestContracts = DELEGATOR_CONTRACTS[latestVersion];

if (latestContracts === undefined) {
  throw new Error(`No contracts found for version ${latestVersion}`);
}

const allChainIds = Object.keys(latestContracts);

// Optional: filter by chain IDs from argv (e.g. yarn validate-latest-contracts 0x7e4,0xa4ec)
// eslint-disable-next-line no-restricted-globals
const chainIdArg = process.argv
  .slice(2)
  .flatMap((arg) => arg.split(','))
  .map((chainIdStr) => chainIdStr.trim())
  .filter((chainIdStr) => chainIdStr.length > 0);

const chainIdsToValidate =
  chainIdArg.length === 0
    ? allChainIds
    : ((): string[] => {
        const set = new Set<number>(
          chainIdArg.map((chainIdStr) =>
            chainIdStr.startsWith('0x')
              ? parseInt(chainIdStr, 16)
              : parseInt(chainIdStr, 10),
          ),
        );
        return allChainIds.filter((chainIdStr) =>
          set.has(parseInt(chainIdStr, 10)),
        );
      })();

if (chainIdArg.length > 0 && chainIdsToValidate.length === 0) {
  throw new Error(`No matching chains for: ${chainIdArg.join(', ')}`);
}

const chainIds = chainIdsToValidate;

console.log(`Testing version ${latestVersion}`);
if (chainIdArg.length > 0) {
  const chainNames = chainIds.map((chainIdStr) => {
    const chainId = parseInt(chainIdStr, 10);
    const chain = Object.values(chains).find(({ id }) => id === chainId);
    return chain ? chain.name : `0x${chainId.toString(16)}`;
  });
  console.log(`Chains: ${chainNames.join(', ')}`);
}
console.log();

const CHAIN_TIMEOUT_MS = 60_000;
let hasFailed = false;

const allChainsDone = chainIds.map(async (chainIdAsString) => {
  const chainId = parseInt(chainIdAsString, 10);
  const chainIdHex = `0x${chainId.toString(16)}`;

  const run = async (): Promise<void> => {
    const contracts = latestContracts[chainId];

    if (contracts === undefined) {
      throw new Error(`No contracts found for chainId ${chainIdHex}`);
    }

    const transport = http(rpcUrlOverrides[chainId]);

    const chain = Object.values(chains).find(({ id }) => id === chainId);

    if (!chain) {
      hasFailed = true;

      console.error(`Chain configuration not found for chainId ${chainIdHex}`);
      return;
    }

    const publicClient = createPublicClient({
      chain,
      transport,
    });

    const actualChainId = await publicClient.getChainId();

    if (actualChainId !== chainId) {
      // this is only possible if a custom chain configuration is used, and incorrectly configured.
      console.error(
        `ChainId mismatch for ${chain.name}: 0x${actualChainId.toString(16)} !== ${chainIdHex}`,
      );
      hasFailed = true;
      return;
    }

    const contractNames = Object.keys(contracts);
    let hasThisChainFailed = false;
    const allContractsDone = contractNames.map(async (contractName) => {
      const contractAddress = contracts[contractName];

      if (contractAddress === undefined) {
        throw new Error(
          `No contract address found for contractName ${contractName}`,
        );
      }

      try {
        const code = await publicClient.getCode({ address: contractAddress });

        if (code === undefined) {
          console.error(
            `${chain.name}: ${contractName} is not deployed at ${contractAddress}`,
          );
          hasThisChainFailed = true;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `RPC Request failed for ${chain.name}: ${contractName} - ${errorMessage}`,
        );
        hasThisChainFailed = true;
      }
    });

    await Promise.all(allContractsDone);

    if (hasThisChainFailed) {
      hasFailed = true;
      console.error(`${chain.name} failed`);
    } else {
      console.log(`${chain.name} succeeded`);
    }
  };

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((_resolve, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Timeout after ${CHAIN_TIMEOUT_MS / 1000}s`)),
      CHAIN_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([run(), timeout]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Chain ${chainIdHex}: ${errorMessage}`);
    hasFailed = true;
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
});

Promise.all(allChainsDone)
  .then(() => {
    console.log();
    if (hasFailed) {
      // eslint-disable-next-line no-restricted-globals
      process.exitCode = 1;
      console.error('Failed to validate contract deployments');
    } else {
      console.log('Successfully validated contract deployments');
    }
    return undefined;
  })
  .catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed with: ${errorMessage}`);
    // eslint-disable-next-line no-restricted-globals
    process.exitCode = 1;
  });
