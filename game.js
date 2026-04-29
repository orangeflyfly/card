/* game.js - 萬界裂痕 核心邏輯 (串接資料庫與引擎版) */

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

    // 初始抽牌：使用 CARD_DB
    for(let i=0; i<4; i++) { 
        draw('p', choice); 
        draw('e', 'WARRIOR'); // 對手預設為破陣者
    }
    showNotice("戰鬥開始！");
    render();
}

function draw(who, choice) {
    if (game[who].hand.length >= 10) return; 
    // 從 database.js 的 CARD_DB 讀取卡池
    let pool = [...CARD_DB[choice || 'NEUTRAL'], ...CARD_DB.NEUTRAL];
    let card = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)])); // 深拷貝防止污染原型
    card.isDrawing = true;
    
    // 如果是丹丹，自帶衝鋒 (直接 ready)
    if (card.keyword === 'charge') card.ready = true;
    else card.ready = false;

    game[who].hand.push(card);
    
    setTimeout(() => {
        card.isDrawing = false;
        render();
    }, 600);
}

function createFX(fromEl, toEl, colorType = "fire") {
    if(!fromEl || !toEl) return;
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'projectile';
    
    if(colorType === "spell") {
        p.style.background = "radial-gradient(circle, #fff 10%, #e0b0ff 40%, #9b59b6 80%)";
        p.style.boxShadow = "0 0 20px #9b59b6, 0 0 40px #6a1b9a";
    } else if (colorType === "heal") {
        p.style.background = "radial-gradient(circle, #fff 10%, #a8e6cf 40%, #1fab89 80%)";
        p.style.boxShadow = "0 0 20px #1fab89";
    }

    p.style.left = (fromRect.left + fromRect.width/2) + 'px';
    p.style.top = (fromRect.top + fromRect.height/2) + 'px';
    document.body.appendChild(p);

    const trail = setInterval(() => {
        const rect = p.getBoundingClientRect();
        const part = document.createElement('div');
        part.className = 'particle';
        if(colorType === "spell") part.style.background = "#9b59b6";
        if(colorType === "heal") part.style.background = "#1fab89";
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
        showDamagePop(toEl, colorType === 'heal' ? '✨' : '💥');
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
            // 呼叫引擎判斷是否可打出
            if(!BattleEngine.canPlayCard(game.p, card)) {
                showNotice(game.p.mana < card.cost ? "能量不足！" : "場上已滿！");
                return;
            }
            
            if(card.type === 'minion') {
                game.p.mana -= card.cost;
                game.p.board.push(game.p.hand.splice(idx, 1)[0]);
            } else if(card.type === 'spell') {
                // 特殊法術：萬界餐館 (直接發動，不需指定目標)
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
    if(game.state === 'TARGETING_SPELL') {
        attackerEl = document.querySelectorAll('#hand-area .card')[game.selectedIdx];
    } else if(game.state === 'TARGETING_ATK') {
        attackerEl = document.querySelectorAll('#player-board .card')[game.selectedIdx];
    }

    if(!attackerEl || type === 'P_HAND' || type === 'P_BOARD') {
        cancelTargeting();
        render();
        return;
    }

    const isHero = type === 'E_HERO';
    const targetMinion = isHero ? null : game.e.board[idx];

    // 嘲諷阻擋判定 (如果是攻擊的話)
    if(game.state === 'TARGETING_ATK') {
        if(!BattleEngine.isValidAttackTarget(isHero, targetMinion, game.e.board)) {
            showNotice("必須先攻擊嘲諷目標！");
            cancelTargeting();
            render();
            return;
        }
    }

    createFX(attackerEl, el, (game.state === 'TARGETING_SPELL' ? 'spell' : 'fire'));

    setTimeout(() => {
        if(game.state === 'TARGETING_SPELL') {
            let card = game.p.hand[game.selectedIdx];
            // 呼叫引擎計算包含林凡加成的法術傷害
            let finalDmg = BattleEngine.calculateSpellDamage(card, game.p.board);
            
            if(isHero) game.e.hp -= finalDmg;
            else game.e.board[idx].hp -= finalDmg;
            
            game.p.mana -= card.cost;
            game.p.hand.splice(game.selectedIdx, 1);
        } else if(game.state === 'TARGETING_ATK') {
            let pM = game.p.board[game.selectedIdx];
            // 呼叫引擎計算戰鬥傷害與反擊
            BattleEngine.calculateCombat(pM, isHero ? game.e : game.e.board[idx], isHero);
            pM.ready = false;
        }
        cleanUp();
        render();
    }, 550);

    cancelTargeting();
}

function cleanUp() {
    game.p.board = game.p.board.filter(m => m.hp > 0);
    game.e.board = game.e.board.filter(m => m.hp > 0);
    if(game.e.hp <= 0) showNotice("🎉 萬界共鳴，你贏了！");
    if(game.p.hp <= 0) showNotice("💀 裂痕吞噬了你...");
}

// AI 升級版：懂得思考生物交換與嘲諷
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

    // AI 攻擊：尋找場上所有可以攻擊的生物
    game.e.board.forEach(m => m.ready = true); // 簡化：AI生物下回合自動準備好
    for(let i=0; i < game.e.board.length; i++) {
        let attacker = game.e.board[i];
        if (attacker.hp <= 0 || !attacker.ready) continue;

        const fromEl = document.querySelectorAll('#enemy-board .card')[i];
        if(!fromEl) continue;

        // 1. 尋找嘲諷
        let taunts = game.p.board.filter(m => m.keyword === 'taunt');
        let target = null;
        let isTargetHero = false;

        if (taunts.length > 0) {
            target = taunts[0]; // 乖乖打嘲諷
        } else {
            // 2. 聰明交換：找可以無傷單殺的敵方怪
            let bestTrade = game.p.board.find(m => m.hp <= attacker.atk && m.atk < attacker.hp);
            if (bestTrade) {
                target = bestTrade;
            } else {
                // 3. 沒得賺就打臉
                target = game.p;
                isTargetHero = true;
            }
        }

        let targetEl = isTargetHero ? document.getElementById('p-hero') : document.querySelectorAll('#player-board .card')[game.p.board.indexOf(target)];

        if(targetEl) {
            createFX(fromEl, targetEl, "fire");
            BattleEngine.calculateCombat(attacker, target, isTargetHero);
            attacker.ready = false;
            await new Promise(r => setTimeout(r, 800));
            cleanUp();
            render();
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
            if(!c.ready && type === 'P_BOARD') classes.push('exhausted'); // 稍後可在 CSS 加入灰暗效果
            
            div.className = classes.join(' ');
            
            // 關鍵字視覺圖示
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
