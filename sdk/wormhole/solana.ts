import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Transaction,
} from '@solana/web3.js';
import {
  postVaaSolana,
  parseVaa,
  CHAINS,
} from '@certusone/wormhole-sdk';
import { WormholeMessage } from '../types';

export class SolanaWormhole {
  private connection: Connection;
  private wormholeProgramId: PublicKey;

  constructor(connection: Connection, wormholeProgramId: string) {
    this.connection = connection;
    this.wormholeProgramId = new PublicKey(wormholeProgramId);
  }

  async sendMessage(message: WormholeMessage, targetChain: number, payer: PublicKey): Promise<string> {
    const instruction = new TransactionInstruction({
      keys: [{ pubkey: payer, isSigner: true, isWritable: true }],
      programId: this.wormholeProgramId,
      data: Buffer.from(JSON.stringify({
        instruction: 'sendMessage',
        message,
        targetChain,
      })),
    });

    const transaction = new Transaction().add(instruction);
    const { blockhash } = await this.connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer;

    // Note: Transaction needs to be signed before sending
    const signature = await this.connection.sendRawTransaction(transaction.serialize());
    await this.connection.confirmTransaction(signature);
    return signature;
  }

  async receiveMessage(vaa: Uint8Array, payer: PublicKey): Promise<WormholeMessage> {
    const parsedVaa = parseVaa(vaa);
    const message: WormholeMessage = JSON.parse(Buffer.from(parsedVaa.payload).toString('utf8'));

    const signTransaction = async (transaction: Transaction): Promise<Transaction> => {
      // This is a placeholder and should be implemented based on your signing mechanism
      // For example, you might use a wallet adapter or other signing method
      return transaction;
    };

    const signedVAA = Buffer.from(vaa);
    const payerPubkey = payer.toBuffer();

    await postVaaSolana(
      this.connection,
      async (transaction) => {
        const signedTx = await signTransaction(transaction);
        return signedTx;
      },
      this.wormholeProgramId,
      payerPubkey,
      Buffer.from(CHAINS.solana.toString()),
      { commitment: 'finalized' } // Example ConfirmOptions
    );

    return message;
  }
}