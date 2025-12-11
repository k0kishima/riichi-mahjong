# Naming Conventions (命名規約)

This project adopts a specific naming convention to ensure consistency and clarity, especially regarding Mahjong domain terminology.

## Core Principle: Japanese Domain Terms in Romanization

Riichi Mahjong has a rich set of terminology that is best expressed in its native Japanese format (Romanized) rather than loose English translations. We prioritize "Ubiquitous Language" (DDD) that matches the mental model of Mahjong players and developers.

- **DO**: Use Romanized Japanese for domain concepts (e.g., `Machi`, `Tehai`, `Shanten`, `Agari`).
- **DO NOT**: Use ambiguous English translations (e.g., `Wait`, `Hand`, `Melds`).

## Naming Pattern: English Verb + Romanized Noun

For functions and methods, we use English verbs to describe the action, followed by the Romanized domain object.

- `detectAgari` (not `kenshutsuAgari`)
- `calculateMachi` (not `calculateWaits`)
- `decomposeTehai` (not `decomposeHand`)

## Terminology Mapping

| Concept | Recommended Term | Deprecated / Avoid | Notes |
| :--- | :--- | :--- | :--- |
| **牌** | `Hai` | `Tile` | `HaiId`, `HaiCounts` |
| **手牌** | `Tehai` | `Hand` | The 13 (or 14) tiles in hand. |
| **待ち** | `Machi` | `Wait` | The tile(s) needed to win. |
| **和了** | `Agari` | `Win` | Winning state. |
| **向聴** | `Shanten` | - | Distance to Tenpai. |
| **副露** | `Furo` | `Meld` | Open sets (Pon, Chi, Kan). `Mentsu` covers both open and closed sets. |
| **面子** | `Mentsu` | `Set`, `Group` | A valid set of 3 (or 4) tiles. |
| **対子** | `Toitsu` | `Pair` | A pair of identical tiles. |
| **雀頭** | `Jantou` | `Head` | The pair needed for the hand structure. |
| **和了牌**| `AgariHai` | `WinTile` | The specific tile that completes the hand. |
| **ドラ** | `Dora` | `BonusTile` | |

## Project Structure

Modules are named after their domain concept in Romanized Japanese.

- `src/agari/`
- `src/machi/` (was `wait`)
- `src/hai/`
- `src/yaku/`
