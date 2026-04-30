// effects.js - 萬界戰場效果索引庫 (A區：戰吼 / B區：亡語 / H區：英雄技能)

// --- A區：戰吼效果 (招募買入時觸發) ---
export const BATTLECRY_EFFECTS = {
    'A1_BUFF_OWN': (target) => { target.atk += 2; target.hp += 1; }, // 自身強化
    'A2_BUFF_ALL_TRIBE': (target, board) => { 
        // 賦予同種族友軍 +1/+1 (修正：加入 m 存在判定，跳過 null)
        board.forEach(m => { if(m && m.tribe === target.tribe) { m.atk += 1; m.hp += 1; } });
    },
    'A3_GENERATE_GOLD': (target, game) => { game.p.gold += 1; } // 賺 1 靈石
};

// --- B區：亡語效果 (戰鬥中死亡時觸發) ---
export const DEATHRATTLE_EFFECTS = {
    'B1_SUMMON_TOKEN': (target, board, index) => {
        // 在原位召喚 1/1 衍生物 (修正：九宮格不能用 splice，改為尋找陣型中的空位放置)
        const token = { name: "小幻靈", atk: 1, hp: 1, tribe: "靈體" };
        const emptyIdx = board.findIndex((m, i) => m === null && i !== index);
        if (emptyIdx !== -1) board[emptyIdx] = token;
    },
    'B2_BUFF_RANDOM_FRIEND': (target, board) => {
        // 修正：先過濾出存活的友軍，避免選到 null
        const alive = board.filter(m => m !== null);
        if (alive.length > 0) {
            const rand = alive[Math.floor(Math.random() * alive.length)];
            rand.atk += 2;
        }
    }
};

// --- H區：英雄專屬效果索引 ---
export const HERO_EFFECTS = {
    // 林凡：隨機 +1/+1 (準備階段)
    'A_HERO_BUFF_RANDOM': (game) => {
        // 【核心崩潰修正】：過濾掉九宮格裡的 null，確保只選到活著的棋子
        const alive = game.p.board.filter(m => m !== null);
        if (alive.length > 0) {
            const rand = alive[Math.floor(Math.random() * alive.length)];
            rand.atk += 1; rand.hp += 1;
            return `林凡的熱飯讓 ${rand.name} 成長了！`;
        }
    },
    // 丹丹：最左邊聖盾 (戰鬥開始)
    'A_HERO_SHIELD_LEFT': (combatBoard) => {
        // 【防護修正】：不再盲目抓 [0]，而是找到第一個不是 null 的棋子
        const firstAlive = combatBoard.find(m => m !== null);
        if (firstAlive) {
            firstAlive.hasShield = true;
            return `丹丹的劍意賦予 ${firstAlive.name} 聖盾！`;
        }
    },
    // 飛飛：刷新拿錢 (刷新商店)
    'A_HERO_REFRESH_GOLD': (game) => {
        if (Math.random() < 0.2) {
            game.p.gold += 1;
            return `飛飛加班偷偷賺了 1 靈石！`;
        }
    },
    // 墨墨：賦予重生 (主動技能)
    'A_HERO_REBORN_ACTIVE': (card) => {
        if (card) {
            card.hasReborn = true;
            return `${card.name} 獲得了重生標記！`;
        }
    }
};

// --- K區：關鍵字邏輯定義 (供引擎計算使用) ---
export const KEYWORDS = {
    'TAUNT': "優先成為攻擊目標",
    'SHIELD': "抵擋下一次受到的傷害",
    'REBORN': "死亡後以 1 生命值復活一次"
};
