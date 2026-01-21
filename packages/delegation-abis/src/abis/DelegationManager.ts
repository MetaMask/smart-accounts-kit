export const abi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ANY_DELEGATE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DOMAIN_VERSION",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "NAME",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ROOT_AUTHORITY",
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
    "name": "VERSION",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "acceptOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
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
        "name": "delegationHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "isDisabled",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "eip712Domain",
    "inputs": [],
    "outputs": [
      {
        "name": "fields",
        "type": "bytes1",
        "internalType": "bytes1"
      },
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "version",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "chainId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "verifyingContract",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "salt",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "extensions",
        "type": "uint256[]",
        "internalType": "uint256[]"
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
        "name": "_input",
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
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
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
    "name": "paused",
    "inputs": [],
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
    "name": "pendingOwner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
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
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
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
    "name": "EIP712DomainChanged",
    "inputs": [],
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
    "name": "OwnershipTransferStarted",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Paused",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": false,
        "internalType": "address"
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
    "type": "event",
    "name": "Unpaused",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "indexed": false,
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
    "name": "ECDSAInvalidSignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignatureLength",
    "inputs": [
      {
        "name": "length",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignatureS",
    "inputs": [
      {
        "name": "s",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "EmptySignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EnforcedPause",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ExpectedPause",
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
  },
  {
    "type": "error",
    "name": "InvalidShortString",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "StringTooLong",
    "inputs": [
      {
        "name": "str",
        "type": "string",
        "internalType": "string"
      }
    ]
  }
] as const;
