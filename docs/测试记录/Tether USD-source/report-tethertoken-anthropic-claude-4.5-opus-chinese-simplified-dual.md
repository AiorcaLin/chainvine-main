# Smart Contract Security Audit Report

**Contract**: TetherToken  
**Engines**: Slither  
**Time**: 2026-02-10T02:29:26.226Z  
**Tool**: Mush Audit - Dual-Engine Vulnerability Scanner

---

## Dual-Engine Overview

| Metric | Count |
|--------|-------|
| Total | **52** |
| Cross-Validated | **0** |
| Slither Only | 52 |
| AI Only | 0 |
| High Confidence | 0 |
| Deduplicated | 0 |

### Severity

| Level | Count |
|-------|-------|
| Medium | 15 |
| Low | 2 |
| Informational | 32 |
| Gas | 3 |

---

## All Findings

### Medium (15)

#### Erc20 Interface
- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:BasicToken.transfer(address,uint256) (TetherToken.sol#122-135)

- **Location:** `TetherToken.sol:303-309, TetherToken.sol:122-135`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:TetherToken.transfer(address,uint256) (TetherToken.sol#336-343)

- **Location:** `TetherToken.sol:311-448, TetherToken.sol:336-343`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:StandardToken.transferFrom(address,address,uint256) (TetherToken.sol#167-188)

- **Location:** `TetherToken.sol:311-448, TetherToken.sol:167-188`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:ERC20Basic.transfer(address,uint256) (TetherToken.sol#81)

- **Location:** `TetherToken.sol:303-309, TetherToken.sol:81-81`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:StandardToken.approve(address,uint256) (TetherToken.sol#195-205)

- **Location:** `TetherToken.sol:303-309, TetherToken.sol:195-205`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:ERC20.approve(address,uint256) (TetherToken.sol#92)

- **Location:** `TetherToken.sol:303-309, TetherToken.sol:92-92`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:ERC20Basic.transfer(address,uint256) (TetherToken.sol#81)

- **Location:** `TetherToken.sol:311-448, TetherToken.sol:81-81`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:TetherToken.transferFrom(address,address,uint256) (TetherToken.sol#346-353)

- **Location:** `TetherToken.sol:311-448, TetherToken.sol:346-353`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:ERC20.approve(address,uint256) (TetherToken.sol#92)

- **Location:** `TetherToken.sol:311-448, TetherToken.sol:92-92`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:TetherToken.approve(address,uint256) (TetherToken.sol#365-371)

- **Location:** `TetherToken.sol:311-448, TetherToken.sol:365-371`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:BasicToken.transfer(address,uint256) (TetherToken.sol#122-135)

- **Location:** `TetherToken.sol:311-448, TetherToken.sol:122-135`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:ERC20.transferFrom(address,address,uint256) (TetherToken.sol#91)

- **Location:** `TetherToken.sol:311-448, TetherToken.sol:91-91`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:StandardToken.approve(address,uint256) (TetherToken.sol#195-205)

- **Location:** `TetherToken.sol:311-448, TetherToken.sol:195-205`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:StandardToken.transferFrom(address,address,uint256) (TetherToken.sol#167-188)

- **Location:** `TetherToken.sol:303-309, TetherToken.sol:167-188`

- **Severity:** Medium
- **Source:** **[Slither]** | Medium Confidence
- **Description:** UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:ERC20.transferFrom(address,address,uint256) (TetherToken.sol#91)

- **Location:** `TetherToken.sol:303-309, TetherToken.sol:91-91`

### Low (2)

#### Events Access
- **Severity:** Low
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Ownable.transferOwnership(address) (TetherToken.sol#64-68) should emit an event for: 
	- owner = newOwner (TetherToken.sol#66) 

- **Location:** `TetherToken.sol:64-68, TetherToken.sol:66-66`

#### Missing Zero Check
- **Severity:** Low
- **Source:** **[Slither]** | Medium Confidence
- **Description:** TetherToken.deprecate(address)._upgradedAddress (TetherToken.sol#383) lacks a zero-check on :
		- upgradedAddress = _upgradedAddress (TetherToken.sol#385)

- **Location:** `TetherToken.sol:383-383, TetherToken.sol:385-385`

### Informational (32)

#### Solc Version
- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Version constraint ^0.4.17 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- DirtyBytesArrayToStorage
	- ABIDecodeTwoDimensionalArrayMemory
	- KeccakCaching
	- EmptyByteArrayCopy
	- DynamicArrayCleanup
	- ImplicitConstructorCallvalueCheck
	- TupleAssignmentMultiStackSlotComponents
	- MemoryArrayCreationOverflow
	- privateCanBeOverridden
	- SignedArrayStorageCopy
	- ABIEncoderV2StorageArrayWithMultiSlotElement
	- DynamicConstructorArgumentsClippedABIV2
	- Unini
- **Location:** `TetherToken.sol:1-1`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** solc-0.4.17 is an outdated solc version. Use a more recent version (at least 0.8.0), if possible.


#### Naming Convention
- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter BlackList.addBlackList(address)._evilUser (TetherToken.sol#277) is not in mixedCase

- **Location:** `TetherToken.sol:277-277`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter StandardToken.allowance(address,address)._spender (TetherToken.sol#213) is not in mixedCase

- **Location:** `TetherToken.sol:213-213`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter StandardToken.approve(address,uint256)._value (TetherToken.sol#195) is not in mixedCase

- **Location:** `TetherToken.sol:195-195`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter BasicToken.transfer(address,uint256)._value (TetherToken.sol#122) is not in mixedCase

- **Location:** `TetherToken.sol:122-122`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter StandardToken.allowance(address,address)._owner (TetherToken.sol#213) is not in mixedCase

- **Location:** `TetherToken.sol:213-213`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter TetherToken.transferFrom(address,address,uint256)._value (TetherToken.sol#346) is not in mixedCase

- **Location:** `TetherToken.sol:346-346`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter TetherToken.transfer(address,uint256)._to (TetherToken.sol#336) is not in mixedCase

- **Location:** `TetherToken.sol:336-336`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter StandardToken.transferFrom(address,address,uint256)._from (TetherToken.sol#167) is not in mixedCase

- **Location:** `TetherToken.sol:167-167`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter TetherToken.allowance(address,address)._spender (TetherToken.sol#374) is not in mixedCase

- **Location:** `TetherToken.sol:374-374`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter StandardToken.transferFrom(address,address,uint256)._to (TetherToken.sol#167) is not in mixedCase

- **Location:** `TetherToken.sol:167-167`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter BlackList.removeBlackList(address)._clearedUser (TetherToken.sol#282) is not in mixedCase

- **Location:** `TetherToken.sol:282-282`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter StandardToken.approve(address,uint256)._spender (TetherToken.sol#195) is not in mixedCase

- **Location:** `TetherToken.sol:195-195`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter TetherToken.transferFrom(address,address,uint256)._from (TetherToken.sol#346) is not in mixedCase

- **Location:** `TetherToken.sol:346-346`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter BlackList.destroyBlackFunds(address)._blackListedUser (TetherToken.sol#287) is not in mixedCase

- **Location:** `TetherToken.sol:287-287`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter TetherToken.transfer(address,uint256)._value (TetherToken.sol#336) is not in mixedCase

- **Location:** `TetherToken.sol:336-336`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter BasicToken.transfer(address,uint256)._to (TetherToken.sol#122) is not in mixedCase

- **Location:** `TetherToken.sol:122-122`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter TetherToken.transferFrom(address,address,uint256)._to (TetherToken.sol#346) is not in mixedCase

- **Location:** `TetherToken.sol:346-346`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter BlackList.getBlackListStatus(address)._maker (TetherToken.sol#267) is not in mixedCase

- **Location:** `TetherToken.sol:267-267`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Variable ERC20Basic._totalSupply (TetherToken.sol#78) is not in mixedCase

- **Location:** `TetherToken.sol:78-78`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter TetherToken.deprecate(address)._upgradedAddress (TetherToken.sol#383) is not in mixedCase

- **Location:** `TetherToken.sol:383-383`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter BasicToken.balanceOf(address)._owner (TetherToken.sol#142) is not in mixedCase

- **Location:** `TetherToken.sol:142-142`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter TetherToken.allowance(address,address)._owner (TetherToken.sol#374) is not in mixedCase

- **Location:** `TetherToken.sol:374-374`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter TetherToken.approve(address,uint256)._value (TetherToken.sol#365) is not in mixedCase

- **Location:** `TetherToken.sol:365-365`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter TetherToken.approve(address,uint256)._spender (TetherToken.sol#365) is not in mixedCase

- **Location:** `TetherToken.sol:365-365`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Parameter StandardToken.transferFrom(address,address,uint256)._value (TetherToken.sol#167) is not in mixedCase

- **Location:** `TetherToken.sol:167-167`

#### Unimplemented Functions
- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** UpgradedStandardToken (TetherToken.sol#303-309) does not implement functions:
	- UpgradedStandardToken.approveByLegacy(address,address,uint256) (TetherToken.sol#308)
	- ERC20Basic.totalSupply() (TetherToken.sol#79)
	- UpgradedStandardToken.transferByLegacy(address,address,uint256) (TetherToken.sol#306)
	- UpgradedStandardToken.transferFromByLegacy(address,address,address,uint256) (TetherToken.sol#307)

- **Location:** `TetherToken.sol:303-309, TetherToken.sol:308-308, TetherToken.sol:79-79, TetherToken.sol:306-306, TetherToken.sol:307-307`

#### Unindexed Event Address
- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Event BlackList.AddedBlackList(address) (TetherToken.sol#297) has address parameters but no indexed parameters

- **Location:** `TetherToken.sol:297-297`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Event TetherToken.Deprecate(address) (TetherToken.sol#443) has address parameters but no indexed parameters

- **Location:** `TetherToken.sol:443-443`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Event BlackList.RemovedBlackList(address) (TetherToken.sol#299) has address parameters but no indexed parameters

- **Location:** `TetherToken.sol:299-299`

- **Severity:** Informational
- **Source:** **[Slither]** | Medium Confidence
- **Description:** Event BlackList.DestroyedBlackFunds(address,uint256) (TetherToken.sol#295) has address parameters but no indexed parameters

- **Location:** `TetherToken.sol:295-295`

### Gas (3)

#### Constable States
- **Severity:** Gas
- **Source:** **[Slither]** | Medium Confidence
- **Description:** BasicToken.basisPointsRate (TetherToken.sol#106) should be constant 

- **Location:** `TetherToken.sol:106-106`

- **Severity:** Gas
- **Source:** **[Slither]** | Medium Confidence
- **Description:** BasicToken.maximumFee (TetherToken.sol#107) should be constant 

- **Location:** `TetherToken.sol:107-107`

- **Severity:** Gas
- **Source:** **[Slither]** | Medium Confidence
- **Description:** ERC20Basic._totalSupply (TetherToken.sol#78) should be constant 

- **Location:** `TetherToken.sol:78-78`

---

## Appendix: Slither Raw

*52 findings | 962ms*

- **[Medium]** `erc20-interface`: UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:BasicToken.transfer(address,uint256) (TetherToken.sol#122-135)
- **[Medium]** `erc20-interface`: TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:TetherToken.transfer(address,uint256) (TetherToken.sol#336-343)
- **[Medium]** `erc20-interface`: TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:StandardToken.transferFrom(address,address,uint256) (TetherToken.sol#167-188)
- **[Medium]** `erc20-interface`: UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:ERC20Basic.transfer(address,uint256) (TetherToken.sol#81)
- **[Medium]** `erc20-interface`: UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:StandardToken.approve(address,uint256) (TetherToken.sol#195-205)
- **[Medium]** `erc20-interface`: UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:ERC20.approve(address,uint256) (TetherToken.sol#92)
- **[Medium]** `erc20-interface`: TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:ERC20Basic.transfer(address,uint256) (TetherToken.sol#81)
- **[Medium]** `erc20-interface`: TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:TetherToken.transferFrom(address,address,uint256) (TetherToken.sol#346-353)
- **[Medium]** `erc20-interface`: TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:ERC20.approve(address,uint256) (TetherToken.sol#92)
- **[Medium]** `erc20-interface`: TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:TetherToken.approve(address,uint256) (TetherToken.sol#365-371)
- **[Medium]** `erc20-interface`: TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:BasicToken.transfer(address,uint256) (TetherToken.sol#122-135)
- **[Medium]** `erc20-interface`: TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:ERC20.transferFrom(address,address,uint256) (TetherToken.sol#91)
- **[Medium]** `erc20-interface`: TetherToken (TetherToken.sol#311-448) has incorrect ERC20 function interface:StandardToken.approve(address,uint256) (TetherToken.sol#195-205)
- **[Medium]** `erc20-interface`: UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:StandardToken.transferFrom(address,address,uint256) (TetherToken.sol#167-188)
- **[Medium]** `erc20-interface`: UpgradedStandardToken (TetherToken.sol#303-309) has incorrect ERC20 function interface:ERC20.transferFrom(address,address,uint256) (TetherToken.sol#91)
- **[Low]** `events-access`: Ownable.transferOwnership(address) (TetherToken.sol#64-68) should emit an event for: 
	- owner = newOwner (TetherToken.sol#66)
- **[Low]** `missing-zero-check`: TetherToken.deprecate(address)._upgradedAddress (TetherToken.sol#383) lacks a zero-check on :
		- upgradedAddress = _upgradedAddress (TetherToken.sol#385)
- **[Informational]** `solc-version`: Version constraint ^0.4.17 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- DirtyBytesArrayToStorage
	- ABIDecodeTwoDimensionalArrayMemory
	- KeccakCaching
	- Empt
- **[Informational]** `solc-version`: solc-0.4.17 is an outdated solc version. Use a more recent version (at least 0.8.0), if possible.
- **[Informational]** `naming-convention`: Parameter BlackList.addBlackList(address)._evilUser (TetherToken.sol#277) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter StandardToken.allowance(address,address)._spender (TetherToken.sol#213) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter StandardToken.approve(address,uint256)._value (TetherToken.sol#195) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter BasicToken.transfer(address,uint256)._value (TetherToken.sol#122) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter StandardToken.allowance(address,address)._owner (TetherToken.sol#213) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter TetherToken.transferFrom(address,address,uint256)._value (TetherToken.sol#346) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter TetherToken.transfer(address,uint256)._to (TetherToken.sol#336) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter StandardToken.transferFrom(address,address,uint256)._from (TetherToken.sol#167) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter TetherToken.allowance(address,address)._spender (TetherToken.sol#374) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter StandardToken.transferFrom(address,address,uint256)._to (TetherToken.sol#167) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter BlackList.removeBlackList(address)._clearedUser (TetherToken.sol#282) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter StandardToken.approve(address,uint256)._spender (TetherToken.sol#195) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter TetherToken.transferFrom(address,address,uint256)._from (TetherToken.sol#346) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter BlackList.destroyBlackFunds(address)._blackListedUser (TetherToken.sol#287) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter TetherToken.transfer(address,uint256)._value (TetherToken.sol#336) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter BasicToken.transfer(address,uint256)._to (TetherToken.sol#122) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter TetherToken.transferFrom(address,address,uint256)._to (TetherToken.sol#346) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter BlackList.getBlackListStatus(address)._maker (TetherToken.sol#267) is not in mixedCase
- **[Informational]** `naming-convention`: Variable ERC20Basic._totalSupply (TetherToken.sol#78) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter TetherToken.deprecate(address)._upgradedAddress (TetherToken.sol#383) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter BasicToken.balanceOf(address)._owner (TetherToken.sol#142) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter TetherToken.allowance(address,address)._owner (TetherToken.sol#374) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter TetherToken.approve(address,uint256)._value (TetherToken.sol#365) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter TetherToken.approve(address,uint256)._spender (TetherToken.sol#365) is not in mixedCase
- **[Informational]** `naming-convention`: Parameter StandardToken.transferFrom(address,address,uint256)._value (TetherToken.sol#167) is not in mixedCase
- **[Informational]** `unimplemented-functions`: UpgradedStandardToken (TetherToken.sol#303-309) does not implement functions:
	- UpgradedStandardToken.approveByLegacy(address,address,uint256) (TetherToken.sol#308)
	- ERC20Basic.totalSupply() (Tethe
- **[Informational]** `unindexed-event-address`: Event BlackList.AddedBlackList(address) (TetherToken.sol#297) has address parameters but no indexed parameters
- **[Informational]** `unindexed-event-address`: Event TetherToken.Deprecate(address) (TetherToken.sol#443) has address parameters but no indexed parameters
- **[Informational]** `unindexed-event-address`: Event BlackList.RemovedBlackList(address) (TetherToken.sol#299) has address parameters but no indexed parameters
- **[Informational]** `unindexed-event-address`: Event BlackList.DestroyedBlackFunds(address,uint256) (TetherToken.sol#295) has address parameters but no indexed parameters
- **[Optimization]** `constable-states`: BasicToken.basisPointsRate (TetherToken.sol#106) should be constant
- **[Optimization]** `constable-states`: BasicToken.maximumFee (TetherToken.sol#107) should be constant
- **[Optimization]** `constable-states`: ERC20Basic._totalSupply (TetherToken.sol#78) should be constant

---

> *Generated by Mush Audit. Cross-validated findings have higher confidence. Manual review recommended.*