import Connect from "./connect.svelte"
import type { State } from "@wagmi/core"
import type { EvmWalletId } from "$lib/wallet/evm"
import type { AptosWalletId } from "$lib/wallet/aptos"
import type { CosmosWalletId } from "$lib/wallet/cosmos"

type Chain = "evm" | "cosmos" | "aptos"
type HoverState = "hover" | "none"
type ChainConnectStatus = State["status"]
type ChainWalletsInformation = ReadonlyArray<{
  id: string
  name: string
  icon: string
  download: string
}>

type Props<TChain extends Chain = Chain> = {
  chain: TChain
  hoverState: HoverState
  address: string | undefined
  connectStatus: ChainConnectStatus
  chainWalletsInformation: ChainWalletsInformation
  connectedWalletId:
    | (TChain extends "cosmos"
        ? CosmosWalletId
        : TChain extends "aptos"
          ? AptosWalletId
          : EvmWalletId)
    | null
    | undefined
  onConnectClick: (walletIdentifier: string) => void | Promise<void>
  onDisconnectClick: () => void
}

export { Connect, type Props, type Props as ConnectProps }
