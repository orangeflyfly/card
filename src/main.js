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
    round: 1,
    phase: 'PREP', // PREP (準備), COMBAT (戰鬥)
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

// 3. 招募準備階段 (處理林凡被動、計時器)
function startPrepPhase() {
    game.phase = 'PREP';
    game.timer = 20;
    game.round++;
    
    // 靈石成長 (最高 10)
    game.p.maxGold = Math.min(game.round + 2, 10);
    game.p.gold = game.p.maxGold;
    
    // --- 觸發英雄準備階段被動 (林凡的熱飯) ---
    if (game.currentHero.effectTag === 'A_HERO_BUFF_RANDOM') {
        const msg = HERO_EFFECTS['A_HERO_BUFF_RANDOM'](game);
        if (msg) showNotice(msg);
    }

    refreshShop(true); // 免費刷新第一手
    startTimer();
    render();
}

// 4. 商店與購買邏輯 (處理飛飛被動、三連進化)
function refreshShop(free = false) {
    if (!free) {
        if (game.p.gold < 1) { showNotice("靈石不足！"); return; }
        game.p.gold -= 1;
        
        // --- 飛飛被動：刷新拿錢 ---
        if (game.currentHero.effectTag === 'A_HERO_REFRESH_GOLD') {
            const msg = HERO_EFFECTS['A_HERO_REFRESH_GOLD'](game);
            if (msg) showNotice(msg);
        }
    }

    // 根據當前回合決定商店星級 (簡化版)
    const pool = game.round < 5 ? CARD_DB.TIER_1 : [...CARD_DB.TIER_1, ...CARD_DB.TIER_2];
    game.shop = Array.from({length: 3}, () => JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)])));
    render();
}

function buyCard(idx) {
    if (game.phase !== 'PREP') return;
    const card = game.shop[idx];
    if (game.p.gold < 3) { showNotice("需 3 靈石！"); return; }
    if (game.p.board.length >= 7) { showNotice("戰場已滿！"); return; }

    game.p.gold -= 3;
    const boughtCard = game.shop.splice(idx, 1)[0];
    
    // --- 觸發戰吼 (A 區效果) ---
    if (boughtCard.effectTag && boughtCard.effectTag.startsWith('A')) {
        BATTLECRY_EFFECTS[boughtCard.effectTag](boughtCard, game.p.board, game);
    }

    game.p.board.push(boughtCard);
    checkTriples(); // 檢查三連進化
    render();
}

// 檢查三連 (相同 ID 湊齊 3 張進化為金卡)
function checkTriples() {
    const counts = {};
    game.p.board.forEach(c => counts[c.id] = (counts[c.id] || 0) + 1);
    
    for (const id in counts) {
        if (counts[id] >= 3) {
            showNotice("✨ 三連合成！棋子獲得大幅強化！");
            // 找出三張卡，刪除兩張，強化一張
            const survivors = game.p.board.filter(c => c.id === id);
            game.p.board = game.p.board.filter(c => c.id !== id);
            
            const golden = survivors[0];
            golden.atk *= 2;
            golden.hp *= 2;
            golden.isGolden = true; // 標記為金卡
            game.p.board.push(golden);
        }
    }
}

// 5. 英雄主動技能 (墨墨的重生)
function useHeroSkill(idx) {
    if (game.currentHero.id === 'MO_MO' && game.p.gold >= 1) {
        const target = game.p.board[idx];
        if (target && !target.hasReborn) {
            game.p.gold -= 1;
            HERO_EFFECTS['A_HERO_REBORN_ACTIVE'](target);
            showNotice(`${target.name} 獲得了重生意境！`);
            render();
        }
    }
}

// 6. 戰鬥邏輯 (克隆戰場，牌不消失)
async function startCombatPhase() {
    game.phase = 'COMBAT';
    clearInterval(game.timerInterval);
    
    // --- 關鍵：克隆鏡像，確保原牌不消失 ---
    let pCombatBoard = BattleEngine.cloneBoard(game.p.board);
    let eCombatBoard = generateEnemyBoard();

    // 觸發羈絆加成
    const activeBonds = BondSystem.getActiveBonds(pCombatBoard);
    BondSystem.applyBondBuffs(pCombatBoard, activeBonds);

    // 觸發開戰英雄技能 (丹丹聖盾)
    BattleEngine.setupCombat(pCombatBoard, eCombatBoard, game.currentHero);
    
    // 渲染戰鬥畫面 (暫時用 game 狀態模擬，實際可改用局部變數渲染)
    game.p.tempBoard = pCombatBoard; 
    game.e.board = eCombatBoard;
    render();

    // 自動戰鬥循環 (簡化演示)
    while (pCombatBoard.length > 0 && eCombatBoard.length > 0) {
        await performAttack(pCombatBoard, eCombatBoard, 'P');
        if (eCombatBoard.length === 0) break;
        await performAttack(eCombatBoard, pCombatBoard, 'E');
    }

    // 戰鬥結束結算
    const win = eCombatBoard.length === 0;
    if (!win) { game.p.hp -= (eCombatBoard.length + 2); }
    showNotice(win ? "勝利！" : "戰敗！");
    
    // 清空敵方與臨時戰場，準備下一輪
    game.e.board = [];
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
    return Array.from({length: Math.min(game.round, 5)}, () => JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)])));
}

async function performAttack(atkBoard, defBoard, side) {
    const attacker = atkBoard[0];
    const target = BattleEngine.findAutoTarget(defBoard);
    if (target) {
        BattleEngine.calculateCombat(attacker, target);
        // 檢查死亡與重生
        if (target.hp <= 0) BattleEngine.handleDeath(defBoard, defBoard.indexOf(target));
        if (attacker.hp <= 0) BattleEngine.handleDeath(atkBoard, 0);
        else atkBoard.push(atkBoard.shift()); // 輪轉
    }
    render();
    await new Promise(r => setTimeout(r, 600));
}

function render() { renderUI(game); }

window.startGame = startGame;
window.buyCard = buyCard;
window.refreshShop = refreshShop;
window.useHeroSkill = useHeroSkill;
