// engine.js - 戰鬥與規則核心引擎

class BattleEngine {
    
    /**
     * 計算戰鬥結果 (修正了英雄不會反擊的邏輯)
     * @param {Object} attacker - 攻擊者 (必定是手下)
     * @param {Object} defender - 防禦者 (手下或英雄)
     * @param {boolean} isDefenderHero - 防禦者是否為英雄
     * @returns {Object} 雙方是否死亡的狀態
     */
    static calculateCombat(attacker, defender, isDefenderHero = false) {
        // 防禦者扣除攻擊者的攻擊力
        defender.hp -= attacker.atk;
        
        // 如果防禦者不是英雄，且具有攻擊力，攻擊者也會受傷
        if (!isDefenderHero && defender.atk) {
            attacker.hp -= defender.atk;
        }
        
        return { 
            attackerDead: attacker.hp <= 0, 
            defenderDead: defender.hp <= 0 
        };
    }

    /**
     * 判斷是否可以打出該卡牌
     */
    static canPlayCard(player, card) {
        // 能量必須足夠，且如果是手下牌，場上不能超過 7 隻
        return player.mana >= card.cost && (card.type !== 'minion' || player.board.length < 7);
    }

    /**
     * 檢查攻擊目標是否合法 (實裝「嘲諷」關鍵字邏輯)
     * @param {boolean} isTargetingHero - 是否瞄準英雄
     * @param {Object} targetMinion - 瞄準的手下物件 (若瞄準英雄則為 null)
     * @param {Array} enemyBoard - 敵方場上陣列
     * @returns {boolean} 是否可以攻擊該目標
     */
    static isValidAttackTarget(isTargetingHero, targetMinion, enemyBoard) {
        // 檢查敵方場上是否有嘲諷手下
        const hasTaunt = enemyBoard.some(minion => minion.keyword === 'taunt');
        
        if (hasTaunt) {
            // 如果場上有嘲諷，但玩家瞄準英雄 -> 不合法
            if (isTargetingHero) return false;
            // 如果場上有嘲諷，但瞄準的手下沒有嘲諷 -> 不合法
            if (targetMinion && targetMinion.keyword !== 'taunt') return false;
        }
        
        return true; // 沒有嘲諷或是乖乖打嘲諷，則合法
    }

    /**
     * 計算實際法術傷害 (實裝「法術傷害」關鍵字加成)
     * @param {Object} spellCard - 施放的法術卡
     * @param {Array} playerBoard - 施放方場上陣列
     * @returns {number} 計算加成後的最終傷害
     */
    static calculateSpellDamage(spellCard, playerBoard) {
        let baseDamage = spellCard.atk || 0;
        
        // 尋找場上是否有法術傷害加成的手下 (例如：林凡)
        let bonusDamage = playerBoard.reduce((sum, minion) => {
            return sum + (minion.keyword === 'spell_damage' ? 2 : 0); // 假設法傷預設 +2
        }, 0);

        return baseDamage + bonusDamage;
    }
}
