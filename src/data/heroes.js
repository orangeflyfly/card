// heroes.js - 萬界戰場英雄定義庫

export const HEROES = {
    'LIN_FAN': {
        id: 'LIN_FAN',
        name: "林凡",
        title: "萬界廚神",
        hp: 35, // 根據餐館老闆設定微調血量
        skillName: "暖心熱飯",
        description: "每回合開始時，隨機賦予一名友方棋子 +1/+1。",
        // --- 注入立繪路徑 ---
        art: './assets/img/lin_fan.jpg', 
        effectTag: 'A_HERO_BUFF_RANDOM'
    },
    'DAN_DAN': {
        id: 'DAN_DAN',
        name: "丹丹",
        title: "劍影紅顏",
        hp: 30,
        skillName: "劍意通明",
        description: "戰鬥開始時，讓最左邊的棋子獲得「聖盾」。",
        // --- 注入立繪路徑 ---
        art: './assets/img/dan_dan.jpg', 
        effectTag: 'A_HERO_SHIELD_LEFT',
        // 【防錯修正】：配合 engine.js 的戰鬥開局技能讀取
        onCombatEffect: 'A_HERO_SHIELD_LEFT' 
    },
    'FEI_FEI': {
        id: 'FEI_FEI',
        name: "飛飛",
        title: "半獸打工仔",
        hp: 30,
        tribe: "半獸族",
        skillName: "半夜加班",
        description: "商店刷新時，有 20% 機率獲得 1 靈石。",
        // --- 注入立繪路徑 ---
        art: './assets/img/fei_fei.jpg', 
        effectTag: 'A_HERO_REFRESH_GOLD'
    },
    'MO_MO': {
        id: 'MO_MO',
        name: "墨墨",
        title: "不死領主",
        hp: 30,
        tribe: "不死族",
        skillName: "死者甦生",
        description: "消耗 1 靈石，使一個友方棋子獲得「重生」。",
        skillCost: 1,
        // --- 注入立繪路徑 ---
        art: './assets/img/mo_mo.jpg', 
        effectTag: 'A_HERO_REBORN_ACTIVE'
    }
};
