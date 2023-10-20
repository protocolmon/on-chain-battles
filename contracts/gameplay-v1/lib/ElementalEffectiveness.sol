// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import { IMonsterV1 } from "../../interfaces/IMonsterV1.sol";

library ElementalEffectiveness {
    uint16 internal constant STRONG_MULTIPLIER = 200;
    uint16 internal constant DEFAULT_MULTIPLIER = 100;
    uint16 internal constant WEAK_MULTIPLIER = 50;

    function applyElementalEffectiveness(
        uint16 damage,
        IMonsterV1.Element attackerElement1,
        IMonsterV1.Element attackerElement2,
        IMonsterV1.Element defenderElement
    ) internal pure returns (uint16) {
        uint16 multiplier = _getAttackMultiplier(
            attackerElement1,
            attackerElement2,
            defenderElement
        );

        return (damage * multiplier) / 100;
    }

    function _getAttackMultiplier(
        IMonsterV1.Element attackerElement1,
        IMonsterV1.Element attackerElement2,
        IMonsterV1.Element defenderElement
    ) internal pure returns (uint16) {
        (uint16 multiplier1, uint16 multiplier2) = (
            _getSingleMultiplier(attackerElement1, defenderElement),
            _getSingleMultiplier(attackerElement2, defenderElement)
        );

        return (multiplier1 + multiplier2) / 2;
    }

    function _getSingleMultiplier(
        IMonsterV1.Element attackerElement,
        IMonsterV1.Element defenderElement
    ) internal pure returns (uint16 multiplier) {
        if (attackerElement == IMonsterV1.Element.Fire) {
            if (
                defenderElement == IMonsterV1.Element.Water ||
                defenderElement == IMonsterV1.Element.Mental
            ) {
                multiplier = WEAK_MULTIPLIER;
            } else if (
                defenderElement == IMonsterV1.Element.Nature ||
                defenderElement == IMonsterV1.Element.Toxic
            ) {
                multiplier = STRONG_MULTIPLIER;
            }
        } else if (attackerElement == IMonsterV1.Element.Water) {
            if (
                defenderElement == IMonsterV1.Element.Nature ||
                defenderElement == IMonsterV1.Element.Electric
            ) {
                multiplier = WEAK_MULTIPLIER;
            } else if (
                defenderElement == IMonsterV1.Element.Fire ||
                defenderElement == IMonsterV1.Element.Mental
            ) {
                multiplier = STRONG_MULTIPLIER;
            }
        } else if (attackerElement == IMonsterV1.Element.Nature) {
            if (
                defenderElement == IMonsterV1.Element.Fire ||
                defenderElement == IMonsterV1.Element.Toxic
            ) {
                multiplier = WEAK_MULTIPLIER;
            } else if (
                defenderElement == IMonsterV1.Element.Water ||
                defenderElement == IMonsterV1.Element.Electric
            ) {
                multiplier = STRONG_MULTIPLIER;
            }
        }

        multiplier = DEFAULT_MULTIPLIER;
    }
}
