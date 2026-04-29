// ui.js - 萬界戰場 (Auto Battler) 介面與渲染模組

export function showNotice(txt) {
    const el = document.getElementById('game-msg');
    if (!el) return;
    el.innerText = txt;
    el.classList.add('msg-show');
    setTimeout(() => el.classList.remove('msg-show'), 1200);
}

export function renderUI(game) {
    // 1. 更新頂部狀態與計時器
    const timerEl = document.getElementById('game-timer');
    if (timerEl) timerEl.innerText = game.timer;
    
    const phaseEl = document.getElementById('game-phase');
    if (phaseEl) phaseEl.innerText = game.phase === 'PREP' ? '招募準備' : '戰鬥開始';

    // 2. 更新英雄血量與靈石資源
    document.getElementById('p-hp').innerText = game.p.hp;
    document.getElementById('e-hp').innerText = game.e.hp;
    document.getElementById('p-gold').innerText = game.p.gold;
    document.getElementById('p-max-gold').innerText = game.p.maxGold;

    // 3. 定義區域渲染函數
    const renderArea = (id, data, type) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';

        data.forEach((c, i) => {
            const div = document.createElement('div');
            let classes = ['card'];
            
            if (c.isDrawing) classes.push('drawing');
            // 如果是在商店且買不起，可以加一個視覺置灰（選配）
            if (type === 'SHOP' && game.p.gold < c.cost) classes.push('unaffordable');
            
            div.className = classes.join(' ');
            
            // 關鍵字圖示邏輯
            let iconHTML = '';
            if (c.keyword === 'taunt') iconHTML = `<div class="card-icon" style="filter:drop-shadow(0 0 5px #000);">🛡️</div>`;
            if (c.keyword === 'heal_aura') iconHTML = `<div class="card-icon" style="filter:drop-shadow(0 0 5px #1fab89);">🌿</div>`;
            if (c.description && c.description.includes('戰吼')) iconHTML = `<div class="card-icon" style="filter:drop-shadow(0 0 5px #f1c40f);">✨</div>`;
            if (c.description && c.description.includes('死亡時')) iconHTML = `<div class="card-icon" style="filter:drop-shadow(0 0 5px #e74c3c);">💀</div>`;

            div.innerHTML = `
                ${iconHTML}
                <div class="cost">${c.cost || 3}</div>
                <div class="card-art" style="background-image: url('${c.art}')"></div>
                <div class="card-name">${c.name}</div>
                <div class="card-tribe">[ ${c.tribe || '無'} ]</div>
                <div class="card-desc">${c.description || ''}</div>
                <div class="stats">
                    <span class="atk">⚔️ ${c.atk}</span>
                    <span class="hp">❤️ ${c.hp}</span>
                </div>
            `;
            
            // 點擊事件
            div.onclick = (e) => {
                e.stopPropagation();
                if (type === 'SHOP') {
                    window.buyCard(i); // 呼叫 main.js 掛載的購買函式
                } else if (type === 'PLAYER_BOARD' && game.phase === 'PREP') {
                    window.sellCard(i); // 準備階段點擊場上棋子可以賣出（選配功能）
                }
            };
            el.appendChild(div);
        });
    };

    // 4. 執行各區域渲染
    renderArea('shop-area', game.shop, 'SHOP');
    renderArea('player-board', game.p.board, 'PLAYER_BOARD');
    renderArea('enemy-board', game.e.board, 'ENEMY_BOARD');
}
