// main.js - 萬界戰場 (Auto Battler) 核心總控制器
import { CARD_DB, HEROES } from './database.js';
import { BattleEngine } from './engine.js';
import { createFX } from './fx.js';
import { showNotice, renderUI } from './ui.js';

// 1. 初始化遊戲狀態
let game = {
    p: { hp: 30, gold: 3, maxGold: 3, board: [] },
    e: { hp: 30, board: [] },
    shop: [],
    timer: 20,
    phase: 'PREP', // PREP (準備), COMBAT (戰鬥)
    currentHero: null,
    timerInterval: null
};

// 2. 遊戲啟動
function startGame(heroKey) {
    game.currentHero = HEROES[heroKey];
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'grid';
    
    startPrepPhase();
}

// 3. 招募準備階段
function startPrepPhase() {
    game.phase = 'PREP';
    game.timer = 20;
    
    // 每回合靈石成長 (最高 10)
    game.p.maxGold = Math.min(game.p.maxGold + 1, 10);
    game.p.gold = game.p.maxGold;
    
    refreshShop(true); // 免費刷新商店
    render();

    // 啟動倒數計時
    if (game.timerInterval) clearInterval(game.timerInterval);
    game.timerInterval = setInterval(() => {
        game.timer--;
        if (game.timer <= 0) {
            clearInterval(game.timerInterval);
            startCombatPhase();
        }
        render();
    }, 1000);
}

// 4. 商店邏輯
function refreshShop(free = false) {
    if (!free) {
        if (game.p.gold < 1) {
            showNotice("靈石不足！");
            return;
        }
        game.p.gold -= 1;
    }

    // 隨機從 Tier 1 & 2 抽取 3 張棋子 (簡化版)
    const pool = [...CARD_DB.TIER_1, ...CARD_DB.TIER_2];
    game.shop = [];
    for (let i = 0; i < 3; i++) {
        const randomCard = pool[Math.floor(Math.random() * pool.length)];
        game.shop.push(JSON.parse(JSON.stringify(randomCard))); // 深拷貝
    }
    render();
}

function buyCard(idx) {
    if (game.phase !== 'PREP') return;
    const card = game.shop[idx];
    
    if (game.p.gold < 3) {
        showNotice("靈石不足 (需 3 靈石)！");
        return;
    }
    if (game.p.board.length >= 7) {
        showNotice("戰場已滿！");
        return;
    }

    game.p.gold -= 3;
    const boughtCard = game.shop.splice(idx, 1)[0];
    game.p.board.push(boughtCard);
    
    // 觸發自走棋常見的買入/戰吼效果預留處
    showNotice(`招募了 ${boughtCard.name}`);
    render();
}

// 5. 自動戰鬥階段
async function startCombatPhase() {
    game.phase = 'COMBAT';
    showNotice("⚔️ 戰鬥開始！");
    
    // 隨機生成對手陣容 (模擬其他玩家)
    generateEnemyBoard();
    render();
    await new Promise(r => setTimeout(r, 1000));

    // 結算開戰前技能 (英雄被動、光環等)
    BattleEngine.triggerStartOfCombat(game.p.board, game.currentHero);
    render();
    await new Promise(r => setTimeout(r, 800));

    // 自動戰鬥循環：雙方輪流攻擊
    let round = 0;
    while (game.p.board.length > 0 && game.e.board.length > 0 && round < 50) {
        // 玩家攻擊
        await performAutoAttack('p', 'e');
        if (game.e.board.length === 0) break;

        // 對手攻擊
        await performAutoAttack('e', 'p');
        round++;
    }

    endCombat();
}

async function performAutoAttack(attackerSide, defenderSide) {
    const attackers = game[attackerSide].board;
    const defenders = game[defenderSide].board;
    if (attackers.length === 0 || defenders.length === 0) return;

    // 簡單邏輯：最左邊的棋子發動攻擊
    const attacker = attackers[0]; 
    const target = BattleEngine.findAutoTarget(defenders);
    
    if (!target) return;

    // 獲取 DOM 元素播放特效
    const attackerEls = document.querySelectorAll(`#${attackerSide === 'p' ? 'player-board' : 'enemy-board'} .card`);
    const defenderEls = document.querySelectorAll(`#${defenderSide === 'p' ? 'player-board' : 'enemy-board'} .card`);
    const targetIdx = defenders.indexOf(target);

    createFX(attackerEls[0], defenderEls[targetIdx], 'slash');
    await new Promise(r => setTimeout(r, 500));

    // 實際計算傷害
    BattleEngine.calculateCombat(attacker, target);
    
    // 清理死亡棋子
    game.p.board = game.p.board.filter(m => m.hp > 0);
    game.e.board = game.e.board.filter(m => m.hp > 0);
    
    // 棋子攻擊後移到隊伍最後方 (模擬輪流攻擊)
    if (attacker.hp > 0) {
        attackers.push(attackers.shift());
    }

    render();
    await new Promise(r => setTimeout(r, 600));
}

function generateEnemyBoard() {
    // 模擬 AI 生成 Tier 1~2 的陣容
    const pool = [...CARD_DB.TIER_1, ...CARD_DB.TIER_2];
    game.e.board = [];
    const count = Math.floor(Math.random() * 3) + 2; // 隨機 2~4 隻
    for (let i = 0; i < count; i++) {
        game.e.board.push(JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)])));
    }
}

function endCombat() {
    if (game.p.board.length === 0 && game.e.board.length > 0) {
        const damage = game.e.board.length + 2; // 基礎傷害 + 剩餘棋子數
        game.p.hp -= damage;
        showNotice(`戰敗！英雄受到 ${damage} 點傷害`);
    } else if (game.e.board.length === 0 && game.p.board.length > 0) {
        showNotice("🎉 戰勝！本局告捷");
    } else {
        showNotice("🤝 平局！不分勝負");
    }

    if (game.p.hp <= 0) {
        showNotice("💀 裂痕崩塌... 遊戲結束");
        setTimeout(() => location.reload(), 3000);
    } else {
        setTimeout(() => startPrepPhase(), 2000);
    }
}

function render() {
    renderUI(game);
}

// ⚠️ 全域綁定
window.startGame = startGame;
window.buyCard = buyCard;
window.refreshShop = refreshShop;
window.forceStartCombat = () => {
    clearInterval(game.timerInterval);
    startCombatPhase();
};
