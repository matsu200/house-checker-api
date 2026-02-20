# 🏠 house-checker-api
Google Apps Script (GAS) を活用した、建築構造データの保存・管理用バックエンドAPIです。
点検結果や現場写真のデータをスプレッドシートおよびGoogleドライブへ自動記録します。

# 🛠 セットアップ方法

## Step 1. スプレッドシートの準備
まず、保存先となる Googleスプレッドシート を新規作成し、以下の 5つのシート を作成してください。

木造シート

S構造シート

R構造シート

user

jsonログ

## Step 2. 各シートのヘッダ（1行目）設定
以下の文字列をコピーし、各シートの セル「A1」 に貼り付けてください。
※貼り付け後、自動で列が分かれます。

<details>
<summary><b>📍 木造シートのヘッダ（クリックで展開）</b></summary>

deleteflag, uuid, general, postflag, postusername, buildingtype, number, datesurveyCount, investigator, investigator_2, investigatorPrefecture, investigatorPrefecturee_2, investigatorNumber, investigatorNumber_2, latitude, longitude, generate_address, generate_cityward, buildingName, buildingNumber, address, cityward, generate_latitude, generate_longitude, mapNumber, buildingUses, structure, floors, scale, exteriorInspectionScore, exteriorInspectionRemarks, adjacentBuildingRisk, adjacentBuildingRiskImages, unevenSettlement, unevenSettlementImages, foundationDamage, foundationDamageImages, firstFloorTilt, firstFloorTiltImages, wallDamage, wallDamageImages, corrosionOrTermite, corrosionOrTermiteImages, roofTile, roofTileImages, windowFrame, windowFrameImages, exteriorWet, exteriorWetImages, exteriorDry, exteriorDryImages, signageAndEquipment, signageAndEquipmentImages, outdoorStairs, outdoorStairsImages, others, othersImages, otherRemarks, overallExteriorScore, overallStructuralScore, overallFallingObjectScore, overallScore, deleteuser, lasteditor

</details>

<details>
<summary><b>📍 S構造シートのヘッダ（クリックで展開）</b></summary>

deleteflag, uuid, general, postflag, postusername, buildingtype, number, userstatus, datesurveyCount, investigator, investigator_2, investigatorPrefecture, investigatorPrefecture_2, investigatorNumber, investigatorNumber_2, latitude, longitude, generate_address, generate_cityward, buildingName, buildingNumber, address, cityward, generate_latitude, generate_longitude, mapNumber, buildingUses, structure, floors, scale, exteriorInspectionScore, exteriorInspectionRemarks, hasSevereDamageMembers, hasSevereDamageMembersImages, adjacentBuildingRisk, adjacentBuildingRiskImages, groundFailureInclination, groundFailureInclinationImages, unevenSettlement, unevenSettlementImages, inspectedFloorsForColumns, totalColumnsLevel5, surveyedColumnsLevel5, percentColumnsLevel5, percentColumnsDamageLevel5, percentColumnsDamageLevel5Images, surveyRateLevel5, totalColumnsLevel4, surveyedColumnsLevel4, percentColumnsLevel4, percentColumnsDamageLevel4, percentColumnsDamageLevel4Images, surveyRateLevel4, windowFrame, windowFrameImages, exteriorMaterialMortarTileStone, exteriorMaterialMortarTileStoneImages, exteriorMaterialALCPCMetalBlock, exteriorMaterialALCPCMetalBlockImages, signageAndEquipment, signageAndEquipmentImages, outdoorStairs, outdoorStairsImages, others, othersImages, otherRemarks, overallExteriorScore, overallStructuralScore2, overallStructuralScore, overallFallingObjectScore, overallScore, deleteuser, lasteditor

</details>

<details>
<summary><b>📍 R構造シートのヘッダ（クリックで展開）</b></summary>

deleteflag, uuid, general, postflag, postusername, buildingtype, number, userstatus, datesurveyCount, investigator, investigator_2, investigatorPrefecture, investigatorPrefecture_2, investigatorNumber, investigatorNumber_2, latitude, longitude, generate_address, generate_cityward, buildingName, buildingNumber, address, cityward, generate_latitude, generate_longitude, mapNumber, buildingUses, structure, floors, scale, exteriorInspectionScore, exteriorInspectionRemarks, adjacentBuildingRisk, adjacentBuildingRiskImages, unevenSettlement, unevenSettlementImages, upperFloorLe1, upperFloorLe1Images, upperFloorLe2, upperFloorLe2Images, hasBuckling, hasBucklingImages, bracingBreakRate, bracingBreakRateImages, jointFailure, jointFailureImages, columnBaseDamage, columnBaseDamageImages, corrosion, corrosionImages, roofingMaterial, roofingMaterialImages, windowFrame, windowFrameImages, exteriorWet, exteriorWetImages, exteriorDry, exteriorDryImages, signageAndEquipment, signageAndEquipmentImages, outdoorStairs, outdoorStairsImages, others, othersImages, otherRemarks, overallExteriorScore, overallStructuralScore, overallFallingObjectScore, overallScore, deleteuser, lasteditor

</details>

<details>
<summary><b>📍 userシートのヘッダ（クリックで展開）</b></summary>

timestamp, emailAddress, hashedpassword, user_role, user_name, admin_number, admin_city, deleteflag, deleteflag, timestamp

</details>

## Step 3. GASプロジェクトへの導入
 GASプロジェクトを新規作成します。

ブラウザ拡張機能 「Google Apps Script GitHub Assistant」 を有効化。

拡張機能メニューから本リポジトリを連携。

URL: https://github.com/matsu200/house-checker-api

「Pull (↓)」ボタン をクリックして、最新のコードをエディタに読み込みます。

## Step 4. 環境設定（重要）
main.gs 内にある SPREADSHEET_ID を、作成したスプレッドシートのIDに書き換えます。

必要に応じて、画像保存用の DRIVE_FOLDER_ID も設定してください。

Google Apps Scriptの設定画面で 「Google Apps Script API」を「オン」 にしてください。

# 🚀 デプロイ方法
GASエディタ右上の 「デプロイ」 ＞ 「新しいデプロイ」 を選択。

種類の選択：「ウェブアプリ」

次のユーザーとして実行：「自分」

アクセスできるユーザー：「全員」

発行された 「ウェブアプリURL」 を、送信元アプリの設定箇所へ貼り付けてください。
