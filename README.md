# riichi-mahjong

A TypeScript library for Japanese Riichi Mahjong (立直麻雀) calculations.

## Features

- **Shanten calculation (向聴数)** - Calculate how many tiles away from tenpai
- **Wait calculation (待ち牌)** - Calculate waiting tiles for tenpai hands
- **MPSZ notation support** - Standard notation parser with Red Five support
- **Full TypeScript support** - Complete type definitions included

## Installation

```bash
npm install riichi-mahjong
```

## Quick Start

```typescript
import { 
  mpszStringToHaiCounts, 
  calculateShantenForRegularHand,
  calculateWaits,
  AGARI_STATE 
} from 'riichi-mahjong';

// Parse hand notation (MPSZ format)
const hand = mpszStringToHaiCounts("123m456p789s1111z"); // 13 tiles

// Calculate shanten (tiles away from tenpai)
const shanten = calculateShantenForRegularHand(hand);

if (shanten === AGARI_STATE) {
  console.log("Agari! (winning hand)");
} else if (shanten === 0) {
  console.log("Tenpai! (ready to win)");
  
  // Calculate waiting tiles
  const waits = calculateWaits(hand);
  console.log("Waiting for:", waits); // Array of tile indices (0-33)
} else {
  console.log(`${shanten}-shanten`);
}
```

## MPSZ Notation

Standard notation where numbers are followed by suit letters:
- `m` = manzu (萬子, characters)
- `p` = pinzu (筒子, dots)
- `s` = souzu (索子, bamboo)
- `z` = jihai (字牌, honors: 1-7 = East, South, West, North, White, Green, Red)
- `0` = red five (赤ドラ, treated as 5 for calculations)

**Examples:**
- `"123m456p789s1111z"` - 13 tiles
- `"11123456788999s"` - 14 tiles (winning hand)
- `"055m456p789s1111z"` - 13 tiles with red fives

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
npm run format
```

## License

MIT
