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

    // 2. 渲染種族羈絆區
    renderBonds(game.p.board);

    // 3. 渲染商店 (招募區)
    renderArea('shop-area', game.shop, 'SHOP', game);

    // 4. 渲染戰場 (關鍵修正：戰鬥階段渲染副本，準備階段渲染原件)
    const playerBoardData = game.phase === 'COMBAT' ? (game.p.tempBoard || []) : game.p.board;
    
    renderArea('player-board', playerBoardData, 'PLAYER_BOARD', game);
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
        // --- 修正點 1：處理空位 (當卡片被買走時) ---
        if (!c) {
            if (type === 'SHOP') {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'card sold-out';
                emptyDiv.innerHTML = `<div style="margin-top:50px; color:#444;">已售出</div>`;
                el.appendChild(emptyDiv);
            }
            return;
        }

        const div = document.createElement('div');
        // 判斷是否買得起
        const isUnaffordable = type === 'SHOP' && game.p.gold < (c.cost || 3);
        div.className = `card ${isUnaffordable ? 'unaffordable' : ''} ${c.isGolden ? 'golden' : ''}`;
        
        // 根據關鍵字顯示小圖示 (聖盾、重生、嘲諷)
        let statusIcons = '';
        if (c.hasShield) statusIcons += `<div class="status-icon shield" title="聖盾">🛡️</div>`;
        if (c.hasReborn) statusIcons += `<div class="status-icon reborn" title="重生">💀</div>`;
        if (c.keyword === 'TAUNT') statusIcons += `<div class="status-icon taunt" title="嘲諷">🧱</div>`;

        div.innerHTML = `
            ${statusIcons}
            <div class="cost">${c.cost || 3}</div>
            <div class="card-art" style="background-image: url('${c.art || 'https://picsum.photos/id/10/120/90'}')"></div>
            <div class="card-name">${c.name}</div>
            <div class="card-tribe">[${c.tribe || '無'}]</div>
            <div class="stats">
                <span class="atk">⚔️ ${c.atk}</span>
                <span class="hp">❤️ ${c.hp}</span>
            </div>
        `;

        // 點擊邏輯
        div.onclick = (e) => {
            e.stopPropagation();
            if (type === 'SHOP') window.buyCard(i);
            if (type === 'PLAYER_BOARD' && game.currentHero.id === 'MO_MO' && game.phase === 'PREP') {
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
        bondArea.innerHTML += '<div style="font-size:12px; color:#666;">目前無羈絆</div>';
        return;
    }

    activeBonds.forEach(bond => {
        const div = document.createElement('div');
        div.className = 'bond-item';
        div.innerHTML = `<strong>${bond.tribe} (${bond.count})</strong><br><small>${bond.description}</small>`;
        bondArea.appendChild(div);
    });
}

/**
 * 如果 HTML 裡沒寫 bond-area，動態建立一個
 */
function createBondArea() {
    const area = document.createElement('div');
    area.id = 'bond-area';
    // 樣式微調，避免遮擋畫面
    area.style = "position:fixed; left:10px; top:150px; width:140px; background:rgba(0,0,0,0.85); padding:10px; border:1px solid var(--gold); font-size:12px; z-index:1000; color:white; border-radius:5px;";
    document.body.appendChild(area);
    return area;
}
