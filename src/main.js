// main.js - 萬界戰場 (Auto Battler) 核心控制中心

import { HEROES } from './data/heroes.js';
import { CARD_DB } from './data/database.js';
import { BattleEngine } from './core/engine.js';
import { BondSystem } from './core/bonds.js';
import { HERO_EFFECTS, BATTLECRY_EFFECTS } from './core/effects.js';
import { showNotice, renderUI } from './ui/ui.js';
import { createFX } from './ui/fx.js'; // 【新增：引入視覺特效模組】

// 1. 初始化遊戲狀態 (修正：將戰場預設為 9 個格子的陣列)
let game = {
    p: { hp: 30, gold: 3, maxGold: 3, board: Array(9).fill(null) },
    e: { hp: 30, board: Array(9).fill(null) },
    shop: [],
    timer: 20,
    round: 0, // 改從 0 開始，第一局 startPrepPhase 會變 1
    phase: 'PREP', 
    currentHero: null,
    timerInterval: null
};

// 輔助函式：判斷場上是否還有存活的棋子
const hasAlive = (board) => board.some(c => c !== null && c.hp > 0);

// 【新增：輔助函式】用來抓取畫面上的 DOM 元素，作為特效發射與受擊的目標
function getCardDOM(side, index) {
    const containerId = side === 'P' ? 'player-board' : 'enemy-board';
    const container = document.getElementById(containerId);
    return container ? container.children[index] : null;
}

// 2. 啟動遊戲
function startGame(heroId) {
    game.currentHero = HEROES[heroId];
    game.p.hp = game.currentHero.hp;
    // 確保每次重新開始都是乾淨的九宮格
    game.p.board = Array(9).fill(null);
    game.e.board = Array(9).fill(null);
    
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
    
    // 【重要修正】防止重複點擊或抓到空位，避免靈石白扣
    if (!card) return; 
    if (game.p.gold < 3) { showNotice("需 3 靈石！"); return; }
    
    // 【核心修正】尋找九宮格的第一個空位
    const emptyIdx = game.p.board.findIndex(c => c === null);
    if (emptyIdx === -1) { showNotice("戰場九宮格已滿！"); return; }

    game.p.gold -= 3;
    
    // 取出物件再設為 null，確保 boughtCard 不會變成空
    const boughtCard = game.shop[idx];
    game.shop[idx] = null; 

    // 觸發戰吼
    if (boughtCard.effectTag && boughtCard.effectTag.startsWith('A')) {
        BATTLECRY_EFFECTS[boughtCard.effectTag](boughtCard, game.p.board, game);
    }

    // 【核心修正】把卡片放到指定的空位，而非推入陣列末端
    game.p.board[emptyIdx] = boughtCard;
    checkTriples(); 
    render(); // 立即重新渲染，確保畫面上卡片消失
}

function checkTriples() {
    const counts = {};
    // 計算時忽略 null 
    game.p.board.forEach(c => { if (c) counts[c.id] = (counts[c.id] || 0) + 1; });
    
    for (const id in counts) {
        if (counts[id] >= 3) {
            showNotice("✨ 三連合成！");
            let firstIdx = -1;
            let found = 0;
            let golden = null;
            
            // 掃描九宮格，合成金卡並清空額外的格子
            for (let i = 0; i < 9; i++) {
                if (game.p.board[i] && game.p.board[i].id === id) {
                    if (firstIdx === -1) {
                        firstIdx = i;
                        golden = game.p.board[i]; // 保留第一隻
                        found++;
                    } else if (found < 3) {
                        game.p.board[i] = null; // 將第二、第三隻的位置清空
                        found++;
                    }
                }
            }
            
            golden.atk *= 2;
            golden.hp *= 2;
            golden.isGolden = true; 
            // golden 已經在 game.p.board[firstIdx] 裡了，所以不用 push
        }
    }
}

// --- 【拖曳排陣核心邏輯】 ---
function moveCard(fromIdx, toIdx) {
    if (game.phase !== 'PREP') return;
    if (fromIdx === toIdx) return; // 原地放下不處理

    // 陣列元素交換 (Swap)
    const temp = game.p.board[fromIdx];
    game.p.board[fromIdx] = game.p.board[toIdx];
    game.p.board[toIdx] = temp;

    // 重新渲染，讓畫面跟上陣列變化
    render();
}

// --- 【新增：拖曳出售邏輯】 ---
function sellCard(idx) {
    if (game.phase !== 'PREP') return;
    const card = game.p.board[idx];
    if (!card) return;

    // 取得該棋子的 DOM 以觸發爆金幣特效
    const cardDOM = getCardDOM('P', idx);
    if (cardDOM) createFX(cardDOM, cardDOM, 'sell');

    game.p.board[idx] = null;
    game.p.gold += 1; // 賣出獲得 1 靈石
    showNotice(`出售 ${card.name}，退還 1 靈石`);
    
    render();
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
    
    // 【核心邏輯】克隆副本，確保原始陣容不消失
    game.p.tempBoard = BattleEngine.cloneBoard(game.p.board);
    game.e.board = generateEnemyBoard();
    
    // 觸發羈絆與開戰技能
    const activeBonds = BondSystem.getActiveBonds(game.p.tempBoard);
    BondSystem.applyBondBuffs(game.p.tempBoard, activeBonds);
    
    // 【核心修正】修復不死族羈絆 (開戰時隨機賦予一名不死族重生)
    if (activeBonds.some(b => b.tribe === '不死')) {
        const undeads = game.p.tempBoard.filter(m => m !== null && m.tribe === '不死');
        if (undeads.length > 0) {
            const randUndead = undeads[Math.floor(Math.random() * undeads.length)];
            randUndead.hasReborn = true;
        }
    }

    BattleEngine.setupCombat(game.p.tempBoard, game.e.board, game.currentHero);
    
    render();
    await new Promise(r => setTimeout(r, 1200)); // 開戰前停頓，讓玩家看清楚對手

    // 用來記錄當前攻擊輪到九宮格的哪一個位子 (0~8)
    let pTurnIdx = 0;
    let eTurnIdx = 0;

    // 自動戰鬥循環 (當雙方都有活人時繼續)
    while (hasAlive(game.p.tempBoard) && hasAlive(game.e.board)) {
        
        // --- 我方攻擊階段 ---
        let pAttacker = null;
        let pStartScan = pTurnIdx;
        // 尋找下一個活著的攻擊者
        do {
            if (game.p.tempBoard[pTurnIdx] && game.p.tempBoard[pTurnIdx].hp > 0) {
                pAttacker = game.p.tempBoard[pTurnIdx];
            }
            pTurnIdx = (pTurnIdx + 1) % 9;
        } while (!pAttacker && pTurnIdx !== pStartScan);

        if (pAttacker) {
            await performAttack(game.p.tempBoard, game.e.board, pAttacker, 'P');
            render(); // 每一動都要渲染，才看得到扣血
            await new Promise(r => setTimeout(r, 800)); // 停頓 0.8 秒增加觀賞性
        }

        if (!hasAlive(game.e.board)) break;

        // --- 敵方攻擊階段 ---
        let eAttacker = null;
        let eStartScan = eTurnIdx;
        do {
            if (game.e.board[eTurnIdx] && game.e.board[eTurnIdx].hp > 0) {
                eAttacker = game.e.board[eTurnIdx];
            }
            eTurnIdx = (eTurnIdx + 1) % 9;
        } while (!eAttacker && eTurnIdx !== eStartScan);

        if (eAttacker) {
            await performAttack(game.e.board, game.p.tempBoard, eAttacker, 'E');
            render();
            await new Promise(r => setTimeout(r, 800));
        }
    }

    const win = !hasAlive(game.e.board);
    if (!win) { 
        // 扣除存活敵人數量的血量
        const survivedCount = game.e.board.filter(c => c && c.hp > 0).length;
        game.p.hp -= (survivedCount + 2); 
    }
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
    const count = Math.min(game.round, 9); // 最多 9 個敵人
    let newBoard = Array(9).fill(null);
    
    for(let i = 0; i < count; i++) {
        // 暫時按順序塞入格子，未來可做隨機陣型
        newBoard[i] = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
    }
    return newBoard;
}

// 【重製版：搭載視覺特效與死亡結算的戰鬥迴圈】
async function performAttack(atkBoard, defBoard, attacker, side) {
    const target = BattleEngine.findAutoTarget(defBoard);
    if (target) {
        // 取得陣列索引
        const atkIdx = atkBoard.indexOf(attacker);
        const defIdx = defBoard.indexOf(target);
        
        // 取得真實 DOM 元素 (為了播特效)
        const atkDOM = getCardDOM(side, atkIdx);
        const defDOM = getCardDOM(side === 'P' ? 'E' : 'P', defIdx);
        
        // 判斷該發射哪種特效 (可依據種族自訂)
        let fxType = 'slash';
        if (attacker.tribe === '仙修' || attacker.tribe === '靈體') fxType = 'spell';
        if (attacker.tribe === '妖獸' || attacker.tribe === '不死') fxType = 'fire';
        
        // 1. 發射彈道與動畫
        if (atkDOM && defDOM) {
            createFX(atkDOM, defDOM, fxType);
            await new Promise(r => setTimeout(r, 500)); // 等待彈道飛到目標身上
        }

        // 記錄戰鬥前的聖盾狀態
        const defHadShield = target.hasShield;
        const atkHadShield = attacker.hasShield;

        // 2. 底層數值扣血結算
        BattleEngine.calculateCombat(attacker, target);
        
        // 3. 觸發聖盾破碎特效
        if (defHadShield && !target.hasShield && defDOM) createFX(defDOM, defDOM, 'shield_break');
        if (atkHadShield && !attacker.hasShield && atkDOM) createFX(atkDOM, atkDOM, 'shield_break');

        // 4. 【完美修復：生死結算】呼叫 engine.js 處理重生與亡語
        if (target.hp <= 0) {
            const revived = BattleEngine.handleDeath(defBoard, defIdx);
            if (revived && defDOM) {
                createFX(defDOM, defDOM, 'reborn'); // 觸發重生特效
                await new Promise(r => setTimeout(r, 400));
            }
        }
        if (attacker.hp <= 0) {
            const revived = BattleEngine.handleDeath(atkBoard, atkIdx);
            if (revived && atkDOM) {
                createFX(atkDOM, atkDOM, 'reborn');
                await new Promise(r => setTimeout(r, 400));
            }
        }
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

// 將所有 UI 會呼叫的函數掛載到 window，確保 HTML 的 onclick 與拖曳有效
window.startGame = startGame;
window.buyCard = buyCard;
window.refreshShop = refreshShop;
window.useHeroSkill = useHeroSkill;
window.forceStartCombat = forceStartCombat;
window.moveCard = moveCard; 
window.sellCard = sellCard; // 【新增】暴露給 UI 呼叫出售機制
