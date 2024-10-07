// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ZKLInbox {
    struct Message {
        string encryptedArweaveLink;
        string recipientPublicKey;
        string senderPublicKey;
        uint256 timestamp;
    }

    mapping(address => Message[]) private inboxes;

    event MessageSent(address indexed recipient, address indexed sender, uint256 timestamp);

    function sendMessage(
        address recipient,
        string memory encryptedArweaveLink,
        string memory recipientPublicKey,
        string memory senderPublicKey
    ) public {
        require(bytes(encryptedArweaveLink).length > 0, "Encrypted Arweave link cannot be empty");
        require(bytes(recipientPublicKey).length > 0, "Recipient public key cannot be empty");
        require(bytes(senderPublicKey).length > 0, "Sender public key cannot be empty");

        Message memory newMessage = Message({
            encryptedArweaveLink: encryptedArweaveLink,
            recipientPublicKey: recipientPublicKey,
            senderPublicKey: senderPublicKey,
            timestamp: block.timestamp
        });

        inboxes[recipient].push(newMessage);

        emit MessageSent(recipient, msg.sender, block.timestamp);
    }

    function getInboxSize(address user) public view returns (uint256) {
        return inboxes[user].length;
    }

    function getMessage(address user, uint256 index) public view returns (
        string memory encryptedArweaveLink,
        string memory recipientPublicKey,
        string memory senderPublicKey,
        uint256 timestamp
    ) {
        require(index < inboxes[user].length, "Message index out of bounds");
        Message memory message = inboxes[user][index];
        return (
            message.encryptedArweaveLink,
            message.recipientPublicKey,
            message.senderPublicKey,
            message.timestamp
        );
    }
}