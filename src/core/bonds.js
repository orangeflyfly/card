// bonds.js - 萬界戰場種族羈絆系統

export const BOND_CONFIG = {
    '凡人': {
        thresholds: [3, 6],
        effect: (count) => {
            const bonus = count >= 6 ? 4 : 2;
            return { type: 'ATK_BUFF', value: bonus, description: `凡人勇氣：全體凡人攻擊力 +${bonus}` };
        }
    },
    '仙修': {
        thresholds: [2, 4],
        effect: (count) => {
            const hpBonus = count >= 4 ? 6 : 3;
            return { type: 'HP_BUFF', value: hpBonus, description: `仙靈護體：全體仙修生命值 +${hpBonus}` };
        }
    },
    '半獸': { // 對應英雄：飛飛
        thresholds: [2, 4],
        effect: (count) => {
            const goldProb = count >= 4 ? 0.4 : 0.2;
            return { type: 'GOLD_PROB', value: goldProb, description: `勤奮半獸：戰鬥結束獲勝後有 ${goldProb * 100}% 機率多得 1 靈石` };
        }
    },
    '不死': { // 對應英雄：墨墨
        thresholds: [2],
        effect: (count) => {
            return { type: 'SPECIAL', description: `不滅意志：戰鬥開始時，隨機一名不死族獲得「重生」` };
        }
    },
    '妖獸': {
        thresholds: [3],
        effect: (count) => {
            return { type: 'SUMMON_BUFF', description: `萬獸奔騰：亡語召喚的衍生物獲得 +2/+2` };
        }
    }
};

export class BondSystem {
    /**
     * 計算目前場上激活的羈絆
     * @param {Array} board - 玩家場上的棋子陣列
     * @returns {Array} 目前啟動的加成效果清單
     */
    static getActiveBonds(board) {
        const counts = {};
        const activeEffects = [];

        // 1. 統計各類別數量 (通常自走棋會要求「不同名」的棋子才算，這裡先簡化為算總數)
        board.forEach(minion => {
            if (minion.tribe) {
                counts[minion.tribe] = (counts[minion.tribe] || 0) + 1;
            }
        });

        // 2. 對比門檻設定
        for (const [tribe, config] of Object.entries(BOND_CONFIG)) {
            const currentCount = counts[tribe] || 0;
            // 找出目前達到的最高門檻
            const reachedThresholds = config.thresholds.filter(t => currentCount >= t);
            
            if (reachedThresholds.length > 0) {
                activeEffects.push({
                    tribe: tribe,
                    count: currentCount,
                    ...config.effect(currentCount)
                });
            }
        }

        return activeEffects;
    }

    /**
     * 將羈絆加成實裝到棋子數值上
     */
    static applyBondBuffs(board, activeBonds) {
        activeBonds.forEach(bond => {
            if (bond.type === 'ATK_BUFF') {
                board.filter(m => m.tribe === bond.tribe).forEach(m => m.atk += bond.value);
            }
            if (bond.type === 'HP_BUFF') {
                board.filter(m => m.tribe === bond.tribe).forEach(m => m.hp += bond.value);
            }
            // 其他特殊效果 (如重生) 需在 engine.js 的 setupCombat 中額外處理
        });
    }
}
