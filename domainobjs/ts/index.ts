import * as assert from 'assert';
import base64url from 'base64url';
import {
    Ciphertext,
    EcdhSharedKey,
	elGamalRerandomize,
	stringifyBigInts,
    Signature,
    PubKey as RawPubKey,
    PrivKey as RawPrivKey,
    G1Point,
    G2Point,
    encrypt,
    decrypt,
    sign,
    hashLeftRight,
    hash13,
    hash3,
    hash4,
    hash5,
	hash9,
	sha256Hash,
    verifySignature,
    genRandomSalt,
    genKeypair,
    genPubKey,
    formatPrivKeyForBabyJub,
    genEcdhSharedKey,
    packPubKey,
    unpackPubKey,
    IncrementalQuinTree,
    SNARK_FIELD_SIZE,
} from 'maci-crypto'

const SERIALIZED_PRIV_KEY_PREFIX = 'macisk.';

class VerifyingKey {
	public alpha1: G1Point;
	public beta2: G2Point;
	public gamma2: G2Point;
	public delta2: G2Point;
	public ic: G1Point[];

	constructor(
		_alpha1: G1Point,
		_beta2: G2Point,
		_gamma2: G2Point,
		_delta2: G2Point,
		_ic: G1Point[]
	) {
		this.alpha1 = _alpha1;
		this.beta2 = _beta2;
		this.gamma2 = _gamma2;
		this.delta2 = _delta2;
		this.ic = _ic;
	}

	public asContractParam() {
		return {
			alpha1: this.alpha1.asContractParam(),
			beta2: this.beta2.asContractParam(),
			gamma2: this.gamma2.asContractParam(),
			delta2: this.delta2.asContractParam(),
			ic: this.ic.map((x) => x.asContractParam()),
		};
	}

	public static fromContract(data: any): VerifyingKey {
		const convertG2 = (point: any): G2Point => {
			return new G2Point(
				[BigInt(point.x[0]), BigInt(point.x[1])],
				[BigInt(point.y[0]), BigInt(point.y[1])]
			);
		};

		return new VerifyingKey(
			new G1Point(BigInt(data.alpha1.x), BigInt(data.alpha1.y)),
			convertG2(data.beta2),
			convertG2(data.gamma2),
			convertG2(data.delta2),
			data.ic.map((c: any) => new G1Point(BigInt(c.x), BigInt(c.y)))
		);
	}

	public equals(vk: VerifyingKey): boolean {
		let icEqual = this.ic.length === vk.ic.length;

		// Immediately return false if the length doesn't match
		if (!icEqual) {
			return false;
		}

		// Each element in ic must match
		for (let i = 0; i < this.ic.length; i++) {
			icEqual = icEqual && this.ic[i].equals(vk.ic[i]);
		}

		return (
			this.alpha1.equals(vk.alpha1) &&
			this.beta2.equals(vk.beta2) &&
			this.gamma2.equals(vk.gamma2) &&
			this.delta2.equals(vk.delta2) &&
			icEqual
		);
	}

	public copy(): VerifyingKey {
		const copyG2 = (point: any): G2Point => {
			return new G2Point(
				[BigInt(point.x[0].toString()), BigInt(point.x[1].toString())],
				[BigInt(point.y[0].toString()), BigInt(point.y[1].toString())]
			);
		};

		return new VerifyingKey(
			new G1Point(
				BigInt(this.alpha1.x.toString()),
				BigInt(this.alpha1.y.toString())
			),
			copyG2(this.beta2),
			copyG2(this.gamma2),
			copyG2(this.delta2),
			this.ic.map(
				(c: any) => new G1Point(BigInt(c.x.toString()), BigInt(c.y.toString()))
			)
		);
	}

	public static fromJSON = (j: string): VerifyingKey => {
		const data = JSON.parse(j);
		return VerifyingKey.fromObj(data);
	};

	public static fromObj = (data: any): VerifyingKey => {
		const alpha1 = new G1Point(
			BigInt(data.vk_alpha_1[0]),
			BigInt(data.vk_alpha_1[1])
		);
		const beta2 = new G2Point(
			[BigInt(data.vk_beta_2[0][1]), BigInt(data.vk_beta_2[0][0])],
			[BigInt(data.vk_beta_2[1][1]), BigInt(data.vk_beta_2[1][0])]
		);
		const gamma2 = new G2Point(
			[BigInt(data.vk_gamma_2[0][1]), BigInt(data.vk_gamma_2[0][0])],
			[BigInt(data.vk_gamma_2[1][1]), BigInt(data.vk_gamma_2[1][0])]
		);
		const delta2 = new G2Point(
			[BigInt(data.vk_delta_2[0][1]), BigInt(data.vk_delta_2[0][0])],
			[BigInt(data.vk_delta_2[1][1]), BigInt(data.vk_delta_2[1][0])]
		);
		const ic = data.IC.map((ic) => new G1Point(BigInt(ic[0]), BigInt(ic[1])));

		return new VerifyingKey(alpha1, beta2, gamma2, delta2, ic);
	};
}

interface Proof {
	a: G1Point;
	b: G2Point;
	c: G1Point;
}

class PrivKey {
	public rawPrivKey: RawPrivKey;

	constructor(rawPrivKey: RawPrivKey) {
		this.rawPrivKey = rawPrivKey;
	}

	public copy = (): PrivKey => {
		return new PrivKey(BigInt(this.rawPrivKey.toString()));
	};

	public asCircuitInputs = () => {
		return formatPrivKeyForBabyJub(this.rawPrivKey).toString();
	};

	public serialize = (): string => {
		return SERIALIZED_PRIV_KEY_PREFIX + this.rawPrivKey.toString(16);
	};

	public static unserialize = (s: string): PrivKey => {
		const x = s.slice(SERIALIZED_PRIV_KEY_PREFIX.length);
		return new PrivKey(BigInt('0x' + x));
	};

	public static isValidSerializedPrivKey = (s: string): boolean => {
		const correctPrefix = s.startsWith(SERIALIZED_PRIV_KEY_PREFIX);
		const x = s.slice(SERIALIZED_PRIV_KEY_PREFIX.length);

		let validValue = false;
		try {
			const value = BigInt('0x' + x);
			validValue = value < SNARK_FIELD_SIZE;
		} catch {
			// comment to make linter happy
		}

		return correctPrefix && validValue;
	};
}

const SERIALIZED_PUB_KEY_PREFIX = 'macipk.';

class PubKey {
	public rawPubKey: RawPubKey;

	constructor(rawPubKey: RawPubKey) {
		assert(rawPubKey.length === 2);
		assert(rawPubKey[0] < SNARK_FIELD_SIZE);
		assert(rawPubKey[1] < SNARK_FIELD_SIZE);
		this.rawPubKey = rawPubKey;
	}

	public copy = (): PubKey => {
		return new PubKey([
			BigInt(this.rawPubKey[0].toString()),
			BigInt(this.rawPubKey[1].toString()),
		]);
	};

	public asContractParam = () => {
		return {
			x: this.rawPubKey[0].toString(),
			y: this.rawPubKey[1].toString(),
		};
	};

	public asCircuitInputs = () => {
		return this.rawPubKey.map((x) => x.toString());
	};

	public asArray = (): BigInt[] => {
		return [this.rawPubKey[0], this.rawPubKey[1]];
	};

	public serialize = (): string => {
		// Blank leaves have pubkey [0, 0], which packPubKey does not support
		if (
			BigInt(`${this.rawPubKey[0]}`) === BigInt(0) &&
			BigInt(`${this.rawPubKey[1]}`) === BigInt(0)
		) {
			return SERIALIZED_PUB_KEY_PREFIX + 'z';
		}
		const packed = packPubKey(this.rawPubKey).toString('hex');
		return SERIALIZED_PUB_KEY_PREFIX + packed.toString();
	};

	public hash = (): BigInt => {
		return hashLeftRight(this.rawPubKey[0], this.rawPubKey[1]);
	};

	public equals = (p: PubKey): boolean => {
		return (
			this.rawPubKey[0] === p.rawPubKey[0] &&
			this.rawPubKey[1] === p.rawPubKey[1]
		);
	};

	public static unserialize = (s: string): PubKey => {
		// Blank leaves have pubkey [0, 0], which packPubKey does not support
		if (s === SERIALIZED_PUB_KEY_PREFIX + 'z') {
			return new PubKey([BigInt(0), BigInt(0)]);
		}

		const len = SERIALIZED_PUB_KEY_PREFIX.length;
		const packed = Buffer.from(s.slice(len), 'hex');
		return new PubKey(unpackPubKey(packed));
	};

	public static isValidSerializedPubKey = (s: string): boolean => {
		const correctPrefix = s.startsWith(SERIALIZED_PUB_KEY_PREFIX);

		let validValue = false;
		try {
			PubKey.unserialize(s);
			validValue = true;
		} catch {
			// comment to make linter happy
		}

		return correctPrefix && validValue;
	};
}

class Keypair {
	public privKey: PrivKey;
	public pubKey: PubKey;

	constructor(privKey?: PrivKey) {
		if (privKey) {
			this.privKey = privKey;
			this.pubKey = new PubKey(genPubKey(privKey.rawPrivKey));
		} else {
			const rawKeyPair = genKeypair();
			this.privKey = new PrivKey(rawKeyPair.privKey);
			this.pubKey = new PubKey(rawKeyPair.pubKey);
		}
	}

	public copy = (): Keypair => {
		return new Keypair(this.privKey.copy());
	};

	public static genEcdhSharedKey(privKey: PrivKey, pubKey: PubKey) {
		return genEcdhSharedKey(privKey.rawPrivKey, pubKey.rawPubKey);
	}

	public equals(keypair: Keypair): boolean {
		const equalPrivKey = this.privKey.rawPrivKey === keypair.privKey.rawPrivKey;
		const equalPubKey =
			this.pubKey.rawPubKey[0] === keypair.pubKey.rawPubKey[0] &&
			this.pubKey.rawPubKey[1] === keypair.pubKey.rawPubKey[1];

		// If this assertion fails, something is very wrong and this function
		// should not return anything
		// XOR is equivalent to: (x && !y) || (!x && y )
		const x = equalPrivKey && equalPubKey;
		const y = !equalPrivKey && !equalPubKey;

		assert((x && !y) || (!x && y));

		return equalPrivKey;
	}
}

interface IStateLeaf {
	pubKey: PubKey;
	voiceCreditBalance: BigInt;
}

interface IDeactivatedKeyLeaf {
    pubKey: PubKey;
    c1: BigInt[];
    c2: BigInt[];
    salt: BigInt;
}

interface VoteOptionTreeLeaf {
	votes: BigInt;
}

/*
 * An encrypted command and signature.
 */
class Message {
	public msgType: BigInt;
	public data: BigInt[];
	public static DATA_LENGTH = 10;

	constructor(msgType: BigInt, data: BigInt[]) {
		assert(data.length === Message.DATA_LENGTH);
		this.msgType = msgType;
		this.data = data;
	}

	private asArray = (): BigInt[] => {
		return [this.msgType].concat(this.data);
	};

	public asContractParam = () => {
		return {
			msgType: this.msgType,
			data: this.data.map((x: BigInt) => x.toString()),
		};
	};

	public asCircuitInputs = (): BigInt[] => {
		return this.asArray();
	};

	public hash = (_encPubKey: PubKey): BigInt => {
		return hash13([...[this.msgType], ...this.data, ..._encPubKey.rawPubKey]);
	};

	public copy = (): Message => {
		return new Message(
			BigInt(this.msgType.toString()),
			this.data.map((x: BigInt) => BigInt(x.toString()))
		);
	};

	public equals = (m: Message): boolean => {
		if (this.data.length !== m.data.length) {
			return false;
		}
		if (this.msgType !== m.msgType) {
			return false;
		}

		for (let i = 0; i < this.data.length; i++) {
			if (this.data[i] !== m.data[i]) {
				return false;
			}
		}

		return true;
	};
}

/*
 * A Ballot represents a User's votes in a Poll, as well as their next valid
 * nonce.
 * @param _voiceCreditBalance The user's voice credit balance
 * @param _nonce The number of valid commands which the user has already
 *               published
 */
class Ballot {
	public votes: BigInt[] = [];
	public nonce: BigInt = BigInt(0);
	public voteOptionTreeDepth: number;

	constructor(_numVoteOptions: number, _voteOptionTreeDepth: number) {
		this.voteOptionTreeDepth = _voteOptionTreeDepth;
		assert(5 ** _voteOptionTreeDepth >= _numVoteOptions);
		assert(_numVoteOptions >= 0);
		for (let i = 0; i < _numVoteOptions; i++) {
			this.votes.push(BigInt(0));
		}
	}

	public hash = (): BigInt => {
		const vals = this.asArray();
		return hashLeftRight(vals[0], vals[1]);
	};

	public asCircuitInputs = (): BigInt[] => {
		return this.asArray();
	};

	public asArray = (): BigInt[] => {
		let lastIndexToInsert = this.votes.length - 1;
		while (lastIndexToInsert > 0) {
			if (this.votes[lastIndexToInsert] !== BigInt(0)) {
				break;
			}
			lastIndexToInsert--;
		}
		const voTree = new IncrementalQuinTree(
			this.voteOptionTreeDepth,
			BigInt(0),
			5,
			hash5
		);
		for (let i = 0; i <= lastIndexToInsert; i++) {
			voTree.insert(this.votes[i]);
		}

		return [this.nonce, voTree.root];
	};

	public copy = (): Ballot => {
		const b = new Ballot(this.votes.length, this.voteOptionTreeDepth);

		b.votes = this.votes.map((x) => BigInt(x.toString()));
		b.nonce = BigInt(this.nonce.toString());

		return b;
	};

	public equals(b: Ballot): boolean {
		for (let i = 0; i < this.votes.length; i++) {
			if (b.votes[i] !== this.votes[i]) {
				return false;
			}
		}
		return b.nonce === this.nonce && this.votes.length === b.votes.length;
	}

	public static genRandomBallot(
		_numVoteOptions: number,
		_voteOptionTreeDepth: number
	) {
		const ballot = new Ballot(_numVoteOptions, _voteOptionTreeDepth);
		ballot.nonce = genRandomSalt();
		return ballot;
	}

	public static genBlankBallot(
		_numVoteOptions: number,
		_voteOptionTreeDepth: number
	) {
		const ballot = new Ballot(_numVoteOptions, _voteOptionTreeDepth);
		return ballot;
	}
}

/*
 * A leaf in the deactivated keys tree, containing hashed deactivated public key with deactivation status
 */
class DeactivatedKeyLeaf implements IDeactivatedKeyLeaf {
    public pubKey: PubKey;
    public c1: BigInt[];
    public c2: BigInt[];
    public salt: BigInt;

    constructor (
        pubKey: PubKey,
        c1: BigInt[],
        c2: BigInt[],
        salt: BigInt
    ) {
        this.pubKey = pubKey
        this.c1 = c1
        this.c2 = c2
        this.salt = salt
    }

    /*
     * Deep-copies the object
     */
    public copy(): DeactivatedKeyLeaf {
        return new DeactivatedKeyLeaf(
            this.pubKey.copy(),
            [BigInt(this.c1[0].toString()), BigInt(this.c1[1].toString())],
            [BigInt(this.c2[0].toString()), BigInt(this.c2[1].toString())],
            BigInt(this.salt.toString()),
        )
    }

    public static genBlankLeaf(): DeactivatedKeyLeaf {
        // The public key for a blank state leaf is the first Pedersen base
        // point from iden3's circomlib implementation of the Pedersen hash.
        // Since it is generated using a hash-to-curve function, we are
        // confident that no-one knows the private key associated with this
        // public key. See:
        // https://github.com/iden3/circomlib/blob/d5ed1c3ce4ca137a6b3ca48bec4ac12c1b38957a/src/pedersen_printbases.js
        // Its hash should equal
        // 6769006970205099520508948723718471724660867171122235270773600567925038008762.
        return new DeactivatedKeyLeaf(
            new PubKey([
                BigInt('10457101036533406547632367118273992217979173478358440826365724437999023779287'),
                BigInt('19824078218392094440610104313265183977899662750282163392862422243483260492317'),
            ]),
            [BigInt(0), BigInt(0)],
            [BigInt(0), BigInt(0)],
            BigInt(0)
        )
    }

    public static genRandomLeaf() {
        const keypair = new Keypair()
        return new DeactivatedKeyLeaf(
            keypair.pubKey,
            [BigInt(0), BigInt(0)],
            [BigInt(0), BigInt(0)],
            genRandomSalt()
        )
    }

    private asArray = (): BigInt[] => {

        return [
            hash3([...this.pubKey.asArray(), this.salt]),
            ...this.c1,
            ...this.c2,
        ]
    }

    public asCircuitInputs = (): BigInt[] => {

        return this.asArray()
    }

    public hash = (): BigInt => {

        return hash5(this.asArray())
    }

    public asContractParam() {
        return {
            pubKeyHash: hash3([...this.pubKey.asArray(), this.salt]),
            c1: this.c1,
            c2: this.c2,
        }
    }

    public equals(s: DeactivatedKeyLeaf): boolean {
        return this.pubKey.equals(s.pubKey) &&
            this.c1[0] === s.c1[0] &&
            this.c1[0] === s.c1[1] &&
            this.c2[0] === s.c2[0] &&
            this.c2[0] === s.c2[1] &&
            this.salt === s.salt
    }

    public serialize = (): string => {
        const j = [
            this.pubKey.serialize(),
            this.c1[0].toString(16),
            this.c1[1].toString(16),
            this.c2[0].toString(16),
            this.c2[1].toString(16),
            this.salt.toString(16),
        ]

        return base64url(
            Buffer.from(JSON.stringify(j, null, 0), 'utf8')
        )
    }

    static unserialize = (serialized: string): DeactivatedKeyLeaf => {
        const j = JSON.parse(base64url.decode(serialized))

        return new DeactivatedKeyLeaf(
            PubKey.unserialize(j[0]),
            [BigInt('0x' + j[1]), BigInt('0x' + j[2])],
            [BigInt('0x' + j[3]), BigInt('0x' + j[4])],
            BigInt('0x' + j[5]),
        )
    }
}

/*
 * A leaf in the state tree, which maps public keys to voice credit balances
 */
class StateLeaf implements IStateLeaf {
	public pubKey: PubKey;
	public voiceCreditBalance: BigInt;
	public timestamp: BigInt;

	constructor(pubKey: PubKey, voiceCreditBalance: BigInt, timestamp: BigInt) {
		this.pubKey = pubKey;
		this.voiceCreditBalance = voiceCreditBalance;
		this.timestamp = timestamp;
	}

	/*
	 * Deep-copies the object
	 */
	public copy(): StateLeaf {
		return new StateLeaf(
			this.pubKey.copy(),
			BigInt(this.voiceCreditBalance.toString()),
			BigInt(this.timestamp.toString())
		);
	}

	public static genBlankLeaf(): StateLeaf {
		// The public key for a blank state leaf is the first Pedersen base
		// point from iden3's circomlib implementation of the Pedersen hash.
		// Since it is generated using a hash-to-curve function, we are
		// confident that no-one knows the private key associated with this
		// public key. See:
		// https://github.com/iden3/circomlib/blob/d5ed1c3ce4ca137a6b3ca48bec4ac12c1b38957a/src/pedersen_printbases.js
		// Its hash should equal
		// 6769006970205099520508948723718471724660867171122235270773600567925038008762.
		return new StateLeaf(
			new PubKey([
				BigInt(
					'10457101036533406547632367118273992217979173478358440826365724437999023779287'
				),
				BigInt(
					'19824078218392094440610104313265183977899662750282163392862422243483260492317'
				),
			]),
			BigInt(0),
			BigInt(0)
		);
	}

	public static genRandomLeaf() {
		const keypair = new Keypair();
		return new StateLeaf(keypair.pubKey, genRandomSalt(), BigInt(0));
	}

	private asArray = (): BigInt[] => {
		return [...this.pubKey.asArray(), this.voiceCreditBalance, this.timestamp];
	};

	public asCircuitInputs = (): BigInt[] => {
		return this.asArray();
	};

	public hash = (): BigInt => {
		return hash4(this.asArray());
	};

	public asContractParam() {
		return {
			pubKey: this.pubKey.asContractParam(),
			voiceCreditBalance: this.voiceCreditBalance.toString(),
			timestamp: this.timestamp.toString(),
		};
	}

	public equals(s: StateLeaf): boolean {
		return (
			this.pubKey.equals(s.pubKey) &&
			this.voiceCreditBalance === s.voiceCreditBalance &&
			this.timestamp === s.timestamp
		);
	}

	public serialize = (): string => {
		const j = [
			this.pubKey.serialize(),
			this.voiceCreditBalance.toString(16),
			this.timestamp.toString(16),
		];

		return base64url(Buffer.from(JSON.stringify(j, null, 0), 'utf8'));
	};

	static unserialize = (serialized: string): StateLeaf => {
		const j = JSON.parse(base64url.decode(serialized));

		return new StateLeaf(
			PubKey.unserialize(j[0]),
			BigInt('0x' + j[1]),
			BigInt('0x' + j[2])
		);
	};
}

class Command {
	public cmdType: BigInt;
	constructor() {}
	public copy = (): Command => {
		throw new Error('Abstract method!');
	};
	public equals = (Command): boolean => {
		throw new Error('Abstract method!');
	};
}

class TCommand extends Command {
	public cmdType: BigInt;
	public stateIndex: BigInt;
	public amount: BigInt;
	public pollId: BigInt;

	constructor(stateIndex: BigInt, amount: BigInt) {
		super();
		this.cmdType = BigInt(2);
		this.stateIndex = stateIndex;
		this.amount = amount;
	}

	public copy = (): TCommand => {
		return new TCommand(
			BigInt(this.stateIndex.toString()),
			BigInt(this.amount.toString())
		);
	};

	public equals = (command: TCommand): boolean => {
		return (
			this.stateIndex === command.stateIndex && this.amount === command.amount
		);
	};
}

/*
 * Unencrypted data whose fields include the user's public key, vote etc.
 */
class PCommand extends Command {
	public cmdType: BigInt;
	public stateIndex: BigInt;
	public newPubKey: PubKey;
	public voteOptionIndex: BigInt;
	public newVoteWeight: BigInt;
	public nonce: BigInt;
	public pollId: BigInt;
	public salt: BigInt;

	constructor(
		stateIndex: BigInt,
		newPubKey: PubKey,
		voteOptionIndex: BigInt,
		newVoteWeight: BigInt,
		nonce: BigInt,
		pollId: BigInt,
		salt: BigInt = genRandomSalt()
	) {
		super();
		const limit50Bits = BigInt(2 ** 50);
		assert(limit50Bits >= stateIndex);
		assert(limit50Bits >= voteOptionIndex);
		assert(limit50Bits >= newVoteWeight);
		assert(limit50Bits >= nonce);
		assert(limit50Bits >= pollId);

		this.cmdType = BigInt(1);
		this.stateIndex = stateIndex;
		this.newPubKey = newPubKey;
		this.voteOptionIndex = voteOptionIndex;
		this.newVoteWeight = newVoteWeight;
		this.nonce = nonce;
		this.pollId = pollId;
		this.salt = salt;
	}

	public copy = (): PCommand => {
		return new PCommand(
			BigInt(this.stateIndex.toString()),
			this.newPubKey.copy(),
			BigInt(this.voteOptionIndex.toString()),
			BigInt(this.newVoteWeight.toString()),
			BigInt(this.nonce.toString()),
			BigInt(this.pollId.toString()),
			BigInt(this.salt.toString())
		);
	};

	/*
	 * Returns this Command as an array. Note that 5 of the Command's fields
	 * are packed into a single 250-bit value. This allows Messages to be
	 * smaller and thereby save gas when the user publishes a message.
	 */
	public asArray = (): BigInt[] => {
		const p =
			BigInt(`${this.stateIndex}`) +
			(BigInt(`${this.voteOptionIndex}`) << BigInt(50)) +
			(BigInt(`${this.newVoteWeight}`) << BigInt(100)) +
			(BigInt(`${this.nonce}`) << BigInt(150)) +
			(BigInt(`${this.pollId}`) << BigInt(200));

		const a = [p, ...this.newPubKey.asArray(), this.salt];
		assert(a.length === 4);
		return a;
	};

	public asCircuitInputs = (): BigInt[] => {
		return this.asArray();
	};

	/*
	 * Check whether this command has deep equivalence to another command
	 */
	public equals = (command: PCommand): boolean => {
		return (
			this.stateIndex === command.stateIndex &&
			this.newPubKey[0] === command.newPubKey[0] &&
			this.newPubKey[1] === command.newPubKey[1] &&
			this.voteOptionIndex === command.voteOptionIndex &&
			this.newVoteWeight === command.newVoteWeight &&
			this.nonce === command.nonce &&
			this.pollId === command.pollId &&
			this.salt === command.salt
		);
	};

	public hash = (): BigInt => {
		return hash4(this.asArray());
	};

	/*
	 * Signs this command and returns a Signature.
	 */
	public sign = (privKey: PrivKey): Signature => {
		return sign(privKey.rawPrivKey, this.hash());
	};

	/*
	 * Returns true if the given signature is a correct signature of this
	 * command and signed by the private key associated with the given public
	 * key.
	 */
	public verifySignature = (signature: Signature, pubKey: PubKey): boolean => {
		return verifySignature(this.hash(), signature, pubKey.rawPubKey);
	};

	/*
	 * Encrypts this command along with a signature to produce a Message.
	 * To save gas, we can constrain the following values to 50 bits and pack
	 * them into a 250-bit value:
	 * 0. state index
	 * 3. vote option index
	 * 4. new vote weight
	 * 5. nonce
	 * 6. poll ID
	 */
	public encrypt = (
		signature: Signature,
		sharedKey: EcdhSharedKey
	): Message => {
		const plaintext = [
			...this.asArray(),
			signature.R8[0],
			signature.R8[1],
			signature.S,
		];

		assert(plaintext.length === 7);

		const ciphertext: Ciphertext = encrypt(plaintext, sharedKey, BigInt(0));

		const message = new Message(BigInt(1), ciphertext);

		return message;
	};

	/*
	 * Decrypts a Message to produce a Command.
	 */
	public static decrypt = (message: Message, sharedKey: EcdhSharedKey) => {
		const decrypted = decrypt(message.data, sharedKey, BigInt(0), 7);

		const p = BigInt(`${decrypted[0]}`);

		// Returns the value of the 50 bits at position `pos` in `val`
		// create 50 '1' bits
		// shift left by pos
		// AND with val
		// shift right by pos
		const extract = (val: BigInt, pos: number): BigInt => {
			return (
				BigInt(
					(((BigInt(1) << BigInt(50)) - BigInt(1)) << BigInt(pos)) &
						BigInt(`${val}`)
				) >> BigInt(pos)
			);
		};

		// p is a packed value
		// bits 0 - 50:    stateIndex
		// bits 51 - 100:  voteOptionIndex
		// bits 101 - 150: newVoteWeight
		// bits 151 - 200: nonce
		// bits 201 - 250: pollId
		const stateIndex = extract(p, 0);
		const voteOptionIndex = extract(p, 50);
		const newVoteWeight = extract(p, 100);
		const nonce = extract(p, 150);
		const pollId = extract(p, 200);

		const newPubKey = new PubKey([decrypted[1], decrypted[2]]);
		const salt = decrypted[3];

		const command = new PCommand(
			stateIndex,
			newPubKey,
			voteOptionIndex,
			newVoteWeight,
			nonce,
			pollId,
			salt
		);

		const signature = {
			R8: [decrypted[4], decrypted[5]],
			S: decrypted[6],
		};

		return { command, signature };
	};
}

/*
 * Unencrypted data whose fields include the user's public key, vote etc.
 */
class KCommand extends Command {
	public cmdType: BigInt;
	public newPubKey: PubKey;
	public newCreditBalance: BigInt;
	public nullifier: BigInt;
	public c1r: BigInt[];
	public c2r: BigInt[];
	public pollId: BigInt;

	constructor(
		newPubKey: PubKey,
		newCreditBalance: BigInt,
		nullifier: BigInt,
		c1r: BigInt[],
		c2r: BigInt[],
		pollId: BigInt,
	) {
		super();
		this.cmdType = BigInt(3);
		this.newPubKey = newPubKey;
		this.newCreditBalance = newCreditBalance;
		this.pollId = pollId;
		this.nullifier = nullifier;
		this.c1r = c1r;
		this.c2r = c2r;
	}

	public copy = (): KCommand => {
		return new KCommand(
			this.newPubKey.copy(),
			BigInt(this.newCreditBalance.toString()),
			BigInt(this.nullifier.toString()),
			[BigInt(this.c1r[0].toString()), BigInt(this.c1r[1].toString())],
			[BigInt(this.c2r[0].toString()), BigInt(this.c2r[1].toString())],
			BigInt(this.pollId.toString()),
		);
	};

	public asArray = (): BigInt[] => {		
		const a = [
			...this.newPubKey.asArray(), 
			this.newCreditBalance,
			this.nullifier,
			...this.c1r,
			...this.c2r,
			this.pollId,
		];
		assert(a.length === 9);
		return a;
	};

	public asCircuitInputs = (): BigInt[] => {
		return this.asArray();
	};

	/*
	 * Check whether this command has deep equivalence to another command
	 */
	public equals = (command: KCommand): boolean => {
		return (
			this.newPubKey[0] === command.newPubKey[0] &&
			this.newPubKey[1] === command.newPubKey[1] &&
			this.newCreditBalance === command.newCreditBalance &&
			this.c1r[0] === command.c1r[0] &&
			this.c1r[1] === command.c1r[1] &&
			this.c2r[0] === command.c2r[0] &&
			this.c2r[1] === command.c2r[1] &&
			this.pollId === command.pollId
		);
	};

	public hash = (): BigInt => {
		return hash9(this.asArray());
	};

	public encrypt = (
		sharedKey: EcdhSharedKey
	): Message => {

		const plaintext = [
			...this.asArray()
		];

		assert(plaintext.length === 9);

		const ciphertext: Ciphertext = encrypt(plaintext, sharedKey, BigInt(0));

		const message = new Message(BigInt(3), ciphertext);

		return message;
	};

	/*
	 * Decrypts a Message to produce a Command.
	 */
	public static decrypt = (message: Message, sharedKey: EcdhSharedKey) => {
		const decrypted = decrypt(message.data, sharedKey, BigInt(0), 9);
		const newPubKey = new PubKey([decrypted[0], decrypted[1]]);
		const newCreditBalance = decrypted[2];
		const nullifier = decrypted[3];
		const c1r = [decrypted[4], decrypted[5]];
		const c2r = [decrypted[6], decrypted[7]];
		const pollId = decrypted[8];

		const command = new KCommand(
			newPubKey,
			newCreditBalance,
			nullifier,
			c1r,
			c2r,
			pollId,
		);

		return { command };
	};

	public prepareValues(
		deactivatedPrivateKey: PrivKey,
		stateLeaves: StateLeaf[],
		stateTree: any,
        numSignUps: BigInt,
        stateIndex: BigInt,
        salt: BigInt, // Salt used in key deactivation message
		coordinatorPubKey: PubKey,
        deactivatedKeysTree: any,
		deactivatedKeyIndex: BigInt,
		z: BigInt,
		c1: BigInt[],
		c2: BigInt[],
	) {
		const stateTreeRoot = stateTree.root;
		const deactivatedKeysRoot = deactivatedKeysTree.root;
		
		const stateLeaf = stateLeaves[parseInt(stateIndex.toString())];
		const { voiceCreditBalance: oldCreditBalance, timestamp } = stateLeaf;

		const stateTreeInclusionProof = stateTree.genMerklePath(Number(stateIndex)).pathElements;
		const deactivatedKeysInclusionProof = deactivatedKeysTree.genMerklePath(parseInt(deactivatedKeyIndex.toString())).pathElements;

		const ecdhKeypair = new Keypair()
		const sharedKey = Keypair.genEcdhSharedKey(
			ecdhKeypair.privKey,
			coordinatorPubKey,
		)

		const encryptedMessage = this.encrypt(sharedKey);
		const messageHash = sha256Hash(encryptedMessage.asContractParam().data.map((x:string) => BigInt(x)));

		const circuitInputs = stringifyBigInts({
			oldPrivKey: deactivatedPrivateKey.asCircuitInputs(),         
			newPubKey: this.newPubKey.asCircuitInputs(),
			numSignUps,
			stateIndex,
			salt,
			stateTreeRoot,
			deactivatedKeysRoot,
			stateTreeInclusionProof,
			oldCreditBalance,
			newCreditBalance: this.newCreditBalance,
			stateLeafTimestamp: timestamp,
			deactivatedKeysInclusionProof,
			deactivatedKeyIndex,
			c1,
			c2,
			coordinatorPubKey: coordinatorPubKey.asCircuitInputs(),
			encPrivKey: ecdhKeypair.privKey.asCircuitInputs(),
			c1r: this.c1r,
			c2r: this.c2r,
			z,
			nullifier: this.nullifier,
			pollId: this.pollId,
			inputHash: sha256Hash([
				stateTreeRoot,
				deactivatedKeysRoot,
				messageHash,
				...coordinatorPubKey.asCircuitInputs(),
				...ecdhKeypair.pubKey.asCircuitInputs(),
			]),
		})

		return { circuitInputs, encPubKey: ecdhKeypair.pubKey, message: encryptedMessage };
	}
}

export {
    StateLeaf,
    DeactivatedKeyLeaf,
    Ballot,
    VoteOptionTreeLeaf,
    PCommand,
    TCommand,
	KCommand,
    Command,
    Message,
    Keypair,
    PubKey,
    PrivKey,
    VerifyingKey,
    Proof,
}
