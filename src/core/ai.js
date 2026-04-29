// ai.js - 對手 AI 思考模組
import { BattleEngine } from './engine.js';
import { createFX } from './fx.js';
import { showNotice } from './ui.js';

export async function executeAITurn(game, drawFn, renderFn, cleanUpFn) {
    if(game.turn !== 'P') return;
    game.turn = 'E';
    game.p.board.forEach(m => m.ready = true); 
    showNotice("敵方回合");
    renderFn();
    
    await new Promise(r => setTimeout(r, 1000));

    game.e.max = Math.min(game.e.max + 1, 10);
    game.e.mana = game.e.max;
    drawFn('e', 'WARRIOR');
    renderFn();

    await new Promise(r => setTimeout(r, 1000));

    // AI 出牌
    let aiHand = game.e.hand;
    aiHand.sort((a, b) => b.cost - a.cost); 
    for(let i = aiHand.length - 1; i >= 0; i--) {
        let card = aiHand[i];
        if(BattleEngine.canPlayCard(game.e, card) && card.type === 'minion') {
            game.e.mana -= card.cost;
            let playedCard = game.e.hand.splice(i, 1)[0];
            playedCard.ready = playedCard.keyword === 'charge' ? true : false;
            game.e.board.push(playedCard);
            renderFn();
            await new Promise(r => setTimeout(r, 800));
        }
    }

    // AI 攻擊
    game.e.board.forEach(m => m.ready = true);
    for(let i=0; i < game.e.board.length; i++) {
        let attacker = game.e.board[i];
        if (attacker.hp <= 0 || !attacker.ready) continue;

        const fromEl = document.querySelectorAll('#enemy-board .card')[i];
        if(!fromEl) continue;

        let taunts = game.p.board.filter(m => m.keyword === 'taunt');
        let target = null;
        let isTargetHero = false;

        if (taunts.length > 0) {
            target = taunts[0];
        } else {
            let bestTrade = game.p.board.find(m => m.hp <= attacker.atk && m.atk < attacker.hp);
            if (bestTrade) {
                target = bestTrade;
            } else {
                target = game.p;
                isTargetHero = true;
            }
        }

        let targetEl = isTargetHero ? document.getElementById('p-hero') : document.querySelectorAll('#player-board .card')[game.p.board.indexOf(target)];

        if(targetEl) {
            createFX(fromEl, targetEl, "slash");
            await new Promise(r => setTimeout(r, 300));
            BattleEngine.calculateCombat(attacker, target, isTargetHero);
            attacker.ready = false;
            cleanUpFn();
            renderFn();
            await new Promise(r => setTimeout(r, 500));
        }
    }

    game.turn = 'P';
    game.p.max = Math.min(game.p.max + 1, 10);
    game.p.mana = game.p.max;
    drawFn('p', game.currentChoice);
    showNotice("你的回合");
    renderFn();
}
