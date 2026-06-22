export const METAMASK_FACILITATOR_ADDRESSES = [
  '0xB01caEa8c6C47bbf4F4b4c5080Ca642043359C2E',
  '0xC066ac5D385419B1A8c43A0E146fA439837a8B8c',
  '0xB42F812A44c22cc6b861478900401ee759EbEAD6',
] as const;

export const METAMASK_FACILITATOR_ADDRESSES_DEV = [
  '0xb4827A2a066CD2Ef88560EFdf063dD05C6c41cC7',
] as const;

export const ALL_METAMASK_FACILITATOR_ADDRESSES = [
  ...METAMASK_FACILITATOR_ADDRESSES,
  ...METAMASK_FACILITATOR_ADDRESSES_DEV,
] as const;

const METAMASK_FACILITATOR_ADDRESSES_LOWERCASE = new Set<string>(
  ALL_METAMASK_FACILITATOR_ADDRESSES.map((address) => address.toLowerCase()),
);

/**
 * Checks whether an address is a known MetaMask facilitator address.
 *
 * @param address - Address to check.
 * @returns True if the address is a known MetaMask facilitator address.
 */
export function isMetaMaskFacilitatorAddress(address: string): boolean {
  return METAMASK_FACILITATOR_ADDRESSES_LOWERCASE.has(address.toLowerCase());
}

/**
 * Checks whether every provided address is a known MetaMask facilitator address.
 *
 * @param addresses - Addresses to check.
 * @returns True when the list is non-empty and all entries are known facilitators.
 */
export function areOnlyMetaMaskFacilitatorAddresses(
  addresses: string[] | null | undefined,
): boolean {
  if (!addresses?.length) {
    return false;
  }

  return addresses.every(isMetaMaskFacilitatorAddress);
}
