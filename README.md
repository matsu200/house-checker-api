house-checker-api
Google Apps Script (GAS) を使った、建築構造データの保存・管理用バックエンドAPIです。建築点検の結果や画像をスプレッドシートに記録します。

🛠 セットアップ方法
1. スプレッドシートの準備
新規スプレッドシートを作成し、以下の名前で5つのシートを作成してください。

木造シート

S構造シート

R構造シート

user

jsonログ

2. 各シートのヘッダ設定
各シートの 1行目 に、以下の項目をコピー＆ペーストして設定してください。

<details>
<summary>📍 木造シートのヘッダを表示</summary>

</details>

<details>
<summary>📍 S構造シートのヘッダを表示</summary>

</details>

<details>
<summary>📍 R構造シートのヘッダを表示</summary>

</details>

<details>
<summary>📍 userシートのヘッダを表示</summary>

</details>

3. GASプロジェクトの構築
 プロジェクトを新規作成します。

ブラウザ拡張機能 「Google Apps Script GitHub Assistant」 をインストールして有効化します。

拡張機能メニューから本リポジトリを連携します。

https://github.com/matsu200/house-checker-api

プロジェクトの 「Pull (↓)」 ボタンを実行し、コードを読み込みます。

4. 環境設定
main.gs（または該当ファイル）に記載されている SPREADSHEET_ID を、自身のスプレッドシートIDに書き換えて保存してください。

必要に応じて、DRIVE_FOLDER_ID 等も設定してください。

🚀 デプロイ
GASエディタ右上の「デプロイ」＞「新しいデプロイ」を選択。

種類：ウェブアプリ

アクセスできるユーザー：全員

発行されたURLをフロントエンドアプリの送信先に設定してください。
