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

const FROM_CHAIN_ID = "union-testnet-8"
const TO_CHAIN_ID = "80084"


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
    if (prevFromAsset !== balance.address) amount = ""
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
    if (prevToAsset !== balance.address) amount = ""
    prevToAsset = balance.address
    return balance
  }
)

let supportedToAsset: any
$: if ($toChain && $toAsset) supportedToAsset = getSupportedAsset($toChain, $toAsset.address)


let amount = ""
$: amountLargerThanZero = Number.parseFloat(amount) > 0

const amountRegex = /[^0-9.]|\.(?=\.)|(?<=\.\d+)\./g
$: amount = amount.replaceAll(amountRegex, "")

let balanceCoversAmount: boolean
$: if ($fromChain && $fromAsset && amount) {
  try {
    const supported = getSupportedAsset($fromChain, $fromAsset.address)
    const decimals = supported ? supported?.decimals : 0
    const inputAmount = parseUnits(amount.toString(), decimals)
    const balance = BigInt($fromAsset.balance.toString())
    balanceCoversAmount = inputAmount <= balance
  } catch (error) {
    console.error("Error parsing amount or balance:", error)
  }
}

// let toChain = derived(
//   toChainId,
//   $toChainId => chains.find(chain => chain.chain_id === $toChainId) ?? null
// )

let toChain = derived(fromChainId, () => chains.find(chain => chain.chain_id === "80084") ?? null)

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
$: swapToTokens = derived([toChainId], ([$toChainId]) =>  [{
  symbol: 'HONEY',
  name: 'Honey',
  address: '0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03',
  balance: BigInt(0)
}])

let userAddr: Readable<UserAddresses> = derived(
  [userAddrCosmos, userAddrEvm],
  ([$userAddrCosmos, $userAddrEvm]) => ({
    evm: $userAddrEvm,
    cosmos: $userAddrCosmos
  })
)

const EVM_CONTRACTS = {
  bartio: {
    evm_voice: '0x27485bC91038A1cC8642170cBdEBE0725829f49d',
    ibc_handler: "0x851c0EB711fe5C7c8fe6dD85d9A0254C8dd11aFD",
    ucs01_handler: "0x6F270608fB562133777AF0f71F6386ffc1737C30",
    bex_actions: '0xD7B680Ce6444E162AcD35D6213cFE75B3F3af1d5',
    ibc_actions: '0x00d14FB2734690E18D06f62656cbAb048B694AE1'
  }
} as const

const BERACHAIN_CONTRACTS = EVM_CONTRACTS['bartio']


const UNION_CONTRACTS = {
  evm_note: 'union10qdttl5qnqfsuvm852zrfysqkuydn0hwz6xe5472tv5590v95zhs49fdlh',
  ucs01_forwarder: 'union1m87a5scxnnk83wfwapxlufzm58qe2v65985exff70z95a2yr86yq7hl08h'
} as const

const SWAP_AMOUNT = 7

const swap = async () => {
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

  const cosmosAddress = await cosmosClient.getCosmosSdkAccount().then(({ address }) => address);

  // Queries for users proxy address on bartio
  const evmProxyAddress = await readContract(config, {
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

  const cosmosBalances = await cosmosClient.getCosmosSdkBalances()
  console.log(cosmosBalances)

  await cosmosClient.transferAssets(
    {
      kind: "cosmwasm",
      instructions: [
        {
          contractAddress: UNION_CONTRACTS.ucs01_forwarder,
          msg: {
            transfer: {
              channel: "channel-86",
              receiver: evmProxyAddress.slice(2),
              memo: ""
            }
          },
          funds: [{ denom: "muno", amount: SWAP_AMOUNT.toString() }]
        }
      ]
    })

  const evmNoteMsg = {
    kind: "cosmwasm",
    instructions: [
      {
        contractAddress: UNION_CONTRACTS.evm_note,
        msg: {
          execute: {
            msgs: [
              // swap
              {
                delegate_call: {
                  to: BERACHAIN_CONTRACTS.bex_actions,
                  data: encodeFunctionData({
                    abi: bexActionsAbi,
                    functionName: "swap",
                    args: [
                      BERACHAIN_CONTRACTS.bex_actions,
                      {
                        // $fromAsset (uno on bera)
                        base: "0x08247b1C6D6AACF6C655f711661D5810380C8385",
                        // $toAsset (honey on bera)
                        quote: "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
                        // amount?
                        quantity: SWAP_AMOUNT
                      }
                    ]
                  }).slice(2),
                },
                // allow_failure: true
              },
              // send
              {
                delegate_call: {
                  to: BERACHAIN_CONTRACTS.ibc_actions,
                  data: encodeFunctionData({
                    abi: ibcTokenActionsAbi,
                    functionName: "ibcSendPercentage",
                    args: [
                      BERACHAIN_CONTRACTS.ibc_actions,
                      {
                        tokens: [{
                          // $toAsset (honey on bera)
                          denom: "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
                          // 100%
                          percentage: 1e6
                        }],
                        // TODO: EVM UCS channel id
                        channelId: "channel-3",
                        // TODO: User hex address on Union
                        receiver: cosmosToEvmAddress(cosmosAddress),
                        // receiver: "15cbba30256b961c37b3fd7224523abdf562fd72",
                        extension: ""
                      }
                    ]
                  }).slice(2),
                  // allow_failure: true
                }
              }
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
            bind:value={amount}
            class={cn(
              !balanceCoversAmount && amount ? 'border-red-500' : '',
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
        <section>
          <CardSectionHeading>Amount</CardSectionHeading>
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
    chains={chains.filter(c => c.enabled_staging)}
    kind="from"
    onChainSelect={newSelectedChain => {
      fromChainId.set(newSelectedChain)
    }}
    selectedChain={$fromChainId}
    userAddr={$userAddr}
  />

  <ChainDialog
    bind:dialogOpen={dialogOpenToChain}
    chains={chains.filter(c => c.enabled_staging)}
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
