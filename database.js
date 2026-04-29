// database.js - 萬界裂痕 (The Omni Rift) 卡牌資料庫
// 融合東方水墨奇幻與現代戲劇性風格

// 職業定義
const CLASSES = {
    MAGE: { name: "奧法師", heroPower: "奧術衝擊", powerCost: 2 },
    WARRIOR: { name: "破陣者", heroPower: "武裝整修", powerCost: 2 }
};

// 卡牌庫
const CARD_DB = {
    MAGE: [
        { id: 'm1', name: "見習法師", cost: 1, atk: 1, hp: 2, type: 'minion', art: "https://picsum.photos/id/1062/120/90" },
        { id: 'm2', name: "奧術彈", cost: 1, atk: 3, hp: 0, type: "spell", art: "https://picsum.photos/id/102/120/90" }, 
        { id: 'm3', name: "火球術", cost: 4, atk: 6, hp: 0, type: 'spell', art: "https://picsum.photos/id/674/120/90" },
        { id: 'm4', name: "奧術巨人", cost: 8, atk: 8, hp: 8, type: "minion", art: "https://picsum.photos/id/177/120/90" },
        // 專屬傳說卡
        { id: 'm-legend', name: "萬界尋仙·林凡", cost: 6, atk: 5, hp: 5, type: 'minion', keyword: 'spell_damage', art: "https://picsum.photos/id/332/120/90", description: "法術傷害+2" }
    ],
    WARRIOR: [
        { id: 'w1', name: "狂暴老兵", cost: 3, atk: 2, hp: 4, type: 'minion', art: "https://picsum.photos/id/292/120/90" },
        { id: 'w2', name: "重型斬擊", cost: 2, atk: 4, hp: 0, type: 'spell', art: "https://picsum.photos/id/447/120/90" },
        { id: 'w3', name: "斬殺", cost: 1, atk: 4, hp: 0, type: "spell", art: "https://picsum.photos/id/982/120/90" },
        { id: 'w4', name: "破陣先鋒", cost: 5, atk: 5, hp: 4, type: "minion", art: "https://picsum.photos/id/1059/120/90" },
        // 專屬傳說卡
        { id: 'w-legend', name: "劍影紅顏·丹丹", cost: 5, atk: 6, hp: 4, type: 'minion', keyword: 'charge', art: "https://picsum.photos/id/349/120/90", description: "衝鋒" }
    ],
    NEUTRAL: [
        { id: 'n1', name: "守衛機器人", cost: 2, atk: 2, hp: 3, type: 'minion', keyword: 'taunt', art: "https://picsum.photos/id/1062/120/90", description: "嘲諷" },
        { id: 'n2', name: "小卒", cost: 1, atk: 1, hp: 1, type: "minion", art: "https://picsum.photos/id/1011/120/90" }, 
        { id: 'n3', name: "路人探險家", cost: 3, atk: 3, hp: 3, type: "minion", art: "https://picsum.photos/id/386/120/90" },
        { id: 'n4', name: "遠古巨魔", cost: 7, atk: 7, hp: 7, type: "minion", art: "https://picsum.photos/id/652/120/90" },
        // 特殊卡
        { id: 'n-special', name: "萬界餐館", cost: 3, atk: 0, hp: 0, type: 'spell', keyword: 'heal', art: "https://picsum.photos/id/493/120/90", description: "穿越萬界，只為一頓熱飯" }
    ]
};
