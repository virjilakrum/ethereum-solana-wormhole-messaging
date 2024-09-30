// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Wormhole/IWormhole.sol";
import "./Wormhole/Structs.sol";

contract Messenger {
    string private current_msg;
    address private wormhole_core_bridge_address;
    uint32 private nonce = 0;
    mapping(uint16 => bytes32) private _applicationContracts;
    address private owner;
    mapping(bytes32 => bool) private _completedMessages;

    // Initialize the contract with the Wormhole core bridge address
    constructor(address _core_bridge_address) {
        owner = msg.sender;
        wormhole_core_bridge_address = _core_bridge_address;
    }

    IWormhole core_bridge;

    // Set the core bridge contract address
    function setCoreBridge(address _core_bridge_address) external {
        require(msg.sender == owner, "Only owner can set core bridge address!");
        core_bridge = IWormhole(_core_bridge_address);
    }

    // Send a message through the Wormhole bridge (payable function)
    function sendMsg(bytes memory str) public payable returns (uint64 sequence) {
        sequence = core_bridge.publishMessage(nonce, str, 1);
        nonce = nonce + 1;
    }

    // Receive and verify an encoded message
    function receiveEncodedMsg(bytes memory encodedMsg) public {
        (WormholeStructs.VM memory vm, bool valid, string memory reason) = core_bridge.parseAndVerifyVM(encodedMsg);

        // Check Wormhole Guardian signatures
        require(valid, reason);

        // Check if the emitter chain contract is registered
        require(_applicationContracts[vm.emitterChainId] == vm.emitterAddress, "Invalid Emitter Address!");

        // Check if the message has already been processed
        require(!_completedMessages[vm.hash], "Message already processed");
        _completedMessages[vm.hash] = true;

        // Update current message with the verified payload
        current_msg = string(vm.payload);
    }

    // Get the current message
    function getCurrentMsg() public view returns (string memory) {
        return current_msg;
    }

    // Register sibling applications on other chains as the only valid senders
    function registerApplicationContracts(uint16 chainId, bytes32 applicationAddr) public {
        require(msg.sender == owner, "Only owner can register new chains!");
        _applicationContracts[chainId] = applicationAddr;
    }
}
