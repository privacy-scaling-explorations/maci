pragma experimental ABIEncoderV2;
pragma solidity ^0.5.0;

import { Hasher } from "./Hasher.sol";
import { DomainObjs } from './DomainObjs.sol';
import { MerkleTree, EmptyMerkleTreeRoots } from "./MerkleTree.sol";
import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { Ownable } from "@openzeppelin/contracts/ownership/Ownable.sol";
import { BatchUpdateStateTreeVerifier } from "./BatchUpdateStateTreeVerifier.sol";

contract MACI is Hasher, Ownable, DomainObjs, EmptyMerkleTreeRoots {

    // Verifier Contracts
    BatchUpdateStateTreeVerifier internal batchUstVerifier;

    // Append-only merkle tree to represent internal state transitions
    // i.e. update function isn't used
    // TODO: remove the update function if it isn't used
    MerkleTree cmdTree;
    MerkleTree stateTree;

    uint256 public emptyVoteOptionTreeRoot;

    // When the contract was deployed. We assume that the signup period starts
    // immediately upon deployment.
    uint256 public signUpTimestamp;

    // Duration of the sign-up period, in seconds
    uint256 public signUpDurationSeconds;

    // Address of the SignUpGatekeeper, which determines whether a user may
    // sign up to vote
    SignUpGatekeeper public signUpGatekeeper;

    // The coordinator can also forcefully end the sign-up period
    bool public signUpForceEnded = false;

    // The coordinator's public key
    PubKey public coordinatorPubKey;

    // TODO: store these values in a Constants.sol
    uint256 SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    // A nothing up my sleeve zero value
    // Should be equal to 5503045433092194285660061905880311622788666850989422096966288514930349325741
    uint256 ZERO_VALUE = uint256(keccak256(abi.encodePacked('Maci'))) % SNARK_SCALAR_FIELD;


    //// Events
    //event SignedUp(
        //uint256[] encryptedMessage,
        //uint256[2] ecdhPublicKey,
        //uint256 hashedEncryptedMessage,
        //uint256 newStateTreeRoot,
        //uint256 userIndex
    //);
    //event CommandPublished(
        //uint256[] encryptedMessage,
        //uint256[2] ecdhPublicKey,
        //uint256 hashedEncryptedMessage,
        //uint256 newCmdTreeRoot
    //);

    constructor(
        uint8 _cmdTreeDepth,
        uint8 _stateTreeDepth,
        uint8 voteOptionTreeDepth,
        BatchUpdateStateTreeVerifier _batchUstVerifier,
        SignUpGatekeeper _signUpGatekeeper,
        uint256 _signUpDurationSeconds,
        PubKey memory _coordinatorPubKey
    ) Ownable() public {

        // Create the Merkle trees
        cmdTree = new MerkleTree(_cmdTreeDepth, ZERO_VALUE);
        stateTree = new MerkleTree(_stateTreeDepth, ZERO_VALUE);

        // Calculate and store the root of an empty vote option tree
        emptyVoteOptionTreeRoot = emptyMerkleTreeRoots[voteOptionTreeDepth - 1];

        batchUstVerifier = _batchUstVerifier;

        signUpTimestamp = now;
        signUpDurationSeconds = _signUpDurationSeconds;
        signUpGatekeeper = _signUpGatekeeper;

        coordinatorPubKey = _coordinatorPubKey;
    }

    /*
     * Returns the deadline to sign up.
     */
    function calcSignUpDeadline() public view returns (uint256) {
        return signUpTimestamp + signUpDurationSeconds;
    }

    /*
     * Ensures that the calling function only continues execution if the
     * current block time is before the sign-up deadline.
     */
    modifier isBeforeSignUpDeadline() {
        require(now < calcSignUpDeadline(), "MACI: the sign-up period has passed");
        _;
    }

    /*
     * Ensures that the calling function only continues execution if the
     * current block time is after or equal to the sign-up deadline.
     */
    modifier isAfterSignUpDeadline() {
        require(now >= calcSignUpDeadline(), "MACI: the sign-up period is not over");
        _;
    }

    // Signs a user up
    // TODO: should we construct a fresh state tree leaf rather than accept it
    // as a message from the user?
    function signUp(
        //uint256[] memory encryptedMessage,
        //uint256[2] memory ecdhPublicKey,
        bytes memory _signUpGatekeeperData
    ) 
    isBeforeSignUpDeadline
    public {
        signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

        //// Calculate leaf value
        //uint256 leaf = hashMulti(encryptedMessage, 0);

        //stateTree.insert(leaf);

        //// Get new cmd tree root
        //uint256 newStateTreeRoot = stateTree.getRoot();

        //emit SignedUp(
            //encryptedMessage,
            //ecdhPublicKey,
            //leaf,
            //newStateTreeRoot,
            //stateTree.getInsertedLeavesNo() - 1
        //);
    }

    //// Publishes commands
    //function publishCommand(
        //uint256[] memory encryptedMessage,
        //uint256[2] memory ecdhPublicKey
    //) 
    //isAfterSignUpDeadline
    //public 
    //{

        //require(signUpForceEnded == false, "MACI: the coordinator has force-ended the sign-up period");

        //// Calculate leaf value
        //uint256 leaf = hashMulti(encryptedMessage, 0);

        //// Insert the new leaf into the cmdTree
        //cmdTree.insert(leaf);

        //// Get new cmd tree root
        //uint256 newCmdTreeRoot = cmdTree.getRoot();

        //emit CommandPublished(
            //encryptedMessage,
            //ecdhPublicKey,
            //leaf,
            //newCmdTreeRoot
        //);
    //}

    //// Submits proof for updating state tree
    //function verifyUpdateStateTreeProof(
      //uint[2] memory,
      //uint[2][2] memory,
      //uint[2] memory,
      //uint[28] memory 
    //) public pure returns (bool) {
      ////return batchUstVerifier.verifyProof(a, b, c, input);
      //// TODO: submit a batch of messages
      //return true;
    //}

    //// Forcefully ends sign up period
    //function endSignUpPeriod() public onlyOwner {
      //signUpForceEnded = true;
    //}
}

