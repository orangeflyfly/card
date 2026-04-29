// engine.js - 萬界戰場自動戰鬥引擎

import { HERO_EFFECTS, DEATHRATTLE_EFFECTS } from './effects.js';

export class BattleEngine {
    
    /**
     * 1. 克隆戰場 (Deep Copy)
     * 確保戰鬥只是「鏡像對決」，戰鬥結束後你的棋子依然完好。
     */
    static cloneBoard(board) {
        return JSON.parse(JSON.stringify(board));
    }

    /**
     * 2. 自動尋敵邏輯
     * 優先尋找帶有「TAUNT (嘲諷)」標籤的敵人。
     */
    static findAutoTarget(enemyBoard) {
        const aliveEnemies = enemyBoard.filter(m => m.hp > 0);
        if (aliveEnemies.length === 0) return null;

        const taunts = aliveEnemies.filter(m => m.keyword === 'TAUNT');
        const targetPool = taunts.length > 0 ? taunts : aliveEnemies;
        return targetPool[Math.floor(Math.random() * targetPool.length)];
    }

    /**
     * 3. 核心戰鬥計算 (含聖盾邏輯)
     * 處理雙方互相撞擊的血量扣除。
     */
    static calculateCombat(attacker, defender) {
        // --- 處理防禦者受傷 ---
        if (defender.hasShield) {
            defender.hasShield = false; // 聖盾抵擋一次傷害後消失
        } else {
            defender.hp -= attacker.atk;
        }

        // --- 處理攻擊者反傷 ---
        if (attacker.hasShield) {
            attacker.hasShield = false; // 攻擊者若有聖盾也不扣血
        } else if (defender.atk > 0) {
            attacker.hp -= defender.atk;
        }
    }

    /**
     * 4. 處理死亡與重生邏輯 (對應 A 區/B 區標籤)
     * 當棋子血量 <= 0 時觸發。
     */
    static handleDeath(board, index) {
        const deadMinion = board[index];
        
        // --- 觸發亡語 (B區) ---
        if (deadMinion.effectTag && deadMinion.effectTag.startsWith('B')) {
            DEATHRATTLE_EFFECTS[deadMinion.effectTag](deadMinion, board, index);
        }

        // --- 處理「重生」標記 ---
        if (deadMinion.hasReborn) {
            // 重生後以 1 點生命值回到場上，並移除重生標記
            deadMinion.hp = 1;
            deadMinion.hasReborn = false;
            return true; // 代表棋子復活了
        }

        board.splice(index, 1); // 真正移除棋子
        return false;
    }

    /**
     * 5. 戰鬥開始前的環境設置
     * 呼叫英雄技能 (H區)。
     */
    static setupCombat(playerBoard, enemyBoard, playerHero) {
        if (playerHero && playerHero.onCombatEffect) {
            // 例如：丹丹給最左邊聖盾
            HERO_EFFECTS[playerHero.onCombatEffect](playerBoard);
        }
        // 這裡未來可以加入敵方英雄的技能結算
    }
}
