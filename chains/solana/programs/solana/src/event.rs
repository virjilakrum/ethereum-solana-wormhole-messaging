use anchor_lang::prelude::*;

#[event]
pub struct WormholeMessageSent {
    #[index]
    pub sender: Pubkey,
    pub target_chain: u16,
    pub nonce: u32,
    pub pub_key1: String,
    pub pub_key2: String,
    pub payload_hash: [u8; 32],
}

#[event]
pub struct WormholeMessageReceived {
    #[index]
    pub emitter_chain: u16,
    #[index]
    pub emitter_address: [u8; 32],
    pub sequence: u64,
    pub recipient: Pubkey,
    pub pub_key1: String,
    pub pub_key2: String,
    pub payload_hash: [u8; 32],
}

#[event]
pub struct MessageProcessed {
    #[index]
    pub vaa_hash: [u8; 32],
    pub sender: Pubkey,
    pub recipient: Pubkey,
}

#[event]
pub struct ConfigUpdated {
    pub admin: Pubkey,
    pub wormhole_bridge: Pubkey,
}