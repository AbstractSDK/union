// Actions to perform on the EVM side using Abstract Action contracts
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

type SupportedEvmChainId = keyof typeof EVM_CONTRACTS

export const sendFullBalanceBackMsg = ({ evmChainId, tokens, unionReceiverAddress }: { evmChainId: SupportedEvmChainId, tokens: string[], unionReceiverAddress: `union${string}` }): EvmMsg => {
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

type SwapActionParams = { baseAsset: string, quoteAsset: string, swapAmount: bigint }

export const swapActionMsg = ({ evmChainId, baseAsset, quoteAsset, swapAmount }: { evmChainId: SupportedEvmChainId } & SwapActionParams): EvmMsg => {
  if (evmChainId === '80084') {
    return bexSwapActionMsg({ baseAsset, quoteAsset, swapAmount })
  }
  throw new Error('Unsupported chain id')
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
    },
    // allow_failure: true
  }
}

