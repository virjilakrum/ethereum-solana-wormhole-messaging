import { expect } from 'chai';
import { EVMMessenger } from './../sdk/evm';
import { SolanaMessenger } from './../sdk/solana';
import { CryptoUtils } from './../sdk/utils';
import { describe, before, it } from 'node:test';

describe('Cross-Chain Messaging Flow', () => {
  let evmMessenger: EVMMessenger;
  let solanaMessenger: SolanaMessenger;

  before(async () => {
    // Initialize messengers with test network details
    evmMessenger = new EVMMessenger('TEST_RPC_URL', 'TEST_CORE_BRIDGE');
    solanaMessenger = new SolanaMessenger();
  });

  it('should send a message from Ethereum to Solana', async () => {
    const { privateKey, publicKey } = await CryptoUtils.generateKeyPair();
    const message = 'Hello, Solana!';
    const encryptedMessage = await CryptoUtils.encrypt(publicKey, message);

    const tx = await evmMessenger.sendMessage(
      CryptoUtils.compressPublicKey(publicKey),
      'TEST_RECIPIENT_KEY',
      encryptedMessage,
      1, // Solana chain ID
      'TEST_PRIVATE_KEY'
    );

    // Wait for the message to be received on Solana
    // This part depends on your specific implementation of message observation
    const receivedMessage = await solanaMessenger.getCurrentMessage();
    const decryptedMessage = await CryptoUtils.decrypt(privateKey, receivedMessage);

    expect(decryptedMessage).to.equal(message);
  });

  // Add more test cases for Solana to Ethereum flow, error cases, etc.
});