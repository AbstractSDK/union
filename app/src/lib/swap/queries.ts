import { createQuery } from '@tanstack/svelte-query';
import { readContract } from '@wagmi/core';
import { crocImpactAbi } from "./abis";
import { BERACHAIN_CONTRACTS } from './constants'; // Assuming you have this import
import { config } from '$lib/wallet/evm/config';

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
