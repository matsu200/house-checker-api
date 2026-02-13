/**
 * 指定されたシートから複数の条件に合うデータを検索し、必要なキーのみを抽出します。
 * 条件の値に配列を指定すると「いずれかに一致（OR検索）」として動作します。
 * * @param {string} sheetName - 検索対象のシート名
 * @param {Object} conditions - 検索条件 (例: {overallScore: ["red", "yellow"]})
 * @param {string[]} keysToExtract - 取得したいヘッダー名の配列
 * @returns {Object[]} 抽出されたデータの配列
 */
function getDataToSpreadsheet(sheetName, conditions, keysToExtract) {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('【')) {
    throw new Error("SPREADSHEET_IDが設定されていません。");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);//対象シートの指定

  if (!sheet) {
    throw new Error(`シート「${sheetName}」が見つかりません。`);
  }

  const range = sheet.getDataRange();
  const values = range.getValues();//シートのレコードを取得
  if (values.length <= 1) {
    return [];
  }

  const header = values[0];//１行目をヘッダーとして指定
  const dataRows = values.slice(1);//以降の行をデータとして扱う処理
  const result = [];//判定結果を格納する配列
  const deleteFlagIndex = header.indexOf('deleteflag');//ヘッダdeleteflagの列を取得

  // 1. 検索条件のヘッダーを取得
  const searchIndices = Object.keys(conditions).map(key => {
    const index = header.indexOf(key);
    if (index === -1) {
      throw new Error(`検索キー「${key}」がシートヘッダーに見つかりません。`);
    }
    // ここではStringに強制変換せず、配列か単一値かを保持する
    return { key, index, targetValue: conditions[key] };
  });

  // 2. 抽出キーのヘッダーを取得
  const extractIndices = keysToExtract.map(key => {
    const index = header.indexOf(key);
    if (index === -1) {
      throw new Error(`抽出キー「${key}」がシートヘッダーに見つかりません。`);
    }
    return { key, index };
  });

  // 3. 1行ずつ条件に一致するか探索
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    // 削除フラグがある行は論理削除しているとしてスキップ
    if (deleteFlagIndex !== -1 && row[deleteFlagIndex] === 1) {
      continue;
    }

    let match = true;//条件に一致する場合ture

    // すべての検索条件をチェック
    for (const { index, targetValue } of searchIndices) {
      const cellValue = String(row[index]); // スプレッドシート側の値を文字列化・検索不一致を防ぐ

      if (Array.isArray(targetValue)) {
        // ---条件が配列なら、その中に含まれているかチェック (OR検索) ---
        const stringTargets = targetValue.map(v => String(v));
        if (!stringTargets.includes(cellValue)) {
          match = false;
          break;
        }
      } else {
        // --- 単一の値なら完全一致チェック ---
        if (cellValue !== String(targetValue)) {
          match = false;
          break;
        }
      }
    }

    // 4. 条件が合致した場合の抽出処理
    if (match) {
      const extractedObject = {};
      extractIndices.forEach(({ key, index }) => {
        let value = row[index];
        
        // 画像URL（Imagesで終わるキー）の配列化処理
        if (key.endsWith('Images') && typeof value === 'string' && value.includes(',')) {
          value = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
        }
        extractedObject[key] = value;
      });
      result.push(extractedObject);
    }
  }

  return result;
}