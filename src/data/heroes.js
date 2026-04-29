// heroes.js - 萬界戰場英雄定義庫

export const HEROES = {
    'LIN_FAN': {
        id: 'LIN_FAN',
        name: "林凡",
        title: "萬界廚神",
        hp: 30,
        skillName: "暖心熱飯",
        description: "每回合開始時，隨機賦予一名友方棋子 +1/+1。",
        // 對接效果 A 區：準備階段自動觸發
        effectTag: 'A_HERO_BUFF_RANDOM'
    },
    'DAN_DAN': {
        id: 'DAN_DAN',
        name: "丹丹",
        title: "劍影紅顏",
        hp: 30,
        skillName: "劍意通明",
        description: "戰鬥開始時，讓最左邊的棋子獲得「聖盾」。",
        // 對接效果 A 區：戰鬥開始時觸發
        effectTag: 'A_HERO_SHIELD_LEFT'
    },
    'FEI_FEI': {
        id: 'FEI_FEI',
        name: "飛飛",
        title: "半獸打工仔",
        hp: 30,
        tribe: "半獸族",
        skillName: "半夜加班",
        description: "商店刷新時，有 20% 機率獲得 1 靈石。",
        // 對接效果 A 區：刷新商店時判定
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
        // 對接效果 A 區：主動點擊觸發 (需要選擇目標)
        effectTag: 'A_HERO_REBORN_ACTIVE'
    }
};
