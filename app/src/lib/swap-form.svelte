<script lang="ts">
import ChainsGate from "$lib/components/chains-gate.svelte"
import ChainDialog from "../routes/transfer/(components)/chain-dialog.svelte"
import ChainButton from "../routes/transfer/(components)/chain-button.svelte"
import { derived, writable, type Readable } from "svelte/store"
import { userAddrEvm } from "$lib/wallet/evm"
import { userAddrCosmos } from "$lib/wallet/cosmos"

import * as Card from "$lib/components/ui/card/index.ts"
import { UnionClient } from "@union/client"
import { Button } from "$lib/components/ui/button"
import type { Chain, UserAddresses } from "$lib/types.ts"
import { encodeFunctionData } from 'viem'
import { bexActionsAbi, ibcTokenActionsAbi } from '$lib/swap/abis.ts'

export let chains: Array<Chain>

let fromChainId = writable("")
let toChainId = writable("")

let toChain = derived(
  toChainId,
  $toChainId => chains.find(chain => chain.chain_id === $toChainId) ?? null
)

let fromChain = derived(
  fromChainId,
  $fromChainId => chains.find(chain => chain.chain_id === $fromChainId) ?? null
)

let dialogOpenToChain = false
let dialogOpenFromChain = false

let userAddr: Readable<UserAddresses> = derived(
  [userAddrCosmos, userAddrEvm],
  ([$userAddrCosmos, $userAddrEvm]) => ({
    evm: $userAddrEvm,
    cosmos: $userAddrCosmos
  })
)

const BERACHAIN_CONTRACTS = {
  ibc_handler: "0x851c0EB711fe5C7c8fe6dD85d9A0254C8dd11aFD",
  ucs01_handler: "0x6F270608fB562133777AF0f71F6386ffc1737C30"
}

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

  const evmNoteMsg = {
    kind: "cosmwasm",
    instructions: [
      {
        contractAddress: "union10qdttl5qnqfsuvm852zrfysqkuydn0hwz6xe5472tv5590v95zhs49fdlh",
        msg: {
          execute: {
            msgs: [
            // approve
            //   {
            //     call: {
            //       // honey
            //       to: "0x08247b1C6D6AACF6C655f711661D5810380C8385",
            //       data: "095ea7b3000000000000000000000000ab827b1cc3535a9e549ee387a6e9c3f02f481b490000000000000000000000000000000000000000000000000000000000000007",
            //     }
            //   },
            //       // swap
            //   {
            //     call: {
            //       // bex
            //       to: "0xAB827b1Cc3535A9e549EE387A6E9C3F02F481B49",
            //       data: "3d719cd900000000000000000000000008247b1c6d6aacf6c655f711661d5810380c83850000000000000000000000000e4aaf1351de4c0264c5c7056ef3777b41bd8e030000000000000000000000000000000000000000000000000000000000008ca00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffff5433e2b3d8211706e6102aa947100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            //     }
            //   },
              // swap
              {
                delegate_call: {
                  to: '0xD7B680Ce6444E162AcD35D6213cFE75B3F3af1d5',
                  data: encodeFunctionData({
                    abi: bexActionsAbi,
                    functionName: "swap",
                    args: [
                      "0xD7B680Ce6444E162AcD35D6213cFE75B3F3af1d5",
                      {
                        base: "0x08247b1C6D6AACF6C655f711661D5810380C8385",
                        quote: "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
                        quantity: 7
                      }
                    ]
                  }).slice(2),
                },
                // allow_failure: true
              },
              // send
              {
                delegate_call: {
                  to: '0x00d14FB2734690E18D06f62656cbAb048B694AE1',
                  data: encodeFunctionData({
                    abi: ibcTokenActionsAbi,
                    functionName: "ibcSendPercentage",
                    args: [
                      '0x00d14FB2734690E18D06f62656cbAb048B694AE1',
                      {
                        tokens: [{
                          denom: "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
                          percentage: 1e6
                        }],
                        channelId: "channel-3",
                        receiver: "15cbba30256b961c37b3fd7224523abdf562fd72",
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
        Chain to start the swap from
      </Card.Description>
    </Card.Header>
      <Card.Content>
        <ChainButton bind:dialogOpen={dialogOpenFromChain} bind:selectedChainId={$fromChainId}>{$fromChain?.display_name ?? "Select from chain"}</ChainButton>
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
        <ChainButton bind:dialogOpen={dialogOpenToChain} bind:selectedChainId={$toChainId}>{$toChain?.display_name ?? "Select chain"}</ChainButton>
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
