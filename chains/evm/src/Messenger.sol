// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Wormhole/IWormhole.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract Messenger is ReentrancyGuard, Ownable,  Initializable{
    string private current_msg;
    address private wormhole_core_bridge_address;
    uint32 private nonce = 0;
    mapping(uint16 => bytes32) private _applicationContracts;
    mapping(bytes32 => bool) private _completedMessages;

    event MessageSent(bytes32 indexed messageHash, address indexed sender, uint16 targetChain);
    event MessageReceived(bytes32 indexed messageHash, address indexed recipient);

    constructor(address _core_bridge_address) Ownable(msg.sender) {
        require(_core_bridge_address != address(0), "Invalid core bridge address");
        wormhole_core_bridge_address = _core_bridge_address;
    }

    IWormhole private core_bridge;

    function initialize() external initializer {
        core_bridge = IWormhole(wormhole_core_bridge_address);
    }

    function sendMsg(string calldata pubKey1, string calldata pubKey2, string calldata encryptedData, uint16 targetChain) 
        external 
        nonReentrant 
        returns (uint64 sequence) 
    {
        require(bytes(pubKey1).length > 0 && bytes(pubKey2).length > 0 && bytes(encryptedData).length > 0, "Invalid input");

        bytes memory payload = abi.encode(pubKey1, pubKey2, encryptedData, msg.sender);
        require(payload.length <= 350, "Payload size exceeds limit");

        sequence = core_bridge.publishMessage(nonce, payload, 1);
        nonce = nonce + 1;

        bytes32 messageHash = keccak256(abi.encodePacked(sequence, payload, block.chainid, targetChain));
        emit MessageSent(messageHash, msg.sender, targetChain);
    }

    function receiveEncodedMsg(bytes calldata encodedMsg) external nonReentrant {
        (IWormhole.VM memory vm, bool valid, string memory reason) = core_bridge.parseAndVerifyVM(encodedMsg);

        require(valid, reason);
        require(_applicationContracts[vm.emitterChainId] == vm.emitterAddress, "Invalid Emitter Address!");
        require(!_completedMessages[vm.hash], "Message already processed");

        _completedMessages[vm.hash] = true;

        (,, string memory encryptedData, address sender) = abi.decode(vm.payload, (string, string, string, address));

        current_msg = encryptedData;
        emit MessageReceived(vm.hash, sender);
    }

    function getCurrentMsg() external view returns (string memory) {
        return current_msg;
    }

    function registerApplicationContracts(uint16 chainId, bytes32 applicationAddr) external onlyOwner {
        require(applicationAddr != bytes32(0), "Invalid application address");
        _applicationContracts[chainId] = applicationAddr;
    }
}