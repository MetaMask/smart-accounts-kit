export const abi = [
  {
    "type": "function",
    "name": "getNonce",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "key",
        "type": "uint192",
        "internalType": "uint192"
      }
    ],
    "outputs": [
      {
        "name": "nonce",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "incrementNonce",
    "inputs": [
      {
        "name": "key",
        "type": "uint192",
        "internalType": "uint192"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "nonceSequenceNumber",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint192",
        "internalType": "uint192"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  }
] as const;
