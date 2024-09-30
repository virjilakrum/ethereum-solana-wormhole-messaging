import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@project-serum/anchor';
import { IDL } from '../chains/solana/target/types/solana';
//import { CORE_BRIDGE_ADDRESS } from '../chains/solana/programs/solana/src/constant';
const CORE_BRIDGE_ADDRESS: string = "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o";
export class SolanaMessenger {
    connection: Connection;
    programId: PublicKey;
    program: Program;

    constructor(rpcUrl: string, programId: string) {
        this.connection = new Connection(rpcUrl, 'confirmed');
        this.programId = new PublicKey(programId);
        const wallet = new Wallet(Keypair.generate()); // Note: This is a dummy wallet, replace with actual wallet in production
        const provider = new AnchorProvider(this.connection, wallet, {});
        this.program = new Program(IDL, this.programId, provider);
    }

    public async initialize(privateKey: string): Promise<string> {
        const wallet = new Wallet(Keypair.fromSecretKey(Buffer.from(privateKey, 'hex')));
        const provider = new AnchorProvider(this.connection, wallet, {});
        this.program = new Program(IDL, this.programId, provider);

        const [configPda] = await PublicKey.findProgramAddress(
            [Buffer.from('config')],
            this.programId
        );

        const tx = await this.program.methods.initialize()
            .accounts({
                config: configPda,
                owner: wallet.publicKey,
                systemProgram: PublicKey.default,
            })
            .rpc();

        return tx;
    }

    public async registerChain(chainId: number, emitterAddr: string, privateKey: string): Promise<string> {
        const wallet = new Wallet(Keypair.fromSecretKey(Buffer.from(privateKey, 'hex')));
        const provider = new AnchorProvider(this.connection, wallet, {});
        this.program = new Program(IDL, this.programId, provider);

        const [configPda] = await PublicKey.findProgramAddress(
            [Buffer.from('config')],
            this.programId
        );

        const [emitterPda] = await PublicKey.findProgramAddress(
            [Buffer.from('EmitterAddress'), Buffer.from(new BN(chainId).toArray('le', 2))],
            this.programId
        );

        const tx = await this.program.methods.registerChain(new BN(chainId), emitterAddr)
            .accounts({
                owner: wallet.publicKey,
                systemProgram: PublicKey.default,
                config: configPda,
                emitterAcc: emitterPda,
            })
            .rpc();

        return tx;
    }

    public async sendMessage(pubKey1: string, pubKey2: string, encryptedData: string, privateKey: string): Promise<string> {
        const wallet = new Wallet(Keypair.fromSecretKey(Buffer.from(privateKey, 'hex')));
        const provider = new AnchorProvider(this.connection, wallet, {});
        this.program = new Program(IDL, this.programId, provider);

        const [configPda] = await PublicKey.findProgramAddress(
            [Buffer.from('config')],
            this.programId
        );

        const [wormholeDerivedEmitter] = await PublicKey.findProgramAddress(
            [Buffer.from('emitter')],
            this.programId
        );

        const [wormholeSequence] = await PublicKey.findProgramAddress(
            [Buffer.from('Sequence'), wormholeDerivedEmitter.toBuffer()],
            new PublicKey(CORE_BRIDGE_ADDRESS)
        );

        const tx = await this.program.methods.sendMsg(pubKey1, pubKey2, encryptedData)
            .accounts({
                coreBridge: new PublicKey(CORE_BRIDGE_ADDRESS),
                wormholeConfig: await this.getWormholeConfig(),
                wormholeFeeCollector: await this.getWormholeFeeCollector(),
                wormholeDerivedEmitter: wormholeDerivedEmitter,
                wormholeSequence: wormholeSequence,
                wormholeMessageKey: Keypair.generate().publicKey,
                payer: wallet.publicKey,
                systemProgram: PublicKey.default,
                clock: PublicKey.default,
                rent: PublicKey.default,
                config: configPda,
            })
            .rpc();

        return tx;
    }

    public async receiveMessage(vaa: string, privateKey: string): Promise<string> {
        const wallet = new Wallet(Keypair.fromSecretKey(Buffer.from(privateKey, 'hex')));
        const provider = new AnchorProvider(this.connection, wallet, {});
        this.program = new Program(IDL, this.programId, provider);

        const [configPda] = await PublicKey.findProgramAddress(
            [Buffer.from('config')],
            this.programId
        );

        const tx = await this.program.methods.confirmMsg()
            .accounts({
                payer: wallet.publicKey,
                systemProgram: PublicKey.default,
                processedVaa: await this.getProcessedVaaAccount(vaa),
                emitterAcc: await this.getEmitterAccount(),
                coreBridgeVaa: new PublicKey(vaa),
                config: configPda,
            })
            .rpc();

        return tx;
    }

    public async getCurrentMessage(): Promise<string> {
        const [configPda] = await PublicKey.findProgramAddress(
            [Buffer.from('config')],
            this.programId
        );
        const config = await this.program.account.config.fetch(configPda);
        return config.currentMsg as string;
    }

    private async getWormholeConfig(): Promise<PublicKey> {
        return PublicKey.findProgramAddressSync([Buffer.from('Bridge')], new PublicKey(CORE_BRIDGE_ADDRESS))[0];
    }

    private async getWormholeFeeCollector(): Promise<PublicKey> {
        return PublicKey.findProgramAddressSync([Buffer.from('fee_collector')], new PublicKey(CORE_BRIDGE_ADDRESS))[0];
    }

    private async getProcessedVaaAccount(vaa: string): Promise<PublicKey> {
        // This is a placeholder. You'll need to implement the correct logic to derive this address
        return PublicKey.findProgramAddressSync([Buffer.from(vaa)], this.programId)[0];
    }

    private async getEmitterAccount(): Promise<PublicKey> {
        // This is a placeholder. You'll need to implement the correct logic to derive this address
        return PublicKey.findProgramAddressSync([Buffer.from('EmitterAddress')], this.programId)[0];
    }
}