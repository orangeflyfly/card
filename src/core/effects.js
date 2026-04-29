// effects.js - 萬界戰場效果索引庫 (A區：戰吼 / B區：亡語 / H區：英雄技能)

// --- A區：戰吼效果 (招募買入時觸發) ---
export const BATTLECRY_EFFECTS = {
    'A1_BUFF_OWN': (target) => { target.atk += 2; target.hp += 1; }, // 自身強化
    'A2_BUFF_ALL_TRIBE': (target, board) => { 
        // 賦予同種族友軍 +1/+1
        board.forEach(m => { if(m.tribe === target.tribe) { m.atk += 1; m.hp += 1; } });
    },
    'A3_GENERATE_GOLD': (target, game) => { game.p.gold += 1; } // 賺 1 靈石
};

// --- B區：亡語效果 (戰鬥中死亡時觸發) ---
export const DEATHRATTLE_EFFECTS = {
    'B1_SUMMON_TOKEN': (target, board, index) => {
        // 在原位召喚 1/1 衍生物
        const token = { name: "小幻靈", atk: 1, hp: 1, tribe: "靈體" };
        board.splice(index, 0, token);
    },
    'B2_BUFF_RANDOM_FRIEND': (target, board) => {
        if (board.length > 0) {
            const rand = board[Math.floor(Math.random() * board.length)];
            rand.atk += 2;
        }
    }
};

// --- H區：英雄專屬效果索引 ---
export const HERO_EFFECTS = {
    // 林凡：隨機 +1/+1 (準備階段)
    'A_HERO_BUFF_RANDOM': (game) => {
        if (game.p.board.length > 0) {
            const rand = game.p.board[Math.floor(Math.random() * game.p.board.length)];
            rand.atk += 1; rand.hp += 1;
            return `林凡的熱飯讓 ${rand.name} 成長了！`;
        }
    },
    // 丹丹：最左邊聖盾 (戰鬥開始)
    'A_HERO_SHIELD_LEFT': (combatBoard) => {
        if (combatBoard.length > 0) {
            combatBoard[0].hasShield = true;
            return `丹丹的劍意賦予 ${combatBoard[0].name} 聖盾！`;
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
