// 職業定義
const CLASSES = {
    MAGE: { name: "法師", heroPower: "奧術衝擊", powerCost: 2 },
    WARRIOR: { name: "戰士", heroPower: "武裝整修", powerCost: 2 }
};

// 卡牌庫
const CARD_DB = {
    MAGE: [
        { id: 'm1', name: "見習法師", cost: 1, atk: 1, hp: 2, type: 'minion' },
        { id: 'm2', name: "火球術", cost: 4, atk: 6, hp: 0, type: 'spell' }
    ],
    WARRIOR: [
        { id: 'w1', name: "狂暴老兵", cost: 3, atk: 2, hp: 4, type: 'minion' },
        { id: 'w2', name: "重型斬擊", cost: 2, atk: 4, hp: 0, type: 'spell' }
    ],
    NEUTRAL: [
        { id: 'n1', name: "守衛機器人", cost: 2, atk: 2, hp: 3, type: 'minion', keyword: 'taunt' }
    ]
};
