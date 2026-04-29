// fx.js - 視覺特效模組

export function showDamagePop(el, icon) {
    const rect = el.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'damage-pop';
    pop.innerText = icon; 
    pop.style.left = rect.left + (rect.width/2) - 15 + 'px';
    pop.style.top = rect.top + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 600);
}

export function createFX(fromEl, toEl, effectType = "fire") {
    if(!fromEl || !toEl) return;
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    if (effectType === 'slash') {
        const slash = document.createElement('div');
        slash.innerText = '💢'; 
        slash.style.position = 'fixed';
        slash.style.fontSize = '60px';
        slash.style.left = toRect.left + (toRect.width/2) - 30 + 'px';
        slash.style.top = toRect.top + (toRect.height/2) - 30 + 'px';
        slash.style.zIndex = '3000';
        slash.style.pointerEvents = 'none';
        slash.style.transition = 'transform 0.2s, opacity 0.3s';
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
            showDamagePop(toEl, '💥');
            setTimeout(() => toEl.classList.remove('shake'), 200);
        }, 300);
        return; 
    }

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

    const trail = setInterval(() => {
        const rect = p.getBoundingClientRect();
        const part = document.createElement('div');
        part.className = 'particle';
        if(effectType === "spell") part.style.background = "#9b59b6";
        else if(effectType === "heal") part.style.background = "#1fab89";
        else part.style.background = "#f39c12"; 
        
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
        showDamagePop(toEl, effectType === 'heal' ? '✨' : '💥');
        setTimeout(() => toEl.classList.remove('shake'), 200);
    }, 500);
}
