import { createQuery } from '@tanstack/svelte-query';
import { readContract } from '@wagmi/core';
import { crocImpactAbi, evmVoiceAbi } from "./abis";
import { BERACHAIN_CONTRACTS, UNION_CONTRACTS } from './constants'; // Assuming you have this import
import { config } from '$lib/wallet/evm/config';
import type { EvmAddress } from '$lib/wallet/types';

export const bexSwapEstimateQuery = ({ baseAsset, quoteAsset, baseAmount }: { baseAsset: string | undefined; quoteAsset: string | undefined; baseAmount: bigint }) => {
  return createQuery({
    queryKey: ['bexSwapEstimate', baseAsset, quoteAsset, baseAmount],
    queryFn: async () => {
      if (!baseAsset || !quoteAsset || !baseAmount) {
        throw new Error('Invalid input');
      }
      const result = await readContract(config, {
        chainId: 80084,
        abi: crocImpactAbi,
        address: BERACHAIN_CONTRACTS.croc_impact,
        functionName: 'calcImpactCall',
        args: [
          baseAsset,
          quoteAsset,
          36000n, // poolIdx
          true, // isBuy
          true, // inBaseQty
          baseAmount, // qty
          0n, // poolTip
          21267430153580247136652501917186561137n // limitPrice
        ],
      });

      return result;
    },
    enabled: !!baseAsset && !!quoteAsset && !!baseAmount,
  });
};

export const evmProxyAddressQuery = ({ cosmosAddress, connectionId, evmChainId }: { cosmosAddress: `union${string}` | null; connectionId: string, evmChainId: string }) => (createQuery({
  queryKey: ['evmProxyAddress', evmChainId, cosmosAddress],
  queryFn: async () => {
    if (!cosmosAddress) throw new Error('Cosmos address is required')

    return readContract(config, {
      chainId: 80084, // TODO: Don't hardcode this
      abi: evmVoiceAbi,
      address: BERACHAIN_CONTRACTS.evm_voice,
      functionName: 'getExpectedProxyAddress',
      args: [{
        // connection from evm -> union
        connection: connectionId,
        // port on union
        port: `wasm.${UNION_CONTRACTS.evm_note}`,
        sender: cosmosAddress
      }]
    }) as Promise<EvmAddress>
  },
  enabled: !!cosmosAddress
}))
