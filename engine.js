// engine.js - 萬界戰場 (Auto Battler) 核心戰鬥引擎

export class BattleEngine {
    
    /**
     * 計算單次交鋒的傷害結算
     * @param {Object} attacker - 攻擊方棋子
     * @param {Object} defender - 防禦方棋子
     */
    static calculateCombat(attacker, defender) {
        // 互相造成等同於攻擊力的傷害
        defender.hp -= attacker.atk;
        if (defender.atk) {
            attacker.hp -= defender.atk;
        }
    }

    /**
     * 自動尋找攻擊目標 (自走棋核心 AI)
     * 邏輯：優先打嘲諷，若無嘲諷則隨機選擇一名存活敵人
     * @param {Array} enemyBoard - 敵方場上陣列
     * @returns {Object|null} 目標棋子，若全滅則回傳 null
     */
    static findAutoTarget(enemyBoard) {
        // 只找活著的敵人
        const aliveEnemies = enemyBoard.filter(m => m.hp > 0);
        if (aliveEnemies.length === 0) return null;

        // 1. 尋找是否有帶有「嘲諷 (taunt)」的目標
        const taunts = aliveEnemies.filter(m => m.keyword === 'taunt');
        
        // 2. 如果有嘲諷，從嘲諷中隨機挑選；沒有則從所有存活敵人中隨機挑選
        const targetPool = taunts.length > 0 ? taunts : aliveEnemies;
        const randomIndex = Math.floor(Math.random() * targetPool.length);
        
        return targetPool[randomIndex];
    }

    /**
     * 戰鬥開始時的技能結算 (處理英雄被動與光環)
     * @param {Array} board - 己方場上陣列
     * @param {Object} hero - 己方英雄
     */
    static triggerStartOfCombat(board, hero) {
        if (board.length === 0) return;

        // 【英雄技能結算】
        // 丹丹：最左邊單位 +2 攻擊
        if (hero && hero.id === 'h2') { 
            board[0].atk += 2;
        }

        // 【棋子技能結算】
        board.forEach((minion, index) => {
            // 餐館小二光環：相鄰友軍生命 +2
            if (minion.keyword === 'heal_aura') {
                if (index > 0) board[index - 1].hp += 2;
                if (index < board.length - 1) board[index + 1].hp += 2;
            }
        });
    }
}
