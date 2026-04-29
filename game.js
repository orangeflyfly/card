/* game.js - 監製修正強化版 - 絕對不簡化版 */

// 1. 完善資料庫：加入更多卡牌並豐富化 (Set 1: 啟源)
const DB = {
    MAGE: [
        { name: "奧術彈", cost: 1, atk: 3, type: "spell", art: "https://picsum.photos/id/102/120/90" }, 
        { name: "學徒", cost: 2, atk: 2, hp: 2, type: "minion", art: "https://picsum.photos/id/1062/120/90" },
        { name: "火球術", cost: 4, atk: 6, hp: 0, type: "spell", art: "https://picsum.photos/id/674/120/90" },
        { name: "奧術巨人", cost: 8, atk: 8, hp: 8, type: "minion", art: "https://picsum.photos/id/177/120/90" }
    ],
    WARRIOR: [
        { name: "重擊", cost: 2, atk: 4, type: "spell", art: "https://picsum.photos/id/447/120/90" }, 
        { name: "衛兵", cost: 3, atk: 2, hp: 5, type: "minion", art: "https://picsum.photos/id/292/120/90" },
        { name: "斬殺", cost: 1, atk: 4, hp: 0, type: "spell", art: "https://picsum.photos/id/982/120/90" },
        { name: "破陣者", cost: 5, atk: 5, hp: 4, type: "minion", art: "https://picsum.photos/id/1059/120/90" }
    ],
    NEUTRAL: [
        { name: "小卒", cost: 1, atk: 1, hp: 1, type: "minion", art: "https://picsum.photos/id/1011/120/90" }, 
        { name: "持盾衛士", cost: 2, atk: 0, hp: 4, type: "minion", art: "https://picsum.photos/id/1062/120/90" },
        { name: "路人探險家", cost: 3, atk: 3, hp: 3, type: "minion", art: "https://picsum.photos/id/386/120/90" },
        { name: "遠古巨魔", cost: 7, atk: 7, hp: 7, type: "minion", art: "https://picsum.photos/id/652/120/90" }
    ]
};

let game = {
    p: { hp: 30, mana: 1, max: 1, hand: [], board: [] },
    e: { hp: 30, mana: 1, max: 1, hand: [], board: [] },
    turn: 'P', 
    state: 'IDLE', // IDLE, TARGETING_SPELL, TARGETING_ATK
    selectedIdx: null,
    currentChoice: 'MAGE'
};

// 新增：全域訊息提示功能
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
    
    // 初始化雙方能量
    game.p.mana = game.p.max = 1;
    game.e.mana = game.e.max = 1;

    // 初始抽牌：玩家 4 張，敵人 4 張
    for(let i=0; i<4; i++) { 
        draw('p', choice); 
        draw('e', 'NEUTRAL'); 
    }
    showNotice("戰鬥開始！");
    render();
}

function draw(who, choice) {
    if (game[who].hand.length >= 10) return; // 手牌上限 10 張
    let pool = [...DB[choice || 'NEUTRAL'], ...DB.NEUTRAL];
    let card = {...pool[Math.floor(Math.random()*pool.length)], isDrawing: true};
    game[who].hand.push(card);
    
    // 0.6秒後移除抽牌動畫狀態，配合 CSS 
    setTimeout(() => {
        card.isDrawing = false;
        render();
    }, 600);
}

function createFX(fromEl, toEl, colorType = "fire") {
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'projectile';
    
    if(colorType === "spell") {
        p.style.background = "radial-gradient(circle, #fff 10%, #e0b0ff 40%, #9b59b6 80%)";
        p.style.boxShadow = "0 0 20px #9b59b6, 0 0 40px #6a1b9a";
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
    pop.style.left = rect.left + (rect.width/2) - 15 + 'px';
    pop.style.top = rect.top + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 600);
}

// 修正：互動邏輯修復法術失效問題
function handleSelect(type, el, idx) {
    if(game.turn !== 'P') return;

    // 狀態 1: IDLE 時點擊
    if(game.state === 'IDLE') {
        if(type === 'P_HAND') {
            let card = game.p.hand[idx];
            if(game.p.mana < card.cost) {
                showNotice("能量不足！");
                return;
            }
            
            if(card.type === 'minion') {
                if(game.p.board.length >= 7) return;
                game.p.mana -= card.cost;
                game.p.board.push({...game.p.hand.splice(idx, 1)[0], ready: false});
            } else if(card.type === 'spell') {
                // 法術牌進入瞄準模式
                game.state = 'TARGETING_SPELL';
                game.selectedIdx = idx;
                document.body.classList.add('targeting-mode');
            }
        } else if(type === 'P_BOARD') {
            if(!game.p.board[idx].ready) {
                showNotice("這回合已攻擊過！");
                return;
            }
            game.state = 'TARGETING_ATK';
            game.selectedIdx = idx;
            document.body.classList.add('targeting-mode');
        }
    } 
    // 狀態 2: 瞄準模式中點擊目標
    else {
        // 如果再次點擊自己或取消，則回到 IDLE
        if((game.state === 'TARGETING_SPELL' && type === 'P_HAND' && game.selectedIdx === idx)) {
            game.state = 'IDLE';
            game.selectedIdx = null;
            document.body.classList.remove('targeting-mode');
        } else {
            executeAction(type, el, idx);
        }
    }
    render();
}

function executeAction(type, el, idx) {
    let attackerEl;
    if(game.state === 'TARGETING_SPELL') {
        attackerEl = document.querySelectorAll('#hand-area .card')[game.selectedIdx];
    } else if(game.state === 'TARGETING_ATK') {
        attackerEl = document.querySelectorAll('#player-board .card')[game.selectedIdx];
    }

    if(!attackerEl || type === 'P_HAND') {
        game.state = 'IDLE';
        document.body.classList.remove('targeting-mode');
        render();
        return;
    }

    createFX(attackerEl, el, (game.state === 'TARGETING_SPELL' ? 'spell' : 'fire'));

    setTimeout(() => {
        if(game.state === 'TARGETING_SPELL') {
            let card = game.p.hand[game.selectedIdx];
            if(type === 'E_HERO') game.e.hp -= card.atk;
            else if(type === 'E_BOARD') game.e.board[idx].hp -= card.atk;
            game.p.mana -= card.cost;
            game.p.hand.splice(game.selectedIdx, 1);
        } else if(game.state === 'TARGETING_ATK') {
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
    game.selectedIdx = null;
    document.body.classList.remove('targeting-mode');
}

function cleanUp() {
    game.p.board = game.p.board.filter(m => m.hp > 0);
    game.e.board = game.e.board.filter(m => m.hp > 0);
    if(game.e.hp <= 0) showNotice("🎉 你贏了！");
    if(game.p.hp <= 0) showNotice("💀 你輸了...");
}

// 修正：對手 AI 遵循能量規則，不再作弊
async function playerEndTurn() {
    if(game.turn !== 'P') return;
    game.turn = 'E';
    game.p.board.forEach(m => m.ready = true); 
    showNotice("敵方回合");
    render();
    
    await new Promise(r => setTimeout(r, 1000));

    // 敵方回合開始：增加最大能量並補滿
    game.e.max = Math.min(game.e.max + 1, 10);
    game.e.mana = game.e.max;
    draw('e', 'NEUTRAL');
    render();

    await new Promise(r => setTimeout(r, 1000));

    // AI 出牌：現在 AI 會計算能量，從最貴的開始嘗試
    let aiHand = game.e.hand;
    aiHand.sort((a, b) => b.cost - a.cost); // 優先出大怪
    for(let i = aiHand.length - 1; i >= 0; i--) {
        let card = aiHand[i];
        if(game.e.mana >= card.cost && game.e.board.length < 7 && card.type === 'minion') {
            game.e.mana -= card.cost;
            game.e.board.push({...game.e.hand.splice(i, 1)[0], ready: true});
            render();
            await new Promise(r => setTimeout(r, 800));
        }
    }

    // AI 攻擊 (巡邏所有場上生物攻擊英雄)
    for(let i=0; i < game.e.board.length; i++) {
        const fromEl = document.querySelectorAll('#enemy-board .card')[i];
        const targetEl = document.getElementById('p-hero');
        if(fromEl && targetEl) {
            createFX(fromEl, targetEl, "fire");
            game.p.hp -= game.e.board[i].atk;
            await new Promise(r => setTimeout(r, 800));
            render();
        }
    }

    // 回歸玩家回合
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
    // UI 顯示對手當前能量
    const eManaEl = document.getElementById('e-mana');
    if(eManaEl) eManaEl.innerText = game.e.mana;

    const renderArea = (id, data, type) => {
        const el = document.getElementById(id);
        el.innerHTML = '';
        data.forEach((c, i) => {
            const div = document.createElement('div');
            
            // 判斷選中狀態
            let isSelected = false;
            if(game.state === 'TARGETING_SPELL' && type === 'P_HAND' && game.selectedIdx === i) isSelected = true;
            if(game.state === 'TARGETING_ATK' && type === 'P_BOARD' && game.selectedIdx === i) isSelected = true;
            
            // 建立 className
            let classes = ['card'];
            if(isSelected) classes.push('selected');
            if(c.isDrawing) classes.push('drawing');
            if(c.type === 'spell') classes.push('spell-card');
            if(isSelected && c.type === 'spell') classes.push('spell-targeting');
            
            div.className = classes.join(' ');
            
            div.innerHTML = `
                <div class="cost">${c.cost || 0}</div>
                <div class="card-art" style="background-image: url('${c.art}')"></div>
                <div class="card-name">${c.name}</div>
                <div class="stats">
                    <span class="atk">${c.type==='spell'?'⚡':'⚔️'} ${c.atk}</span>
                    <span class="hp">${c.hp ? '❤️ ' + c.hp : ''}</span>
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
