// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { PoseidonT3 } from "../crypto/PoseidonT3.sol";

/// @notice A struct that holds a LazyIMT data
struct LazyIMTData {
  uint40 maxIndex;
  uint40 numberOfLeaves;
  mapping(uint256 => uint256) elements;
}

/// @notice Custom errors
error DefaultZeroBadIndex();
error DepthTooLarge();
error DepthCannotBeZero();
error NumberOfLeavesCannotBeZero();
error AmbiguousDepth();

/// @title InternalLazyIMT
/// @dev A LazyIMT with Zeroes value set to the hash of
/// a MACI Blank State Leaf
/// @notice This implementation is taken from zk-kit
/// https://github.com/privacy-scaling-explorations/zk-kit/blob/main/packages/imt.sol/contracts/internal/InternalLazyIMT.sol
/// and modified to work with MACI.
library InternalLazyIMT {
  uint256 internal constant MAX_DEPTH = 32;

  uint40 internal constant MAX_INDEX = (1 << 32) - 1;

  uint256 internal constant Z_0 = 6769006970205099520508948723718471724660867171122235270773600567925038008762;
  uint256 internal constant Z_1 = 2972820301952105722688860985556183033855705951263221082702981787813754939537;
  uint256 internal constant Z_2 = 19009473369953096352828532459942637819279786575057870804186038131433538383332;
  uint256 internal constant Z_3 = 1877001762518233819645599208989578372605193385355680834239714249281096297174;
  uint256 internal constant Z_4 = 4022598852800694816938652741439614774645858989706174527409714109784047480520;
  uint256 internal constant Z_5 = 8078617093048295855521451309865989496051030103472138252021705658681696298712;
  uint256 internal constant Z_6 = 21861637049723057871988413507302821095913894718242489848472531680353400271584;
  uint256 internal constant Z_7 = 2969626195902860050407584814596940245443093107470116547781577350415736914038;
  uint256 internal constant Z_8 = 13863086449569754493134198846069090996475357615094865751949144794620598051673;
  uint256 internal constant Z_9 = 13774233155966252113965527228795435224641075024674384267997743867571011718458;
  uint256 internal constant Z_10 = 7674682532432601125535053858292577379388329393276537570517515727197672122157;
  uint256 internal constant Z_11 = 2657471847139856346360223652201172662911313292042510535836997980857168085414;
  uint256 internal constant Z_12 = 14112562742724116016492623819773686970029672095023612838615540190985426106768;
  uint256 internal constant Z_13 = 16966520284141749853106006448832965932249937855809150844697400390499975107456;
  uint256 internal constant Z_14 = 21146121663662200258116396149536742745305242191891337170899444969488030502620;
  uint256 internal constant Z_15 = 8395571901509192935479743034608666551563743095742598750914087478677907730358;
  uint256 internal constant Z_16 = 11584898446168752024843587018551921614604785083342073076015560385003528300499;
  uint256 internal constant Z_17 = 19681365563800708744156562671961079617734353445922751560400662591064339349816;
  uint256 internal constant Z_18 = 11060693795061987995391612467169498625108376769265861980249917517984263067473;
  uint256 internal constant Z_19 = 20136055137568042031318427040358591430196153124171666293804511634641041409480;
  uint256 internal constant Z_20 = 10438448879123510479428288344427042332522761183009746406441238260861529360499;
  uint256 internal constant Z_21 = 20302411580043873005239406811066876697276902025885155920151067303221158887923;
  uint256 internal constant Z_22 = 16905699456770804689394621400052823445587122726651394178036372609288266146575;
  uint256 internal constant Z_23 = 13317924909658910751179983108234689413063120680580702936091220805509299490708;
  uint256 internal constant Z_24 = 11624463897690689883938167321830091369950933831231839575225419984927228390345;
  uint256 internal constant Z_25 = 12388077003631746290497429926117583834311703848735670874049584990731919769551;
  uint256 internal constant Z_26 = 16641943593086083573943184041147806885253724243247212515325749241831788827569;
  uint256 internal constant Z_27 = 8675770901378242337954792996483564563211065498082968464791979179678744114204;
  uint256 internal constant Z_28 = 3741944068643598116715410464277276913339851849923986024648161859457213369743;
  uint256 internal constant Z_29 = 9365051374992868354747065577256691008852056444829383197903446097138255771103;
  uint256 internal constant Z_30 = 19608043542461863702809013760105552654336523908709289008189330402608282498922;
  uint256 internal constant Z_31 = 15116478429455923389320892447700153271977917184085737305957533984219061034768;
  uint256 internal constant Z_32 = 13372161856163346716845871420623647679532631520878788090782842562075678687737;

  /// @notice Returns the default zero value for a given index
  /// @param index The index of the zero value
  /// @return The zero value
  function _defaultZero(uint8 index) internal pure returns (uint256) {
    if (index == 0) return Z_0;
    if (index == 1) return Z_1;
    if (index == 2) return Z_2;
    if (index == 3) return Z_3;
    if (index == 4) return Z_4;
    if (index == 5) return Z_5;
    if (index == 6) return Z_6;
    if (index == 7) return Z_7;
    if (index == 8) return Z_8;
    if (index == 9) return Z_9;
    if (index == 10) return Z_10;
    if (index == 11) return Z_11;
    if (index == 12) return Z_12;
    if (index == 13) return Z_13;
    if (index == 14) return Z_14;
    if (index == 15) return Z_15;
    if (index == 16) return Z_16;
    if (index == 17) return Z_17;
    if (index == 18) return Z_18;
    if (index == 19) return Z_19;
    if (index == 20) return Z_20;
    if (index == 21) return Z_21;
    if (index == 22) return Z_22;
    if (index == 23) return Z_23;
    if (index == 24) return Z_24;
    if (index == 25) return Z_25;
    if (index == 26) return Z_26;
    if (index == 27) return Z_27;
    if (index == 28) return Z_28;
    if (index == 29) return Z_29;
    if (index == 30) return Z_30;
    if (index == 31) return Z_31;
    if (index == 32) return Z_32;
    revert DefaultZeroBadIndex();
  }

  /// @notice Initializes the LazyIMT
  /// @param self The LazyIMTData
  /// @param depth The depth of the tree
  function _init(LazyIMTData storage self, uint8 depth) internal {
    if (depth > MAX_DEPTH) {
      revert DepthTooLarge();
    }
    self.maxIndex = uint40((1 << depth) - 1);
    self.numberOfLeaves = 0;
  }

  /// @notice Returns the index for a given level and index
  /// @param level The level
  /// @param index The index
  /// @return The index for the element
  function _indexForElement(uint8 level, uint40 index) internal pure returns (uint40) {
    // store the elements sparsely
    return (uint40(level) << 32) - level + index;
  }

  /// @notice Inserts a leaf into the LazyIMT
  /// @param self The LazyIMTData
  /// @param leaf The leaf to insert
  function _insert(LazyIMTData storage self, uint256 leaf) internal {
    uint40 index = self.numberOfLeaves;

    self.numberOfLeaves = index + 1;

    uint256 hash = leaf;

    for (uint8 i = 0; ; ) {
      self.elements[_indexForElement(i, index)] = hash;
      // it's a left element so we don't hash until there's a right element
      if (index & 1 == 0) break;
      uint40 elementIndex = _indexForElement(i, index - 1);
      hash = PoseidonT3.poseidon([self.elements[elementIndex], hash]);
      unchecked {
        index >>= 1;
        i++;
      }
    }
  }

  /// @notice Returns the root of the LazyIMT
  /// @param self The LazyIMTData
  /// @return The root of the LazyIMT
  function _root(LazyIMTData storage self) internal view returns (uint256) {
    // this will always short circuit if self.numberOfLeaves == 0
    uint40 numberOfLeaves = self.numberOfLeaves;
    // dynamically determine a depth
    uint8 depth = 1;
    while (uint40(1 << depth) < numberOfLeaves) {
      depth++;
    }
    return _root(self, numberOfLeaves, depth);
  }

  /// @notice Returns the root of the LazyIMT
  /// @dev Here it's assumed that the depth value is valid.
  /// If it is either 0 or > 2^8-1 this function will panic.
  /// @param self The LazyIMTData
  /// @param numberOfLeaves The number of leaves
  /// @param depth The depth of the tree
  /// @return The root of the LazyIMT
  function _root(LazyIMTData storage self, uint40 numberOfLeaves, uint8 depth) internal view returns (uint256) {
    if (depth > MAX_DEPTH) {
      revert DepthTooLarge();
    }
    // this should always short circuit if self.numberOfLeaves == 0
    if (numberOfLeaves == 0) return _defaultZero(depth);
    uint256[] memory levels = new uint256[](depth + 1);
    _levels(self, numberOfLeaves, depth, levels);
    return levels[depth];
  }

  /// @notice Updates the levels of the LazyIMT
  /// @param self The LazyIMTData
  /// @param numberOfLeaves The number of leaves
  /// @param depth The depth of the tree
  /// @param levels The levels of the tree
  function _levels(
    LazyIMTData storage self,
    uint40 numberOfLeaves,
    uint8 depth,
    uint256[] memory levels
  ) internal view {
    if (depth > MAX_DEPTH) {
      revert DepthTooLarge();
    }
    if (numberOfLeaves == 0) {
      revert NumberOfLeavesCannotBeZero();
    }

    // this should always short circuit if self.numberOfLeaves == 0
    uint40 index = numberOfLeaves - 1;

    if (index & 1 == 0) {
      levels[0] = self.elements[_indexForElement(0, index)];
    } else {
      levels[0] = _defaultZero(0);
    }

    for (uint8 i = 0; i < depth; ) {
      if (index & 1 == 0) {
        levels[i + 1] = PoseidonT3.poseidon([levels[i], _defaultZero(i)]);
      } else {
        uint256 levelCount = (numberOfLeaves) >> (i + 1);
        if (levelCount > index >> 1) {
          uint256 parent = self.elements[_indexForElement(i + 1, index >> 1)];
          levels[i + 1] = parent;
        } else {
          uint256 sibling = self.elements[_indexForElement(i, index - 1)];
          levels[i + 1] = PoseidonT3.poseidon([sibling, levels[i]]);
        }
      }
      unchecked {
        index >>= 1;
        i++;
      }
    }
  }
}
