class BattleEngine {
    static calculateCombat(attacker, defender) {
        defender.hp -= attacker.atk;
        attacker.hp -= defender.atk;
        return { attackerDead: attacker.hp <= 0, defenderDead: defender.hp <= 0 };
    }

    static canPlayCard(player, card) {
        return player.mana >= card.cost && (card.type !== 'minion' || player.board.length < 7);
    }
}
