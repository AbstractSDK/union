import { encodeFunctionData } from 'viem';
import { EVM_CONTRACTS, UCS01_CHANNELS } from './constants';
import { bexActionsAbi, ibcTokenActionsAbi } from './abis';
import { cosmosToEvmAddress } from '$lib/wallet/utilities/derive-address';

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

export const sendFullBalanceBackMsg = ({ evmChainId, tokens, unionReceiverAddress }: { evmChainId: keyof typeof EVM_CONTRACTS, tokens: string[], unionReceiverAddress: `union${string}` }): EvmMsg => {
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
      // allow_failure: true
    }
  }
}

/**
 * Actions to perform on bexswap specifically. TODO: genericize.
 */
export const bexSwapActionMsg = ({ baseAsset, quoteAsset, swapAmount }: { baseAsset: string; quoteAsset: string; swapAmount: bigint }): EvmMsg => {

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
    },
    // allow_failure: true
  }
}
