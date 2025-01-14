import { graphql } from "gql.tada"

export const chainsQueryDocument = graphql(/* GraphQL */ `query ChainsQuery @cached(ttl: 30) {
  v1_ibc_union_chains(order_by: {display_name: asc}) {
    display_name
    testnet
    chain_id
    enabled
    rpc_type
    addr_prefix
    enabled
    enabled_staging
    rpcs(where: {enabled: {_eq: true}}) {
      url
      type
    }
    explorers {
      tx_url
      block_url
      address_url
    }
    assets {
      denom
      display_symbol
      display_name
      decimals
      faucets(where: { enabled: {_eq: true}}) {
        url
        display_name
      }
      gas_token
    }
  }
}`)
