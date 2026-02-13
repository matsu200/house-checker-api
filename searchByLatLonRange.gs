/**
 * 緯度・経度による円形の範囲検索を行い、必要なキーと中心からの距離（メートル）を抽出します。（Haversine公式を使用）
 * * 【変更点】距離（メートル）は Math.ceil で切り上げられます。
 * * @param {string} sheetName - 検索対象のシート名
 * @param {number} centerLat - 検索中心の緯度
 * @param {number} centerLng - 検索中心の経度
 * @param {number} range - 検索する円の半径（メートル単位を想定）
 * @param {string} latKey - スプレッドシートの緯度列のヘッダー名
 * @param {string} lngKey - スプレッドシートの経度列のヘッダー名
 * @param {string[]} keysToExtract - 取得したい列のヘッダー名の配列
 */
function searchByLatLonRange(sheetName, centerLat, centerLng, range, latKey, lngKey, keysToExtract) {
  // 地球の半径（キロメートル）。距離計算の基準となる
  const EARTH_RADIUS_KM = 6371; 
  const radiusm = range; // range パラメータを半径（m）として扱う

  if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('【')) {
    throw new Error("SPREADSHEET_IDが設定されていません。");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);//対象シートの指定

  if (!sheet) {
    throw new Error(`シート「${sheetName}」が見つかりません。`);
  }

  const rangeData = sheet.getDataRange();
  const values = rangeData.getValues();//レコード数の取得
  if (values.length <= 1) {
    return []; 
  }

  const header = values[0];
  const dataRows = values.slice(1);//1行目をヘッダとして以降をデータに指定
  const result = [];
  
  // 緯度・経度列のヘッダを取得
  const latIndex = header.indexOf(latKey);
  const lngIndex = header.indexOf(lngKey);

  if (latIndex === -1 || lngIndex === -1) {
    throw new Error(`緯度キー「${latKey}」または経度キー「${lngKey}」がシートヘッダーに見つかりません。`);
  }

  // 抽出キーのヘッダを取得
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
   * 2点間の球面距離を計算する (Haversine公式)取得した２点と地球を中心とした点との角度により距離を計算する。
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
  
  // シートに保存されている緯度経度から距離を算出指定した距離内にあるレコードのみ取得
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    const recordLat = parseFloat(row[latIndex]);//ヘッダlatkeyから取得
    const recordLng = parseFloat(row[lngIndex]);//ヘッダlngkeyから取得

    // 緯度・経度の値が数値として有効かチェック
    if (isNaN(recordLat) || isNaN(recordLng)) {
      continue; // 無効な値はスキップ
    }

    // 距離を計算 (Km単位に変換)
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
  result.sort((a, b) => a.distance_m - b.distance_m);//配列に保存時、昇順に整理
  return result;
}