# house-checker-api

Google Apps Script (GAS) を使った、建築構造データの保存・管理用バックエンドAPIです。

##　セットアップ方法

###スプレットシートの準備

--新規スプレットシートを作成し、以下のシート名を作成します。

 `木造シート`, `S構造シート`, `R構造シート`, `user`, `jsonログ`
 
--スプレットシートの一行目にヘッダ名を記入します。

-木造シートヘッダ名

deleteflag, uuid, general, postflag, postusername, buildingtype, number, datesurveyCount, investigator, investigator_2, investigatorPrefecture, investigatorPrefecturee_2, investigatorNumber, investigatorNumber_2, latitude, longitude, generate_address, generate_cityward, buildingName, buildingNumber, address, cityward, generate_latitude, generate_longitude, mapNumber, buildingUses, structure, floors, scale, exteriorInspectionScore, exteriorInspectionRemarks, adjacentBuildingRisk, adjacentBuildingRiskImages, unevenSettlement, unevenSettlementImages, foundationDamage, foundationDamageImages, firstFloorTilt, firstFloorTiltImages, wallDamage, wallDamageImages, corrosionOrTermite, corrosionOrTermiteImages, roofTile, roofTileImages, windowFrame, windowFrameImages, exteriorWet, exteriorWetImages, exteriorDry, exteriorDryImages, signageAndEquipment, signageAndEquipmentImages, outdoorStairs, outdoorStairsImages, others, othersImages, otherRemarks, overallExteriorScore, overallStructuralScore, overallFallingObjectScore, overallScore, deleteuser, lasteditor

-S構造シートヘッダ名

deleteflag, uuid, general, postflag, postusername, buildingtype, number, userstatus, datesurveyCount, investigator, investigator_2, investigatorPrefecture, investigatorPrefecture_2, investigatorNumber, investigatorNumber_2, latitude, longitude, generate_address, generate_cityward, buildingName, buildingNumber, address, cityward, generate_latitude, generate_longitude, mapNumber, buildingUses, structure, floors, scale, exteriorInspectionScore, exteriorInspectionRemarks, hasSevereDamageMembers, hasSevereDamageMembersImages, adjacentBuildingRisk, adjacentBuildingRiskImages, groundFailureInclination, groundFailureInclinationImages, unevenSettlement, unevenSettlementImages, inspectedFloorsForColumns, totalColumnsLevel5, surveyedColumnsLevel5, percentColumnsLevel5, percentColumnsDamageLevel5, percentColumnsDamageLevel5Images, surveyRateLevel5, totalColumnsLevel4, surveyedColumnsLevel4, percentColumnsLevel4, percentColumnsDamageLevel4, percentColumnsDamageLevel4Images, surveyRateLevel4, windowFrame, windowFrameImages, exteriorMaterialMortarTileStone, exteriorMaterialMortarTileStoneImages, exteriorMaterialALCPCMetalBlock, exteriorMaterialALCPCMetalBlockImages, signageAndEquipment, signageAndEquipmentImages, outdoorStairs, outdoorStairsImages, others, othersImages, otherRemarks, overallExteriorScore, overallStructuralScore2, overallStructuralScore, overallFallingObjectScore, overallScore, deleteuser, lasteditor

-R構造シートヘッダ名

deleteflag, uuid, general, postflag, postusername, buildingtype, number, userstatus, datesurveyCount, investigator, investigator_2, investigatorPrefecture, investigatorPrefecture_2, investigatorNumber, investigatorNumber_2, latitude, longitude, generate_address, generate_cityward, buildingName, buildingNumber, address, cityward, generate_latitude, generate_longitude, mapNumber, buildingUses, structure, floors, scale, exteriorInspectionScore, exteriorInspectionRemarks, adjacentBuildingRisk, adjacentBuildingRiskImages, unevenSettlement, unevenSettlementImages, upperFloorLe1, upperFloorLe1Images, upperFloorLe2, upperFloorLe2Images, hasBuckling, hasBucklingImages, bracingBreakRate, bracingBreakRateImages, jointFailure, jointFailureImages, columnBaseDamage, columnBaseDamageImages, corrosion, corrosionImages, roofingMaterial, roofingMaterialImages, windowFrame, windowFrameImages, exteriorWet, exteriorWetImages, exteriorDry, exteriorDryImages, signageAndEquipment, signageAndEquipmentImages, outdoorStairs, outdoorStairsImages, others, othersImages, otherRemarks, overallExteriorScore, overallStructuralScore, overallFallingObjectScore, overallScore, deleteuser, lasteditor

-userヘッダ名

timestamp, emailAddress, hashedpassword, user_role, user_name, admin_number, admin_city, deleteflag, deleteflag, timestamp

--mainファイルに記載されているSPREADSHEET_IDを自身のIDに変更します。

--Google Apps Scriptプロジェクトを作成します。

--ブラウザ拡張機能「Google Apps Script GitHub Assistant」を有効します。

--拡張機能メニューから　https://github.com/matsu200/house-checker-api　を連携します。

--プロジェクトの「pull」ボタンを実行しエディタにコードを読み込みます。
