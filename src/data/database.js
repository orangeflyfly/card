// database.js - 萬界戰場資料庫總匯

// 這裡預留未來從獨立檔案匯入的空間
// import { humanCards } from './tribes/human.js';
// import { beastCards } from './tribes/beast.js';

// 目前先將基本棋子定義在此，後續我們可以逐一拆分出種族檔案
const ALL_CARDS = [
    // --- 一星棋子 (Tier 1) ---
    { id: 'h1', name: "見習武者", tier: 1, atk: 2, hp: 1, tribe: "凡人", cost: 3 },
    { id: 'i1', name: "見習仙童", tier: 1, atk: 1, hp: 2, tribe: "仙修", cost: 3, effectTag: 'A3_GENERATE_GOLD' }, // 戰吼賺錢
    { id: 'b1', name: "小狐妖", tier: 1, tier: 1, atk: 1, hp: 1, tribe: "妖獸", cost: 3, effectTag: 'B1_SUMMON_TOKEN' }, // 亡語召喚
    { id: 'm1', name: "機關木人", tier: 1, atk: 1, hp: 3, tribe: "機關", cost: 3, keyword: 'TAUNT' }, // 嘲諷
    { id: 'u1', name: "復甦小鬼", tier: 1, atk: 2, hp: 1, tribe: "不死", cost: 3 },

    // --- 二星棋子 (Tier 2) ---
    { id: 'h2', name: "雲遊探險家", tier: 2, atk: 3, hp: 3, tribe: "凡人", cost: 3, effectTag: 'A2_BUFF_ALL_TRIBE' }, // 戰吼全體加成
    { id: 'i2', name: "餐館小二", tier: 2, atk: 2, hp: 4, tribe: "仙修", cost: 3, keyword: 'HEAL_AURA' }, // 配合林凡的廚師主題
    { id: 'hb1', name: "半獸監工", tier: 2, atk: 4, hp: 2, tribe: "半獸", cost: 3 }, // 配合飛飛主題
    { id: 'u2', name: "墓園守衛", tier: 2, atk: 2, hp: 5, tribe: "不死", cost: 3, keyword: 'TAUNT' }
];

// 按照星級分類，方便主程式隨機抽取商店卡牌
export const CARD_DB = {
    TIER_1: ALL_CARDS.filter(c => c.tier === 1),
    TIER_2: ALL_CARDS.filter(c => c.tier === 2),
    TIER_3: ALL_CARDS.filter(c => c.tier === 3) || [],
    // 未來可擴充至 TIER_6
};

// 匯出種族清單，供羈絆系統使用
export const TRIBES = ["凡人", "仙修", "妖獸", "機關", "不死", "半獸"];
