export const abi = [
  {
    "type": "function",
    "name": "computeAddress",
    "inputs": [
      {
        "name": "_bytecodeHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_salt",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "addr_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deploy",
    "inputs": [
      {
        "name": "_bytecode",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "_salt",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "addr_",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Deployed",
    "inputs": [
      {
        "name": "addr",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "Create2EmptyBytecode",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Create2FailedDeployment",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Create2InsufficientBalance",
    "inputs": [
      {
        "name": "balance",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "needed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SimpleFactoryEmptyContract",
    "inputs": [
      {
        "name": "deployed",
        "type": "address",
        "internalType": "address"
      }
    ]
  }
] as const;
