// ui.js - 萬界戰場介面渲染模組 (萬界餐館內景強化版)

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
    // 1. 更新基礎資訊 (血量、靈石、計時器、當前階段文字)
    updateText('p-hp', game.p.hp);
    updateText('e-hp', game.e.hp);
    updateText('p-gold', game.p.gold);
    updateText('p-max-gold', game.p.maxGold);
    updateText('game-timer', game.timer);
    updateText('game-phase', game.phase === 'PREP' ? '招募準備' : '激戰中');

    // 2. 更新英雄立繪與動態戰場內景
    updateHeroArt(game);
    updateArenaBackground(game);

    // 3. 渲染種族羈絆區
    const aliveCards = game.p.board.filter(c => c !== null);
    renderBonds(aliveCards);

    // 4. 渲染商店與戰場 (左右對抗佈局)
    renderArea('shop-area', game.shop, 'SHOP', game);
    
    // 戰鬥階段渲染副本 (tempBoard)，準備階段渲染原件 (board)
    const playerBoardData = game.phase === 'COMBAT' ? (game.p.tempBoard || []) : game.p.board;
    renderArea('player-board', playerBoardData, 'PLAYER_BOARD', game);
    renderArea('enemy-board', game.e.board, 'ENEMY_BOARD', game);
}

/**
 * 區域渲染邏輯 - 支援拖放出售、九宮格換位與狀態渲染
 */
function renderArea(id, data, type, game) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';

    // 【核心優化：出售感應】讓商店區在準備階段可以接收拖來的棋子
    if (type === 'SHOP' && game.phase === 'PREP') {
        el.ondragover = (e) => { 
            e.preventDefault(); 
            el.style.backgroundColor = 'rgba(231, 76, 60, 0.15)'; 
            el.style.boxShadow = 'inset 0 0 20px rgba(231, 76, 60, 0.3)';
        };
        el.ondragleave = () => { 
            el.style.backgroundColor = ''; 
            el.style.boxShadow = '';
        };
        el.ondrop = (e) => {
            e.preventDefault();
            el.style.backgroundColor = '';
            el.style.boxShadow = '';
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(fromIdx) && window.sellCard) {
                window.sellCard(fromIdx); 
            }
        };
    }

    data.forEach((c, i) => {
        // 處理空位渲染
        if (!c) {
            const emptyEl = createEmptySlot(type, i, game);
            if (emptyEl) el.appendChild(emptyEl);
            return;
        }

        // 建立卡牌元素
        const div = document.createElement('div');
        const isUnaffordable = type === 'SHOP' && game.p.gold < (c.cost || 3);
        
        // 組合類別：包含金卡效果、購買力判斷、以及受傷狀態
        div.className = `card ${isUnaffordable ? 'unaffordable' : ''} ${c.isGolden ? 'golden' : ''} ${c.hp <= 0 ? 'dead' : ''}`;
        div.dataset.index = i;

        // 綁定拖曳功能 (僅限準備階段的我方棋子)
        if (type === 'PLAYER_BOARD' && game.phase === 'PREP') {
            setupDragging(div, i);
        }

        // 注入卡牌內部 HTML (包含各項數值與狀態圖示)
        div.innerHTML = buildCardHTML(c);

        // 互動邏輯
        div.onclick = (e) => {
            e.stopPropagation();
            if (type === 'SHOP') window.buyCard(i);
            // 墨墨專屬重生技能
            if (type === 'PLAYER_BOARD' && game.currentHero?.id === 'MO_MO' && game.phase === 'PREP') {
                window.useHeroSkill(i);
            }
        };

        el.appendChild(div);
    });
}

// --- 內部輔助邏輯：將功能模組化以利維護 ---

function buildCardHTML(c) {
    let statusIcons = '';
    // 渲染狀態圖示：聖盾、重生、嘲諷
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
            <span class="hp" style="color: ${c.hp < 5 ? 'var(--highlight)' : 'inherit'}">❤️ ${c.hp}</span>
        </div>
    `;
}

function setupDragging(div, i) {
    div.draggable = true;
    div.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', i);
        setTimeout(() => div.style.opacity = '0.4', 0); // 拖起時本體半透明
    };
    div.ondragend = () => div.style.opacity = '1';
    
    // 九宮格交換位置感應
    div.ondragover = (e) => { 
        e.preventDefault(); 
        div.style.filter = 'brightness(1.5)';
        div.style.boxShadow = '0 0 25px var(--gold)';
    };
    div.ondragleave = () => { 
        div.style.filter = '';
        div.style.boxShadow = ''; 
    };
    div.ondrop = (e) => {
        e.preventDefault();
        div.style.filter = '';
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
        empty.innerHTML = `<div style="margin-top:50px; color:#444; letter-spacing:2px;">已售出</div>`;
    } else {
        // 九宮格空位：支持放入拖來的棋子
        empty.className = 'card empty-slot';
        empty.dataset.index = i;
        if (type === 'PLAYER_BOARD' && game.phase === 'PREP') {
            empty.ondragover = (e) => { 
                e.preventDefault(); 
                empty.style.backgroundColor = 'rgba(189, 160, 109, 0.1)';
                empty.style.borderColor = 'var(--gold)'; 
            };
            empty.ondragleave = () => { 
                empty.style.backgroundColor = '';
                empty.style.borderColor = ''; 
            };
            empty.ondrop = (e) => {
                e.preventDefault();
                empty.style.backgroundColor = '';
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
        el.style.backgroundPosition = 'center';
    }
}

/**
 * 強化版：動態戰場內景切換
 * 加入了背景圖片結合漸層的視覺處理
 */
function updateArenaBackground(game) {
    const arena = document.querySelector('.arena-container');
    if (!arena) return;

    if (game.phase === 'COMBAT') {
        // 激戰中：色調變暗冷，強調戰鬥緊張感
        arena.style.filter = "brightness(0.6) sepia(0.2) contrast(1.2)";
        arena.style.backgroundBlendMode = "multiply";
    } else {
        // 準備中：色調溫潤，呈現餐館的和諧氣氛
        arena.style.filter = "brightness(1) sepia(0) contrast(1)";
        arena.style.backgroundBlendMode = "normal";
    }
}

function updateText(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
}

/**
 * 渲染羈絆顯示區 (包含動態建立與樣式更新)
 */
function renderBonds(board) {
    const bondArea = document.getElementById('bond-area') || createBondArea();
    const activeBonds = BondSystem.getActiveBonds(board);
    
    bondArea.innerHTML = '<h4>啟動羈絆</h4>';
    if (activeBonds.length === 0) {
        bondArea.innerHTML += '<div style="font-size:12px; color:#666; margin-top:10px;">目前無羈絆</div>';
        return;
    }

    activeBonds.forEach(bond => {
        const div = document.createElement('div');
        div.className = 'bond-item';
        div.innerHTML = `
            <div class="bond-header">
                <strong>${bond.tribe}</strong>
                <span class="bond-count">${bond.count}</span>
            </div>
            <small class="bond-desc">${bond.description}</small>
        `;
        bondArea.appendChild(div);
    });
}

function createBondArea() {
    const area = document.createElement('div');
    area.id = 'bond-area';
    // 預設掛載在 body，樣式由 style.css 控制
    document.body.appendChild(area);
    return area;
}
