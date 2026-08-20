# RecallLog

**学んだことを記録すると、忘却曲線に沿って「次にいつ復習すればいいか」を自動で管理してくれる学習ログアプリです。**

編入試験の勉強をしている中で、「今日は何を勉強したか」「あの範囲はいつ復習すべきか」を
自分の頭とノートだけで管理するのに限界を感じたのが、このアプリを作ったきっかけです。
毎日の学習を書き留めるだけで、復習のタイミングを勝手に組み立ててくれる——
そういう相棒がほしくて作りました。

---

## 何ができるのか

- **学習ログを記録する** — その日に学んだこと（見出し・詳細・タグ・学習日）を残す
- **復習日を自動で決めてくれる** — 記録すると、忘却曲線に沿って次の復習日が自動でセットされる
- **今日やる復習がひと目でわかる** — ダッシュボードに「今日の復習件数」「正答率」「復習回数」が並ぶ
- **その場で復習できる** — 「覚えていた / 忘れていた」を押すだけ。結果に応じて次回の復習日が調整される
- **カレンダーで先の予定を見渡せる** — いつ・何を復習するかを月表示で確認できる（やり忘れは赤で表示）
- **検索とタグで整理できる** — 科目やキーワードで過去の学習ログを横断検索

---

## 忘却曲線にどう沿っているか

人の記憶は時間とともに薄れますが、**忘れかけた頃に復習を繰り返す**と定着が一気に良くなります。
これを「間隔反復（Spaced Repetition）」と呼びます。RecallLog はこの考え方を素直に実装しています。

学習を記録すると、次の間隔で復習日が組まれていきます。

```
学習 → 1日後 → 3日後 → 7日後 → 14日後 → 30日後 →（習得済み）
```

復習のときの操作はシンプルに 2 択です。

- **覚えていた** → 段階が 1 つ進み、次の復習が先に延びる。最後まで到達すると「習得済み」になる
- **忘れていた** → 段階が 1 つ戻り、翌日にもう一度出てくる

この間隔は将来自分で調整したくなると思ったので、`src/libs/srs.ts` に定数として切り出し、
復習日の計算ロジックもそこに集約しています。

---

## 使っている技術

いつでもどこからでも（スマホでもPCでも）使えることを最優先に、次の構成を選びました。

- **Next.js（App Router）/ React / TypeScript** — フロントとAPIを一つのコードベースでまとめられるため
- **Prisma + PostgreSQL** — 型安全にDBを扱えて、無料のクラウドPostgres（Neon）でそのまま公開できるため
- **jose（JWT）/ bcryptjs** — 認証とパスワード保護を自前で堅く実装するため
- **zod + react-hook-form** — 入力チェックをクライアントとサーバの両方で揃えるため

### 自分の学習記録を守るための作り

学習の記録は自分だけのものなので、他人に見られない・触られないことを大事にしました。

- パスワードは **bcrypt** でハッシュ化して保存し、平文は一切残さない
- ログイン状態は **JWT を HttpOnly Cookie に載せて** 管理し、JavaScript からトークンを読めないようにして XSS に備える（`HttpOnly` / `Secure` / `SameSite=Strict`）
- 学習ログの取得・編集・削除・復習は、**必ず「本人のデータか」を確認**してから実行する
- ログインの連続失敗にはレートリミットをかけ、総当たりを防ぐ
- `next.config.ts` で CSP などのセキュリティヘッダを設定

---

## ローカルで動かす

### 必要なもの

- Node.js 18 以上
- 無料のPostgreSQL（[Neon](https://neon.tech) など）

### 手順

```bash
# 1. 依存パッケージをインストール
npm install

# 2. 環境変数を用意
cp .env.example .env
#   DATABASE_URL … Neon で作った接続文字列を貼る
#   JWT_SECRET   … 16文字以上のランダムな文字列（例: openssl rand -base64 32）

# 3. データベースにテーブルを作成
npm run db:push

# 4. 初期データ（サンプルの学習ログ入りアカウント）を投入
npm run seed

# 5. 起動
npm run dev
```

<http://localhost:3000> を開き、下のアカウントでログインすると、
サンプルの学習ログが入った状態でダッシュボードを試せます。

| メールアドレス       | パスワード        | 備考                             |
| -------------------- | ----------------- | -------------------------------- |
| `user01@example.com` | `User01#Passw0rd` | サンプル学習ログ入り（今日の復習あり） |
| `user02@example.com` | `User02#Passw0rd` | データが分離されていることの確認用 |
| `admin@example.com`  | `Admin#Passw0rd`  | 管理用アカウント                 |

> `.env` は秘密情報を含むためリポジトリに含めていません（`.gitignore` で除外）。
> 配布しているのは `.env.example` のみです。

---

## 公開する（Vercel + Neon）

いつでもアクセスできるように、Vercel にデプロイして本番URLを立てられます。

1. **Neon でデータベースを用意する**
   [neon.tech](https://neon.tech) でプロジェクトを作成し、表示される接続文字列
   （`postgresql://...?sslmode=require`）を控える。

2. **GitHub にこのコードを push する**
   自分のリポジトリにアップロードする。

3. **Vercel にインポートする**
   [vercel.com](https://vercel.com) で「New Project」からリポジトリを選ぶ。
   環境変数に次の 2 つを設定する。
   - `DATABASE_URL` … Neon の接続文字列
   - `JWT_SECRET` … 16文字以上のランダムな文字列

4. **デプロイ**
   デプロイが完了すると本番URLが発行される。初回だけ、ローカルから本番DBへ
   テーブルを作成しておく。
   ```bash
   # .env の DATABASE_URL を Neon の本番用に設定した状態で
   npm run db:push
   npm run seed   # ← 初期アカウントが不要なら省略可
   ```

   以降は、発行されたURLをスマホでもPCでも開けば、ログインして使えます。

> ビルド時に `prisma generate` が自動実行されるよう設定してあるので、
> Vercel 側での追加設定は基本的に不要です。

---

## 画面

> スクリーンショットは `docs/images/` に置いています。

| 画面           | ファイル                        |
| -------------- | ------------------------------- |
| トップ         | `docs/images/01-home.png`       |
| サインアップ   | `docs/images/02-signup.png`     |
| ダッシュボード | `docs/images/03-dashboard.png`  |
| 学習ログ       | `docs/images/04-logs.png`       |
| カレンダー     | `docs/images/05-calendar.png`   |
| アカウント     | `docs/images/06-account.png`    |

![ダッシュボード](docs/images/03-dashboard.png)

![カレンダー](docs/images/05-calendar.png)

---

## ディレクトリ構成

```
recalllog/
├─ prisma/
│  ├─ schema.prisma        # User / StudyLog / Review など
│  └─ seed.ts              # 初期アカウント＋サンプル学習ログ
├─ src/
│  ├─ config/auth.ts       # 認証・レートリミットの設定値
│  ├─ libs/
│  │  ├─ prisma.ts         # PrismaClient（サーバレス対応のシングルトン）
│  │  ├─ passwordStrength.ts
│  │  └─ srs.ts            # 忘却曲線（間隔反復）の計算ロジック
│  └─ app/
│     ├─ _types/           # zod スキーマ・型定義
│     ├─ _actions/         # サインアップ（Server Actions）
│     ├─ _contexts/        # ログイン状態の管理（自動トークン更新）
│     ├─ _hooks/           # 認証付き fetch
│     ├─ _components/      # Header / PasswordField / StrengthMeter
│     ├─ api/
│     │  ├─ _helper/       # jwt / cookies / verifyAuth
│     │  ├─ login, logout, refresh, me, password, login-history
│     │  ├─ study-logs, study-logs/[id], study-logs/[id]/review
│     │  ├─ stats          # ダッシュボードの集計
│     │  ├─ calendar       # 復習カレンダー
│     │  └─ admin/…        # 管理用
│     ├─ login, signup
│     ├─ member/           # dashboard / logs / calendar / account
│     └─ admin/
└─ next.config.ts          # セキュリティヘッダ（CSP など）
```

---

## これから足したいこと

- 復習間隔を自分好みに設定できるようにする（今は固定の 1・3・7・14・30 日）
- 「今日の復習があります」をメールやプッシュで通知する
- 学習時間や連続日数（ストリーク）の記録
- 記憶度に応じて間隔を動的に変える方式（SM-2 など）への発展
