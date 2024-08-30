import { derived, writable } from "svelte/store";
import type { Chain, UserAddresses } from "$lib/types";
import { userAddrEvm } from "$lib/wallet/evm";
import { userAddrCosmos } from "$lib/wallet/cosmos";
import { getSupportedAsset } from '$lib/utilities/helpers';
import { userBalancesQuery } from "../queries/balance";

export const fromChainId = writable<string>("union-testnet-8");
export const toChainId = writable<string>("80084");

export const fromAssetSymbol = writable("");
export const fromAssetAddress = writable("");
export const toAssetSymbol = writable("");
export const toAssetAddress = writable("");

export const createSwapStores = (chains: Chain[]) => {
  const userAddr = derived(
    [userAddrCosmos, userAddrEvm],
    ([$userAddrCosmos, $userAddrEvm]) => ({
      evm: $userAddrEvm,
      cosmos: $userAddrCosmos
    })
  );

  const userBalances = userBalancesQuery({ chains, userAddr, connected: true });

  const fromChain = derived(
    fromChainId,
    $fromChainId => chains.find(chain => chain.chain_id === $fromChainId) ?? null
  );

  const toChain = derived(
    toChainId,
    $toChainId => chains.find(chain => chain.chain_id === $toChainId) ?? null
  );

  const sendableBalances = derived([fromChainId, userBalances], ([$fromChainId, $userBalances]) => {
    // ... existing logic ...
  });

  const fromAsset = derived(
    [fromChain, userBalances, fromAssetAddress],
    ([$chain, $userBalances, $assetAddress]) => {
      // ... existing logic ...
    }
  );

  const toAsset = derived(
    [toChain, userBalances, toAssetAddress],
    ([$chain, $userBalances, $assetAddress]) => {
      // ... existing logic ...
    }
  );

  return {
    userAddr,
    userBalances,
    fromChain,
    toChain,
    sendableBalances,
    fromAsset,
    toAsset
  };
};
