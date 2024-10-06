// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

library WormholeStructs {
    struct Provider {
        uint16 chainId;
        uint16 governanceChainId;
        bytes32 governanceContract;
    }

    struct GuardianSet {
        address[] keys;
        uint32 expirationTime;
    }

    struct Signature {
        bytes32 r;
        bytes32 s;
        uint8 v;
        uint8 guardianIndex;
    }

    struct VM {
        uint8 version;
        uint32 timestamp;
        uint32 nonce;
        uint16 emitterChainId;
        bytes32 emitterAddress;
        uint64 sequence;
        uint8 consistencyLevel;
        bytes payload;

        uint32 guardianSetIndex;
        Signature[] signatures;

        bytes32 hash;
    }
}

interface Structs {
    function getProvider(uint16 chainId) external view returns (WormholeStructs.Provider memory);
    function storeVM(WormholeStructs.VM calldata vmData) external;
    function retrieveVM(uint64 sequence) external view returns (WormholeStructs.VM memory);

    // Function to get a GuardianSet by index
    function getGuardianSet(uint32 index) external view returns (WormholeStructs.GuardianSet memory);

    // Function to store a new GuardianSet
    function storeGuardianSet(uint32 index, WormholeStructs.GuardianSet memory guardianSetData) external;
}
