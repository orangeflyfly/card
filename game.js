/* game.js */
const DB = {
    MAGE: [{name:"奧術彈", cost:1, atk:3, type:"spell"}, {name:"學徒", cost:2, atk:2, hp:2, type:"minion"}],
    WARRIOR: [{name:"重擊", cost:2, atk:4, type:"spell"}, {name:"衛兵", cost:3, atk:2, hp:5, type:"minion"}],
    NEUTRAL: [{name:"小卒", cost:1, atk:1, hp:1, type:"minion"}, {name:"巨魔", cost:5, atk:5, hp:5, type:"minion"}]
};

let game = {
    p: { hp: 30, mana: 1, max: 1, hand: [], board: [] },
    e: { hp: 30, mana: 1, max: 1, hand: [], board: [] },
    turn: 'P', state: 'IDLE', selectedIdx: null,
    currentChoice: 'MAGE'
};

function startGame(choice) {
    game.currentChoice = choice;
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'grid';
    for(let i=0; i<4; i++) { draw('p', choice); draw('e', 'NEUTRAL'); }
    render();
}

function draw(who, choice) {
    let pool = [...DB[choice || 'NEUTRAL'], ...DB.NEUTRAL];
    game[who].hand.push({...pool[Math.floor(Math.random()*pool.length)]});
}

function createFX(fromEl, toEl, colorType = "fire") {
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'projectile';
    
    if(colorType === "spell") {
        p.style.background = "radial-gradient(circle, #fff 10%, #e0b0ff 40%, #9b59b6 80%)";
        p.style.boxShadow = "0 0 20px #9b59b6";
    }

    p.style.left = (fromRect.left + fromRect.width/2) + 'px';
    p.style.top = (fromRect.top + fromRect.height/2) + 'px';
    document.body.appendChild(p);

    const trail = setInterval(() => {
        const rect = p.getBoundingClientRect();
        const part = document.createElement('div');
        part.className = 'particle';
        if(colorType === "spell") part.style.background = "#9b59b6";
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
        showDamagePop(toEl);
        setTimeout(() => toEl.classList.remove('shake'), 200);
    }, 500);
}

function showDamagePop(el) {
    const rect = el.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'damage-pop';
    pop.innerText = '💥';
    pop.style.left = rect.left + 'px';
    pop.style.top = rect.top + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 600);
}

function handleSelect(type, el, idx) {
    if(game.turn !== 'P') return;

    if(game.state === 'IDLE' && type === 'P_HAND') {
        let card = game.p.hand[idx];
        if(game.p.mana < card.cost) return;
        if(card.type === 'minion') {
            game.p.mana -= card.cost;
            game.p.board.push({...game.p.hand.splice(idx, 1)[0], ready: false});
        } else {
            game.state = 'TARGETING_SPELL';
            game.selectedIdx = idx;
        }
    } else if(game.state === 'IDLE' && type === 'P_BOARD') {
        if(!game.p.board[idx].ready) return;
        game.state = 'TARGETING_ATK';
        game.selectedIdx = idx;
    } else if(game.state.includes('TARGETING')) {
        executeAction(type, el, idx);
    }
    render();
}

function executeAction(type, el, idx) {
    let attackerEl = (game.state === 'TARGETING_SPELL') ? 
        document.querySelectorAll('#hand-area .card')[game.selectedIdx] :
        document.querySelectorAll('#player-board .card')[game.selectedIdx];

    createFX(attackerEl, el, (game.state === 'TARGETING_SPELL' ? 'spell' : 'fire'));

    setTimeout(() => {
        if(game.state === 'TARGETING_SPELL') {
            let card = game.p.hand[game.selectedIdx];
            if(type === 'E_HERO') game.e.hp -= card.atk;
            else if(type === 'E_BOARD') game.e.board[idx].hp -= card.atk;
            game.p.mana -= card.cost;
            game.p.hand.splice(game.selectedIdx, 1);
        } else {
            let pM = game.p.board[game.selectedIdx];
            if(type === 'E_HERO') game.e.hp -= pM.atk;
            else if(type === 'E_BOARD') {
                let eM = game.e.board[idx];
                eM.hp -= pM.atk; pM.hp -= eM.atk;
            }
            pM.ready = false;
        }
        cleanUp();
        render();
    }, 550);
    game.state = 'IDLE';
}

function cleanUp() {
    game.p.board = game.p.board.filter(m => m.hp > 0);
    game.e.board = game.e.board.filter(m => m.hp > 0);
}

async function playerEndTurn() {
    if(game.turn !== 'P') return;
    game.turn = 'E';
    game.p.board.forEach(m => m.ready = true);
    document.getElementById('end-btn').innerText = "敵方回合...";
    
    await new Promise(r => setTimeout(r, 1000));
    // AI 出牌
    game.e.hand.forEach((c, i) => {
        if(game.e.board.length < 7 && c.type === 'minion') {
            game.e.board.push({...game.e.hand.splice(i, 1)[0], ready: true});
        }
    });
    render();

    await new Promise(r => setTimeout(r, 1000));
    // AI 攻擊
    for(let i=0; i<game.e.board.length; i++) {
        const fromEl = document.querySelectorAll('#enemy-board .card')[i];
        const targetEl = document.getElementById('p-hero');
        if(fromEl) {
            createFX(fromEl, targetEl, "fire");
            game.p.hp -= game.e.board[i].atk;
            await new Promise(r => setTimeout(r, 600));
        }
    }

    game.turn = 'P';
    if(game.p.max < 10) game.p.max++;
    game.p.mana = game.p.max;
    draw('p', game.currentChoice);
    document.getElementById('end-btn').innerText = "結束回合";
    render();
}

function render() {
    document.getElementById('p-hp').innerText = game.p.hp;
    document.getElementById('e-hp').innerText = game.e.hp;
    document.getElementById('p-mana').innerText = game.p.mana;
    document.getElementById('p-max').innerText = game.p.max;
    document.getElementById('e-hand').innerText = game.e.hand.length;

    const renderArea = (id, data, type) => {
        const el = document.getElementById(id);
        el.innerHTML = '';
        data.forEach((c, i) => {
            const div = document.createElement('div');
            div.className = `card ${game.selectedIdx === i && game.state !== 'IDLE' ? 'selected' : ''}`;
            div.innerHTML = `<div class="cost">${c.cost || 0}</div><div style="padding:10px">${c.name}</div>
                             <div class="stats"><span>${c.atk}</span><span>${c.hp || ''}</span></div>`;
            div.onclick = () => handleSelect(type, div, i);
            el.appendChild(div);
        });
    };

    renderArea('hand-area', game.p.hand, 'P_HAND');
    renderArea('player-board', game.p.board, 'P_BOARD');
    renderArea('enemy-board', game.e.board, 'E_BOARD');
}
