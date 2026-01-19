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
        "name": "_args",
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
    "name": "getAllTermsInfo",
    "inputs": [
      {
        "name": "_terms",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "tokens_",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "periodAmounts_",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "periodDurations_",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "startDates_",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "getAvailableAmount",
    "inputs": [
      {
        "name": "_delegationHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_delegationManager",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_terms",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "_args",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "availableAmount_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "isNewPeriod_",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "currentPeriod_",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getHashKey",
    "inputs": [
      {
        "name": "_caller",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_delegationHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "getTermsInfo",
    "inputs": [
      {
        "name": "_terms",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "_tokenIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "token_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "periodAmount_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "periodDuration_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "startDate_",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "periodicAllowances",
    "inputs": [
      {
        "name": "hashKey",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "periodAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "periodDuration",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "startDate",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "lastTransferPeriod",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "transferredInCurrentPeriod",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TransferredInPeriod",
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
        "name": "token",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "periodAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "periodDuration",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "startDate",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "transferredInCurrentPeriod",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "transferTimestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  }
] as const;
