type SupportedChainId = keyof typeof EVM_CONTRACTS
export type SupportedEvmVoiceChainId = SupportedChainId

export const EVM_CONTRACTS = {
  ['80084']: {
    evm_voice: '0x27485bC91038A1cC8642170cBdEBE0725829f49d',
    ibc_handler: "0x851c0EB711fe5C7c8fe6dD85d9A0254C8dd11aFD",
    ucs01_handler: "0x6F270608fB562133777AF0f71F6386ffc1737C30",
    bex_actions: '0xD7B680Ce6444E162AcD35D6213cFE75B3F3af1d5',
    ibc_actions: '0x00d14FB2734690E18D06f62656cbAb048B694AE1',
    croc_impact: '0xCfEa3579a06e2e9a596D311486D12B3a49a919Cd',
    muno: '0x08247b1C6D6AACF6C655f711661D5810380C8385'
  }
} as const

export const SWAPPABLE_ASSETS = {
  ['80084']: [{
    display_symbol: 'HONEY',
    symbol: 'HONEY',
    name: 'Honey',
    address: '0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03',
    unionDenom: 'factory/union1m87a5scxnnk83wfwapxlufzm58qe2v65985exff70z95a2yr86yq7hl08h/0x6263f6409ba2cd53e84f2bc19a5e718e25b5c7e499'
  },
  {
    display_symbol: 'UNO',
    symbol: 'UNO',
    name: 'Uno',
    address: '0x08247b1C6D6AACF6C655f711661D5810380C8385',
    unionDenom: 'muno'
  }]
} as const

type SwappableAssetSymbol<T extends SupportedChainId> = typeof SWAPPABLE_ASSETS[T][number]['display_symbol'];

export const PAIRS:  {[K in SupportedChainId]: Array<ReadonlyArray<SwappableAssetSymbol<K>>> } = {
  ['80084']: [
    ['HONEY', 'UNO']
  ]
} as const

export const UCS01_CHANNELS = {
  ['80084']: 'channel-3'
} as const

export const BERACHAIN_CONTRACTS = EVM_CONTRACTS['80084']

export const UNION_CONTRACTS = {
  evm_note: 'union10qdttl5qnqfsuvm852zrfysqkuydn0hwz6xe5472tv5590v95zhs49fdlh',
  ucs01_forwarder: 'union1m87a5scxnnk83wfwapxlufzm58qe2v65985exff70z95a2yr86yq7hl08h'
} as const
