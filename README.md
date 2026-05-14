# 菫青の大学入試数学資料保管庫

数学のPDF資料を整理して公開する、GitHub Pages向けの静的サイトです。
HTML、CSS、JavaScriptだけで動作し、資料一覧は `data/materials.json` から自動表示します。

## ファイル構成

```text
.
├── index.html
├── materials.html
├── about.html
├── contact.html
├── css/
│   └── style.css
├── js/
│   └── materials.js
├── data/
│   └── materials.json
├── files/
│   └── PDF資料を置く
└── assets/
    └── 画像素材
```

## GitHub Pagesで公開する手順

1. このフォルダの内容をGitHubリポジトリに置きます。
2. GitHubのリポジトリ画面で `Settings` を開きます。
3. 左メニューの `Pages` を開きます。
4. `Build and deployment` の `Source` を `Deploy from a branch` にします。
5. このリポジトリでは公開用に `gh-pages` ブランチを使います。`Branch` を `gh-pages`、フォルダを `/root` にして保存します。
6. 数分後、GitHub PagesのURLから `index.html` が表示されます。

## ローカルで確認する手順

`materials.html` とトップページは `data/materials.json` を読み込むため、ファイルを直接開くよりローカルサーバー経由で確認してください。

```bash
python3 -m http.server 8000
```

起動後、ブラウザで次のURLを開きます。

```text
http://localhost:8000/
```

## PDF資料を追加する方法

1. PDFファイルを `files/` フォルダに置きます。
2. `data/materials.json` に資料情報を1件追加します。
3. GitHubへ反映すると、`materials.html` の一覧とトップページの資料数に自動表示されます。

Google Driveなど外部サービスの共有リンクから追加したPDFも、公開時はDriveへ直接リンクせず、ダウンロードしたPDFを `files/` で管理する形に統一します。
これにより、GitHub Pages上の資料リンクはすべてサイト内の相対パスで完結します。

PDFファイル名は、英数字・小文字・ハイフンを使った名前を推奨します。
例: `linear-algebra-vectors.pdf`, `calculus-limits.pdf`

リンクは相対パスで `./files/ファイル名.pdf` と書きます。

## 今後の更新方法

このサイトは静的サイトなので、GitHub Pages上に「自分だけが見られるアップロード画面」を安全に置くことはできません。
管理画面でPDFを直接アップロードしてJSONを書き換えるには、認証付きのサーバー、CMS、GitHub Appなどが別途必要です。

現状でおすすめの運用は次のどちらかです。

### 1. Codexに追加を頼む

資料を追加したいときは、次のように依頼してください。

```text
このPDFをサイトに追加して。
PDF: /path/to/example.pdf
タイトル: ベクトル詳解
説明: ベクトル分野の要点と解法を整理した資料
courses: 数学C
units: ベクトル
type: 基礎
tags: ベクトル, 図形, 詳解
更新日: 今日

やってほしいこと:
- PDFを files/ に英数字・小文字・ハイフンの名前で保存
- data/materials.json に追加
- JSONが正しいか確認
- ローカルサーバーで資料一覧とPDFリンクを確認
- 問題なければ main と gh-pages にpush
```

分類に迷う場合は、PDFだけ渡して「タイトルと内容から分類を推測して」と書けば大丈夫です。
pushしてほしくないときは、最後に「まだcommitやpushはしないで」と書いてください。

### 2. 自分で追加する

1. PDFを `files/` に入れます。
2. ファイル名を英数字・小文字・ハイフンに整えます。
3. `data/materials.json` の配列末尾に資料情報を追加します。
4. 次のコマンドでJSONを確認します。

```bash
python3 -m json.tool data/materials.json > /tmp/materials.json
```

5. ローカルサーバーを起動して表示を確認します。

```bash
python3 -m http.server 8000
```

6. `http://localhost:8000/materials.html` を開き、カード表示とPDFリンクを確認します。
7. 問題なければGitHubへ反映します。

```bash
git add files/ data/materials.json
git commit -m "Add math material"
git push origin main
git push origin main:gh-pages
```

### ローカル入力補助ページ

この作業用PCには、公開されないローカル専用の入力補助ページを用意しています。

```text
.local-tools/material-entry-helper.html
```

ブラウザでこのHTMLを開くと、資料情報を入力して `materials.json` に追加するためのJSONを生成できます。
このページは `.gitignore` で除外しているため、GitHub Pagesには公開されません。
ただし、PDFを自動で `files/` にコピーしたり、JSONファイルを直接保存したりはしません。

## materials.jsonの書き方

`data/materials.json` は配列形式です。資料1件ごとに、次のようなオブジェクトを追加します。

```json
{
  "title": "ベクトル 基礎まとめ",
  "courses": ["数学C"],
  "units": ["ベクトル"],
  "type": ["基礎"],
  "description": "ベクトルの基本事項と典型的な考え方をまとめた資料です。",
  "file": "./files/vector-basic-summary.pdf",
  "date": "2026-05-14",
  "tags": ["ベクトル", "図形", "基礎"]
}
```

`courses`、`units`、`type` はすべて配列で指定します。1つだけ指定する場合も `["数学C"]` のように配列にしてください。

## 大分類 courses

`courses` は高校数学の大きな入口です。複数指定できます。

- 数学Ⅰ
- 数学A
- 数学Ⅱ
- 数学B
- 数学Ⅲ
- 数学C
- その他

例: 微分積分を数学Ⅱと数学Ⅲの両方にまたがる資料として扱う場合:

```json
"courses": ["数学Ⅱ", "数学Ⅲ"]
```

## 小分類 units

`units` は単元名です。複数指定できます。

数学Ⅰ:
- 数と式
- 集合と命題
- 2次関数
- 図形と計量
- データの分析

数学A:
- 図形の性質
- 場合の数と確率
- 数学と人間の活動
- 整数

数学Ⅱ:
- 式と証明
- 複素数と方程式
- 図形と方程式
- 三角関数
- 指数関数・対数関数
- 微分法・積分法

数学B:
- 数列
- 統計的な推測
- 数学と社会生活

数学Ⅲ:
- 極限
- 微分法
- 積分法

数学C:
- ベクトル
- 平面上の曲線
- 複素数平面
- 数学的な表現の工夫

その他:
- その他

大分類は「まず探す入口」、小分類は「その中での詳しい単元」です。
分類に迷ったときは、`courses` だけを大きめに指定し、`units` は `["その他"]` にしても構いません。

## typeの指定

`type` は資料の性質を表します。必ず配列で指定します。

- 基礎
- 問題演習

判断の目安:
- 「基礎」「入門」「まとめ」「公式」「解説」「ノート」などを含む資料は `["基礎"]`
- 「問題」「演習」「確認テスト」「過去問」「例題」「課題」などを含む資料は `["問題演習"]`
- 問題解説のように両方の性質がある資料は `["基礎", "問題演習"]`
- 判断に迷う場合は `["基礎"]`

## 複数分類の例

```json
{
  "title": "微分積分のまとめ",
  "courses": ["数学Ⅱ", "数学Ⅲ"],
  "units": ["微分法・積分法", "微分法", "積分法"],
  "type": ["基礎"],
  "description": "数学Ⅱと数学Ⅲにまたがる微分積分の要点整理です。",
  "file": "./files/calculus-summary.pdf",
  "date": "2026-05-14",
  "tags": ["微分", "積分", "まとめ"]
}
```

複数件を書く場合は、各オブジェクトの間にカンマを入れます。
最後のオブジェクトの後ろにはカンマを付けません。JSONはカンマミスがあると読み込めなくなるので注意してください。

## 連絡先ページの編集

`contact.html` には仮のメールアドレスとGitHubリンクを入れています。
公開前に、実際に使う連絡先へ差し替えてください。
