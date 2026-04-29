// ui.js - 萬界戰場介面渲染模組

import { BondSystem } from '../core/bonds.js';

/**
 * 顯示全域訊息 (如：戰鬥開始、林凡的熱飯)
 */
export function showNotice(txt) {
    const el = document.getElementById('game-msg');
    if (!el) return;
    el.innerText = txt;
    el.classList.add('msg-show');
    setTimeout(() => el.classList.remove('msg-show'), 1200);
}

/**
 * 核心渲染函式
 */
export function renderUI(game) {
    // 1. 更新基礎資訊 (血量、靈石、計時器)
    document.getElementById('p-hp').innerText = game.p.hp;
    document.getElementById('e-hp').innerText = game.e.hp;
    document.getElementById('p-gold').innerText = game.p.gold;
    document.getElementById('p-max-gold').innerText = game.p.maxGold;
    
    const timerEl = document.getElementById('game-timer');
    if (timerEl) timerEl.innerText = game.timer;

    // 2. 渲染種族羈絆區 (新增功能：顯示目前啟動的加成)
    renderBonds(game.p.board);

    // 3. 渲染商店 (招募區)
    renderArea('shop-area', game.shop, 'SHOP', game);

    // 4. 渲染戰場 (我方與敵方)
    renderArea('player-board', game.p.board, 'PLAYER_BOARD', game);
    renderArea('enemy-board', game.e.board, 'ENEMY_BOARD', game);
}

/**
 * 區域渲染邏輯
 */
function renderArea(id, data, type, game) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';

    data.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = `card ${game.p.gold < (c.cost || 3) && type === 'SHOP' ? 'unaffordable' : ''}`;
        
        // 根據關鍵字顯示小圖示 (聖盾、重生、嘲諷)
        let statusIcons = '';
        if (c.hasShield) statusIcons += `<div class="status-icon shield">🛡️</div>`;
        if (c.hasReborn) statusIcons += `<div class="status-icon reborn">💀</div>`;
        if (c.keyword === 'TAUNT') statusIcons += `<div class="status-icon taunt">🧱</div>`;

        div.innerHTML = `
            ${statusIcons}
            <div class="cost">${c.cost || 3}</div>
            <div class="card-art" style="background-image: url('${c.art || 'https://picsum.photos/id/10/120/90'}')"></div>
            <div class="card-name">${c.name}</div>
            <div class="card-tribe">[${c.tribe}]</div>
            <div class="stats">
                <span class="atk">⚔️ ${c.atk}</span>
                <span class="hp">❤️ ${c.hp}</span>
            </div>
        `;

        // 點擊邏輯
        div.onclick = (e) => {
            e.stopPropagation();
            if (type === 'SHOP') window.buyCard(i);
            if (type === 'PLAYER_BOARD' && game.currentHero.id === 'MO_MO') {
                // 墨墨專屬技能：點擊場上棋子賦予重生
                window.useHeroSkill(i);
            }
        };

        el.appendChild(div);
    });
}

/**
 * 渲染羈絆顯示區
 */
function renderBonds(board) {
    const bondArea = document.getElementById('bond-area') || createBondArea();
    const activeBonds = BondSystem.getActiveBonds(board);
    
    bondArea.innerHTML = '<h4>啟動羈絆</h4>';
    if (activeBonds.length === 0) {
        bondArea.innerHTML += '<div style="font-size:12px; color:#666;">暫無羈絆</div>';
        return;
    }

    activeBonds.forEach(bond => {
        const div = document.createElement('div');
        div.className = 'bond-item';
        div.innerHTML = `<strong>${bond.tribe} (${bond.count})</strong>: ${bond.description}`;
        bondArea.appendChild(div);
    });
}

/**
 * 如果 HTML 裡沒寫 bond-area，動態建立一個
 */
function createBondArea() {
    const area = document.createElement('div');
    area.id = 'bond-area';
    area.style = "position:fixed; left:10px; top:100px; width:180px; background:rgba(0,0,0,0.8); padding:10px; border:1px solid var(--gold); font-size:13px; z-index:1000;";
    document.body.appendChild(area);
    return area;
}
