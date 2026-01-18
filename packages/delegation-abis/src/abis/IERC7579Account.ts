export const abi = [
  {
    "type": "function",
    "name": "accountId",
    "inputs": [],
    "outputs": [
      {
        "name": "accountImplementationId",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "execute",
    "inputs": [
      {
        "name": "mode",
        "type": "bytes32",
        "internalType": "ModeCode"
      },
      {
        "name": "executionCalldata",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "executeFromExecutor",
    "inputs": [
      {
        "name": "mode",
        "type": "bytes32",
        "internalType": "ModeCode"
      },
      {
        "name": "executionCalldata",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "returnData",
        "type": "bytes[]",
        "internalType": "bytes[]"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "installModule",
    "inputs": [
      {
        "name": "moduleTypeId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "module",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "initData",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "isModuleInstalled",
    "inputs": [
      {
        "name": "moduleTypeId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "module",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "additionalContext",
        "type": "bytes",
        "internalType": "bytes"
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
  },
  {
    "type": "function",
    "name": "isValidSignature",
    "inputs": [
      {
        "name": "hash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "supportsExecutionMode",
    "inputs": [
      {
        "name": "encodedMode",
        "type": "bytes32",
        "internalType": "ModeCode"
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
  },
  {
    "type": "function",
    "name": "supportsModule",
    "inputs": [
      {
        "name": "moduleTypeId",
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
  },
  {
    "type": "function",
    "name": "uninstallModule",
    "inputs": [
      {
        "name": "moduleTypeId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "module",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "deInitData",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "event",
    "name": "ModuleInstalled",
    "inputs": [
      {
        "name": "moduleTypeId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "module",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ModuleUninstalled",
    "inputs": [
      {
        "name": "moduleTypeId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "module",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  }
] as const;
