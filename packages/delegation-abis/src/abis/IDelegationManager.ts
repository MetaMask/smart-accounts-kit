export const abi = [
  {
    "type": "function",
    "name": "disableDelegation",
    "inputs": [
      {
        "name": "_delegation",
        "type": "tuple",
        "internalType": "struct Delegation",
        "components": [
          {
            "name": "delegate",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "delegator",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "authority",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "caveats",
            "type": "tuple[]",
            "internalType": "struct Caveat[]",
            "components": [
              {
                "name": "enforcer",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "terms",
                "type": "bytes",
                "internalType": "bytes"
              },
              {
                "name": "args",
                "type": "bytes",
                "internalType": "bytes"
              }
            ]
          },
          {
            "name": "salt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "disabledDelegations",
    "inputs": [
      {
        "name": "_delegationHash",
        "type": "bytes32",
        "internalType": "bytes32"
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
    "name": "enableDelegation",
    "inputs": [
      {
        "name": "_delegation",
        "type": "tuple",
        "internalType": "struct Delegation",
        "components": [
          {
            "name": "delegate",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "delegator",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "authority",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "caveats",
            "type": "tuple[]",
            "internalType": "struct Caveat[]",
            "components": [
              {
                "name": "enforcer",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "terms",
                "type": "bytes",
                "internalType": "bytes"
              },
              {
                "name": "args",
                "type": "bytes",
                "internalType": "bytes"
              }
            ]
          },
          {
            "name": "salt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getDelegationHash",
    "inputs": [
      {
        "name": "_delegation",
        "type": "tuple",
        "internalType": "struct Delegation",
        "components": [
          {
            "name": "delegate",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "delegator",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "authority",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "caveats",
            "type": "tuple[]",
            "internalType": "struct Caveat[]",
            "components": [
              {
                "name": "enforcer",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "terms",
                "type": "bytes",
                "internalType": "bytes"
              },
              {
                "name": "args",
                "type": "bytes",
                "internalType": "bytes"
              }
            ]
          },
          {
            "name": "salt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
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
    "name": "getDomainHash",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pause",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "redeemDelegations",
    "inputs": [
      {
        "name": "_permissionContexts",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "_modes",
        "type": "bytes32[]",
        "internalType": "ModeCode[]"
      },
      {
        "name": "_executionCallDatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unpause",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "DisabledDelegation",
    "inputs": [
      {
        "name": "delegationHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "delegator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "delegate",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "delegation",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct Delegation",
        "components": [
          {
            "name": "delegate",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "delegator",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "authority",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "caveats",
            "type": "tuple[]",
            "internalType": "struct Caveat[]",
            "components": [
              {
                "name": "enforcer",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "terms",
                "type": "bytes",
                "internalType": "bytes"
              },
              {
                "name": "args",
                "type": "bytes",
                "internalType": "bytes"
              }
            ]
          },
          {
            "name": "salt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "EnabledDelegation",
    "inputs": [
      {
        "name": "delegationHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "delegator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "delegate",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "delegation",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct Delegation",
        "components": [
          {
            "name": "delegate",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "delegator",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "authority",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "caveats",
            "type": "tuple[]",
            "internalType": "struct Caveat[]",
            "components": [
              {
                "name": "enforcer",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "terms",
                "type": "bytes",
                "internalType": "bytes"
              },
              {
                "name": "args",
                "type": "bytes",
                "internalType": "bytes"
              }
            ]
          },
          {
            "name": "salt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RedeemedDelegation",
    "inputs": [
      {
        "name": "rootDelegator",
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
        "name": "delegation",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct Delegation",
        "components": [
          {
            "name": "delegate",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "delegator",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "authority",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "caveats",
            "type": "tuple[]",
            "internalType": "struct Caveat[]",
            "components": [
              {
                "name": "enforcer",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "terms",
                "type": "bytes",
                "internalType": "bytes"
              },
              {
                "name": "args",
                "type": "bytes",
                "internalType": "bytes"
              }
            ]
          },
          {
            "name": "salt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetDomain",
    "inputs": [
      {
        "name": "domainHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "domainVersion",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "chainId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "contractAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyDisabled",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AlreadyEnabled",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BatchDataLengthMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CannotUseADisabledDelegation",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptySignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAuthority",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidDelegate",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidDelegator",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidEOASignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidERC1271Signature",
    "inputs": []
  }
] as const;
