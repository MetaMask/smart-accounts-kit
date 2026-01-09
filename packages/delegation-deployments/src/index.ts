import type { Address } from 'viem';

import {
  DEPLOYMENTS_1_3_0,
  DEPLOYMENTS_1_1_0,
  DEPLOYMENTS_1_0_0,
} from './contractAddresses';

export const CHAIN_ID = {
  // Mainnets
  arbitrum: 0xa4b1,
  arbitrumNova: 0xa4ba,
  base: 0x2105,
  berachain: 0x138de,
  bsc: 0x38,
  gnosis: 0x64,
  ink: 0xdef1,
  linea: 0xe708,
  mainnet: 0x1,
  monad: 0x8f,
  optimism: 0xa,
  polygon: 0x89,
  sei: 0x531,
  sonic: 0x92,
  unichain: 0x82,
  megaEthMainnet: 0x10e6,
  // Testnets
  bscTestnet: 0x61,
  arbitrumSepolia: 0x66eee,
  baseSepolia: 0x14a34,
  berachainBepolia: 0x138c5,
  chiado: 0x27d8,
  citreaTestnet: 0x13fb,
  hoodiTestnet: 0x88bb0,
  inkSepolia: 0xba5ed,
  lineaSepolia: 0xe705,
  megaEthTestnet: 0x18c7,
  monadTestnet: 0x279f,
  optimismSepolia: 0xaa37dc,
  polygonAmoy: 0x13882,
  seiTestnet: 0x530,
  sepolia: 0xaa36a7,
  sonicTestnet: 0x3909,
  unichainSepolia: 0x515,
  // decommissioned
  lineaGoerli: 0xe704,
};

type DeployedContracts = Record<
  string,
  Record<number, Record<string, Address>>
>;

export const DELEGATOR_CONTRACTS: DeployedContracts = {
  '1.0.0': {
    // Mainnets
    [CHAIN_ID.optimism]: DEPLOYMENTS_1_0_0,
    [CHAIN_ID.polygon]: DEPLOYMENTS_1_0_0,
    [CHAIN_ID.base]: DEPLOYMENTS_1_0_0,
    [CHAIN_ID.arbitrum]: DEPLOYMENTS_1_0_0,
    [CHAIN_ID.linea]: DEPLOYMENTS_1_0_0,
    // Testnets
    [CHAIN_ID.sepolia]: {
      ...DEPLOYMENTS_1_0_0,
      HybridDeleGatorImpl: '0x5989F5D13DF8fc818EdA65e417AED90459fD67F7',
    },
    [CHAIN_ID.lineaSepolia]: {
      ...DEPLOYMENTS_1_0_0,
      HybridDeleGatorImpl: '0x5989F5D13DF8fc818EdA65e417AED90459fD67F7',
    },
  },
  '1.1.0': {
    // Mainnets
    [CHAIN_ID.arbitrum]: DEPLOYMENTS_1_1_0,
    [CHAIN_ID.base]: DEPLOYMENTS_1_1_0,
    [CHAIN_ID.linea]: DEPLOYMENTS_1_1_0,
    [CHAIN_ID.optimism]: DEPLOYMENTS_1_1_0,
    [CHAIN_ID.polygon]: DEPLOYMENTS_1_1_0,
    // Testnets
    [CHAIN_ID.sepolia]: DEPLOYMENTS_1_1_0,
    [CHAIN_ID.lineaSepolia]: DEPLOYMENTS_1_1_0,
    [CHAIN_ID.baseSepolia]: {
      ...DEPLOYMENTS_1_1_0,
      SimpleFactory: '0xE8eA1DE8D6AfE400B7C8C1A81B7C29B7876b4d02',
    },
  },
  '1.3.0': {
    // Mainnets
    [CHAIN_ID.mainnet]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.polygon]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.bsc]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.optimism]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.arbitrum]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.ink]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.linea]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.base]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.gnosis]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.berachain]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.unichain]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.arbitrumNova]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.sei]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.sonic]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.monad]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.megaEthMainnet]: DEPLOYMENTS_1_3_0,
    // Testnets
    [CHAIN_ID.bscTestnet]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.citreaTestnet]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.megaEthTestnet]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.chiado]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.lineaSepolia]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.berachainBepolia]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.baseSepolia]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.arbitrumSepolia]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.sepolia]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.optimismSepolia]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.unichainSepolia]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.polygonAmoy]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.inkSepolia]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.monadTestnet]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.seiTestnet]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.sonicTestnet]: DEPLOYMENTS_1_3_0,
    [CHAIN_ID.hoodiTestnet]: DEPLOYMENTS_1_3_0,
  },
};
