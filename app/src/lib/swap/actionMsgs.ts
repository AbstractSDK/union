// Actions to perform on the EVM side using Abstract Action contracts
import { encodeFunctionData } from 'viem';
import { EVM_CONTRACTS, UCS01_CHANNELS } from './constants';
import { bexActionsAbi, ibcTokenActionsAbi } from './abis';
import { cosmosToEvmAddress } from '$lib/wallet/utilities/derive-address';
import { isSupportedChainId } from './helpers';
import type { EvmAddress } from '$lib/wallet/types';

type EvmMsg = {
  call: {
    to: string;
    data: string;
    allow_failure?: boolean;
    value?: boolean;
  }
 } | {
  delegate_call: {
    to: string;
    data: string;
    allow_failure?: boolean;
    value?: boolean;
  }
}

export const sendFullBalanceBackMsg = ({ evmChainId, tokens, unionReceiverAddress }: { evmChainId: string, tokens: string[], unionReceiverAddress: `union${string}` }): EvmMsg => {
  if (!isSupportedChainId(evmChainId)) {
    throw new Error(`Unsupported chain id: ${evmChainId}`)
  }

  const ibcActionsAddress = EVM_CONTRACTS[evmChainId].ibc_actions
  return {
    delegate_call: {
      to: ibcActionsAddress,
      data: encodeFunctionData({
        abi: ibcTokenActionsAbi,
        functionName: "ibcSendPercentage",
        args: [
          ibcActionsAddress,
          {
            tokens: tokens.map((token) => ({
              denom: token,
              // 100%
              percentage: 1e6
            })),
            // TODO: EVM UCS channel id
            channelId: UCS01_CHANNELS[evmChainId],
            // TODO: User hex address on Union
            receiver: cosmosToEvmAddress(unionReceiverAddress),
            // receiver: "15cbba30256b961c37b3fd7224523abdf562fd72",
            extension: ""
          }
        ]
      }).slice(2),
      allow_failure: true
    }
  }
}

type SwapActionParams = { baseAsset: EvmAddress, quoteAsset: EvmAddress, swapAmount: bigint }

export const swapActionMsg = ({ evmChainId, baseAsset, quoteAsset, swapAmount }: { evmChainId: string } & SwapActionParams): EvmMsg => {
  switch (evmChainId) {
    case '80084': {
      return bexSwapActionMsg({ baseAsset, quoteAsset, swapAmount })
    }
    default:
      throw new Error(`Unsupported chain id: ${evmChainId}`)
  }
}

/**
 * Actions to perform on bexswap specifically.
 */
export const bexSwapActionMsg = ({ baseAsset, quoteAsset, swapAmount }: SwapActionParams): EvmMsg => {

  const bexSwapActionsAddress = EVM_CONTRACTS['80084'].bex_actions

  return {
    delegate_call: {
      to: bexSwapActionsAddress,
      data: encodeFunctionData({
        abi: bexActionsAbi,
        functionName: "swap",
        args: [
          bexSwapActionsAddress,
          {
            base: baseAsset,
            quote: quoteAsset,
            // amount?
            quantity: swapAmount
          }
        ]
      }).slice(2),
      allow_failure: true
    },
  }
}

