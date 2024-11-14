use std::string::FromUtf8Error;

use cosmwasm_std::{CheckedMultiplyRatioError, IbcOrder, OverflowError, StdError, SubMsgResult};
use cw_controllers::AdminError;
use thiserror::Error;
use ucs01_relay_api::{middleware::MiddlewareError, protocol::ProtocolError, types::EncodingError};

/// Never is a placeholder to ensure we don't return any errors
#[derive(Error, Debug)]
pub enum Never {}

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("{0}")]
    Admin(#[from] AdminError),

    #[error("Channel doesn't exist: {id}")]
    NoSuchChannel { id: String },

    #[error("Didn't send any funds")]
    NoFunds,

    #[error("An overflow occurred: {error}")]
    Overflow {
        #[from]
        error: OverflowError,
    },

    #[error("Expected {expected:?} channel ordering but got {actual:?}")]
    InvalidChannelOrdering {
        expected: IbcOrder,
        actual: IbcOrder,
    },

    #[error("Insufficient funds to redeem on channel")]
    InsufficientFunds,

    #[error("Got a submessage reply with unknown id: {id} and variant: {variant:?}")]
    UnknownReply { id: u64, variant: SubMsgResult },

    #[error("unable to send pfm forward packet: {err}")]
    PfmSendPacketError { err: String },

    #[error("{0}")]
    Protocol(#[from] ProtocolError),

    #[error("{0}")]
    ProtocolEncoding(#[from] EncodingError),

    #[error("Channel {channel_id} has unknown protocol version {protocol_version}")]
    UnknownProtocol {
        channel_id: String,
        protocol_version: String,
    },

    #[error("Channel {channel_id} protocol version {protocol_version} mismatch counterparty protocol version {counterparty_protocol_version}")]
    ProtocolMismatch {
        channel_id: String,
        protocol_version: String,
        counterparty_protocol_version: String,
    },

    #[error("Only myself is able to trigger this message")]
    Unauthorized,

    #[error("The operation is not supported")]
    Unsupported,

    #[error(transparent)]
    MiddlewareError(#[from] MiddlewareError),

    #[error("Unable to decode json value")]
    SerdeJson(#[from] serde_json_wasm::de::Error),

    #[error(transparent)]
    Arithmetic(#[from] CheckedMultiplyRatioError),

    #[error("Only the IBC host is able to perform this operation")]
    OnlyIBCHost,

    #[error("The reply was invalid")]
    InvalidReply,
}

impl From<FromUtf8Error> for ContractError {
    fn from(_: FromUtf8Error) -> Self {
        ContractError::Std(StdError::invalid_utf8("parsing denom key"))
    }
}
