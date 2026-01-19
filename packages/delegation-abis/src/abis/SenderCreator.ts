export const abi = [
  {
    "type": "function",
    "name": "createSender",
    "inputs": [
      {
        "name": "initCode",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "sender",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  }
] as const;
