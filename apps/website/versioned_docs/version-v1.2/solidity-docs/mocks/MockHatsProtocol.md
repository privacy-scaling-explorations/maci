# MockHatsProtocol

A mock contract to test the HatsGatekeeper

### hats

```solidity
contract IHats hats
```

### lastTopHat

```solidity
uint256 lastTopHat
```

### lastHat

```solidity
uint256 lastHat
```

### constructor

```solidity
constructor(address _hats) public payable
```

Deploy an instance of MockHatsProtocol

#### Parameters

| Name   | Type    | Description                |
| ------ | ------- | -------------------------- |
| \_hats | address | The Hats Protocol contract |

### mintTopHat

```solidity
function mintTopHat(address _target, string _details, string _imageURI) external returns (uint256)
```

Creates and mints a Hat that is its own admin, i.e. a "topHat"

_A topHat has no eligibility and no toggle_

#### Parameters

| Name       | Type    | Description                                                                                                                                              |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_target   | address | The address to which the newly created topHat is minted                                                                                                  |
| \_details  | string  | A description of the Hat [optional]. Should not be larger than 7000 bytes (enforced in changeHatDetails)                                                 |
| \_imageURI | string  | The image uri for this top hat and the fallback for its downstream hats [optional]. Should not be larger than 7000 bytes (enforced in changeHatImageURI) |

#### Return Values

| Name | Type    | Description                                 |
| ---- | ------- | ------------------------------------------- |
| [0]  | uint256 | topHatId The id of the newly created topHat |

### createHat

```solidity
function createHat(uint256 _admin, string _details, uint32 _maxSupply, address _eligibility, address _toggle, bool _mutable, string _imageURI) external returns (uint256)
```

Creates a new hat. The msg.sender must wear the `_admin` hat.

_Initializes a new Hat struct, but does not mint any tokens._

#### Parameters

| Name          | Type    | Description                                                                                                                                          |
| ------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_admin       | uint256 | The id of the Hat that will control who wears the newly created hat                                                                                  |
| \_details     | string  | A description of the Hat. Should not be larger than 7000 bytes (enforced in changeHatDetails)                                                        |
| \_maxSupply   | uint32  | The total instances of the Hat that can be worn at once                                                                                              |
| \_eligibility | address | The address that can report on the Hat wearer's status                                                                                               |
| \_toggle      | address | The address that can deactivate the Hat                                                                                                              |
| \_mutable     | bool    | Whether the hat's properties are changeable after creation                                                                                           |
| \_imageURI    | string  | The image uri for this hat and the fallback for its downstream hats [optional]. Should not be larger than 7000 bytes (enforced in changeHatImageURI) |

#### Return Values

| Name | Type    | Description                              |
| ---- | ------- | ---------------------------------------- |
| [0]  | uint256 | newHatId The id of the newly created Hat |

### mintHat

```solidity
function mintHat(uint256 _hatId, address _wearer) external returns (bool)
```

Mints an ERC1155-similar token of the Hat to an eligible recipient, who then "wears" the hat

_The msg.sender must wear an admin Hat of `_hatId`, and the recipient must be eligible to wear `_hatId`_

#### Parameters

| Name     | Type    | Description                            |
| -------- | ------- | -------------------------------------- |
| \_hatId  | uint256 | The id of the Hat to mint              |
| \_wearer | address | The address to which the Hat is minted |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0]  | bool |             |

### isWearerOfHat

```solidity
function isWearerOfHat(address account, uint256 hat) external view returns (bool)
```

Checks whether a given address wears a given Hat

_Convenience function that wraps `balanceOf`_

#### Parameters

| Name    | Type    | Description                                   |
| ------- | ------- | --------------------------------------------- |
| account | address | The address in question                       |
| hat     | uint256 | The id of the Hat that the `_user` might wear |

#### Return Values

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | isWearer Whether the `_user` wears the Hat. |
