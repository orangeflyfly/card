// fx.js - 萬界戰場視覺特效模組

/**
 * 強化版：傷害跳字 (支援自訂顏色與大小，並加入微亂數偏移防止字體重疊)
 */
export function showDamagePop(el, icon, customColor = 'white', fontSize = '3rem') {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'damage-pop';
    pop.innerText = icon; 
    
    // 視覺優化：加入 X 軸的隨機微小偏移，這樣多段攻擊時字才不會全部黏在一起
    const randomX = (Math.random() - 0.5) * 30;
    pop.style.left = rect.left + (rect.width/2) - 15 + randomX + 'px';
    pop.style.top = rect.top + 'px';
    pop.style.color = customColor;
    pop.style.fontSize = fontSize;
    
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 600);
}

/**
 * 強化版：核心特效產生器
 */
export function createFX(fromEl, toEl, effectType = "fire") {
    if(!fromEl || !toEl) return;
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    // ==========================================
    // 1. 近戰斬擊特效 (slash)
    // ==========================================
    if (effectType === 'slash') {
        const slash = document.createElement('div');
        slash.innerText = '💢'; 
        slash.style.position = 'fixed';
        slash.style.fontSize = '60px';
        slash.style.left = toRect.left + (toRect.width/2) - 30 + 'px';
        slash.style.top = toRect.top + (toRect.height/2) - 30 + 'px';
        slash.style.zIndex = '3000';
        slash.style.pointerEvents = 'none';
        // 視覺優化：加入 cubic-bezier 讓爆發感更強烈
        slash.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s';
        slash.style.transform = 'scale(0.1) rotate(-20deg)';
        slash.style.filter = 'drop-shadow(0 0 15px #e74c3c)';
        document.body.appendChild(slash);
        
        setTimeout(() => {
            slash.style.transform = 'scale(1.5) rotate(10deg)';
            slash.style.opacity = '1';
        }, 10);
        
        setTimeout(() => slash.style.opacity = '0', 200);

        setTimeout(() => {
            slash.remove();
            toEl.classList.add('shake');
            showDamagePop(toEl, '💥', '#ff4757');
            setTimeout(() => toEl.classList.remove('shake'), 200);
        }, 300);
        return; 
    }

    // ==========================================
    // 2. 特殊狀態特效 (聖盾、重生、出售) - 新增！
    // ==========================================
    if (effectType === 'shield_break') {
        toEl.classList.add('shake');
        showDamagePop(toEl, '🛡️ 破碎', '#7bed9f', '2rem');
        setTimeout(() => toEl.classList.remove('shake'), 200);
        return;
    }

    if (effectType === 'reborn') {
        showDamagePop(toEl, '💀 甦生', '#a29bfe', '2.5rem');
        return;
    }

    if (effectType === 'sell') {
        // 出售卡片時的爆金幣特效
        showDamagePop(fromEl, '💰 +1', '#feca57', '2.5rem');
        return;
    }

    // ==========================================
    // 3. 遠程彈道特效 (fire, spell, heal)
    // ==========================================
    const p = document.createElement('div');
    p.className = 'projectile';
    
    if(effectType === "spell") {
        p.style.background = "radial-gradient(circle, #fff 10%, #e0b0ff 40%, #9b59b6 80%)";
        p.style.boxShadow = "0 0 20px #9b59b6, 0 0 40px #6a1b9a";
    } else if (effectType === "heal") {
        p.style.background = "radial-gradient(circle, #fff 10%, #a8e6cf 40%, #1fab89 80%)";
        p.style.boxShadow = "0 0 20px #1fab89";
    } else { 
        p.style.background = "radial-gradient(circle, #fff 10%, #f39c12 40%, #e74c3c 80%)";
        p.style.boxShadow = "0 0 20px #e74c3c, 0 0 40px #c0392b";
    }

    p.style.left = (fromRect.left + fromRect.width/2) + 'px';
    p.style.top = (fromRect.top + fromRect.height/2) + 'px';
    document.body.appendChild(p);

    // 視覺優化：強化拖尾粒子系統，加入隨機擴散效果
    const trail = setInterval(() => {
        const rect = p.getBoundingClientRect();
        const part = document.createElement('div');
        part.className = 'particle';
        if(effectType === "spell") part.style.background = "#9b59b6";
        else if(effectType === "heal") part.style.background = "#1fab89";
        else part.style.background = "#f39c12"; 
        
        // 給粒子一點點隨機偏移，看起來更像真實的火焰/魔法拖尾
        const offsetX = (Math.random() - 0.5) * 12;
        const offsetY = (Math.random() - 0.5) * 12;
        
        part.style.left = rect.left + rect.width/2 + offsetX + 'px';
        part.style.top = rect.top + rect.height/2 + offsetY + 'px';
        document.body.appendChild(part);
        setTimeout(() => part.remove(), 400);
    }, 30);

    // 彈道飛行
    setTimeout(() => {
        p.style.left = (toRect.left + toRect.width/2 - 12) + 'px';
        p.style.top = (toRect.top + toRect.height/2 - 12) + 'px';
    }, 50);

    // 彈道命中結算
    setTimeout(() => {
        clearInterval(trail);
        p.remove();
        toEl.classList.add('shake');
        
        // 根據不同類型跳出對應的顏色與符號
        const isHeal = effectType === 'heal';
        showDamagePop(toEl, isHeal ? '✨' : '💥', isHeal ? '#2ed573' : '#ff4757');
        
        setTimeout(() => toEl.classList.remove('shake'), 200);
    }, 500);
}
