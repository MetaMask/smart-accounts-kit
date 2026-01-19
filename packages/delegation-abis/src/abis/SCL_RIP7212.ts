export const abi = [
  {
    "type": "function",
    "name": "verify",
    "inputs": [
      {
        "name": "message",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "r",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "s",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "qx",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "qy",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  }
] as const;
