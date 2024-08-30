import { createMutation } from "@tanstack/svelte-query";
import { UNION_CONTRACTS } from "./constants";
import { UnionClient } from "@union/client";
import { sendFullBalanceBackMsg, swapActionMsg } from "./actionMsgs";
import { toast } from "svelte-sonner";
import type { Chain } from "$lib/types";
import type { EvmAddress } from "$lib/wallet/types";

interface TransferToEvmParams {
  unionClient: UnionClient;
  asset: {
    denom: string
    amount: bigint
  }
  channelId: `channel-${string}`
  receiver: EvmAddress;
}

export const createTransferToEvmMutation = () => createMutation({
  mutationFn: async ({
    unionClient: cosmosClient,
    asset: { denom, amount },
    channelId,
    receiver,
  }: TransferToEvmParams) => {
    await cosmosClient.transferAssets({
      kind: "cosmwasm",
      instructions: [
        {
          contractAddress: UNION_CONTRACTS.ucs01_forwarder,
          msg: {
            transfer: {
              channel: channelId,
              receiver: receiver.slice(2),
              memo: ""
            }
          },
          funds: [{ denom: denom, amount: amount.toString() }]
        }
      ]
    });
  },
  onError: (error) => {
    toast.error(`Transfer to EVM failed: ${error.message}`);
  },
  onSuccess: () => {
    toast.success("Transfer to EVM completed successfully");
  },
});


interface EvmSwapParams {
  unionClient: UnionClient
  toChain: Chain
  fromAssetAddress: EvmAddress;
  toAssetAddress: EvmAddress;
  amount: bigint;
  receiverAddrUnion: `union${string}`;
}

export const createEvmSwapMutation = () => createMutation({
  mutationFn: async ({
    unionClient: cosmosClient,
    toChain,
    toAssetAddress,
    amount: parsedSwapAmount,
    fromAssetAddress: baseAsset,
    receiverAddrUnion: unionAddr,
  }: EvmSwapParams) => {
    // Perform the swap
    const evmNoteMsg = [
      {
        contractAddress: UNION_CONTRACTS.evm_note,
        msg: {
          execute: {
            msgs: [
              swapActionMsg({
                evmChainId: toChain.chain_id,
                baseAsset,
                quoteAsset: toAssetAddress,
                swapAmount: parsedSwapAmount
              }),
              sendFullBalanceBackMsg({
                evmChainId: toChain.chain_id,
                tokens: [toAssetAddress],
                unionReceiverAddress: unionAddr
              }),
            ],
            callback: null,
            timeout_seconds: "5000000"
          }
        }
      }
    ];

    return await cosmosClient.cosmwasmMessageExecuteContract(evmNoteMsg);
  },
  onError: (error) => {
    toast.error(`Swap failed: ${error.message}`);
  },
  onSuccess: (cosmosTransfer) => {
    console.log(`https://explorer.nodestake.org/union-testnet/tx/${cosmosTransfer.transactionHash}`);
    toast.success("Swap completed successfully");
  },
});

