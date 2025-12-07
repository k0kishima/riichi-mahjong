

import { HaiKindId } from './hai';

/**
 * Configuration for hand calculation
 */
export interface HandConfig {
    isTsumo: boolean;
    isRiichi: boolean;
    isIppatsu: boolean;
    isRinshan: boolean;
    isChankan: boolean;
    isHaitei: boolean;
    isHoutei: boolean;
    isDoubleRiichi: boolean;
    isTenhou: boolean;
    isChiihou: boolean;

    // Wind settings
    /** 27: East, 28: South, 29: West, 30: North */
    bakaze: number;
    /** 27: East, 28: South, 29: West, 30: North */
    jikaze: number;

    // Dora
    /** Indices of dora tiles */
    doraTiles: number[];
    /** Indices of ura dora tiles */
    uraDoraTiles: number[];
}



/**
 * Yaku Names
 * Defined as a const object for type safety and autocompletion.
 */
export const YakuName = {
    // Standard Yaku
    Tanyao: 'Tanyao',
    Pinfu: 'Pinfu',
    Riichi: 'Riichi',
    MenzenTsumo: 'MenzenTsumo',
    Ippatsu: 'Ippatsu',

    // Suit-based Yaku (染め手)
    Honitsu: 'Honitsu',
    Chinitsu: 'Chinitsu',

    // Yakuhai variations
    Yakuhai: 'Yakuhai', // Generic
    Haku: 'Haku',
    Hatsu: 'Hatsu',
    Chun: 'Chun',
    Bakaze: 'Bakaze',
    Jikaze: 'Jikaze',

    // Others
    Chiitoitsu: 'Chiitoitsu',
} as const;

export type YakuName = typeof YakuName[keyof typeof YakuName];

/**
 * Represents a Yaku (Winning condition)
 */
export interface Yaku {
    name: YakuName;
    hanOpen: number;
    hanClosed: number;
    isYakuman: boolean;
}

/**
 * Result of hand calculation
 */
export interface HandResponse {
    cost: {
        main: number;
        /** Payment from others for tsumo (dealer/non-dealer split) */
        additional?: number;
        total: number;
    } | null;
    han: number;
    fu: number;
    yaku: Yaku[];
    error: string | null;
    fuDetails: { reason: string; fu: number }[];
    /** The structure chosen for this result (useful for score calculation) */
    structure?: HandStructure;
}

/**
 * Result of Agari Check (Check if hand is checking)
 */
export interface AgariResult {
    isAgari: boolean;
    yaku: YakuName[];
    han: number;
    error?: string;
    structure?: HandStructure;
}


/**
 * Mentsu Types
 */
export const MentsuType = {
    /** Sequence (Shuntsu / 順子) e.g., 1-2-3 */
    Shuntsu: 'shuntsu',
    /** Triplet (Koutsu / 刻子) e.g., 1-1-1 */
    Koutsu: 'koutsu',
    /** Quad (Kantsu / 槓子) e.g., 1-1-1-1 */
    Kantsu: 'kantsu',
} as const;

export type MentsuType = typeof MentsuType[keyof typeof MentsuType];

/**
 * Mentsu (面子) - A set of 3 or 4 tiles.
 */
export interface Mentsu {
    type: MentsuType;
    /** The tiles forming the meld (HaiKindId) */
    tiles: HaiKindId[];
    /** 
     * Whether the meld is open/exposed (Naki / 鳴き).
     * - true: Open/Exposed (Chi, Pon, Min-Kan)
     * - false: Closed/Concealed (An-Kou, An-Kan)
     */
    isOpen: boolean;
}

/**
 * Head (雀頭) - A pair of tiles (Toitsu / 対子).
 */
export interface Head {
    /** [tile, tile] */
    tiles: HaiKindId[];
}

/**
 * A partial unit of a complete hand (Mentsu or Head).
 */
export type Block = Mentsu | Head;

/**
 * Represents a decomposed hand structure (4 mentsu + 1 head, or chitoitsu/kokushi)
 */
export interface HandStructure {
    /** Should be 4 for standard hand */
    mentsu: Mentsu[];
    /** should be 1 pair */
    head: Head;
    /** The waiting tile(s) indices - conceptually, usually just the win tile */
    wait: HaiKindId[];
    /** The tile that completed the hand */
    winTile: HaiKindId;
}
