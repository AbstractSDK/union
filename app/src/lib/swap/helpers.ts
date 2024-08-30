import { type SupportedEvmVoiceChainId, EVM_CONTRACTS } from './constants';


export const isSupportedChainId = (chainId: string): chainId is SupportedEvmVoiceChainId => chainId in EVM_CONTRACTS;
