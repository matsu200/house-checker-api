/**
 * ユーザー名とパスワードを照合し、成功したらユーザー情報を返します。
 * @param {string} userName - ユーザー名
 * @param {string} password - 平文のパスワード（入力されたもの）
 * @returns {Object|null} - 認証成功時はユーザー情報オブジェクト、失敗時はnull
 */
function authenticateUser(email, password) {

  // 1. 入力されたパスワードをハッシュ化
  const inputHashedPassword = hashPassword(password); 

  // 2. スプレッドシートからデータを取得
  // ユーザー名で検索し、保存されているハッシュ値を含むすべての情報を取得
  const searchConditions = { "emailAddress": email };
  const keysToExtract = ["emailAddress", "user_role", "hashedpassword","user_name","admin_number","admin_city","deleteflag"];

  // グローバル変数 USER_SHEET_NAME を使用
  const userDataArray = getDataToSpreadsheet(USER_SHEET_NAME, searchConditions, keysToExtract);

  if (userDataArray.length === 0) {
    return null; // ユーザーが見つからない
  }

  const userRecord = userDataArray[0];
  const savedHashedPassword = String(userRecord.hashedpassword).trim();

  // 3. ハッシュ値の比較
  if (inputHashedPassword === savedHashedPassword) {
    if (userRecord.deleteflag === 1) {
        return { status: "error", message: "このアカウントは削除されています。" };
    }
    // 認証成功: セキュリティのためハッシュ値を削除してから返す
    delete userRecord.hashedpassword;
    delete userRecord.deleteflag;
    return {
        status: "success",
        user: userRecord
    };
  } else {
    return null; // パスワード不一致
  }
}


/**
 * ユーザーのデータを更新します。
 * @param {string} email - 更新対象のユーザーメールアドレス
 * @param {Object} updateData - 更新するキーと値のペア
 */
function updateUser(email, updateData) {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('【')) {
    throw new Error("SPREADSHEET_IDが設定されていません。");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  // グローバル変数 USER_SHEET_NAME を使用
  const sheet = ss.getSheetByName(USER_SHEET_NAME);

  if (!sheet) {
    throw new Error(`シート「${USER_SHEET_NAME}」が見つかりません。`);
  }

  // パスワードのハッシュ化処理を追加
  if (updateData.password) {
    const newHashedPassword = hashPassword(updateData.password); 
    updateData.hashedpassword = newHashedPassword; 
    delete updateData.password; 
    Logger.log(`ユーザーID ${email} のパスワードが更新され、ハッシュ化されました。`);
  }
  
  // 依存関数
  const rowNumber = findUserRowByUserId(sheet, email);
  if (!rowNumber) {
    throw new Error(`ユーザーID「${email}」を持つユーザーが見つかりませんでした。`);
  }
  
  // ヘッダー行を取得
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updateKeys = Object.keys(updateData);
  
  // 更新処理の実行
  for (let i = 0; i < header.length; i++) {
    const headerName = header[i];
    if (updateKeys.includes(headerName)) {
      // 該当の列の値を更新
      sheet.getRange(rowNumber, i + 1).setValue(updateData[headerName]);
    }
  }
}


/**
 * ユーザーのデータをシートから削除します。
 * @param {string} email - 削除対象のユーザーID
 */
function deleteUser(email) {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('【')) {
    throw new Error("SPREADSHEET_IDが設定されていません。");
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  // グローバル変数 USER_SHEET_NAME を使用
  const sheet = ss.getSheetByName(USER_SHEET_NAME);

  if (!sheet) {
    throw new Error(`シート「${USER_SHEET_NAME}」が見つかりません。`);
  }

  // 依存関数
  const rowNumber = findUserRowByUserId(sheet, email);
  if (!rowNumber) {
    throw new Error(`ユーザーID「${email}」を持つユーザーが見つかりませんでした。`);
  }

  // ヘッダー行を取得
    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const deleteFlagIndex = header.indexOf('deleteflag');
    
    if (deleteFlagIndex === -1) {
        throw new Error("ヘッダーに'deleteflag'列が見つかりません。論理削除を実行できません。");
    }
    
    // deleteflag列の列番号 (1ベース)
    const deleteFlagCol = deleteFlagIndex + 1;

    // 対象行のdeleteflag列に「1」を設定
    sheet.getRange(rowNumber, deleteFlagCol).setValue(1);
}


/**
 * 平文のパスワードをSHA-256でハッシュ化し、Base64エンコードします。
 * (updateUser, authenticateUserで使用)
 */
function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return Utilities.base64Encode(digest);
}


/**
 * 指定されたユーザーIDを持つ行を検索し、そのインデックス（1始まりの行番号）を返します。
 * (updateUser, deleteUserで使用)
 */
function findUserRowByUserId(sheet, email) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;
  
  const header = values[0];
  const userIdColIndex = header.indexOf('emailAddress'); 

  if (userIdColIndex === -1) {
    throw new Error(`シート「${sheet.getName()}」にヘッダー「emailAddress」が見つかりません。`);
  }

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][userIdColIndex]) === String(email)) {
      return i + 1; 
    }
  }
  return null;
}

/**
 * 指定されたemailを持つ行を検索し、そのインデックス（1始まりの行番号）を返します。
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 検索対象のシート
 * @param {string} email - 検索するメールアドレス
 * @returns {number | null} - ユーザーIDが見つかった場合は行番号 (1始まり)、見つからない場合はnull
 */
function findUserRowByUserId(sheet, userId) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;
  
  const header = values[0];
  const userIdColIndex = header.indexOf('user_id');

  if (userIdColIndex === -1) {
    throw new Error(`シート「${sheet.getName()}」にヘッダー「user_id」が見つかりません。`);
  }

  // 2行目から最終行までループ
  for (let i = 1; i < values.length; i++) {
    // スプレッドシートの行番号は i + 1
    if (String(values[i][userIdColIndex]) === String(userId)) {
      return i + 1; 
    }
  }
  return null;
}

