import {
  http as httpTransport,
  createClient,
  createWalletClient,
  http,
  createPublicClient,
} from 'viem';
import { nodeUrl, bundlerUrl, paymasterUrl, chain, deployPk } from './config';
import { privateKeyToAccount } from 'viem/accounts';
import { deploySmartAccountsEnvironment } from '@metamask/smart-accounts-kit/utils';
import { writeFile } from 'fs/promises';

const ENTRYPOINT_ADDRESS_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';
const POLL_INTERVAL_MS = 1_000;
// timeout is 5 minutes, which is sufficiently long to never trigger a false positive
const TIMEOUT_MS = 5 * 60_000;
let hasTimedOut = false;

const waitFor = async (name: string, url: string) => {
  let isAvailable: boolean | undefined = undefined;

  console.log(`Waiting for ${name}, at ${url}`);
  const transport = httpTransport(url);

  const client = createClient({
    transport,
  });

  do {
    if (isAvailable !== undefined) {
      // Only add a delay if it's not the first time
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    await client
      .request({ method: 'web3_clientVersion' })
      .then(() => (isAvailable = true))
      // as soon as the node is responding (even if it's MethodNotFoundRpcError)
      .catch((e) => (isAvailable = (e as Error).name !== 'HttpRequestError'));
  } while (!isAvailable && !hasTimedOut);

  if (isAvailable) {
    console.log(`${name} is available`);
  }
};

const deployEnvironment = async () => {
  const smartAccountEnvironment = await deploySmartAccountsEnvironment(
    createWalletClient({
      account: privateKeyToAccount(deployPk),
      chain,
      transport: http(nodeUrl),
    }),
    createPublicClient({
      chain,
      transport: http(nodeUrl),
    }),
    chain,
    {
      EntryPoint: ENTRYPOINT_ADDRESS_V07,
    },
  );

  return smartAccountEnvironment;
};

(async () => {
  const startTime = Date.now();

  const timeoutRef = setTimeout(() => (hasTimedOut = true), TIMEOUT_MS);

  await Promise.all([
    waitFor('Blockchain node', nodeUrl),
    waitFor('Bundler', bundlerUrl),
    waitFor('Mock paymaster', paymasterUrl),
  ]);

  const environment = await deployEnvironment();
  await writeFile('./.gator-env.json', JSON.stringify(environment, null, 2));

  clearTimeout(timeoutRef);

  if (hasTimedOut) {
    console.error('Timed out waiting for dependencies');
    process.exitCode = 1;
  } else {
    const duration = Date.now() - startTime;
    console.log(`Dependencies ready in ${duration}ms`);
  }
})();
