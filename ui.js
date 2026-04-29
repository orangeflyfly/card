// ui.js - 介面與渲染模組

export function showNotice(txt) {
    const el = document.getElementById('game-msg');
    if (!el) return;
    el.innerText = txt;
    el.classList.add('msg-show');
    setTimeout(() => el.classList.remove('msg-show'), 1200);
}

export function renderUI(game) {
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
            
            // 呼叫掛載在 window 上的全域函式
            div.onclick = (e) => {
                e.stopPropagation();
                window.handleSelect(type, div, i);
            };
            el.appendChild(div);
        });
    };

    renderArea('hand-area', game.p.hand, 'P_HAND');
    renderArea('player-board', game.p.board, 'P_BOARD');
    renderArea('enemy-board', game.e.board, 'E_BOARD');
}
