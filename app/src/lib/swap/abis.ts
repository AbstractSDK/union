export const ibcTokenActionsAbi = [
  {
    'type': 'constructor',
    'inputs': [
      {
        'name': 'tokenRelay_',
        'type': 'address',
        'internalType': 'contract IRelay',
      },
      {
        'name': 'timeout_',
        'type': 'uint64',
        'internalType': 'uint64',
      },
      {
        'name': 'admin',
        'type': 'address',
        'internalType': 'address',
      },
    ],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'function',
    'name': 'PERCENTAGE_SCALE',
    'inputs': [],
    'outputs': [
      {
        'name': '',
        'type': 'uint32',
        'internalType': 'uint32',
      },
    ],
    'stateMutability': 'view',
  },
  {
    'type': 'function',
    'name': 'ibcSend',
    'inputs': [
      {
        'name': 'executor',
        'type': 'address',
        'internalType': 'contract IbcTokenActions',
      },
      {
        'name': 'sendMessage',
        'type': 'tuple',
        'internalType': 'struct IbcTokenActions.IbcSendMessage',
        'components': [
          {
            'name': 'tokens',
            'type': 'tuple[]',
            'internalType': 'struct LocalToken[]',
            'components': [
              {
                'name': 'denom',
                'type': 'address',
                'internalType': 'address',
              },
              {
                'name': 'amount',
                'type': 'uint128',
                'internalType': 'uint128',
              },
            ],
          },
          {
            'name': 'channelId',
            'type': 'string',
            'internalType': 'string',
          },
          {
            'name': 'receiver',
            'type': 'bytes',
            'internalType': 'bytes',
          },
          {
            'name': 'extension',
            'type': 'string',
            'internalType': 'string',
          },
        ],
      },
    ],
    'outputs': [
      {
        'name': '',
        'type': 'bool',
        'internalType': 'bool',
      },
      {
        'name': '',
        'type': 'bytes',
        'internalType': 'bytes',
      },
    ],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'function',
    'name': 'ibcSendPercentage',
    'inputs': [
      {
        'name': 'executor',
        'type': 'address',
        'internalType': 'contract IbcTokenActions',
      },
      {
        'name': 'percentageMessage',
        'type': 'tuple',
        'internalType': 'struct IbcTokenActions.IbcSendPercentageMessage',
        'components': [
          {
            'name': 'tokens',
            'type': 'tuple[]',
            'internalType': 'struct IbcTokenActions.PercentToken[]',
            'components': [
              {
                'name': 'denom',
                'type': 'address',
                'internalType': 'address',
              },
              {
                'name': 'percentage',
                'type': 'uint32',
                'internalType': 'uint32',
              },
            ],
          },
          {
            'name': 'channelId',
            'type': 'string',
            'internalType': 'string',
          },
          {
            'name': 'receiver',
            'type': 'bytes',
            'internalType': 'bytes',
          },
          {
            'name': 'extension',
            'type': 'string',
            'internalType': 'string',
          },
        ],
      },
    ],
    'outputs': [
      {
        'name': '',
        'type': 'bool',
        'internalType': 'bool',
      },
      {
        'name': '',
        'type': 'bytes',
        'internalType': 'bytes',
      },
    ],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'function',
    'name': 'owner',
    'inputs': [],
    'outputs': [
      {
        'name': '',
        'type': 'address',
        'internalType': 'address',
      },
    ],
    'stateMutability': 'view',
  },
  {
    'type': 'function',
    'name': 'paused',
    'inputs': [],
    'outputs': [
      {
        'name': '',
        'type': 'bool',
        'internalType': 'bool',
      },
    ],
    'stateMutability': 'view',
  },
  {
    'type': 'function',
    'name': 'renounceOwnership',
    'inputs': [],
    'outputs': [],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'function',
    'name': 'setTimeout',
    'inputs': [
      {
        'name': 'newTimeout',
        'type': 'uint64',
        'internalType': 'uint64',
      },
    ],
    'outputs': [],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'function',
    'name': 'setTokenRelay',
    'inputs': [
      {
        'name': 'newTokenRelay',
        'type': 'address',
        'internalType': 'contract IRelay',
      },
    ],
    'outputs': [],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'function',
    'name': 'timeout',
    'inputs': [],
    'outputs': [
      {
        'name': '',
        'type': 'uint64',
        'internalType': 'uint64',
      },
    ],
    'stateMutability': 'view',
  },
  {
    'type': 'function',
    'name': 'tokenRelay',
    'inputs': [],
    'outputs': [
      {
        'name': '',
        'type': 'address',
        'internalType': 'contract IRelay',
      },
    ],
    'stateMutability': 'view',
  },
  {
    'type': 'function',
    'name': 'transferOwnership',
    'inputs': [
      {
        'name': 'newOwner',
        'type': 'address',
        'internalType': 'address',
      },
    ],
    'outputs': [],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'event',
    'name': 'IbcSend',
    'inputs': [
      {
        'name': 'receiver',
        'type': 'bytes',
        'indexed': true,
        'internalType': 'bytes',
      },
      {
        'name': 'tokens',
        'type': 'tuple[]',
        'indexed': false,
        'internalType': 'struct LocalToken[]',
        'components': [
          {
            'name': 'denom',
            'type': 'address',
            'internalType': 'address',
          },
          {
            'name': 'amount',
            'type': 'uint128',
            'internalType': 'uint128',
          },
        ],
      },
      {
        'name': 'extension',
        'type': 'string',
        'indexed': false,
        'internalType': 'string',
      },
    ],
    'anonymous': false,
  },
  {
    'type': 'event',
    'name': 'OwnershipTransferred',
    'inputs': [
      {
        'name': 'previousOwner',
        'type': 'address',
        'indexed': true,
        'internalType': 'address',
      },
      {
        'name': 'newOwner',
        'type': 'address',
        'indexed': true,
        'internalType': 'address',
      },
    ],
    'anonymous': false,
  },
  {
    'type': 'event',
    'name': 'Paused',
    'inputs': [
      {
        'name': 'account',
        'type': 'address',
        'indexed': false,
        'internalType': 'address',
      },
    ],
    'anonymous': false,
  },
  {
    'type': 'event',
    'name': 'Unpaused',
    'inputs': [
      {
        'name': 'account',
        'type': 'address',
        'indexed': false,
        'internalType': 'address',
      },
    ],
    'anonymous': false,
  },
  {
    'type': 'error',
    'name': 'EnforcedPause',
    'inputs': [],
  },
  {
    'type': 'error',
    'name': 'ExpectedPause',
    'inputs': [],
  },
  {
    'type': 'error',
    'name': 'FailedApproval',
    'inputs': [
      {
        'name': 'token',
        'type': 'address',
        'internalType': 'address',
      },
      {
        'name': 'amount',
        'type': 'uint128',
        'internalType': 'uint128',
      },
    ],
  },
  {
    'type': 'error',
    'name': 'InvalidPercentage',
    'inputs': [
      {
        'name': 'percentage',
        'type': 'uint32',
        'internalType': 'uint32',
      },
      {
        'name': 'max',
        'type': 'uint32',
        'internalType': 'uint32',
      },
    ],
  },
  {
    'type': 'error',
    'name': 'OwnableInvalidOwner',
    'inputs': [
      {
        'name': 'owner',
        'type': 'address',
        'internalType': 'address',
      },
    ],
  },
  {
    'type': 'error',
    'name': 'OwnableUnauthorizedAccount',
    'inputs': [
      {
        'name': 'account',
        'type': 'address',
        'internalType': 'address',
      },
    ],
  },
]

export const bexActionsAbi = [
  {
    'type': 'constructor',
    'inputs': [
      {
        'name': 'owner',
        'type': 'address',
        'internalType': 'address',
      },
      {
        'name': 'bexSwap_',
        'type': 'address',
        'internalType': 'contract IBex',
      },
    ],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'function',
    'name': 'bexSwap',
    'inputs': [],
    'outputs': [
      {
        'name': '',
        'type': 'address',
        'internalType': 'contract IBex',
      },
    ],
    'stateMutability': 'view',
  },
  {
    'type': 'function',
    'name': 'owner',
    'inputs': [],
    'outputs': [
      {
        'name': '',
        'type': 'address',
        'internalType': 'address',
      },
    ],
    'stateMutability': 'view',
  },
  {
    'type': 'function',
    'name': 'paused',
    'inputs': [],
    'outputs': [
      {
        'name': '',
        'type': 'bool',
        'internalType': 'bool',
      },
    ],
    'stateMutability': 'view',
  },
  {
    'type': 'function',
    'name': 'renounceOwnership',
    'inputs': [],
    'outputs': [],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'function',
    'name': 'setBexSwap',
    'inputs': [
      {
        'name': 'bexSwap_',
        'type': 'address',
        'internalType': 'contract IBex',
      },
    ],
    'outputs': [],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'function',
    'name': 'swap',
    'inputs': [
      {
        'name': 'executor',
        'type': 'address',
        'internalType': 'contract BexActions',
      },
      {
        'name': 'swapMessage',
        'type': 'tuple',
        'internalType': 'struct BexActions.SwapMessage',
        'components': [
          {
            'name': 'base',
            'type': 'address',
            'internalType': 'address',
          },
          {
            'name': 'quote',
            'type': 'address',
            'internalType': 'address',
          },
          {
            'name': 'quantity',
            'type': 'uint128',
            'internalType': 'uint128',
          },
        ],
      },
    ],
    'outputs': [
      {
        'name': 'baseQuote',
        'type': 'int128',
        'internalType': 'int128',
      },
      {
        'name': 'quoteFlow',
        'type': 'int128',
        'internalType': 'int128',
      },
    ],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'function',
    'name': 'transferOwnership',
    'inputs': [
      {
        'name': 'newOwner',
        'type': 'address',
        'internalType': 'address',
      },
    ],
    'outputs': [],
    'stateMutability': 'nonpayable',
  },
  {
    'type': 'event',
    'name': 'OwnershipTransferred',
    'inputs': [
      {
        'name': 'previousOwner',
        'type': 'address',
        'indexed': true,
        'internalType': 'address',
      },
      {
        'name': 'newOwner',
        'type': 'address',
        'indexed': true,
        'internalType': 'address',
      },
    ],
    'anonymous': false,
  },
  {
    'type': 'event',
    'name': 'Paused',
    'inputs': [
      {
        'name': 'account',
        'type': 'address',
        'indexed': false,
        'internalType': 'address',
      },
    ],
    'anonymous': false,
  },
  {
    'type': 'event',
    'name': 'SwapReceived',
    'inputs': [
      {
        'name': 'base',
        'type': 'address',
        'indexed': true,
        'internalType': 'address',
      },
      {
        'name': 'quote',
        'type': 'address',
        'indexed': true,
        'internalType': 'address',
      },
      {
        'name': 'quantity',
        'type': 'uint128',
        'indexed': false,
        'internalType': 'uint128',
      },
    ],
    'anonymous': false,
  },
  {
    'type': 'event',
    'name': 'Unpaused',
    'inputs': [
      {
        'name': 'account',
        'type': 'address',
        'indexed': false,
        'internalType': 'address',
      },
    ],
    'anonymous': false,
  },
  {
    'type': 'error',
    'name': 'EnforcedPause',
    'inputs': [],
  },
  {
    'type': 'error',
    'name': 'ExpectedPause',
    'inputs': [],
  },
  {
    'type': 'error',
    'name': 'FailedApproval',
    'inputs': [
      {
        'name': 'token',
        'type': 'address',
        'internalType': 'address',
      },
      {
        'name': 'amount',
        'type': 'uint128',
        'internalType': 'uint128',
      },
    ],
  },
  {
    'type': 'error',
    'name': 'OwnableInvalidOwner',
    'inputs': [
      {
        'name': 'owner',
        'type': 'address',
        'internalType': 'address',
      },
    ],
  },
  {
    'type': 'error',
    'name': 'OwnableUnauthorizedAccount',
    'inputs': [
      {
        'name': 'account',
        'type': 'address',
        'internalType': 'address',
      },
    ],
  },
]
