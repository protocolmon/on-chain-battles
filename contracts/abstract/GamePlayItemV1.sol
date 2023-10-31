// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../lib/RandomnessLibV1.sol";
import { IGenericEventLoggerV1 } from "../interfaces/IGenericEventLoggerV1.sol";

abstract contract GamePlayItem {
    using Strings for uint256;
    using Strings for uint16;

    IGenericEventLoggerV1 internal eventLogger;

    function isRandomHit(
        uint256 seed,
        string memory salt,
        uint8 chance
    ) internal pure returns (bool) {
        return RandomnessLibV1.isRandomHit(seed, salt, chance);
    }

    function setEventLogger(IGenericEventLoggerV1 _eventLogger) external {
        eventLogger = _eventLogger;
    }

    function emitBattleLogDamage(
        uint256 attacker,
        uint256 defender,
        address move,
        int16 damage,
        uint16 elementalEffectiveness,
        bool isCritical
    ) internal {
        if (address(eventLogger) == address(0)) return;

        string[] memory data = new string[](5);
        data[0] = defender.toString();
        data[1] = Strings.toHexString(uint256(uint160(move)), 20);
        data[2] = int16ToString(damage);
        data[3] = elementalEffectiveness.toString();
        data[4] = isCritical ? "true" : "false";

        eventLogger.logEventByTokenId(
            attacker,
            "Damage",
            data
        );
    }

    function emitBattleLogStatusEffect(
        uint256 player,
        address statusEffect,
        uint256 extraData
    ) internal {
        if (address(eventLogger) == address(0)) return;

        string[] memory data = new string[](2);
        data[0] = Strings.toHexString(uint256(uint160(statusEffect)), 20);
        data[1] = extraData.toString();

        eventLogger.logEventByTokenId(
            player,
            "StatusEffectExecuted",
            data
        );
    }

    function int16ToString(int16 input) internal returns (string memory) {
        return input < 0 ? string(abi.encodePacked("-", uint16(-input).toString())) : string(uint16(input).toString());
    }
}
