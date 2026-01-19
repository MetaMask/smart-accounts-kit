export const abi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_swapApiSigner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_delegationManager",
        "type": "address",
        "internalType": "contract IDelegationManager"
      },
      {
        "name": "_metaSwap",
        "type": "address",
        "internalType": "contract IMetaSwap"
      },
      {
        "name": "_argsEqualityCheckEnforcer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "WHITELIST_ENFORCED",
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
    "name": "WHITELIST_NOT_ENFORCED",
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
    "name": "argsEqualityCheckEnforcer",
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
    "name": "delegationManager",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IDelegationManager"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "executeFromExecutor",
    "inputs": [
      {
        "name": "_mode",
        "type": "bytes32",
        "internalType": "ModeCode"
      },
      {
        "name": "_executionCalldata",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "returnData_",
        "type": "bytes[]",
        "internalType": "bytes[]"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "isAggregatorAllowed",
    "inputs": [
      {
        "name": "aggregatorIdHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "allowed",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isTokenAllowed",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ],
    "outputs": [
      {
        "name": "allowed",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "metaSwap",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IMetaSwap"
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
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setSwapApiSigner",
    "inputs": [
      {
        "name": "_newSigner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "swapApiSigner",
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
    "name": "swapByDelegation",
    "inputs": [
      {
        "name": "_signatureData",
        "type": "tuple",
        "internalType": "struct DelegationMetaSwapAdapter.SignatureData",
        "components": [
          {
            "name": "apiData",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "expiration",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      },
      {
        "name": "_delegations",
        "type": "tuple[]",
        "internalType": "struct Delegation[]",
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
      },
      {
        "name": "_useTokenWhitelist",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "swapTokens",
    "inputs": [
      {
        "name": "_aggregatorId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_tokenFrom",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "_tokenTo",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "_recipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_amountFrom",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_balanceFromBefore",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_swapData",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
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
    "name": "updateAllowedAggregatorIds",
    "inputs": [
      {
        "name": "_aggregatorIds",
        "type": "string[]",
        "internalType": "string[]"
      },
      {
        "name": "_statuses",
        "type": "bool[]",
        "internalType": "bool[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateAllowedTokens",
    "inputs": [
      {
        "name": "_tokens",
        "type": "address[]",
        "internalType": "contract IERC20[]"
      },
      {
        "name": "_statuses",
        "type": "bool[]",
        "internalType": "bool[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      {
        "name": "_token",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "_amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_recipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ChangedAggregatorIdStatus",
    "inputs": [
      {
        "name": "aggregatorIdHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "aggregatorId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "status",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ChangedTokenStatus",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "indexed": false,
        "internalType": "contract IERC20"
      },
      {
        "name": "status",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
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
    "name": "SentTokens",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "contract IERC20"
      },
      {
        "name": "recipient",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetArgsEqualityCheckEnforcer",
    "inputs": [
      {
        "name": "newArgsEqualityCheckEnforcer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetDelegationManager",
    "inputs": [
      {
        "name": "newDelegationManager",
        "type": "address",
        "indexed": true,
        "internalType": "contract IDelegationManager"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetMetaSwap",
    "inputs": [
      {
        "name": "newMetaSwap",
        "type": "address",
        "indexed": true,
        "internalType": "contract IMetaSwap"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SwapApiSignerUpdated",
    "inputs": [
      {
        "name": "newSigner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TryExecuteUnsuccessful",
    "inputs": [
      {
        "name": "batchExecutionindex",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "result",
        "type": "bytes",
        "indexed": false,
        "internalType": "bytes"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AddressEmptyCode",
    "inputs": [
      {
        "name": "target",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "AddressInsufficientBalance",
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
    "name": "AggregatorIdIsNotAllowed",
    "inputs": [
      {
        "name": "aggregatorId",
        "type": "string",
        "internalType": "string"
      }
    ]
  },
  {
    "type": "error",
    "name": "AmountFromMismatch",
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
    "name": "ExecutionFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FailedInnerCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FailedNativeTokenTransfer",
    "inputs": [
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "InputLengthsMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientTokens",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidApiSignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidEmptyDelegations",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidIdenticalTokens",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidSwapFunctionSelector",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidZeroAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MissingArgsEqualityCheckEnforcer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotDelegationManager",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotLeafDelegator",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotSelf",
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
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "SignatureExpired",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TokenFromIsNotAllowed",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ]
  },
  {
    "type": "error",
    "name": "TokenFromMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TokenToIsNotAllowed",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ]
  },
  {
    "type": "error",
    "name": "UnsupportedCallType",
    "inputs": [
      {
        "name": "callType",
        "type": "bytes1",
        "internalType": "CallType"
      }
    ]
  },
  {
    "type": "error",
    "name": "UnsupportedExecType",
    "inputs": [
      {
        "name": "execType",
        "type": "bytes1",
        "internalType": "ExecType"
      }
    ]
  }
] as const;
