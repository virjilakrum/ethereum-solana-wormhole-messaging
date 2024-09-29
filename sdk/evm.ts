/**import fs from 'fs';
import ethers from 'ethers';
import { promisify } from "util";
const exec = promisify(require("child_process").exec);

export class EVMMessenger{
    sendMessage(arg0: string, arg1: string, encryptedMessage: string, arg3: number, arg4: string) {
        throw new Error('Method not implemented.');
    }
    rpc:string;
    coreBridge:string;
    deployedAddress: string;

    constructor(nodeUrl:string, wormholeCoreBridge:string, deployedAddress?:string) {
        this.rpc = nodeUrl;
        this.coreBridge = wormholeCoreBridge;
        this.deployedAddress = deployedAddress as string;
    }

    public async deploy(networkName:string, privateKey:string) {
        let cmd = `cd chains/evm && forge build && forge create --legacy --rpc-url ${this.rpc} --private-key ${privateKey} src/Messenger.sol:Messenger --constructor-args ${this.coreBridge} && exit`;
        const { stdout, stderr } = await exec(cmd);
        console.log(stdout);

        const deploymentAddress = stdout
                                    .split("Deployed to: ")[1]
                                    .split("\n")[0]
                                    .trim();
    
        let config = JSON.parse(fs.readFileSync('./xdapp.config.json').toString());
        config.networks[networkName].deployedAddress = deploymentAddress;
        fs.writeFileSync('./xdapp.config.json', JSON.stringify(config, null, 2));       
        this.deployedAddress = deploymentAddress;
    }

    public getContract(): ethers.Contract {
        const messenger = new ethers.Contract(
            this.deployedAddress,
            JSON.parse(
                fs.readFileSync("./chains/evm/out/Messenger.sol/Messenger.json").toString()
            ).abi,    
        )

        // let tx = messenger.registerApplicationContracts(
        //     chainID,
        //     foreignAddress
        // );    
       
        return messenger;
    } 
}
*/
/**
    const signer = new ethers.Wallet(srcNetwork.privateKey).connect(
        new ethers.providers.JsonRpcProvider(srcNetwork.rpc)
    );
    const messenger = new ethers.Contract(
        srcDeploymentInfo.address,
        JSON.parse(
            fs
                .readFileSync(
                    "./chains/evm/out/Messenger.sol/Messenger.json"
                )
                .toString()
        ).abi,
        signer
    );
    const tx = await messenger.registerApplicationContracts(
        targetNetwork.wormholeChainId,
        emitterBuffer
    ); */
    import fs from 'fs';
    import { ethers } from 'ethers';
    import { promisify } from "util";
    const exec = promisify(require("child_process").exec);
    
    export class EVMMessenger {
        rpc: string;
        coreBridge: string;
        deployedAddress: string;
        provider: ethers.providers.JsonRpcProvider;
    
        constructor(nodeUrl: string, wormholeCoreBridge: string, deployedAddress?: string) {
            this.rpc = nodeUrl;
            this.coreBridge = wormholeCoreBridge;
            this.deployedAddress = deployedAddress as string;
            this.provider = new ethers.providers.JsonRpcProvider(this.rpc);
        }
    
        public async deploy(networkName: string, privateKey: string) {
            let cmd = `cd chains/evm && forge build && forge create --legacy --rpc-url ${this.rpc} --private-key ${privateKey} src/Messenger.sol:Messenger --constructor-args ${this.coreBridge} && exit`;
            const { stdout, stderr } = await exec(cmd);
            console.log(stdout);
            const deploymentAddress = stdout
                .split("Deployed to: ")[1]
                .split("\n")[0]
                .trim();
    
            let config = JSON.parse(fs.readFileSync('./xdapp.config.json').toString());
            config.networks[networkName].deployedAddress = deploymentAddress;
            fs.writeFileSync('./xdapp.config.json', JSON.stringify(config, null, 2));       
            this.deployedAddress = deploymentAddress;
        }
    
        public getContract(signerOrProvider?: ethers.Signer | ethers.providers.Provider): ethers.Contract {
            const abi = JSON.parse(
                fs.readFileSync("./chains/evm/out/Messenger.sol/Messenger.json").toString()
            ).abi;
            return new ethers.Contract(this.deployedAddress, abi, signerOrProvider || this.provider);
        }
    
        public async sendMessage(pubKey1: string, pubKey2: string, encryptedData: string, targetChain: number, privateKey: string): Promise<ethers.ContractTransaction> {
            const signer = new ethers.Wallet(privateKey, this.provider);
            const contract = this.getContract(signer);
            return await contract.sendMsg(pubKey1, pubKey2, encryptedData, targetChain);
        }
    
        public async receiveMessage(vaa: string, privateKey: string): Promise<ethers.ContractTransaction> {
            const signer = new ethers.Wallet(privateKey, this.provider);
            const contract = this.getContract(signer);
            return await contract.receiveEncodedMsg(vaa);
        }
    
        public async getCurrentMessage(): Promise<string> {
            const contract = this.getContract();
            return await contract.getCurrentMsg();
        }
    
        public async registerApplicationContracts(chainId: number, applicationAddr: string, privateKey: string): Promise<ethers.ContractTransaction> {
            const signer = new ethers.Wallet(privateKey, this.provider);
            const contract = this.getContract(signer);
            return await contract.registerApplicationContracts(chainId, applicationAddr);
        }
    }