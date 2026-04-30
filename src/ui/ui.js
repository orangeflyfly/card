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
    updateText('p-hp', game.p.hp);
    updateText('e-hp', game.e.hp);
    updateText('p-gold', game.p.gold);
    updateText('p-max-gold', game.p.maxGold);
    updateText('game-timer', game.timer);
    updateText('game-phase', game.phase === 'PREP' ? '招募準備' : '激戰中');

    // 2. 更新英雄立繪與動態戰場背景
    updateHeroArt(game);
    updateArenaBackground(game);

    // 3. 渲染種族羈絆區
    const aliveCards = game.p.board.filter(c => c !== null);
    renderBonds(aliveCards);

    // 4. 渲染商店與戰場 (左右對抗佈局)
    renderArea('shop-area', game.shop, 'SHOP', game);
    
    // 戰鬥階段渲染副本，準備階段渲染原件
    const playerBoardData = game.phase === 'COMBAT' ? (game.p.tempBoard || []) : game.p.board;
    renderArea('player-board', playerBoardData, 'PLAYER_BOARD', game);
    renderArea('enemy-board', game.e.board, 'ENEMY_BOARD', game);
}

/**
 * 區域渲染邏輯 - 支援拖放、出售與九宮格顯示
 */
function renderArea(id, data, type, game) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';

    // 【新增：商店出售機制】當卡片拖回商店區時觸發出售
    if (type === 'SHOP' && game.phase === 'PREP') {
        el.ondragover = (e) => { e.preventDefault(); el.style.backgroundColor = 'rgba(231, 76, 60, 0.1)'; };
        el.ondragleave = () => { el.style.backgroundColor = ''; };
        el.ondrop = (e) => {
            e.preventDefault();
            el.style.backgroundColor = '';
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(fromIdx) && window.sellCard) {
                window.sellCard(fromIdx); // 呼叫 main.js 的出售函式
            }
        };
    }

    data.forEach((c, i) => {
        // 處理空位邏輯
        if (!c) {
            const emptyEl = createEmptySlot(type, i, game);
            if (emptyEl) el.appendChild(emptyEl);
            return;
        }

        // 建立卡牌元素
        const div = document.createElement('div');
        const isUnaffordable = type === 'SHOP' && game.p.gold < (c.cost || 3);
        div.className = `card ${isUnaffordable ? 'unaffordable' : ''} ${c.isGolden ? 'golden' : ''}`;
        div.dataset.index = i;

        // 綁定拖曳功能 (僅限準備階段的我方戰場)
        if (type === 'PLAYER_BOARD' && game.phase === 'PREP') {
            setupDragging(div, i);
        }

        // 渲染卡牌內部 HTML
        div.innerHTML = buildCardHTML(c);

        // 點擊邏輯 (買卡或英雄技能)
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

// --- 輔助優化函式：將大型邏輯「分家」 ---

function buildCardHTML(c) {
    let statusIcons = '';
    if (c.hasShield) statusIcons += `<div class="status-icon shield" title="聖盾">🛡️</div>`;
    if (c.hasReborn) statusIcons += `<div class="status-icon reborn" title="重生">💀</div>`;
    if (c.keyword === 'TAUNT') statusIcons += `<div class="status-icon taunt" title="嘲諷">🧱</div>`;

    return `
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
}

function setupDragging(div, i) {
    div.draggable = true;
    div.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', i);
        setTimeout(() => div.style.opacity = '0.5', 0);
    };
    div.ondragend = () => div.style.opacity = '1';
    
    // 交換位置邏輯
    div.ondragover = (e) => { e.preventDefault(); div.style.boxShadow = '0 0 20px var(--highlight)'; };
    div.ondragleave = () => div.style.boxShadow = '';
    div.ondrop = (e) => {
        e.preventDefault();
        div.style.boxShadow = '';
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(fromIdx) && fromIdx !== i && window.moveCard) {
            window.moveCard(fromIdx, i);
        }
    };
}

function createEmptySlot(type, i, game) {
    const empty = document.createElement('div');
    if (type === 'SHOP') {
        empty.className = 'card sold-out';
        empty.innerHTML = `<div style="margin-top:50px; color:#444;">已售出</div>`;
    } else {
        empty.className = 'card empty-slot';
        empty.dataset.index = i;
        if (type === 'PLAYER_BOARD' && game.phase === 'PREP') {
            empty.ondragover = (e) => { e.preventDefault(); empty.style.borderColor = 'var(--highlight)'; };
            empty.ondragleave = () => { empty.style.borderColor = ''; };
            empty.ondrop = (e) => {
                e.preventDefault();
                empty.style.borderColor = '';
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (!isNaN(fromIdx) && window.moveCard) window.moveCard(fromIdx, i);
            };
        }
    }
    return empty;
}

function updateHeroArt(game) {
    const el = document.getElementById('p-hero');
    if (el && game.currentHero?.art) {
        el.style.backgroundImage = `url('${game.currentHero.art}')`;
        el.style.backgroundSize = 'cover';
    }
}

/**
 * 新增：動態戰場背景更新
 * 根據目前的階段更換競技場氛圍
 */
function updateArenaBackground(game) {
    const arena = document.querySelector('.arena-container');
    if (!arena) return;
    if (game.phase === 'COMBAT') {
        arena.style.background = `radial-gradient(circle at center, rgba(231, 76, 60, 0.1) 0%, transparent 80%)`;
    } else {
        arena.style.background = `radial-gradient(circle at center, rgba(189, 160, 109, 0.05) 0%, transparent 60%)`;
    }
}

function updateText(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
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

function createBondArea() {
    const area = document.createElement('div');
    area.id = 'bond-area';
    document.body.appendChild(area);
    return area;
}
