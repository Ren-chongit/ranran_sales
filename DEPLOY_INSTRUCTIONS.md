# GitHub Pages デプロイ手順

## 1. GitHubリポジトリの作成

1. GitHub.comにログイン
2. 「New repository」をクリック
3. リポジトリ名を入力（例：`sales-dashboard`）
4. **Public**を選択（GitHub Pagesは無料プランではPublicリポジトリのみ）
5. 「Create repository」をクリック

## 2. 設定ファイルの更新

以下の2つのファイルで `YOUR_USERNAME` と `YOUR_REPOSITORY_NAME` を実際の値に変更してください：

### package.json
```json
"homepage": "https://あなたのユーザー名.github.io/リポジトリ名",
```

### vite.config.ts
```typescript
base: process.env.NODE_ENV === 'production' ? '/リポジトリ名/' : '/',
```

## 3. 依存関係のインストール

```bash
cd web_app
npm install
```

## 4. GitHubにプッシュ

```bash
# Gitリポジトリの初期化
git init
git add .
git commit -m "Initial commit: Sales dashboard with authentication"

# GitHubリポジトリとの連携
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
git push -u origin main
```

## 5. GitHub Pagesの設定

1. GitHubリポジトリページで「Settings」タブをクリック
2. 左サイドバーから「Pages」を選択
3. Source: 「Deploy from a branch」を選択
4. Branch: 「gh-pages」を選択
5. 「Save」をクリック

## 6. デプロイ実行

```bash
npm run deploy
```

## 7. 公開URLの確認

- URL: `https://あなたのユーザー名.github.io/リポジトリ名`
- デプロイには2-3分かかります
- 初回デプロイ後、Settings > Pagesでステータスを確認

## 認証情報

- **デフォルトパスワード**: `sales2025`
- **変更方法**: `.env`ファイルを作成して `VITE_APP_PASSWORD=新しいパスワード` を設定

## データファイルの配置

売上データJSONファイルは以下に配置してください：
```
web_app/public/data/YYYY-MM-DD.json
```

## 注意事項

- リポジトリは**Public**である必要があります
- パスワード認証は簡易的なものです（セキュリティが重要な場合は他の方法を検討）
- データファイルもPublicに公開されます

## トラブルシューティング

- デプロイエラーが出る場合: `npm run build` でローカルビルドを確認
- ページが表示されない場合: package.jsonとvite.config.tsの設定を再確認
- 404エラーの場合: GitHub Pages設定でブランチが正しく設定されているか確認