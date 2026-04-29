// main.js - 萬界戰場 (Auto Battler) 核心控制中心

import { HEROES } from './data/heroes.js';
import { CARD_DB } from './data/database.js';
import { BattleEngine } from './core/engine.js';
import { BondSystem } from './core/bonds.js';
import { HERO_EFFECTS, BATTLECRY_EFFECTS } from './core/effects.js';
import { showNotice, renderUI } from './ui/ui.js';

// 1. 初始化遊戲狀態
let game = {
    p: { hp: 30, gold: 3, maxGold: 3, board: [] },
    e: { hp: 30, board: [] },
    shop: [],
    timer: 20,
    round: 0, // 改從 0 開始，第一局 startPrepPhase 會變 1
    phase: 'PREP', 
    currentHero: null,
    timerInterval: null
};

// 2. 啟動遊戲
function startGame(heroId) {
    game.currentHero = HEROES[heroId];
    game.p.hp = game.currentHero.hp;
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'grid';
    
    startPrepPhase();
}

// 3. 招募準備階段
function startPrepPhase() {
    game.phase = 'PREP';
    game.timer = 20;
    game.round++;
    
    // 靈石成長
    game.p.maxGold = Math.min(game.round + 2, 10);
    game.p.gold = game.p.maxGold;
    
    // 英雄被動：林凡
    if (game.currentHero.effectTag === 'A_HERO_BUFF_RANDOM') {
        const msg = HERO_EFFECTS['A_HERO_BUFF_RANDOM'](game);
        if (msg) showNotice(msg);
    }

    refreshShop(true); 
    startTimer();
    render();
}

// 4. 商店與購買邏輯 (Bug 修正版)
function refreshShop(free = false) {
    if (!free) {
        if (game.p.gold < 1) { showNotice("靈石不足！"); return; }
        game.p.gold -= 1;
        
        if (game.currentHero.effectTag === 'A_HERO_REFRESH_GOLD') {
            const msg = HERO_EFFECTS['A_HERO_REFRESH_GOLD'](game);
            if (msg) showNotice(msg);
        }
    }

    const pool = game.round < 5 ? CARD_DB.TIER_1 : [...CARD_DB.TIER_1, ...CARD_DB.TIER_2];
    // 生成商店卡牌
    game.shop = Array.from({length: 3}, () => JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)])));
    render();
}

function buyCard(idx) {
    if (game.phase !== 'PREP') return;
    
    const card = game.shop[idx];
    
    // 【重要修正】防止重複點擊或抓到空位
    if (!card) return; 
    if (game.p.gold < 3) { showNotice("需 3 靈石！"); return; }
    if (game.p.board.length >= 7) { showNotice("戰場已滿！"); return; }

    game.p.gold -= 3;
    
    // 【重要修正】使用 null 佔位而不是直接 splice，確保商店索引不位移
    const boughtCard = game.shop[idx];
    game.shop[idx] = null; 

    // 觸發戰吼
    if (boughtCard.effectTag && boughtCard.effectTag.startsWith('A')) {
        BATTLECRY_EFFECTS[boughtCard.effectTag](boughtCard, game.p.board, game);
    }

    game.p.board.push(boughtCard);
    checkTriples(); 
    render(); // 立即重新渲染，確保畫面上卡片消失
}

function checkTriples() {
    const counts = {};
    game.p.board.forEach(c => counts[c.id] = (counts[c.id] || 0) + 1);
    
    for (const id in counts) {
        if (counts[id] >= 3) {
            showNotice("✨ 三連合成！");
            const survivors = game.p.board.filter(c => c.id === id);
            game.p.board = game.p.board.filter(c => c.id !== id);
            
            const golden = survivors[0];
            golden.atk *= 2;
            golden.hp *= 2;
            golden.isGolden = true; 
            game.p.board.push(golden);
        }
    }
}

// 5. 準備完成按鈕
function forceStartCombat() {
    if (game.phase !== 'PREP') return;
    showNotice("⚡ 準備完成，開戰！");
    startCombatPhase();
}

// 6. 戰鬥邏輯 (加入延遲，讓過程清晰)
async function startCombatPhase() {
    game.phase = 'COMBAT';
    if (game.timerInterval) clearInterval(game.timerInterval);
    
    // 克隆副本，確保原件不消失
    game.p.tempBoard = BattleEngine.cloneBoard(game.p.board);
    game.e.board = generateEnemyBoard();
    
    // 觸發羈絆與開戰技能
    const activeBonds = BondSystem.getActiveBonds(game.p.tempBoard);
    BondSystem.applyBondBuffs(game.p.tempBoard, activeBonds);
    BattleEngine.setupCombat(game.p.tempBoard, game.e.board, game.currentHero);
    
    render();
    await new Promise(r => setTimeout(r, 1200)); // 開戰前停頓，讓玩家看清楚對手

    // 自動戰鬥循環
    while (game.p.tempBoard.length > 0 && game.e.board.length > 0) {
        // 我方攻擊
        await performAttack(game.p.tempBoard, game.e.board, 'P');
        render();
        await new Promise(r => setTimeout(r, 800)); // 每次攻擊停頓 0.8 秒

        if (game.e.board.length === 0) break;

        // 敵方攻擊
        await performAttack(game.e.board, game.p.tempBoard, 'E');
        render();
        await new Promise(r => setTimeout(r, 800));
    }

    const win = game.e.board.length === 0;
    if (!win) { game.p.hp -= (game.e.board.length + 2); }
    showNotice(win ? "勝利！" : "戰敗！");
    
    setTimeout(startPrepPhase, 2000);
}

// 輔助函式
function startTimer() {
    if (game.timerInterval) clearInterval(game.timerInterval);
    game.timerInterval = setInterval(() => {
        game.timer--;
        if (game.timer <= 0) startCombatPhase();
        render();
    }, 1000);
}

function generateEnemyBoard() {
    const pool = CARD_DB.TIER_1;
    const count = Math.min(game.round, 5);
    return Array.from({length: count}, () => JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)])));
}

async function performAttack(atkBoard, defBoard, side) {
    const attacker = atkBoard[0];
    const target = BattleEngine.findAutoTarget(defBoard);
    if (target) {
        BattleEngine.calculateCombat(attacker, target);
        if (target.hp <= 0) BattleEngine.handleDeath(defBoard, defBoard.indexOf(target));
        if (attacker.hp <= 0) BattleEngine.handleDeath(atkBoard, 0);
        else atkBoard.push(atkBoard.shift()); 
    }
}

function useHeroSkill(idx) {
    if (game.currentHero.id === 'MO_MO' && game.p.gold >= 1) {
        const target = game.p.board[idx];
        if (target && !target.hasReborn) {
            game.p.gold -= 1;
            HERO_EFFECTS['A_HERO_REBORN_ACTIVE'](target);
            showNotice(`${target.name} 獲得重生！`);
            render();
        }
    }
}

function render() { renderUI(game); }

// 【核心修正】將所有 UI 會呼叫的函數掛載到 window
window.startGame = startGame;
window.buyCard = buyCard;
window.refreshShop = refreshShop;
window.useHeroSkill = useHeroSkill;
window.forceStartCombat = forceStartCombat;
