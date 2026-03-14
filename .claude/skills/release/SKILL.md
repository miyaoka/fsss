---
name: release
description: "npm リリーススキル。キーワード: release, リリース, publish, バージョン, version。bumpp でバージョンバンプし、PR 作成・マージ後に GitHub Release で npm publish をトリガーする"
---

# npm リリース

bumpp によるバージョンバンプから npm publish までの一連のリリースフローを実行する。

---

## 事前確認

```bash
git status
git branch --show-current
```

- ワーキングツリーがクリーンであること
- デフォルトブランチ上であること（リリースブランチはここから作成する）

---

## リリースタイプの判断

### 前回リリースからのコミットを確認

```bash
git log "$(git describe --tags --abbrev=0)"..HEAD --oneline
```

### コミット内容からリリースタイプを判断

- breaking change や大きな機能追加 → major
- 新機能追加（feat） → minor
- バグ修正、リファクタ、ドキュメント → patch

### 現在のバージョンと次のバージョンを提示してユーザーに確認を取る

---

## リリースブランチ作成

```bash
git checkout -b release/v{next-version}
```

---

## バージョンバンプ

```bash
pnpm release --release {major|minor|patch} --yes --no-push
```

- `--no-push` をつけて push はブランチ push 時にまとめて行う
- bumpp が package.json 更新 → commit → tag を作成する

---

## プッシュと PR 作成

```bash
git push -u origin {branch-name} --follow-tags
```

- `--follow-tags` でタグも一緒に push する
- PR 作成は `/create-pr` スキルに委譲する

---

## マージ後: GitHub Release 作成

PR がマージされたら GitHub Release を作成する。

```bash
gh release create {tag} --generate-notes
```

- `publish.yml` ワークフローが `release: published` イベントで npm publish を実行する

---

## 注意事項

- main への直接 push は禁止。必ず PR 経由でマージする
- bumpp は `--no-push` で実行し、ブランチ push 時にタグも送る
