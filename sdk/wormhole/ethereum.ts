import { ethers, providers } from 'ethers';
import { parseVaa } from '@certusone/wormhole-sdk';
import { WormholeMessage } from '../types';

export class EthereumWormhole {
  private provider: providers.Provider;
  private wormholeContract: ethers.Contract;

  constructor(provider: providers.Provider, wormholeAddress: string) {
    this.provider = provider;
    this.wormholeContract = new ethers.Contract(
      wormholeAddress,
      [
        'function publishMessage(bytes payload, uint32 nonce) payable returns (uint64 sequence)',
        'function parseAndVerifyVM(bytes calldata encodedVM) public view returns (tuple(uint8 version, uint32 timestamp, uint32 nonce, uint16 emitterChainId, bytes32 emitterAddress, uint64 sequence, uint8 consistencyLevel, bytes payload, uint32 guardianSetIndex, bytes32 hash, bytes signatures) vm, bool valid, string memory reason)'
      ],
      this.provider
    );
  }

  async sendMessage(message: WormholeMessage, targetChain: number): Promise<string> {
    const encodedMessage = ethers.utils.defaultAbiCoder.encode(
      ['string', 'string', 'string'],
      [message.pubKey1, message.pubKey2, message.encryptedData]
    );
    const nonce = Math.floor(Math.random() * 1000000);
    const tx = await this.wormholeContract.publishMessage(encodedMessage, nonce, {
      value: ethers.utils.parseEther('0.1') // Adjust fee as needed
    });
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async receiveMessage(vaa: Uint8Array): Promise<WormholeMessage> {
    const { vm, valid, reason } = await this.wormholeContract.parseAndVerifyVM(vaa);
    if (!valid) {
      throw new Error(`Invalid VAA: ${reason}`);
    }
    const parsedVaa = parseVaa(vaa);
    const decodedPayload = ethers.utils.defaultAbiCoder.decode(
      ['string', 'string', 'string'],
      parsedVaa.payload
    );
    return {
      pubKey1: decodedPayload[0],
      pubKey2: decodedPayload[1],
      encryptedData: decodedPayload[2]
    };
  }
}