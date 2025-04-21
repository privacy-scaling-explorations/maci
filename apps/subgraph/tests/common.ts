import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
// eslint-disable-next-line import/no-extraneous-dependencies
import { createMockedFunction } from "matchstick-as";

export const DEFAULT_POLL_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000001");

export const DEFAULT_MESSAGE_PROCESSOR_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000002");

export const DEFAULT_TALLY_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000003");

export function mockPollContract(): void {
  createMockedFunction(DEFAULT_POLL_ADDRESS, "voteOptions", "voteOptions():(uint256)").returns([
    ethereum.Value.fromI32(20),
  ]);

  createMockedFunction(DEFAULT_POLL_ADDRESS, "treeDepths", "treeDepths():(uint8,uint8,uint8)").returns([
    ethereum.Value.fromI32(1),
    ethereum.Value.fromI32(2),
    ethereum.Value.fromI32(10),
  ]);

  createMockedFunction(
    DEFAULT_POLL_ADDRESS,
    "getDeployTimeAndDuration",
    "getDeployTimeAndDuration():(uint256,uint256)",
  ).returns([ethereum.Value.fromI32(30), ethereum.Value.fromI32(40)]);

  createMockedFunction(DEFAULT_POLL_ADDRESS, "getStartAndEndDate", "getStartAndEndDate():(uint256,uint256)").returns([
    ethereum.Value.fromI32(30),
    ethereum.Value.fromI32(40),
  ]);

  createMockedFunction(
    DEFAULT_POLL_ADDRESS,
    "hashMessageAndPublicKey",
    "hashMessageAndPublicKey((uint256[10]),(uint256,uint256)):(uint256)",
  )
    .withArgs([
      ethereum.Value.fromTuple(
        changetype<ethereum.Tuple>([
          ethereum.Value.fromFixedSizedArray([
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(2)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(3)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(4)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(5)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(6)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(7)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(8)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9)),
          ]),
        ]),
      ),
      ethereum.Value.fromTuple(
        changetype<ethereum.Tuple>([
          ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(2)),
          ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(3)),
        ]),
      ),
    ])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9000))]);
}

export function mockMaciContract(): void {
  createMockedFunction(
    Address.fromString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A"),
    "getPoll",
    "getPoll(uint256):((address,address,address))",
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))])
    .returns([
      ethereum.Value.fromTuple(
        changetype<ethereum.Tuple>([
          ethereum.Value.fromAddress(DEFAULT_POLL_ADDRESS),
          ethereum.Value.fromAddress(DEFAULT_MESSAGE_PROCESSOR_ADDRESS),
          ethereum.Value.fromAddress(DEFAULT_TALLY_ADDRESS),
        ]),
      ),
    ]);
}
