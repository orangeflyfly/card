/* game.js - 萬界裂痕 核心邏輯 (特效升級 & Bug修復版) */

let game = {
    p: { hp: 30, mana: 1, max: 1, hand: [], board: [] },
    e: { hp: 30, mana: 1, max: 1, hand: [], board: [] },
    turn: 'P', 
    state: 'IDLE', // IDLE, TARGETING_SPELL, TARGETING_ATK
    selectedIdx: null,
    currentChoice: 'MAGE'
};

// 全域訊息提示功能
function showNotice(txt) {
    const el = document.getElementById('game-msg');
    if (!el) return;
    el.innerText = txt;
    el.classList.add('msg-show');
    setTimeout(() => el.classList.remove('msg-show'), 1200);
}

function startGame(choice) {
    game.currentChoice = choice;
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'grid';
    
    game.p.mana = game.p.max = 1;
    game.e.mana = game.e.max = 1;

    // 初始抽牌
    for(let i=0; i<4; i++) { 
        draw('p', choice); 
        draw('e', 'WARRIOR'); // 對手預設為破陣者
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

// 🌟 升級版特效產生器
function createFX(fromEl, toEl, effectType = "fire") {
    if(!fromEl || !toEl) return;
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    // ⚔️ 近戰刀光特效 (不需要飛行，直接在目標身上爆發)
    if (effectType === 'slash') {
        const slash = document.createElement('div');
        slash.innerText = '💢'; 
        slash.style.position = 'fixed';
        slash.style.fontSize = '60px';
        slash.style.left = toRect.left + (toRect.width/2) - 30 + 'px';
        slash.style.top = toRect.top + (toRect.height/2) - 30 + 'px';
        slash.style.zIndex = '3000';
        slash.style.pointerEvents = 'none';
        slash.style.transition = 'transform 0.2s, opacity 0.3s';
        slash.style.transform = 'scale(0.1) rotate(-20deg)';
        slash.style.filter = 'drop-shadow(0 0 15px #e74c3c)';
        document.body.appendChild(slash);
        
        // 瞬間放大
        setTimeout(() => {
            slash.style.transform = 'scale(1.5) rotate(10deg)';
            slash.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            slash.style.opacity = '0';
        }, 200);

        setTimeout(() => {
            slash.remove();
            toEl.classList.add('shake');
            showDamagePop(toEl, '💥');
            setTimeout(() => toEl.classList.remove('shake'), 200);
        }, 300);
        return; 
    }

    // ☄️ 遠程飛行特效
    const p = document.createElement('div');
    p.className = 'projectile';
    
    if(effectType === "spell") {
        p.style.background = "radial-gradient(circle, #fff 10%, #e0b0ff 40%, #9b59b6 80%)";
        p.style.boxShadow = "0 0 20px #9b59b6, 0 0 40px #6a1b9a";
    } else if (effectType === "heal") {
        p.style.background = "radial-gradient(circle, #fff 10%, #a8e6cf 40%, #1fab89 80%)";
        p.style.boxShadow = "0 0 20px #1fab89";
    } else { // fire
        p.style.background = "radial-gradient(circle, #fff 10%, #f39c12 40%, #e74c3c 80%)";
        p.style.boxShadow = "0 0 20px #e74c3c, 0 0 40px #c0392b";
    }

    p.style.left = (fromRect.left + fromRect.width/2) + 'px';
    p.style.top = (fromRect.top + fromRect.height/2) + 'px';
    document.body.appendChild(p);

    const trail = setInterval(() => {
        const rect = p.getBoundingClientRect();
        const part = document.createElement('div');
        part.className = 'particle';
        if(effectType === "spell") part.style.background = "#9b59b6";
        else if(effectType === "heal") part.style.background = "#1fab89";
        else part.style.background = "#f39c12"; // 火焰殘影
        
        part.style.left = rect.left + rect.width/2 + 'px';
        part.style.top = rect.top + rect.height/2 + 'px';
        document.body.appendChild(part);
        setTimeout(() => part.remove(), 400);
    }, 30);

    setTimeout(() => {
        p.style.left = (toRect.left + toRect.width/2 - 12) + 'px';
        p.style.top = (toRect.top + toRect.height/2 - 12) + 'px';
    }, 50);

    setTimeout(() => {
        clearInterval(trail);
        p.remove();
        toEl.classList.add('shake');
        showDamagePop(toEl, effectType === 'heal' ? '✨' : '💥');
        setTimeout(() => toEl.classList.remove('shake'), 200);
    }, 500);
}

function showDamagePop(el, icon) {
    const rect = el.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'damage-pop';
    pop.innerText = icon; 
    pop.style.left = rect.left + (rect.width/2) - 15 + 'px';
    pop.style.top = rect.top + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 600);
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
    
    // 【修復關鍵】：先將狀態與卡牌索引存起來，避免提早被清空
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

    // 嘲諷判定
    if(actionState === 'TARGETING_ATK') {
        if(!BattleEngine.isValidAttackTarget(isHero, targetMinion, game.e.board)) {
            showNotice("必須先攻擊嘲諷目標！");
            cancelTargeting();
            render();
            return;
        }
    }

    // 判斷該播哪一種特效
    let fxType = 'slash'; // 預設近戰攻擊為刀光
    if (actionState === 'TARGETING_SPELL') {
        let spellCard = game.p.hand[selectedIdx];
        if (spellCard.name.includes("火")) fxType = 'fire';
        else fxType = 'spell';
    }

    // 發射動畫
    createFX(attackerEl, el, fxType);
    
    // 動畫發射後立刻解除瞄準狀態，讓玩家可以繼續操作別的牌
    cancelTargeting();
    render();

    // 550毫秒後，動畫抵達目標，執行實際扣血邏輯
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

// AI 升級版
async function playerEndTurn() {
    if(game.turn !== 'P') return;
    game.turn = 'E';
    game.p.board.forEach(m => m.ready = true); 
    showNotice("敵方回合");
    render();
    
    await new Promise(r => setTimeout(r, 1000));

    game.e.max = Math.min(game.e.max + 1, 10);
    game.e.mana = game.e.max;
    draw('e', 'WARRIOR');
    render();

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
            render();
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
            // AI 攻擊也使用刀光特效
            createFX(fromEl, targetEl, "slash");
            
            // 延遲一點點時間讓動畫播完再扣血
            await new Promise(r => setTimeout(r, 300));
            BattleEngine.calculateCombat(attacker, target, isTargetHero);
            attacker.ready = false;
            cleanUp();
            render();
            await new Promise(r => setTimeout(r, 500));
        }
    }

    game.turn = 'P';
    game.p.max = Math.min(game.p.max + 1, 10);
    game.p.mana = game.p.max;
    draw('p', game.currentChoice);
    showNotice("你的回合");
    render();
}

function render() {
    document.getElementById('p-hp').innerText = game.p.hp;
    document.getElementById('e-hp').innerText = game.e.hp;
    document.getElementById('p-mana').innerText = game.p.mana;
    document.getElementById('p-max').innerText = game.p.max;
    document.getElementById('e-hand').innerText = game.e.hand.length;
    const eManaEl = document.getElementById('e-mana');
    if(eManaEl) eManaEl.innerText = game.e.mana;

    const renderArea = (id, data, type) => {
        const el = document.getElementById(id);
        el.innerHTML = '';
        data.forEach((c, i) => {
            const div = document.createElement('div');
            
            let isSelected = false;
            if(game.state === 'TARGETING_SPELL' && type === 'P_HAND' && game.selectedIdx === i) isSelected = true;
            if(game.state === 'TARGETING_ATK' && type === 'P_BOARD' && game.selectedIdx === i) isSelected = true;
            
            let classes = ['card'];
            if(isSelected) classes.push('selected');
            if(c.isDrawing) classes.push('drawing');
            if(c.type === 'spell') classes.push('spell-card');
            if(isSelected && c.type === 'spell') classes.push('spell-targeting');
            if(!c.ready && type === 'P_BOARD') classes.push('exhausted');
            
            div.className = classes.join(' ');
            
            let iconHTML = '';
            if(c.keyword === 'taunt') iconHTML = `<div style="position:absolute; top:-15px; right:-15px; font-size:28px; filter:drop-shadow(0 0 5px #000); z-index:20;">🛡️</div>`;
            if(c.keyword === 'spell_damage') iconHTML = `<div style="position:absolute; top:-15px; right:-15px; font-size:28px; filter:drop-shadow(0 0 5px #9b59b6); z-index:20;">✨</div>`;
            if(c.keyword === 'charge') iconHTML = `<div style="position:absolute; top:-15px; right:-15px; font-size:28px; filter:drop-shadow(0 0 5px #e74c3c); z-index:20;">⚡</div>`;

            div.innerHTML = `
                ${iconHTML}
                <div class="cost">${c.cost || 0}</div>
                <div class="card-art" style="background-image: url('${c.art}')"></div>
                <div class="card-name">${c.name}</div>
                <div style="font-size:10px; text-align:center; padding: 2px 5px; color:#aaa; height: 14px; overflow:hidden;">${c.description || ''}</div>
                <div class="stats">
                    <span class="atk">${c.type==='spell'?'🔥':'⚔️'} ${c.atk}</span>
                    <span class="hp">${c.hp !== undefined && c.type==='minion' ? '❤️ ' + c.hp : ''}</span>
                </div>
            `;
            
            div.onclick = (e) => {
                e.stopPropagation();
                handleSelect(type, div, i);
            };
            el.appendChild(div);
        });
    };

    renderArea('hand-area', game.p.hand, 'P_HAND');
    renderArea('player-board', game.p.board, 'P_BOARD');
    renderArea('enemy-board', game.e.board, 'E_BOARD');
}
