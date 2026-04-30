// engine.js - 萬界戰場自動戰鬥引擎 (核心策略優化版)

import { HERO_EFFECTS, DEATHRATTLE_EFFECTS } from './effects.js';

export class BattleEngine {
    
    /**
     * 1. 克隆戰場 (Deep Copy)
     * 確保戰鬥只是「鏡像對決」，不影響玩家在準備階段的原始卡牌數據。
     */
    static cloneBoard(board) {
        return JSON.parse(JSON.stringify(board));
    }

    /**
     * 2. 自動尋敵邏輯 (嘲諷優先)
     * 強化：優先鎖定帶有「TAUNT」的敵方，且加入「隨機性」防止死板的攻擊順序。
     */
    static findAutoTarget(enemyBoard) {
        // 安全檢查：過濾掉空位 (null) 與 已死亡 (hp <= 0) 的對象
        const aliveEnemies = enemyBoard.filter(m => m !== null && m.hp > 0);
        if (aliveEnemies.length === 0) return null;

        // 搜尋嘲諷怪
        const taunts = aliveEnemies.filter(m => m.keyword === 'TAUNT');
        
        // 如果有嘲諷怪，就只從嘲諷怪中隨機挑選一個；否則從所有存活敵人中隨機挑選
        const targetPool = taunts.length > 0 ? taunts : aliveEnemies;
        return targetPool[Math.floor(Math.random() * targetPool.length)];
    }

    /**
     * 3. 核心戰鬥計算 (含聖盾與反傷邏輯)
     * 優化：加入受傷門檻判斷，確保與 FX 特效同步。
     */
    static calculateCombat(attacker, defender) {
        if (!attacker || !defender) return;

        // --- A. 處理防禦者受傷邏輯 ---
        if (defender.hasShield) {
            // 有聖盾則免疫本次傷害，聖盾標記移除 (交由 main.js 觸發 shield_break 特效)
            defender.hasShield = false;
        } else {
            // 實打實的扣血，最低扣至 0 (方便處理死亡判定)
            defender.hp = Math.max(0, defender.hp - attacker.atk);
        }

        // --- B. 處理攻擊者反傷邏輯 (互撞) ---
        // 只有當防禦者有攻擊力時，攻擊者才會受到反傷
        if (defender.atk > 0) {
            if (attacker.hasShield) {
                // 攻擊者若有聖盾，亦可免疫本次碰撞反傷
                attacker.hasShield = false;
            } else {
                attacker.hp = Math.max(0, attacker.hp - defender.atk);
            }
        }
    }

    /**
     * 4. 處理死亡與重生邏輯
     * 優化：嚴格處理九宮格位置 (null)，並確保重生後的數值正確。
     * @returns {boolean} 是否復活 (用於 main.js 播放 reborn 特效)
     */
    static handleDeath(board, index) {
        const deadMinion = board[index];
        if (!deadMinion || deadMinion.hp > 0) return false; 
        
        // --- 觸發亡語 (B區效果：如死後召喚、隨機加攻) ---
        if (deadMinion.effectTag && deadMinion.effectTag.startsWith('B')) {
            if (DEATHRATTLE_EFFECTS[deadMinion.effectTag]) {
                DEATHRATTLE_EFFECTS[deadMinion.effectTag](deadMinion, board, index);
            }
        }

        // --- 處理「重生」機制 ---
        if (deadMinion.hasReborn) {
            // 重生設定：以 1 點生命值復活，並永久移除本次重生標記
            deadMinion.hp = 1;
            deadMinion.hasReborn = false;
            
            // 注意：重生會保留原始攻擊力與種族，棋子留在原位
            return true; // 告知外部：這隻棋子復活了，請播特效！
        }

        // 若無重生，則正式將該位置清空 (九宮格維持 index 結構)
        board[index] = null; 
        return false;
    }

    /**
     * 5. 戰鬥開始前的環境設置 (場地與英雄被動)
     */
    static setupCombat(playerBoard, enemyBoard, playerHero) {
        // --- 玩家英雄技能開戰啟動 (如：丹丹的聖盾、林凡的屬性提升) ---
        if (playerHero && playerHero.onCombatEffect) {
            if (HERO_EFFECTS[playerHero.onCombatEffect]) {
                HERO_EFFECTS[playerHero.onCombatEffect](playerBoard);
            }
        }

        // --- 未來擴充：敵方英雄技能結算 ---
        // if (enemyHero) { ... }
    }
}
