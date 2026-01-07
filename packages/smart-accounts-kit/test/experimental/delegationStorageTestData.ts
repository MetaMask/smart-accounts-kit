import {
  ROOT_AUTHORITY,
  getDelegationHashOffchain,
} from '../../src/delegation';
import type { Delegation } from '../../src/types';

export const TEST_ACCOUNT = '0x0E9bBA6e2D962645c5FB1064d86cc6dE6050739C';
export const DELEGATOR_ACCOUNT = '0x0E9bBA6e2D962645c5FB1064d86cc6dE6050739C';
export const DELEGATE_ACCOUNT = '0x2FcB88EC2359fA635566E66415D31dD381CF5585';
export const CAVEAT_ALLOWED_TARGETS_ENFORCER =
  '0xDBc1C143FCe9aB810df9ECD231440D5367EA096b';
export const CAVEAT_TERMS = '0xb0914277B8f227315A06C452023e432133BEC5AB';
export const CAVEAT_ARGS = '0x';
export const DELEGATION_SIGNATURE =
  '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a47055138591040ebd4b136fc8dd9c78dc9bb874ba611e6cc9a32c0fc31a8db0e16331644fd240395d7e545228029fbea01062ddcd29dd2dfae9e14d60919a39f2d600000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000247b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000037222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a33303032222c2263726f73734f726967696e223a66616c73657d000000000000000000';

export const UNSIGNED_DELEGATION: Delegation = {
  delegator: DELEGATOR_ACCOUNT,
  delegate: DELEGATE_ACCOUNT,
  authority: ROOT_AUTHORITY,
  caveats: [
    {
      enforcer: CAVEAT_ALLOWED_TARGETS_ENFORCER,
      terms: CAVEAT_TERMS,
      args: CAVEAT_ARGS,
    },
  ],
  salt: '0x0',
  signature: '0x',
};

export const MOCK_DELEGATION_CHAIN_FROM_MIDDLEWARE_STORE: Delegation[] = [
  {
    ...UNSIGNED_DELEGATION,
    signature: DELEGATION_SIGNATURE,
  },
];

export const MOCK_SIGNED_DELEGATION: Delegation = {
  ...UNSIGNED_DELEGATION,
  signature: DELEGATION_SIGNATURE,
};

export const MOCK_DELEGATION_CHAIN_API_RESPONSE: Delegation[] = [
  {
    ...MOCK_SIGNED_DELEGATION,
    salt: '0x0',
  },
];

export enum RequestType {
  DelegationChange = 'delegation-chain',

  DELEGATIONS = 'delegations',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  FAILED_REQUEST = 'SOME_API_ERROR',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  PERSIST_SIGNED_DELEGATION = 'persist-signed-delegation',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  PERSIST_SIGNED_DELEGATION_FAILED_REQUEST = 'persist-signed-delegation-failed-request',
}

export const createDelegationStoreAPIFetchResponse = (
  type: RequestType,
  data?: Delegation,
) => {
  let json: object;

  switch (type) {
    case RequestType.DelegationChange:
      json = MOCK_DELEGATION_CHAIN_API_RESPONSE;
      break;
    case RequestType.DELEGATIONS:
      json = [MOCK_SIGNED_DELEGATION];
      break;
    case RequestType.FAILED_REQUEST:
      json = { error: 'Some API error' };
      break;
    case RequestType.PERSIST_SIGNED_DELEGATION:
      if (!data) {
        throw new Error('Data is required to create a response');
      }
      json = { delegationHash: getDelegationHashOffchain(data) };
      break;
    case RequestType.PERSIST_SIGNED_DELEGATION_FAILED_REQUEST:
      json = { delegationHash: '0x-miss-match-delegation-hash' };
      break;
    default:
      json = { error: 'Invalid request type' };
  }

  return {
    json: async () => Promise.resolve(json),
  };
};
