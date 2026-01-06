import { createPublicClient, http } from 'viem';
import * as allChains from 'viem/chains';
import type { Chain } from 'viem/chains';

import { DELEGATOR_CONTRACTS } from '../src/index';
import { compareVersions } from 'compare-versions';
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
  id: 6342,
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
} as any as { [key: string]: Chain };

// The default rpc urls for these chains are not reliable, so we override them
// This may be a game of cat and mouse, so a better solution may be needed.
export const rpcUrlOverrides = {
  [chains.mainnet.id]: 'https://eth.merkle.io',
  [chains.bsc.id]: 'https://bsc-dataseed1.binance.org/',
  [chains.bscTestnet.id]: 'https://bsc-testnet-rpc.publicnode.com',
};

const latestVersion = Object.keys(DELEGATOR_CONTRACTS).reduce(
  (acc, version) => {
    if (compareVersions(version, acc) === 1) {
      return version;
    }
    return acc;
  },
  '0.0.0',
);

console.log(`Testing version ${latestVersion}`);
console.log();

const latestContracts = DELEGATOR_CONTRACTS[latestVersion];

const chainIds = Object.keys(latestContracts);

let hasFailed = false;

const allChainsDone = chainIds.map(async (chainIdAsString) => {
  const chainId = parseInt(chainIdAsString);

  const contracts = latestContracts[chainIdAsString];

  const transport = http(rpcUrlOverrides[chainId]);

  const chain = Object.values(chains).find((c) => c.id === chainId);

  if (!chain) {
    hasFailed = true;

    console.error(`Chain configuration not found for chainId ${chainId}`);
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
      `ChainId mismatch for ${chain.name}: ${actualChainId} !== ${chainId}`,
    );
    hasFailed = true;
    return;
  }

  const contractNames = Object.keys(contracts);
  let hasThisChainFailed = false;
  const allContractsDone = contractNames.map(async (contractName) => {
    const contractAddress = contracts[contractName];

    try {
      const code = await publicClient.getCode({ address: contractAddress });

      if (code === undefined) {
        console.error(
          `${chain.name}: ${contractName} is not deployed at ${contractAddress}`,
        );
        hasThisChainFailed = true;
      }
    } catch (error) {
      console.error(`RPC Request failed for ${chain.name}: ${contractName}`);
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
});

Promise.all(allChainsDone).then(() => {
  console.log();
  if (hasFailed) {
    process.exitCode = 1;
    console.error('Failed to validate contract deployments');
  } else {
    console.log('Successfully validated contract deployments');
  }
});
