/**
 * UUIDから適切なシートを選択し、Flutter対応のネスト構造（画像オブジェクト化）でデータを取得します。
 */
function getrecord(uuid) {
  if (!uuid) throw new Error("uuidが指定されていません。");

  let targetSheetName;
  let keysToExtract = [];
  const conditions = { uuid: uuid };
  const prefix = uuid.split('_')[0];

  // --- 1. シート選択と抽出キーの定義　 ---
  if (prefix === "W") {
    targetSheetName = '木造シート';
    keysToExtract = ['uuid', 'postusername', 'buildingtype', 'number', 'date', 'surveyCount', 'investigator', 'investigatorPrefecture', 'investigatorNumber', 'latitude', 'longitude', 'address', 'buildingName', 'buildingNumber', 'mapNumber', 'buildingUse', 'structure', 'floors', 'scale', 'exteriorInspectionScore', 'exteriorInspectionRemarks', 'adjacentBuildingRisk', 'adjacentBuildingRiskImages', 'unevenSettlement', 'unevenSettlementImages', 'foundationDamage', 'foundationDamageImages', 'firstFloorTilt', 'firstFloorTiltImages', 'wallDamage', 'wallDamageImages', 'corrosionOrTermite', 'corrosionOrTermiteImages', 'roofTile', 'roofTileImages', 'windowFrame', 'windowFrameImages', 'exteriorWet', 'exteriorWetImages', 'exteriorDry', 'exteriorDryImages', 'signageAndEquipment', 'signageAndEquipmentImages', 'outdoorStairs', 'outdoorStairsImages', 'others', 'othersImages', 'otherRemarks', 'overallExteriorScore', 'overallStructuralScore', 'overallFallingObjectScore', 'overallScore'];
  } else if (prefix === "S") {
    targetSheetName = 'S構造シート';
    keysToExtract = ['uuid', 'postusername', 'buildingtype', 'number', 'date', 'surveyCount', 'investigator', 'investigatorPrefecture', 'investigatorNumber', 'latitude', 'longitude', 'address', 'buildingName', 'buildingNumber', 'mapNumber', 'buildingUse', 'structure', 'floors', 'scale', 'exteriorInspectionScore', 'exteriorInspectionRemarks', 'hasSevereDamageMembers', 'hasSevereDamageMembersImages', 'adjacentBuildingRisk', 'adjacentBuildingRiskImages', 'groundFailureInclination', 'groundFailureInclinationImages', 'unevenSettlement', 'unevenSettlementImages', 'inspectedFloorsForColumns', 'totalColumnsLevel5', 'surveyedColumnsLevel5', 'percentColumnsLevel5', 'percentColumnsDamageLevel5', 'percentColumnsDamageLevel5Images', 'surveyRateLevel5', 'totalColumnsLevel4', 'surveyedColumnsLevel4', 'percentColumnsLevel4', 'percentColumnsDamageLevel4', 'percentColumnsDamageLevel4Images', 'surveyRateLevel4', 'windowFrame', 'windowFrameImages', 'exteriorMaterialMortarTileStone', 'exteriorMaterialMortarTileStoneImages', 'exteriorMaterialALCPCMetalBlock', 'exteriorMaterialALCPCMetalBlockImages', 'signageAndEquipment', 'signageAndEquipmentImages', 'outdoorStairs', 'outdoorStairsImages', 'others', 'othersImages', 'otherRemarks', 'overallExteriorScore', 'overallStructuralScore2', 'overallStructuralScore', 'overallFallingObjectScore', 'overallScore'];
  } else if (prefix === "R") {
    targetSheetName = 'R構造シート';
    keysToExtract = ['uuid', 'postusername', 'buildingtype', 'number', 'date', 'surveyCount', 'investigator', 'investigatorPrefecture', 'investigatorNumber', 'latitude', 'longitude', 'address', 'buildingName', 'buildingNumber', 'mapNumber', 'buildingUse', 'structure', 'floors', 'scale', 'exteriorInspectionScore', 'exteriorInspectionRemarks', 'adjacentBuildingRisk', 'adjacentBuildingRiskImages', 'unevenSettlement', 'unevenSettlementImages', 'upperFloorLe1', 'upperFloorLe1Images', 'upperFloorLe2', 'upperFloorLe2Images', 'hasBuckling', 'hasBucklingImages', 'bracingBreakRate', 'bracingBreakRateImages', 'jointFailure', 'jointFailureImages', 'columnBaseDamage', 'columnBaseDamageImages', 'corrosion', 'corrosionImages', 'roofingMaterial', 'roofingMaterialImages', 'windowFrame', 'windowFrameImages', 'exteriorWet', 'exteriorWetImages', 'exteriorDry', 'exteriorDryImages', 'signageAndEquipment', 'signageAndEquipmentImages', 'outdoorStairs', 'outdoorStairsImages', 'others', 'othersImages', 'otherRemarks', 'overallExteriorScore', 'overallStructuralScore', 'overallFallingObjectScore', 'overallScore'];
  } else {
    throw new Error("無効なuuidプレフィックスです: " + prefix);
  }

  // --- 2. データの取得 ---
  const results = getDataToSpreadsheet(targetSheetName, conditions, keysToExtract);
  if (results.length === 0) return null;

  const flatData = results[0];

  // --- 3. ネスト構造（Unit, Overview）の作成 　Flutter側で型定義をする処理---
  const structuredData = {
    uuid: flatData.uuid || uuid,
    postusername: flatData.postusername || "",
    unit: {
      buildingtype: flatData.buildingtype || prefix,
      number: flatData.number || "",
      date: flatData.date || "",
      surveyCount: Number(flatData.surveyCount) || 0,
      investigator: [flatData.investigator || ""],
      investigatorPrefecture: [flatData.investigatorPrefecture || ""],
      investigatorNumber: [flatData.investigatorNumber || ""],
      position: {
        latitude: Number(flatData.latitude) || 0,
        longitude: Number(flatData.longitude) || 0
      }
    },
    overview: {
      buildingName: flatData.buildingName || "",
      buildingNumber: flatData.buildingNumber || "",
      address: flatData.address || "",
      mapNumber: flatData.mapNumber || "",
      buildingUse: flatData.buildingUse || "",
      structure: flatData.structure || "",
      floors: Number(flatData.floors) || 0,
      scale: flatData.scale || ""
    },
    content: {},
    overallScore: flatData.overallScore || ""
  };

  // --- 4. Content配下の整理と画像のオブジェクト化 ---
  const rootKeys = ['uuid','postusername', 'overallScore'];
  const unitKeys = ['buildingtype', 'number', 'date', 'surveyCount', 'investigator', 'investigatorPrefecture', 'investigatorNumber', 'latitude', 'longitude'];
  const overviewKeys = ['buildingName', 'buildingNumber', 'address', 'mapNumber', 'buildingUse', 'structure', 'floors', 'scale'];

  Object.keys(flatData).forEach(key => {
    if (rootKeys.includes(key) || unitKeys.includes(key) || overviewKeys.includes(key)) return;

    let value = flatData[key];

    // 画像キー（Imagesで終わる）の処理
    if (key.endsWith('Images')) {
      if (Array.isArray(value)) {
        // 文字列の配列をオブジェクトの配列に変換
        value = value.map(url => ({
          localPath: "",
          firebaseUrl: url
        }));
      } else if (typeof value === 'string' && value.length > 0) {
        // 万が一単一の文字列で届いた場合
        value = [{ localPath: "", firebaseUrl: value }];
      } else {
        // データがない場合は空配列
        value = [];
      }
    }

    structuredData.content[key] = value;
  });

  return structuredData;
}



/**
 * 指定されたUUIDを持つレコードを論理的に削除（フラグをON）し、削除実行者（user_id）を記録します。
 * * @param {string} sheetName - 検索対象のシート名
 * @param {string} uuid - 削除対象レコードのUUID
 * @param {string} email - 削除を実行したユーザーのメールアドレス
 * @returns {boolean} - 削除が成功した場合 true
 */
function deleteRecordByUuid(uuid, email) {
    const sheetName=getSheetNameFromUuid(uuid);
    
    // スプレッドシートとシートの準備
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        Logger.log(`エラー: シート「${sheetName}」が見つかりません。`);
        return false;
    }

    const range = sheet.getDataRange();
    const values = range.getValues();
    if (values.length <= 1) {
        Logger.log("エラー: データ行が見つかりません。");
        return false;
    }

    const header = values[0];
    const dataRows = values.slice(1);

    // --------------------------------------------------------
    // 1. 必要な列インデックスの取得
    // --------------------------------------------------------
    const uuidIndex = header.indexOf('uuid'); // または 'record_uuid'
    const deleteFlagIndex = header.indexOf('deleteflag');
    const deleteUserIndex = header.indexOf('deleteuser');
    
    if (uuidIndex === -1) {
        throw new Error("ヘッダーに'uuid'列が見つかりません。");
    }
    if (deleteFlagIndex === -1) {
        throw new Error("ヘッダーに'deleteflag'列が見つかりません。");
    }
    if (deleteUserIndex === -1) {
        throw new Error("ヘッダーに'deleteuser'列が見つかりません。");
    }

    let targetRowNumber = -1; // スプレッドシートの行番号 (1ベース)

    // --------------------------------------------------------
    // 2. 検索条件に合致する行を見つける
    // --------------------------------------------------------
    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        // UUIDを文字列として比較
        if (String(row[uuidIndex]) === String(uuid)) {
            // 見つかった場合、スプレッドシートの行番号を記録 (ヘッダー行が1行目なので i + 2)
            targetRowNumber = i + 2; 
            break; 
        }
    }

    // --------------------------------------------------------
    // 3. 削除フラグの更新とユーザーIDの記録
    // --------------------------------------------------------
    if (targetRowNumber !== -1) {
        // 削除フラグを '1' に設定（列インデックス + 1 でスプレッドシートの列番号を取得）
        sheet.getRange(targetRowNumber, deleteFlagIndex + 1).setValue(1);
        
        // 削除実行ユーザーIDを記録
        sheet.getRange(targetRowNumber, deleteUserIndex + 1).setValue(email);
        
        Logger.log(`uuid: ${uuid} のレコードは、ユーザー ${email} によって論理的に削除されました。`);
        return true;
    } else {
        Logger.log(`エラー: uuid「${uuid}」に一致するレコードが見つかりませんでした。`);
        return false;
    }
}


/**
 * 指定されたUUIDを持つレコードを検索し、提供された更新リストに基づいてフィールドを更新します。
 * また、更新実行者としてlastchangeuserにuser_idを記録します。
 * * @param {string} uuid - 更新対象レコードのUUID
 * @param {string} userId - 変更を実行したユーザーのID
 * @param {Array<Object>} updates - 変更内容のリスト。
 * 例: [{key: 'buildingName', value: '新ビル名'}, {key: 'status', value: '完了'}]
 * @returns {boolean} - 更新が成功した場合 true
 */
function updateRecordByUuid(uuid, userId, updates) {
    if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('【')) {
        throw new Error("SPREADSHEET_IDが設定されていません。");
    }
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        Logger.log(`エラー: uuid「${uuid}」に対する更新データリスト (updates) が無効または空です。`);
        return false;
    }
    // シート名の特定
    const sheetName = getSheetNameFromUuid(uuid);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        Logger.log(`エラー: シート「${sheetName}」が見つかりません。`);
        return false;
    }

    const range = sheet.getDataRange();
    const values = range.getValues();
    if (values.length <= 1) {
        Logger.log(`シート「${sheetName}」にデータ行が見つかりません。`);
        return false;
    }

    const header = values[0];
    const dataRows = values.slice(1);

    // --------------------------------------------------------
    // 1. 必須列インデックスの取得
    // --------------------------------------------------------
    let uuidIndex = header.indexOf('uuid');
    if (uuidIndex === -1) {
        uuidIndex = header.indexOf('record_uuid');
    }
    const lastChangeUserIndex = header.indexOf('lasteditor');
    
    if (uuidIndex === -1) throw new Error("ヘッダーに'uuid'または'record_uuid'列が見つかりません。");
    if (lastChangeUserIndex === -1) throw new Error("ヘッダーに'lasteditor'列が見つかりません。");

    let targetRowNumber = -1; // スプレッドシートの行番号 (1ベース)

    // --------------------------------------------------------
    // 2. 検索条件に合致する行を見つける
    // --------------------------------------------------------
    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        if (String(row[uuidIndex]).trim() === String(uuid).trim()) { 
            targetRowNumber = i + 2; // ヘッダー行(1) + ループインデックス(i) + 1
            break; 
        }
    }

    if (targetRowNumber === -1) {
        Logger.log(`エラー: uuid「${uuid}」に一致するレコードが見つかりませんでした。`);
        return false;
    }
    
    // --------------------------------------------------------
    // 3. 変更箇所の更新
    // --------------------------------------------------------
    let updatedCount = 0;
    
    // 更新リストをループし、変更箇所のみを更新
    updates.forEach(update => {
        const updateKey = update.key;
        const updateValue = update.value;
        
        const colIndex = header.indexOf(updateKey);
        
        if (colIndex !== -1) {
            // 列が見つかった場合、該当セルを更新 (列インデックス + 1 でスプレッドシートの列番号を取得)
            sheet.getRange(targetRowNumber, colIndex + 1).setValue(updateValue);
            updatedCount++;
        } else {
            Logger.log(`警告: 更新キー「${updateKey}」はシートヘッダーに見つからなかったためスキップされました。`);
        }
    });
    
    // --------------------------------------------------------
    // 4. 最終変更者の記録
    // --------------------------------------------------------
    if (updatedCount > 0) {
        // lastchangeuser 列を更新
        sheet.getRange(targetRowNumber, lastChangeUserIndex + 1).setValue(userId);
        
        Logger.log(`uuid: ${uuid} のレコードで ${updatedCount} 件のフィールドが更新されました。実行者: ${userId}`);
        return true;
    } else {
        Logger.log(`uuid: ${uuid} のレコードで有効な更新は検出されませんでした。`);
        return false;
    }
}

/**
 * 構造タイプに基づいてプレフィックス付きUUIDを生成します。
 * @param {string} structureType - 構造タイプ ('W', 'S', 'R'など)
 * @returns {string} - 例: "W_xxxxxxxx-xxxx-..."
 */
function generatePrefixedUuid(structureType) {
  const prefix = STRUCTURE_MAP[structureType]?.prefix || "GENERIC_";
  return prefix + Utilities.getUuid();
}
/**
 * UUIDのプレフィックスに基づいて、対応するシート名を返します。
 * @param {string} uuid - プレフィックス付きUUID (例: "W_xxxxxxxx...")
 * @returns {string|null} - 対応するシート名、または null
 */
function getSheetNameFromUuid(uuid) {
  for (const key in STRUCTURE_MAP) {
    const info = STRUCTURE_MAP[key];
    if (uuid.startsWith(info.prefix)) {
      return info.sheetName;
    }
  }
  return null;
}
