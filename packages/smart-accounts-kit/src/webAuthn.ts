import {
  parseAbiParameters,
  encodeAbiParameters,
  type Hex,
  encodePacked,
  keccak256,
  concat,
  hexToBytes,
} from 'viem';
import { parseSignature } from 'webauthn-p256';

export const FIELD_MODULUS =
  115792089210356248762697446949407573529996955224135760342422259061068512044369n;
export const MALLEABILITY_THRESHOLD = FIELD_MODULUS / 2n;

export const SIGNATURE_ABI_PARAMS = parseAbiParameters(
  'bytes32, uint256, uint256, bytes, bool, string, string, uint256',
);

/**
 * This function is used to convert the client data returned from the
 * credentials API into a format that can be consumed by the DeleGator
 * contracts. We need the flattend JSON strings before and after the
 * userOpHash/challenge. This function provides those two client data string
 * slices.
 *
 * @param clientDataJson - The client data JSON string.
 * @returns Returns [clientDataJSONPrefix and clientDataJSONSuffix]
 * ClientDataJSONPrefix contains the client data till the challengeHash
 * ClientDataJSONSuffix contains the client data after the challengeHash.
 */
export const splitOnChallenge = (
  clientDataJson: string,
): [clientDataJSONPrefix: string, clientDataJSONSuffix: string] => {
  /*
  CientData looks like this:
  {
    "type": "webauthn.create" | "webauthn.get",
    "challenge": "{userOpHash}",
    "origin": "{Domain}",
    "crossOrigin": boolean
  }
  */
  try {
    const { challenge } = JSON.parse(clientDataJson);
    if (challenge === undefined) {
      throw new Error('No "challenge" found in the input string');
    }
    return clientDataJson.split(challenge) as [string, string];
  } catch (error) {
    throw new Error('No "challenge" found in the input string', {
      cause: error,
    });
  }
};

/**
 * Returns the index of '"type":' in the ClientData.
 *
 * @param clientDataJson - Stringified ClientDataJSON.
 * @returns The index of '"type":' in the ClientData.
 */
export const getResponseTypeLocation = (clientDataJson: string): bigint => {
  try {
    // Find the index of the `"type":` key in the JSON string directly
    const typeIndex = clientDataJson.indexOf('"type":');

    if (typeIndex === -1) {
      throw new Error('No "type" found in the input string');
    }
    // Return the index of the `"type":` key
    return BigInt(typeIndex);
  } catch (error) {
    // Handle any errors that occur during the search
    throw new Error('No "type" found in the input string', {
      cause: error,
    });
  }
};

/**
 * Encodes a signature to a hexadecimal signature that will be accepted
 * by the DeleGator contracts.
 *
 * @param keyId - The key used for the signature, represented as a hexadecimal string.
 * @param signature - The signature to convert, as Hex.
 * @param clientDataJSON - The client data used in the creation of the signature.
 * @param authenticatorData - The authenticator data used in the creation of the signature.
 * @returns The signature as a valid DeleGator signature encoded as Hexadecimal string.
 */
export function encodeDeleGatorSignature(
  keyId: string,
  signature: Hex,
  clientDataJSON: string,
  authenticatorData: Hex,
): Hex {
  const keyIdHash = keccak256(encodePacked(['string'], [keyId]));

  const parsedSignature = parseSignature(signature);

  let { s } = parsedSignature;

  while (s > MALLEABILITY_THRESHOLD) {
    s = FIELD_MODULUS - s;
  }

  const { r } = parsedSignature;

  const [clientDataComponent1, clientDataComponent2] =
    splitOnChallenge(clientDataJSON);

  const { userVerified } = parseAuthenticatorFlags(authenticatorData);

  const responseTypeLocation = getResponseTypeLocation(clientDataJSON);

  const encodedSignature = encodeAbiParameters(SIGNATURE_ABI_PARAMS, [
    keyIdHash,
    r,
    s,
    authenticatorData,
    userVerified,
    clientDataComponent1,
    clientDataComponent2,
    responseTypeLocation,
  ]);
  return encodedSignature;
}

const AUTHENTICATOR_DATA_FLAGS_OFFSET = 32;
// We have all of the flag bits defined here for completeness, even though we only extract the userVerified flag.
enum AuthenticatorDataFlagBitIndex {
  UserPresence = 0,
  UserVerified = 2,
  BackupEligibility = 3,
  BackupState = 4,
  AttestedCredentialData = 6,
  ExtensionData = 7,
}

export type AuthenticatorFlags = {
  userVerified: boolean;
};

/**
 * Parses the authenticator data and returns an authenticator flags object with the `userVerified` flag.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/Authenticator_data.
 *
 * @param authenticatorData - The authenticator data to parse.
 * @returns An object representing the parsed authenticator flags.
 */
export function parseAuthenticatorFlags(
  authenticatorData: Hex,
): AuthenticatorFlags {
  const authenticatorDataBuffer = hexToBytes(authenticatorData);
  const dataBufferUint8 = new Uint8Array(authenticatorDataBuffer);
  const flags = dataBufferUint8[AUTHENTICATOR_DATA_FLAGS_OFFSET];
  if (flags === undefined) {
    throw new Error('Authenticator flags not found in authenticator data');
  }

  // Bit 0 is the least significant bit in the flags byte, so we left shift 0b1 by the bit index
  // eslint-disable-next-line no-bitwise
  const bitMask = 0b1 << AuthenticatorDataFlagBitIndex.UserVerified;

  return {
    // eslint-disable-next-line no-bitwise
    userVerified: (flags & bitMask) !== 0x0,
  };
}

/**
 * Creates a dummy signature.
 * This must meet all early-failure conditions of the real signature, but does not need to be a valid signature.
 *
 * @param keyId - The key ID to use for the dummy signature.
 * @returns The encoded signature.
 */
export const createDummyWebAuthnSignature = (keyId: Hex) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/Authenticator_data#data_structure
  const rpIdHash = keccak256(encodePacked(['string'], ['AuthenticatorData']));
  const flags = '0x05';
  const signCount = '0x00000000';
  const authenticatorData = concat([rpIdHash, flags, signCount]);

  const keyIdHash = keccak256(encodePacked(['string'], [keyId]));
  const rs =
    57896044605178124381348723474703786764998477612067880171211129530534256022184n;
  const userVerification = true;
  const clientDataPrefix = '{"type":"webauthn.get","challenge":"';
  const clientDataSuffix = '","origin":"passkey-domain","crossOrigin":false}';
  const responseTypeLocation = 1n;

  const encodedSignature = encodeAbiParameters(SIGNATURE_ABI_PARAMS, [
    keyIdHash,
    rs,
    rs,
    authenticatorData,
    userVerification,
    clientDataPrefix,
    clientDataSuffix,
    responseTypeLocation,
  ]);

  return encodedSignature;
};
