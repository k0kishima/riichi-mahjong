# riichi-mahjong

Riichi Mahjong library for TypeScript.

## Features

- **Shanten calculation (向聴数)** - Calculate how many tiles away from tenpai
- **Hai utilities (牌ユーティリティ)** - Tehai string notation parser and validators
- **TypeScript support** - Full type definitions included

## Installation

```bash
npm install riichi-mahjong
```

## Usage

### Basic Example

```typescript
import { tehaiStringToHaiCounts, calculateShantenForRegularHand, AGARI_STATE } from 'riichi-mahjong';

// Convert tehai string to hai counts
const haiCounts = tehaiStringToHaiCounts("123m456p789s1122z");

// Calculate shanten number
const shanten = calculateShantenForRegularHand(haiCounts);

if (shanten === AGARI_STATE) {
  console.log("Agari!"); // -1 means winning hand
} else if (shanten === 0) {
  console.log("Tenpai!"); // 0 means ready to win
} else {
  console.log(`${shanten}-shanten`); // 1+ means tiles away from tenpai
}
```

### Tehai String Notation

Use standard notation where numbers are followed by suit letters:
- `m` = manzu (萬子, characters)
- `p` = pinzu (筒子, dots)
- `s` = souzu (索子, bamboo)
- `z` = jihai (字牌, honors: 1-7 = East, South, West, North, White, Green, Red)

Examples:
- `"123m456p789s1122z"` - 14 hai (complete hand)
- `"123456789m1234p"` - 13 hai (before draw)

## API Reference

### Types

#### `TehaiString`
String representation of a hand (13 or 14 hai).

#### `HaiCounts`
Array of length 34 representing count (0-4) for each hai kind.

#### `ShantenNumber`
Number representing shanten state:
- `-1` (AGARI_STATE) - Winning hand
- `0` - Tenpai (ready to win)
- `1+` - Number of tiles away from tenpai

### Functions

#### `tehaiStringToHaiCounts(tehai: TehaiString): HaiCounts`
Converts tehai string notation to hai counts array.

**Parameters:**
- `tehai` - Tehai string (must be 13 or 14 hai)

**Returns:** HaiCounts array

**Throws:** Error if tehai is invalid

**Example:**
```typescript
const counts = tehaiStringToHaiCounts("123m456p789s1122z");
```

#### `calculateShantenForRegularHand(haiCounts: HaiCounts): ShantenNumber`
Calculates shanten number for regular hand (4 mentsu + 1 toitsu pattern).

**Parameters:**
- `haiCounts` - HaiCounts array (must be 13 or 14 hai)

**Returns:** Shanten number (-1 to 8)

**Example:**
```typescript
const shanten = calculateShantenForRegularHand(counts);
```

#### `isTehaiString(str: string): boolean`
Type guard to check if a string is valid tehai notation.

#### `isHaiCounts(arr: readonly number[]): boolean`
Type guard to validate HaiCounts array.

#### `createHaiCounts(arr: readonly number[]): HaiCounts`
Creates validated HaiCounts from array.

### Constants

#### `AGARI_STATE`
Constant value `-1` representing a winning hand.

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
npm run format
```

## License

MIT
