function getuserpost_search(sheetName,centerLat, centerLng, range, latKey, lngKey, keysToExtract){
    // 地球の半径（キロメートル）。距離計算の基準となる
  const EARTH_RADIUS_KM = 6371; 
  const radiusm = range; // range パラメータを半径（m）として扱う

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID); 
  const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
    throw new Error(`シート名「${SheetName}」が見つかりません。`);
  }
  const rangeData = sheet.getDataRange();
  const values = rangeData.getValues();
  if (values.length <= 1) {
    return []; 
  }

  const header = values[0];
  const dataRows = values.slice(1);
  const result = [];
  
  // 緯度・経度列のインデックスを取得
  const latIndex = header.indexOf(latKey);
  const lngIndex = header.indexOf(lngKey);
  const userpostIndex = header.indexOf('userpost');
  if (latIndex === -1 || lngIndex === -1) {
    throw new Error(`緯度キー「${latKey}」または経度キー「${lngKey}」がシートヘッダーに見つかりません。`);
  }

  // 抽出キーのインデックスを取得
  const extractIndices = keysToExtract.map(key => {
    const index = header.indexOf(key);
    if (index === -1) {
      throw new Error(`抽出キー「${key}」がシートヘッダーに見つかりません。`);
    }
    return { key, index };
  });

  // Haversine公式に必要な定数を事前に計算
  const rad = Math.PI / 180;
  const lat1Rad = centerLat * rad;
  const lng1Rad = centerLng * rad;
  
  /**
   * 2点間の球面距離を計算する (Haversine公式)
   * @param {number} lat2 - 2点目の緯度（度）
   * @param {number} lng2 - 2点目の経度（度）
   * @returns {number} - 距離 (キロメートル)
   */
  function calculateDistance(lat2, lng2) {
    const lat2Rad = lat2 * rad;
    const lng2Rad = lng2 * rad;
    
    const dLat = lat2Rad - lat1Rad;
    const dLng = lng2Rad - lng1Rad;

    // Haversine formula
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return EARTH_RADIUS_KM * c; // 結果をキロメートルで返す
  }
  
  // データ行をフィルタリング
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (String(row[userpostIndex]) !== "1") {
      continue;
    }
    const recordLat = parseFloat(row[latIndex]);
    const recordLng = parseFloat(row[lngIndex]);

    // 緯度・経度の値が数値として有効かチェック
    if (isNaN(recordLat) || isNaN(recordLng)) {
      continue; // 無効な値はスキップ
    }

    // 距離を計算 (Km単位)
    const distanceKm = calculateDistance(recordLat, recordLng);
    const distanceMeters = Math.ceil(distanceKm * 1000); 

    // 距離が指定された半径内にあるかチェック
    if (distanceMeters <= radiusm) {
      // 1. 必要なキーのデータのみを抽出
      const extractedObject = {};
      extractIndices.forEach(({ key, index }) => {
        extractedObject[key] = row[index];
      });
      
      // 2. 中心からの距離をメートル単位で計算し、切り上げ

      extractedObject['distance_m'] = distanceMeters;
      
      result.push(extractedObject);
    }
  }
  result.sort((a, b) => a.distance_m - b.distance_m);
  return result;
}

