// database.js - 萬界戰場 (Auto Battler) 棋子資料庫
// 融合東方水墨奇幻與現代戲劇性風格

// 英雄定義 (原本的職業，現在變成開局可選的英雄，擁有不同被動技能)
export const HEROES = {
    MAGE: { id: 'h1', name: "萬界尋仙·林凡", skill: "靈力共鳴", description: "招募仙修時，隨機賦予友方仙修 +1/+1", hp: 30 },
    WARRIOR: { id: 'h2', name: "劍影紅顏·丹丹", skill: "劍心通明", description: "戰鬥開始時，最左邊的友方單位獲得 +2 攻擊力", hp: 30 }
};

// 萬界戰場棋子庫 (依星級區分，移除所有法術牌)
// 屬性說明: cost 固定為招募費用, tribe 為種族標籤
export const CARD_DB = {
    // 一星棋子 (Tier 1) - 遊戲初期可招募
    TIER_1: [
        { id: 't1_1', name: "見習仙童", cost: 3, atk: 1, hp: 2, type: 'minion', tribe: '仙修', art: "https://picsum.photos/id/1062/120/90", description: "販賣時額外獲得 1 靈石" },
        { id: 't1_2', name: "狂暴武者", cost: 3, atk: 2, hp: 1, type: 'minion', tribe: '凡人', art: "https://picsum.photos/id/292/120/90" },
        { id: 't1_3', name: "迷途小妖", cost: 3, atk: 1, hp: 1, type: "minion", tribe: '妖獸', art: "https://picsum.photos/id/1011/120/90", description: "死亡時：召喚一個 1/1 的小妖" },
        { id: 't1_4', name: "機關守衛", cost: 3, atk: 1, hp: 3, type: 'minion', tribe: '機關', keyword: 'taunt', art: "https://picsum.photos/id/1062/120/90", description: "嘲諷" }
    ],
    
    // 二星棋子 (Tier 2) - 遊戲中期可招募
    TIER_2: [
        { id: 't2_1', name: "破陣先鋒", cost: 3, atk: 3, hp: 4, type: "minion", tribe: '凡人', art: "https://picsum.photos/id/1059/120/90" },
        { id: 't2_2', name: "雲遊探險家", cost: 3, atk: 3, hp: 3, type: "minion", tribe: '凡人', art: "https://picsum.photos/id/386/120/90", description: "戰吼：賦予一個友方單位 +1/+1" },
        { id: 't2_3', name: "餐館小二", cost: 3, atk: 2, hp: 4, type: "minion", tribe: '仙修', keyword: 'heal_aura', art: "https://picsum.photos/id/493/120/90", description: "戰鬥開始：相鄰友軍生命 +2" } // 萬界餐館概念轉化
    ],

    // 三星棋子 (Tier 3) - 遊戲中後期可招募
    TIER_3: [
        { id: 't3_1', name: "遠古巨魔", cost: 3, atk: 6, hp: 6, type: "minion", tribe: '妖獸', art: "https://picsum.photos/id/652/120/90" },
        { id: 't3_2', name: "奧術石像", cost: 3, atk: 4, hp: 8, type: "minion", tribe: '機關', keyword: 'taunt', art: "https://picsum.photos/id/177/120/90", description: "嘲諷" }
    ]
};
