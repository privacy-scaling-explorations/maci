pragma experimental ABIEncoderV2;
pragma solidity ^0.5.0;

import { Hasher } from "./Hasher.sol";
import { DomainObjs } from './DomainObjs.sol';
import { MerkleTree } from "./MerkleTree.sol";
import { SignUpGatekeeper } from "./gatekeepers/SignUpGatekeeper.sol";
import { Ownable } from "@openzeppelin/contracts/ownership/Ownable.sol";
import { BatchUpdateStateTreeVerifier } from "./BatchUpdateStateTreeVerifier.sol";

contract MACI is Hasher, Ownable, DomainObjs {

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

    // The initial voice credit balance per user
    uint256 public initialVoiceCreditBalance;

    // The coordinator's public key
    PubKey public coordinatorPubKey;

    // TODO: store these values in a Constants.sol
    uint256 SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    // A nothing up my sleeve zero value
    // Should be equal to 5503045433092194285660061905880311622788666850989422096966288514930349325741
    uint256 ZERO_VALUE = uint256(keccak256(abi.encodePacked('Maci'))) % SNARK_SCALAR_FIELD;

    // Events
    event SignUp(PubKey indexed _userPubKey);

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
        uint256 _initialVoiceCreditBalance,
        PubKey memory _coordinatorPubKey
    ) Ownable() public {

        // Set the verifier contract addresses
        batchUstVerifier = _batchUstVerifier;

        // Set the sign-up duration
        signUpTimestamp = now;
        signUpDurationSeconds = _signUpDurationSeconds;
        
        // Set the sign-up gatekeeper contract
        signUpGatekeeper = _signUpGatekeeper;
        
        // Set the initial voice credit balance
        initialVoiceCreditBalance = _initialVoiceCreditBalance;

        // Set the coordinator's public key
        coordinatorPubKey = _coordinatorPubKey;

        // Create the command tree
        cmdTree = new MerkleTree(_cmdTreeDepth, ZERO_VALUE);

        // Set the state tree root
        stateTree = new MerkleTree(_stateTreeDepth, ZERO_VALUE);

        // Calculate the vote option tree root.
        // Re-use a computed root to save gas if the depth is the same.
        if (voteOptionTreeDepth == _cmdTreeDepth) {
            emptyVoteOptionTreeRoot = cmdTree.getRoot();
        } else if (voteOptionTreeDepth == _stateTreeDepth) {
            emptyVoteOptionTreeRoot = stateTree.getRoot();
        } else {
            MerkleTree tempTree = new MerkleTree(voteOptionTreeDepth, ZERO_VALUE);
            emptyVoteOptionTreeRoot = tempTree.getRoot();
        }

        // Make subsequent insertions start from leaf #1, as leaf #0 is only
        // updated with random data if a command is invalid.
        stateTree.insertBlankAtZerothLeaf();
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

    /*
     * Allows a user who is eligible to sign up to do so. The sign-up
     * gatekeeper will prevent double sign-ups or ineligible users from signing
     * up. This function will only succeed if the sign-up deadline has not
     * passed. It also inserts a fresh state leaf into the state tree.
     * @param _userPubKey The user's desired public key.
     * @param _signUpGatekeeperData Data to pass to the sign-up gatekeeper's
     *     register() function. For instance, the POAPGatekeeper or
     *     SignUpTokenGatekeeper requires this value to be the ABI-encoded
     *     token ID.
     */
    function signUp(
        PubKey memory _userPubKey,
        bytes memory _signUpGatekeeperData
    ) 
    isBeforeSignUpDeadline
    public {

        // Register the user via the sign-up gatekeeper. This function should
        // throw if the user has already registered or if ineligible to do so.
        signUpGatekeeper.register(msg.sender, _signUpGatekeeperData);

        // Create, hash, and insert a fresh state leaf
        StateLeaf memory stateLeaf = StateLeaf({
            pubKey: _userPubKey,
            voteOptionTreeRoot: emptyVoteOptionTreeRoot,
            voiceCreditBalance: initialVoiceCreditBalance,
            nonce: 0
        });

        uint256 hashedLeaf = hashStateLeaf(stateLeaf);

        stateTree.insert(hashedLeaf);

        emit SignUp(_userPubKey);
    }

    //// Publishes commands
    //function publishCommand(
        //uint256[] memory encryptedMessage,
        //uint256[2] memory ecdhPublicKey
    //) 
    //isAfterSignUpDeadline
    //public 
    //{

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
}

