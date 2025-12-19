# コーディング規約 (Code Style & Conventions)

## インポートパス (Import Paths)
**ルール:** `src/` 内では **相対パス** (`../utils` 等) を使用してください。
**理由:** `tsc` 標準ビルドでの互換性確保（エイリアス解決不要化）と、過度なネスト構造の防止。

## Null vs Undefined
**ルール:** `undefined` を排他的に使用してください（`null` は避ける）。
**理由:** JSエンジンのデフォルト値との統一。[Reference](https://typescriptbook.jp/reference/values-types-variables/undefined-vs-null)

## Enum 型の実装
**ルール:** `enum` ではなく **const オブジェクト + Union 型** を使用してください。
```typescript
// ✅ 推奨
export const Direction = { Up: 0, Down: 1 } as const;
export type Direction = typeof Direction[keyof typeof Direction];
```
**理由:** バンドルサイズ削減（Tree-shaking有効化）と型安全性の向上。

## 命名規約 (Naming Conventions)
### ドメイン用語のローマ字化
**ルール:** 麻雀用語は **ローマ字** を使用してください（例: `Tehai`, `Shanten`, `Agari`）。
**理由:** 英語翻訳による意味の曖昧さを排除し、ドメイン概念を正確に表現するため。

### 関数名パターン
**ルール:** `英動詞` + `ローマ字名詞` の形式としてください（例: `calculateAgari`, `decomposeTehai`）。
**理由:** 操作（英語）と対象（ドメイン語）を明確に区別し、可読性を高めるため。

## ドキュメンテーション (Documentation)
### ユビキタス言語の明記
**ルール:** TSDoc コメント内には、対応する**ユビキタス言語（日本語のドメイン用語）**を必ず明記してください。
**理由:** `grep "牌種ID"` のように日本語で検索可能にすることで、ドメイン概念の定義場所を特定しやすくし、用語の揺らぎを防ぐため。

## 型定義 (Type Definitions)
### Interface vs Type
**ルール:** オブジェクトの型定義には、可能な限り `interface` を使用してください。`type` エイリアスは、Union型、Tuple型、または `interface` よりも著しく簡潔に記述できる場合にのみ使用してください。
**理由:**
- **パフォーマンス (遅延評価):** TypeScriptコンパイラは `interface` を遅延評価するため、コンパイル速度の向上やエディタの応答性改善に寄与します。対して `type` は宣言時に再帰的に解決・展開されるため、複雑な型でコストが高くなる傾向があります。
- **エラーメッセージ:** 多くの場合、`interface` の方がより簡潔で分かりやすいエラーメッセージを提供します。これは、`type` がコンパイル処理でインライン展開され、エラーメッセージに定義名ではなく構造が表示されてしまうためです。
- **補足 (Declaration Merging):** `interface` は宣言マージが可能（オープン）ですが、`type` は閉じた定義です。本プロジェクトでは主にパフォーマンスとエディタ体験（DX）の観点から `interface` を推奨します。意図しないマージには注意してください。
