export const abi = [
  {
    "type": "function",
    "name": "afterAllHook",
    "inputs": [
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "ModeCode"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "afterHook",
    "inputs": [
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "ModeCode"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "beforeAllHook",
    "inputs": [
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "ModeCode"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "beforeHook",
    "inputs": [
      {
        "name": "_terms",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "_mode",
        "type": "bytes32",
        "internalType": "ModeCode"
      },
      {
        "name": "_executionCallData",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "_delegationHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_redeemer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getTermsInfo",
    "inputs": [
      {
        "name": "_terms",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "allowance_",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "spentMap",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "delegationHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "IncreasedSpentMap",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "redeemer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "delegationHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "limit",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "spent",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  }
] as const;
