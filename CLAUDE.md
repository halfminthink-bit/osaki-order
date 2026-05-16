# CLAUDE.md — OSAKI 注文システム

このファイルは Claude Code がこのプロジェクトで作業する際の指針です。
**実装に着手する前に必ず最後まで読んでください。**

---

## このプロジェクトの目的

飲食店向けプロトタイプ。客が席のQRをスマホで読み、注文を送信。店員側ページで席別の注文一覧と状態管理ができる。注文データはDBに永続化され、後から経営判断に使える。

**インターン1day課題のため、今日中に「クライアントに見せて伝わる」状態に持っていく**ことが最優先。コードの美しさより、動作・公開・**MVPストーリーの体現**を優先。

---

## MVPの価値定義(これがこのプロジェクトの「なぜ」)

タブレット端末を廃止し、客のスマホを注文端末にすることで:

1. **客側**: 取り合い・呼び出しのストレスゼロ、追加注文しやすい(→客単価向上)
2. **店員側**: 席ごとの注文が一目で見え、会計時の照合が瞬時(→オペレーションミス削減)
3. **経営側**: 全店舗の注文データが1つのDBに集約、売れ筋・時間帯・客単価が定量で見える(→メニュー改定・店舗展開の判断材料)

**実装上の意味**: 「動く注文システム」を作るだけではなく、**注文がDBに正しく構造化されて残ること**、**席別・時間別・人数別で集計可能なデータ粒度を保つこと**が重要。UIの美しさより、データの設計と流れを優先する。

---

## ユーザー(作業者)について

- バックグラウンド: Python は書けるが TypeScript / React / Next.js は不慣れ
- 概念は理解しているが書き手としては遅い
- 文法レベルの細かい説明は不要、設計判断の理由は説明してほしい
- エラーが出たら自走より、状況を整理して相談したい

---

## ⚠️ 重要な前提・落とし穴(先に読む)

- **Next.js 16 系を使用。** App Router で動的ルート(`params`)が `Promise<{...}>` になっている。`await params` が必要。古い書き方(同期取得)を書かない。
- **pnpm 11 系の build script ブロック問題。** `sharp` / `unrs-resolver` / `msw` などのネイティブ系・postinstall系パッケージは `pnpm-workspace.yaml` の `allowBuilds` で明示制御。必要に応じて `ignoredBuiltDependencies` も使う。`pnpm approve-builds` の結果はグローバル設定でリポジトリには反映されないので使わない。
- **DB を叩く Server Component には `export const dynamic = 'force-dynamic';` を明示。** ビルド時クラッシュ防止。
- **既存の自動生成ファイルを安易に消さない。** 特に `lib/utils.ts`(shadcn の `cn` ヘルパー)や `lib/prisma.ts`(後で導入)は触らない。
- **Vercel Hobby プランの Deployment Protection。** プロジェクト作成直後は Settings → Deployment Protection の「Require Log In」が **ON のまま** だと全URLが 404 を返す。プロジェクト作成後すぐに **OFF にして Save**。

---

## 技術スタック

| レイヤ | 採用 |
|---|---|
| フレームワーク | Next.js 16 (App Router) + TypeScript |
| UI / スタイル | React 19 + Tailwind CSS v4 + shadcn/ui (Radix/Nova preset) |
| パッケージマネージャ | **pnpm**(npm/yarn は使わない) |
| DB | Neon PostgreSQL(後ほど導入) |
| ORM | Prisma(後ほど導入) |
| デプロイ | Vercel(GitHub 連携で自動デプロイ済み: https://osaki-order-fu2c.vercel.app) |

---

## ディレクトリ構成

```
app/                  # Next.js App Router ルート
  page.tsx            # 客側: 注文トップ(メニュー一覧)
  order/              # 注文関連サブページ(後で)
  staff/              # 店員側: 注文受信一覧(後で)
  api/                # Route Handler(後で。POST /api/orders など)
components/
  ui/                 # shadcn/ui コンポーネント (Button, Card, Input, ...)
lib/
  utils.ts            # shadcn の cn ヘルパー(変更不可)
  menu.ts             # メニューデータ(後で。UIから分離)
  prisma.ts           # PrismaClient シングルトン(後で。変更不可)
public/               # 静的アセット
```

---

## データモデル(全タスクで一貫してこの形で扱う)

### MenuItem(メニュー1品)
```typescript
type MenuItem = {
  id: string                // "ramen-001"
  name: string              // "醤油ラーメン"
  price: number             // 980 (円、税込)
  category: MenuCategory    // "main" | "noodles" | "side" | "drink" | "dessert"
  description?: string
  imageUrl?: string         // 未設定なら絵文字で代用
  isSoldOut: boolean
}

type MenuCategory = "main" | "noodles" | "side" | "drink" | "dessert"
```

### Order(1回の注文確定 = 1レコード)
```typescript
type Order = {
  id: string
  tableNumber: number       // QRパラメータから取得
  partySize: number         // 入店時に客が入力(1〜10人想定)
  items: OrderItem[]
  totalPrice: number        // items の合計を保存(後で集計しやすい)
  status: OrderStatus       // "received" | "preparing" | "served" | "canceled"
  isPaid: boolean           // 会計済フラグ。true になると /staff/table と /order/status から消える(席回転対応)
  createdAt: Date           // 時間帯分析に使う
  updatedAt: Date
}

// preparing は DB enum に残すが、UI からは使わない(将来の復活余地)
type OrderStatus = "received" | "preparing" | "served" | "canceled"
```

### OrderItem(注文の中の1品)
```typescript
type OrderItem = {
  menuItemId: string
  menuItemName: string      // スナップショット(メニュー名が変わっても過去注文を正しく表示)
  price: number             // スナップショット(価格改定対応)
  quantity: number
}
```

**スナップショット設計の理由**: メニューを後で値上げ・改名しても、過去の注文履歴は当時の名前と価格で残り続ける。経営ダッシュボードや会計記録の整合性を保つため。これは外せない設計。

---

## 動かすコマンド

```bash
pnpm install          # 依存追加
pnpm dev              # 開発サーバー(http://localhost:3000)
pnpm build            # 本番ビルド(Vercel ビルド前に手元で確認可)
pnpm lint             # ESLint
```

DB 導入後に追加予定:
```bash
pnpm prisma db push   # スキーマ反映
pnpm prisma studio    # DB GUI 確認
pnpm prisma generate  # クライアント生成
```

---

## 機能要件

### Must(必ず完成させる - MVP の核)
1. 客がスマホでアクセスし、テーブル番号 + 人数を入れてからメニューを見る
2. メニューはジャンル別表示、各品に「+追加」ボタン
3. 注文カゴで合計金額が見える
4. 「注文確定」を押すと **DB に保存される**(Order + OrderItem)
5. 店員側ページで注文一覧が見える、ステータス変更ができる
6. 店員ページで「テーブル番号 → そのテーブルの注文と合計」が見える(会計用)
7. 会計済管理(isPaid)による席回転対応: **会計はテーブル単位の一括操作**。/staff/table/[n] の「会計する」ボタンで `POST /api/tables/[n]/checkout` を叩き、未払い全注文を一括 isPaid: true に。個別の isPaid 操作は禁止(誤操作防止)。会計後は /staff/table と /order/status から除外され、同席番号の次客注文と混ざらない

### Should(時間が許せば)
- 経営ダッシュボード(`/dashboard`): 売れ筋ランキング、時間帯別、客単価
- 品切れメニューの追加禁止 + エラー表示
- 割り勘機能(`totalPrice / partySize` を表示)

### やらないこと(明示的な禁止)
- **ログイン / 認証**は実装しない。店員ページも公開URLでOK(プロトタイプ前提、本番では追加する旨をプレゼンで言う)
- 決済
- リアルタイム更新(WebSocket等)。リロードで十分
- テストコード
- AI画像生成。メニュー画像は**絵文字(🍜🍣🍻🍰)で代用**。時間があれば最後に差し替え
- 過剰なコンポーネント分割、過剰な抽象化
- ダークモード対応・凝ったデザインシステム
- レスポンシブのPC最適化(スマホ幅で動けばOK、PC表示は `max-w-md` でセンタリングだけ)

---

## デザイン方針

- **スマホ幅 375px 基準**。PC表示は `max-w-md mx-auto` でセンタリング
- アクセントカラーは**暖色1色**(amber-600 or red-600)。多用しない
- ボタン高さ 48px 以上(指で押しやすく)
- カードは縦に並べる(横スクロールは作らない)
- メニュー画像は絵文字で十分

---

## 作業ルール

### 1. 小さく刻む
1機能ずつ実装し、ローカルで動作確認 → コミット → push → Vercelデプロイ成功を確認してから次へ。「まとめて実装してから push」をやらない。

### 2. 既存コードを尊重
自動生成された初期ファイルや shadcn が生成した `components/ui/*` を必要以上に書き換えない。必要な箇所だけ差分で。

### 3. データモデルから外れない
上で定義した型(MenuItem / Order / OrderItem)を全タスクで一貫して使う。途中で勝手にフィールドを足したり名前を変えない。必要なら相談する。

### 4. 不明点は止まる
仕様判断に迷ったら勝手に進めず、3行以内で状況を報告して指示を仰ぐ。「とりあえず動くコード」で進めない。

### 5. 検証手段
何か実装したら以下のいずれかで確認してから完了扱いにする:
- `pnpm dev` で画面が出る
- `pnpm build` がエラー0で通る
- Vercel のデプロイが Ready になる

### 6. コミット粒度
機能単位でコミット、メッセージは英語の短文(`feat: add menu list`, `feat: persist orders to db` など)。

---

## 詰まったときの動き

エラーや判断に迷ったら、勝手に進めず以下のいずれか:
- ユーザーに状況を3行以内で報告して指示を仰ぐ
- 公式ドキュメント(Next.js 16 / Prisma / Vercel / Neon)を参照する

**「とりあえず動くコード」を投げ続けないこと。** わからないときは止まる。