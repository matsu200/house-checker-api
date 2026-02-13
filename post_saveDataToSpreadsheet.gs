function post_saveDataToSpreadsheet(data, targetSheetName, structureType, upFlag, upName, upuuid) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID); 
  const sheet = ss.getSheetByName(targetSheetName);

  if (!sheet) throw new Error(`シート名「${targetSheetName}」が見つかりません。`);
  // --- 1. 重複位置チェック (5m以内の近接データ確認) ---
  // 更新(upuuidがある)ではなく、新規登録の場合のみチェックを実行
  if (!upuuid && data.unit?.position) {
    const currentLat = data.unit.position.latitude;
    const currentLng = data.unit.position.longitude;
    
    // 緯度・経度が有効な数値であることを確認
    if (currentLat && currentLng) {
      // searchByLatLonRange を呼び出し (半径5m以内を検索)
      // チェック対象の列は、後続のgeocodeAddressが書き込む 'generate_latitude' 等を想定
      const nearbyBuildings = searchByLatLonRange(
        targetSheetName, 
        currentLat, 
        currentLng, 
        5,                  // 5メートル
        'latitude', 
        'longitude', 
        ['uuid']            // 重複確認のためuuidだけ取得
      );

      if (nearbyBuildings.length > 0) {
        // 5m以内に建物が見つかった場合、エラーを投げて中断
        throw new Error(`近接エラー：5m以内に既に登録済みの建物が存在します。(最寄UUID: ${nearbyBuildings[0].uuid})`);
      }
    }
  }



  const values = sheet.getDataRange().getValues();
  const header = values[0];
  const uuidIndex = header.indexOf('uuid');
  if (uuidIndex === -1) throw new Error("ヘッダーに 'uuid' 列が見つかりません。");
  const flagIndex = header.indexOf('generalpostflag');
  let recordUuid = upuuid || generatePrefixedUuid(structureType);
  let targetRow = -1;
  let isUpdate = false;

  if (upuuid !== "") {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][uuidIndex]) === String(upuuid)) {
        targetRow = i + 1;
        isUpdate = true;
        break;
      }
    }
  }

  // --- 型定義の管理マッピング ---
  const STRING_KEYS = ['buildingtype','number','buildingName', 'buildingNumber','address', 'mapNumber','buildingUse','structure', 'scale', 'buildingNumber','overallExteriorScore','investigator', 'investigatorPrefecture', 'investigatorNumber'];
  const NUMBER_KEYS = ['surveyCount', 'floors', 'exteriorInspectionScore'];
  const LIST_KEYS = ['investigator', 'investigatorPrefecture', 'investigatorNumber'];

  /**
   * ネストされたオブジェクトから値を抽出する内部関数
   */
  function getNestedValue(key) {
    if (key === 'deleteflag') return 0;
    if (key === 'uuid') return recordUuid;
    if (key === 'generalpostflag') {
      // 更新（targetRowがある）かつ upFlagがnull（更新しない指示）の場合
      if (targetRow !== -1 && upFlag === null && flagIndex !== -1) {
        return values[targetRow - 1][flagIndex]; // 現在のスプレッドシートの値をそのまま返す
      }
      return upFlag === null ? 0 : upFlag; // 新規でnullならデフォルト0
    }
    if (key === 'postusername') return upName;

    // データの優先順位：ルート -> unit -> overview -> content -> position
    if (data[key] !== undefined) return data[key];
    if (data.unit && data.unit[key] !== undefined) return data.unit[key];
    if (data.overview && data.overview[key] !== undefined) return data.overview[key];
    if (data.content && data.content[key] !== undefined) return data.content[key];
    if (data.unit?.position && data.unit.position[key] !== undefined) return data.unit.position[key];
    
    return "";
  }

  const rowData = header.map(key => {
    let value;
    let baseKey = key;
    let isSecondElement = false;

    // 1. リストの2番目要素(_2)の判定
    if (key.endsWith('_2')) {
      baseKey = key.slice(0, -2);
      isSecondElement = true;
    }

    let rawValue = getNestedValue(baseKey);

    // 2. データ型に応じた変換
    if (key.endsWith('Images')) {
      value = Array.isArray(rawValue) ? rawValue.map(item => item.firebaseUrl).join(', ') : "";
    } else if (LIST_KEYS.includes(baseKey) && Array.isArray(rawValue)) {
      value = isSecondElement ? (rawValue[1] || "") : (rawValue[0] || "");
    } else {
      value = rawValue !== undefined ? rawValue : "";
    }

    // 3. スプレッドシートへの書き込み形式の制御
    // 文字列として扱うべきキー（IDなど）には必ずシングルクォートを付ける
    const needsStringQuote = STRING_KEYS.some(sk => baseKey === sk);
    const isNumberType = NUMBER_KEYS.some(nk => baseKey === nk);

    if (needsStringQuote && value !== "") {
      // 既に ' が付いていない場合のみ付与し、型を文字列に強制
      let strValue = String(value);
      return strValue.startsWith("'") ? strValue : "'" + strValue;
    }

    if (isNumberType) {
      // 数値型の場合は、空なら0、あれば数値変換して返す
      return value === "" ? 0 : Number(value);
    }

    return value;
  });

  // --- 書き込み処理 ---
  if (targetRow !== -1) {
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
    targetRow = sheet.getLastRow();
  }

  // 4. 非同期的な位置・住所情報の補完
  if (data.overview?.address) {
    geocodeAddress(targetSheetName, targetRow, data.overview.address, 'cityward', 'generate_latitude', 'generate_longitude');
  }
  if (data.unit?.position) {
    reversegeocodeAddress(targetSheetName, targetRow, data.unit.position.latitude, data.unit.position.longitude, 'generate_address', 'generate_cityward');
  }
}