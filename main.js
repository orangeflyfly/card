// main.js - 萬界裂痕 核心總控制器
import { CARD_DB } from './database.js';
import { BattleEngine } from './engine.js';
import { createFX } from './fx.js';
import { showNotice, renderUI } from './ui.js';
import { executeAITurn } from './ai.js';

let game = {
    p: { hp: 30, mana: 1, max: 1, hand: [], board: [] },
    e: { hp: 30, mana: 1, max: 1, hand: [], board: [] },
    turn: 'P', 
    state: 'IDLE',
    selectedIdx: null,
    currentChoice: 'MAGE'
};

// 包裝 render，讓它隨時傳入最新的 game 狀態
function render() {
    renderUI(game);
}

function startGame(choice) {
    game.currentChoice = choice;
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'grid';
    
    game.p.mana = game.p.max = 1;
    game.e.mana = game.e.max = 1;

    for(let i=0; i<4; i++) { 
        draw('p', choice); 
        draw('e', 'WARRIOR'); 
    }
    showNotice("戰鬥開始！");
    render();
}

function draw(who, choice) {
    if (game[who].hand.length >= 10) return; 
    let pool = [...CARD_DB[choice || 'NEUTRAL'], ...CARD_DB.NEUTRAL];
    let card = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)])); 
    card.isDrawing = true;
    
    if (card.keyword === 'charge') card.ready = true;
    else card.ready = false;

    game[who].hand.push(card);
    
    setTimeout(() => {
        card.isDrawing = false;
        render();
    }, 600);
}

function handleSelect(type, el, idx) {
    if(game.turn !== 'P') return;

    if(game.state === 'IDLE') {
        if(type === 'P_HAND') {
            let card = game.p.hand[idx];
            if(!BattleEngine.canPlayCard(game.p, card)) {
                showNotice(game.p.mana < card.cost ? "能量不足！" : "場上已滿！");
                return;
            }
            
            if(card.type === 'minion') {
                game.p.mana -= card.cost;
                game.p.board.push(game.p.hand.splice(idx, 1)[0]);
            } else if(card.type === 'spell') {
                if(card.keyword === 'heal') {
                    game.p.mana -= card.cost;
                    game.p.hand.splice(idx, 1);
                    executeHealSpell();
                    return;
                }
                game.state = 'TARGETING_SPELL';
                game.selectedIdx = idx;
                document.body.classList.add('targeting-mode');
            }
        } else if(type === 'P_BOARD') {
            if(!game.p.board[idx].ready) {
                showNotice("這回合尚未準備好！");
                return;
            }
            game.state = 'TARGETING_ATK';
            game.selectedIdx = idx;
            document.body.classList.add('targeting-mode');
        }
    } 
    else {
        if((game.state === 'TARGETING_SPELL' && type === 'P_HAND' && game.selectedIdx === idx)) {
            cancelTargeting();
        } else {
            executeAction(type, el, idx);
        }
    }
    render();
}

function cancelTargeting() {
    game.state = 'IDLE';
    game.selectedIdx = null;
    document.body.classList.remove('targeting-mode');
}

function executeHealSpell() {
    showNotice("一頓熱飯，暖胃暖心！");
    game.p.hp = Math.min(game.p.hp + 5, 30);
    game.p.board.forEach(m => m.hp += 2);
    createFX(document.getElementById('p-hero'), document.getElementById('p-hero'), "heal");
    setTimeout(() => { cleanUp(); render(); }, 550);
}

function executeAction(type, el, idx) {
    let attackerEl;
    const actionState = game.state;
    const selectedIdx = game.selectedIdx;

    if(actionState === 'TARGETING_SPELL') {
        attackerEl = document.querySelectorAll('#hand-area .card')[selectedIdx];
    } else if(actionState === 'TARGETING_ATK') {
        attackerEl = document.querySelectorAll('#player-board .card')[selectedIdx];
    }

    if(!attackerEl || type === 'P_HAND' || type === 'P_BOARD') {
        cancelTargeting();
        render();
        return;
    }

    const isHero = type === 'E_HERO';
    const targetMinion = isHero ? null : game.e.board[idx];

    if(actionState === 'TARGETING_ATK') {
        if(!BattleEngine.isValidAttackTarget(isHero, targetMinion, game.e.board)) {
            showNotice("必須先攻擊嘲諷目標！");
            cancelTargeting();
            render();
            return;
        }
    }

    let fxType = 'slash'; 
    if (actionState === 'TARGETING_SPELL') {
        let spellCard = game.p.hand[selectedIdx];
        if (spellCard.name.includes("火")) fxType = 'fire';
        else fxType = 'spell';
    }

    createFX(attackerEl, el, fxType);
    cancelTargeting();
    render();

    setTimeout(() => {
        if(actionState === 'TARGETING_SPELL') {
            let card = game.p.hand[selectedIdx];
            let finalDmg = BattleEngine.calculateSpellDamage(card, game.p.board);
            
            if(isHero) game.e.hp -= finalDmg;
            else game.e.board[idx].hp -= finalDmg;
            
            game.p.mana -= card.cost;
            game.p.hand.splice(selectedIdx, 1);
        } else if(actionState === 'TARGETING_ATK') {
            let pM = game.p.board[selectedIdx];
            BattleEngine.calculateCombat(pM, isHero ? game.e : game.e.board[idx], isHero);
            pM.ready = false;
        }
        cleanUp();
        render();
    }, 550);
}

function cleanUp() {
    game.p.board = game.p.board.filter(m => m.hp > 0);
    game.e.board = game.e.board.filter(m => m.hp > 0);
    if(game.e.hp <= 0) showNotice("🎉 萬界共鳴，你贏了！");
    if(game.p.hp <= 0) showNotice("💀 裂痕吞噬了你...");
}

async function playerEndTurn() {
    await executeAITurn(game, draw, render, cleanUp);
}

/* 
 * ⚠️ 重要：因為 ES6 模組具有封閉性，HTML 裡面的 onclick="xxx()" 會找不到函數。
 * 我們必須在這裡明確地把這些函數綁定到 window (全域環境) 上！
 */
window.startGame = startGame;
window.handleSelect = handleSelect;
window.playerEndTurn = playerEndTurn;
