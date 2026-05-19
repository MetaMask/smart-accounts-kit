import { config } from 'dotenv';
import { x402Client, x402HTTPClient } from '@x402/core/client';
import { wrapFetchWithPayment } from '@x402/fetch';
import {
  CaveatType,
  createOpenDelegation,
  getSmartAccountsEnvironment,
  ScopeType,
  signDelegation,
  type Delegation,
} from '@metamask/smart-accounts-kit';
import { encodeDelegations } from '@metamask/smart-accounts-kit/utils';
import { x402Erc7710Client } from '@metamask/smart-accounts-kit-x402';
import {
  getAddress,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { randomBytes } from 'node:crypto';

config();

type CliConfig = {
  privateKey: Hex;
  url: string;
};

function parseCliConfig(): CliConfig {
  const args = process.argv.slice(2);
  const keyArgIndex = args.findIndex((arg) => arg === '--private-key');
  const urlArgIndex = args.findIndex((arg) => arg === '--url');

  const privateKeyFromArg =
    keyArgIndex >= 0 ? (args[keyArgIndex + 1] as Hex | undefined) : undefined;
  const privateKey = (privateKeyFromArg ??
    (process.env.PRIVATE_KEY as Hex | undefined)) as Hex | undefined;

  if (!privateKey || !privateKey.startsWith('0x')) {
    throw new Error(
      'Missing private key. Pass --private-key 0x... or set PRIVATE_KEY',
    );
  }

  const urlFromArg = urlArgIndex >= 0 ? args[urlArgIndex + 1] : undefined;
  const url = urlFromArg ?? process.env.X402_URL ?? 'http://localhost:4021/random';

  return { privateKey, url };
}

function parseChainIdFromNetwork(network: string): number {
  const [namespace, reference] = network.split(':');
  if (namespace !== 'eip155' || !reference) {
    throw new Error(
      `Unsupported network "${network}". Expected CAIP-2 eip155:<chainId>`,
    );
  }

  const chainId = Number(reference);
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error(`Invalid chain id in network "${network}"`);
  }
  return chainId;
}


async function main() {
  const { privateKey, url } = parseCliConfig();
  const account = privateKeyToAccount(privateKey);

  const erc7710Client = new x402Erc7710Client({
    delegationProvider: async (requirements) => {
      const chainId = parseChainIdFromNetwork(requirements.network);
      const environment = getSmartAccountsEnvironment(chainId);

      // expires in 1 minute (must be an integer unix timestamp)
      const expiry = Math.floor(Date.now() / 1000) + 60;

      const delegation = createOpenDelegation({
        environment,
        from: account.address,
        scope: {
          type: ScopeType.Erc20TransferAmount,
          tokenAddress: getAddress(requirements.asset),
          maxAmount: BigInt(requirements.amount),
        },
        salt: `0x${randomBytes(32).toString('hex')}`,
        caveats: [
          {
            type: CaveatType.Timestamp,
            afterThreshold: 0,
            beforeThreshold: expiry,
          }
        ]
      });


      const signature = await signDelegation({
        privateKey,
        delegation,
        delegationManager: environment.DelegationManager,
        chainId,
      });

      const signedDelegation: Delegation = {
        ...delegation,
        signature,
      };

      return {
        delegationManager: environment.DelegationManager,
        permissionContext: encodeDelegations([signedDelegation]),
        delegator: account.address,
      };
    },
  });

  const httpClient = new x402HTTPClient(new x402Client().register(
    'eip155:*',
    erc7710Client
  ));

  const fetchWithPayment = wrapFetchWithPayment(fetch, httpClient);

  const paidResponse = await fetchWithPayment(url, { method: 'GET' });
  
  if (!paidResponse.ok) {
    const bodyText = await paidResponse.text();
    throw new Error(
      `Paid request failed with status ${paidResponse.status}: ${bodyText}`,
    );
  }

  console.log(await paidResponse.text());
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`x402 client failed: ${message}`);
  process.exit(1);
});
