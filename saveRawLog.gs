/**
 * 受信した生JSONデータをデバッグログシートに日時と共に保存します。
 * @param {string} rawJson - POSTされたJSONの生文字列
 */
function saveRawLog(rawJson) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID); 
    let sheet = ss.getSheetByName(DEBUG_LOG_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(DEBUG_LOG_SHEET_NAME);
      // ヘッダー行を設定
      sheet.getRange("A1:C1").setValues([["日時", "ステータス", "JSON生データ"]]).setFontWeight("bold");
    }

    // ログ情報（A: 日時, B: ステータス, C: 生JSON文字列）
    const timestamp = new Date();
    // 最初の行には「処理中」または「成功」を意味する仮のステータスを設定します
    const logData = [timestamp, "処理中", rawJson]; 

    // 最終行に追記
    sheet.appendRow(logData);

  } catch (error) {
    // ログシートへの保存に失敗しても、メインの処理は止めない
    Logger.log("ログ保存エラー: " + error.message);
  }
}