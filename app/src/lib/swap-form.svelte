<script lang="ts">
import ChainsGate from "$lib/components/chains-gate.svelte"
import ChainDialog from "../routes/transfer/(components)/chain-dialog.svelte"
import ChainButton from "../routes/transfer/(components)/chain-button.svelte"
import { derived, writable, type Readable } from "svelte/store"
import { userAddrEvm } from "$lib/wallet/evm"
import { userAddrCosmos } from "$lib/wallet/cosmos"
import AssetsDialog from "../routes/transfer/(components)/assets-dialog.svelte"
import { Input } from "$lib/components/ui/input/index.js"

import * as Card from "$lib/components/ui/card/index.ts"
import { UnionClient } from "@union/client"
import { Button } from "$lib/components/ui/button"
import type { Chain, UserAddresses } from "$lib/types.ts"
import { encodeFunctionData, formatUnits, parseUnits } from 'viem'
import { bexActionsAbi, evmVoiceAbi, ibcTokenActionsAbi } from '$lib/swap/abis.ts'
import { truncate } from '$lib/utilities/format.ts'
import CardSectionHeading from '../routes/transfer/(components)/card-section-heading.svelte'
import Chevron from '../routes/transfer/(components)/chevron.svelte'
import { getSupportedAsset } from '$lib/utilities/helpers.ts'
import { sepolia, berachainTestnetbArtio, arbitrumSepolia } from "viem/chains"
import { readContract } from '@wagmi/core'
import { config } from '$lib/wallet/evm/config.ts'
import { rawToBech32 } from '$lib/utilities/address.ts'
import { cosmosToEvmAddress } from '$lib/wallet/utilities/derive-address.ts'
import { userBalancesQuery } from "./queries/balance";
import { cn } from "./utilities/shadcn";
import { BERACHAIN_CONTRACTS, SWAPPABLE_ASSETS, UNION_CONTRACTS } from "./swap/constants";
import { bexSwapEstimateQuery } from "./swap/queries"
import { toast } from "svelte-sonner";
    import { bexSwapActionMsg, sendFullBalanceBackMsg as sendFullBalanceBackActionMsg } from "./swap/actions";

const ENABLED_FROM_CHAIN_IDS = ["union-testnet-8"]
const ENABLED_TO_CHAIN_IDS = ["80084"]
const FROM_CHAIN_ID = ENABLED_FROM_CHAIN_IDS[0]
const TO_CHAIN_ID = ENABLED_TO_CHAIN_IDS[0]

export let chains: Array<Chain>

// CURRENT FORM STATE
let fromChainId = writable(FROM_CHAIN_ID)
let toChainId = writable(TO_CHAIN_ID)

$: userBalances = userBalancesQuery({ chains, userAddr: $userAddr, connected: true })

$: sendableBalances = derived([fromChainId, userBalances], ([$fromChainId, $userBalances]) => {
  if (!$fromChainId) return
  const chainIndex = chains.findIndex(c => c.chain_id === $fromChainId)
  const cosmosBalance = $userBalances[chainIndex]
  if (!cosmosBalance?.isSuccess || cosmosBalance.data instanceof Error) {
    console.log("trying to send from cosmos but no balances fetched yet")
    return null
  }
  return cosmosBalance.data.map(balance => ({ ...balance, balance: BigInt(balance.balance) }))
})

let prevFromAsset: string
$: fromAsset = derived(
  [fromChain, userBalances, fromAssetAddress],
  ([$chain, $userBalances, $assetAddress]) => {
    if ($chain === null || $assetAddress === "") return null

    const chainIndex = chains.findIndex(c => c.chain_id === $chain.chain_id)
    const userBalance = $userBalances[chainIndex]
    if (!userBalance.isSuccess) {
      return null
    }
    let balance = userBalance.data.find(balance => balance.address === $assetAddress)
    if (!balance) {
      return null
    }
    if (prevFromAsset !== balance.address) swapAmount = ""
    prevFromAsset = balance.address
    return balance
  }
)

let supportedFromAsset: any
$: if ($fromChain && $fromAsset) supportedFromAsset = getSupportedAsset($fromChain, $fromAsset.address)

let prevToAsset: string
$: toAsset = derived(
  [toChain, userBalances, toAssetAddress],
  ([$chain, $userBalances, $assetAddress]) => {
    if ($chain === null || $assetAddress === "") return null

    const chainIndex = chains.findIndex(c => c.chain_id === $chain.chain_id)
    const userBalance = $userBalances[chainIndex]
    if (!userBalance.isSuccess) {
      return null
    }
    let balance = userBalance.data.find(balance => balance.address === $assetAddress)
    if (!balance) {
      return null
    }
    if (prevToAsset !== balance.address) swapAmount = ""
    prevToAsset = balance.address
    return balance
  }
)

let supportedToAsset: any
$: if ($toChain && $toAsset) supportedToAsset = getSupportedAsset($toChain, $toAsset.address)

let swapAmount = ""
$: amountLargerThanZero = Number.parseFloat(swapAmount) > 0

const amountRegex = /[^0-9.]|\.(?=\.)|(?<=\.\d+)\./g
$: swapAmount = swapAmount.replaceAll(amountRegex, "")

let balanceCoversAmount: boolean
$: if ($fromChain && $fromAsset && swapAmount) {
  try {
    const supported = getSupportedAsset($fromChain, $fromAsset.address)
    const decimals = supported ? supported?.decimals : 0
    const inputAmount = parseUnits(swapAmount.toString(), decimals)
    const balance = BigInt($fromAsset.balance.toString())
    balanceCoversAmount = inputAmount <= balance
  } catch (error) {
    console.error("Error parsing amount or balance:", error)
  }
}

let toChain = derived(toChainId, () => chains.find(chain => chain.chain_id === $toChainId) ?? null)

let fromChain = derived(
  fromChainId,
  $fromChainId => chains.find(chain => chain.chain_id === $fromChainId) ?? null
)

let dialogOpenFromToken = false
let dialogOpenToToken = false
let dialogOpenToChain = false
let dialogOpenFromChain = false

let fromAssetSymbol = writable("")
let fromAssetAddress = writable("")
let toAssetSymbol = writable("")
let toAssetAddress = writable("")

// TODO: retrieve these from the actual swap factories
$: swapToTokens = derived([toChainId], ([$toChainId]) =>  (SWAPPABLE_ASSETS[$toChainId as keyof typeof SWAPPABLE_ASSETS] || []).map(asset => ({
  ...asset,
  balance: BigInt(0)
})))

let userAddr: Readable<UserAddresses> = derived(
  [userAddrCosmos, userAddrEvm],
  ([$userAddrCosmos, $userAddrEvm]) => ({
    evm: $userAddrEvm,
    cosmos: $userAddrCosmos
  })
)

const SWAP_AMOUNT = 7

const swap = async () => {
  if (!$fromChain) return toast.error("can't find fromChain in config")
  if (!$fromAsset) return toast.error(`Error finding fromAsset`)
  if (!$toChain) return toast.error("can't find toChain in config")
  if (!$fromAsset) return toast.error(`Error finding fromAsset`)
  if (!swapAmount) return toast.error("Please select an amount")

  let supported = getSupportedAsset($fromChain, $fromAsset.address)
  let decimals = supported?.decimals ?? 0
  let parsedSwapAmount = parseUnits(swapAmount, decimals)

  const cosmosOfflineSigner = window?.keplr?.getOfflineSigner($fromChainId, {
    disableBalanceCheck: false
  })

  // TODO: don't hardcode union
  const cosmosClient = new UnionClient({
    cosmosOfflineSigner,
    evmSigner: undefined,
    bech32Prefix: "union",
    chainId: $fromChainId,
    gas: { denom: "UNO", amount: "0.0025" },
    rpcUrl: `https://rpc.testnet-8.union.build`
  })

  const cosmosAddress = await cosmosClient.getCosmosSdkAccount().then(({ address }) => address) as `union${string}`;

  // Queries for users proxy address on bartio
  const evmProxyAddress = await readContract(config, {
    // TODO: don't hardcode
    chainId: 80084,
    abi: evmVoiceAbi,
    address: BERACHAIN_CONTRACTS.evm_voice,
    functionName: 'getExpectedProxyAddress',
    args: [{
      connection: 'connection-0',
      port: `wasm.${UNION_CONTRACTS.evm_note}`,
      sender: cosmosAddress
    }]
  }) as string

  console.log(evmProxyAddress);

  await cosmosClient.transferAssets(
    {
      kind: "cosmwasm",
      instructions: [
        {
          contractAddress: UNION_CONTRACTS.ucs01_forwarder,
          msg: {
            transfer: {
              // TODO: don't hardcode
              // Bartio channel id
              channel: "channel-86",
              receiver: evmProxyAddress.slice(2),
              memo: ""
            }
          },
          funds: [{ denom: $fromAsset.address, amount: parsedSwapAmount.toString() }]
        }
      ]
    })

  // TODO: wait for transfer to be confirmed

  const evmNoteMsg = {
    kind: "cosmwasm",
    instructions: [
      {
        contractAddress: UNION_CONTRACTS.evm_note,
        msg: {
          execute: {
            msgs: [
              // swap
              bexSwapActionMsg({
                // TODO: how do we dynamically resolve this?
                // $fromAsset, but on toChain (uno on bera)
                baseAsset: BERACHAIN_CONTRACTS.muno,
                quoteAsset: $toAssetAddress,
                swapAmount: parsedSwapAmount
              }),
              // send
              sendFullBalanceBackActionMsg({
                evmChainId: '80084',
                tokens: [$toAssetAddress],
                unionReceiverAddress: cosmosAddress
              }),
            ],
            callback: null,
            timeout_seconds: "5000000"
          }
        }
      }
    ]
  }

  // @ts-ignore
  const cosmosTransfer = await cosmosClient.transferAssets(evmNoteMsg)
  console.log(`https://explorer.nodestake.org/union-testnet/tx/${cosmosTransfer.transactionHash}`)
}
</script>


<ChainsGate let:chains>
  <div class="size-full flex flex-col items-center gap-6 m-6">
    <Card.Root class="max-w-xl flex flex-col w-full">
    <Card.Header>
      <Card.Title>From</Card.Title>
      <Card.Description>
        Chain to start the swap
      </Card.Description>
    </Card.Header>
      <Card.Content>
        <section>
          <ChainButton bind:dialogOpen={dialogOpenFromChain} bind:selectedChainId={$fromChainId}>{$fromChain?.display_name ?? "Select from chain"}</ChainButton>
        </section>
        <section>
          <CardSectionHeading>Asset</CardSectionHeading>
          {#if $sendableBalances !== undefined && $fromChainId}
            {#if $sendableBalances === null}
              Failed to load sendable balances for <b>{$fromChain?.display_name}</b>.
            {:else if $sendableBalances && $sendableBalances.length === 0}
              You don't have sendable assets on <b>{$fromChain?.display_name}</b>. You can get some from <a
              class="underline font-bold" href="/faucet">the faucet</a>
            {:else}
              <Button
                class="w-full"
                variant="outline"
                on:click={() => (dialogOpenFromToken = !dialogOpenFromToken)}
              >
                <div
                  class="flex-1 text-left font-bold text-md">{truncate(supportedFromAsset ? supportedFromAsset.display_symbol : $fromAssetSymbol ? $fromAssetSymbol : 'Select Asset', 12)}</div>

                <Chevron/>
              </Button>
            {/if}
          {:else}
            Select a chain to swap from.
          {/if}
          {#if $fromAssetSymbol !== '' && $sendableBalances !== null && $fromAsset?.address}
            <div class="mt-4 text-xs text-muted-foreground">
              <b>{truncate(supportedFromAsset ? supportedFromAsset?.display_symbol : $fromAssetSymbol, 12)}</b> balance on
              <b>{$fromChain?.display_name}</b> is
              {formatUnits(BigInt($fromAsset.balance), supportedFromAsset?.decimals ?? 0)}
            </div>
          {/if}
        </section>
        <section>
          <CardSectionHeading>Amount</CardSectionHeading>
          <Input
            autocapitalize="none"
            autocomplete="off"
            autocorrect="off"
            type="number"
            inputmode="decimal"
            bind:value={swapAmount}
            class={cn(
              !balanceCoversAmount && swapAmount ? 'border-red-500' : '',
              'focus:ring-0 focus-visible:ring-0 disabled:bg-black/30',
            )}
            disabled={!$fromAsset}
            maxlength={64}
            minlength={1}
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0.00"
            spellcheck="false"
          />
        </section>
      </Card.Content>
    </Card.Root>
    <Card.Root class="max-w-xl flex flex-col w-full">
    <Card.Header>
      <Card.Title>To</Card.Title>
      <Card.Description>
        Chain to swap where the swap will be performed on
      </Card.Description>
    </Card.Header>
      <Card.Content>
        <section>
          <ChainButton bind:dialogOpen={dialogOpenToChain} bind:selectedChainId={$toChainId}>{$toChain?.display_name ?? "Select chain"}</ChainButton>
        </section>
        <section>
          <CardSectionHeading>Asset</CardSectionHeading>
          {#if $swapToTokens !== undefined && $toChainId}
            {#if $swapToTokens === null}
              Failed to load sendable balances for <b>{$toChain?.display_name}</b>.
            {:else if $swapToTokens && $swapToTokens.length === 0}
              No swaps are available on <b>{$toChain?.display_name}</b>. Please select a different chains.
            {:else}
              <Button
                class="w-full"
                variant="outline"
                on:click={() => (dialogOpenToToken = !dialogOpenToToken)}
              >
                <div
                  class="flex-1 text-left font-bold text-md">{truncate(supportedToAsset ? supportedToAsset.display_symbol : $toAssetSymbol ? $toAssetSymbol : 'Select Asset', 12)}</div>

                <Chevron/>
              </Button>
            {/if}
          {:else}
            Select a chain to swap from.
          {/if}
          {#if $toAssetSymbol !== '' && $swapToTokens !== null && $toAsset?.address}
            <div class="mt-4 text-xs text-muted-foreground">
              <b>{truncate(supportedToAsset ? supportedToAsset?.display_symbol : $toAssetSymbol, 12)}</b> balance on
              <b>{$toChain?.display_name}</b> is
              {formatUnits(BigInt($toAsset.balance), supportedToAsset?.decimals ?? 0)}
            </div>
          {/if}
        </section>
      </Card.Content>
    </Card.Root>
    <Button
      on:click={async event => {
        swap()
      }}
      type="button"
    >
      Swap
    </Button>
  </div>


  <ChainDialog
    bind:dialogOpen={dialogOpenFromChain}
    chains={chains.filter(c => c.enabled_staging).filter(c => ENABLED_FROM_CHAIN_IDS.includes(c.chain_id))}
    kind="from"
    onChainSelect={newSelectedChain => {
      fromChainId.set(newSelectedChain)
    }}
    selectedChain={$fromChainId}
    userAddr={$userAddr}
  />

  <ChainDialog
    bind:dialogOpen={dialogOpenToChain}
    chains={chains.filter(c => c.enabled_staging).filter(c => ENABLED_TO_CHAIN_IDS.includes(c.chain_id))}
    kind="to"
    onChainSelect={newSelectedChain => {
      toChainId.set(newSelectedChain)
    }}
    selectedChain={$toChainId}
    userAddr={$userAddr}
  />

</ChainsGate>

<!-- From chain asset selector -->
{#if $fromChain !== null}
  <AssetsDialog
    chain={$fromChain}
    assets={$sendableBalances}
    onAssetSelect={asset => {
      console.log('Selected Asset: ', asset)
      fromAssetSymbol.set(asset.symbol)
      fromAssetAddress.set(asset.address)
    }}
    bind:dialogOpen={dialogOpenFromToken}
  />
{/if}

<!-- To chain asset selector -->
{#if $toChain !== null}
  <AssetsDialog
    chain={$toChain}
    assets={$swapToTokens}
    onAssetSelect={asset => {
      console.log('Selected Swap To Asset: ', asset)
      toAssetSymbol.set(asset.symbol)
      toAssetAddress.set(asset.address)
    }}
    bind:dialogOpen={dialogOpenToToken}
  />
{/if}
