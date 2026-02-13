
/**
 * 一意なマジック認証トークンを生成します。
 */
function generateMagicToken() {
  return Utilities.getUuid();
}

/**
 * 認証に必要なデータを一時的にキャッシュに保存します。（userRole を追加）
 */
function storeTempAuthData(token, email, hashedPassword, userRole,user_name,admin_number,admin_city) {
  const cache = CacheService.getScriptCache();
  // userRole も JSON に含めて保存
  const data = JSON.stringify({ email: email, hashedPassword: hashedPassword, userRole: userRole ,user_name:user_name,admin_number:admin_number,admin_city:admin_city}); 
  cache.put(token, data, TOKEN_EXPIRY_SECONDS);
}

/**
 * キャッシュから認証データを取得し、取得後すぐに削除します。
 */
function retrieveTempAuthData(token) {
  const cache = CacheService.getScriptCache();
  const dataString = cache.get(token);
  if (dataString) {
    cache.remove(token); 
    // userRole も含めて返す
    return JSON.parse(dataString); 
  }
  return null;
}

/**
 * JSON形式のレスポンスを生成します。（doPostなどで利用）
 */
function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output; 
}

/**
 * HTML形式のレスポンスを生成します。（doGetでの認証成功/失敗画面で利用）
 */
function createHtmlOutput(title, message, color) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; background: #f4f4f4; }
          .container { max-width: 600px; margin: auto; padding: 30px; border-radius: 8px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          h1 { color: ${color}; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <p>${message}</p>
        </div>
      </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html);
}


// ====================================================================

//ユーザ登録

/**
 * ユーザーデータを指定されたシートに保存または更新します。
 * スプレッドシートの列順序を [timestamp, email, role, hashedPassword, user_name, deleteflag, deleteflag_ts] (7列)と仮定します。
 * 既に存在する論理削除済みユーザー（deleteflag=1）は再アクティブ化（deleteflag=0）されます。
 * @param {string} emailAddress - メールアドレス
 * @param {string} hashedPassword - ハッシュ化されたパスワード
 * @param {string} sheetName - 書き込み対象のシート名
 * @param {string} [userRole="一般ユーザー"] - ユーザーの役割（管理者/一般ユーザーなど）
 * @param {string} user_name - ユーザー名
 * @returns {string} 処理内容 ("updated", "reactivated", or "new_entry")
 */
function saveUserDataToSpreadsheet(emailAddress, hashedPassword, sheetName, userRole = "一般ユーザー",user_name,admin_number,admin_city) { 
  if (typeof SPREADSHEET_ID === 'undefined' || SPREADSHEET_ID.includes('【')) {
    throw new Error("SPREADSHEET_IDが設定されていません。");
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID); 
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`シート「${sheetName}」が見つかりません。`);
  }
  
  const timestamp = new Date();
  const lastRow = sheet.getLastRow();
  
  // ユーザーデータが存在する可能性がある場合のみチェックを実行 (ヘッダー行を除く)
  if (lastRow > 1) {
    // 7列分のデータ（タイムスタンプからdeleteflagtimestampまで）を取得
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 9); 
    const allData = dataRange.getValues();
    
    // メールアドレスの重複をチェック
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      const existingEmail = row[1]; // 2列目（インデックス1）にメールアドレスが格納されている
      const currentDeleteFlag = row[7]; // **6**列目（インデックス5）に deleteflag が格納されている
      
      if (existingEmail === emailAddress) {
        // 同じメールアドレスを持つ行が見つかった
        const targetRow = i + 2; 
        
        // 更新する範囲の特定
        const rangeToUpdate = sheet.getRange(targetRow, 1, 1, 9);
        
        if (currentDeleteFlag === 1) {
          
          // 更新値の準備: 役割、パスワード、ユーザー名、タイムスタンプを更新し、deleteflagを0に、deleteflagtimestampを0
          const reactivationValues = [
            timestamp,         // 1. タイムスタンプ
            emailAddress,      // 2. emailAddress (不変)
            hashedPassword,    // 4. hashedPassword (更新)
            userRole,          // 3. userRole (更新)
            user_name,         // 5. user_name (更新)
            admin_number,
            admin_city,
            0,                 // 6. deleteflagを 0 に戻す
            ""                 // 7. deleteflagtimestamp をクリア
          ];
          
          rangeToUpdate.setValues([reactivationValues]);
          Logger.log(`ユーザー ${emailAddress} を再アクティブ化し、パスワード/権限/ユーザー名を更新しました (行: ${targetRow})`);
          return "reactivated"; 
          
        } else {
          // 再登録による情報変更
          
          // 更新する値: 役割とパスワード、ユーザー名
          sheet.getRange(targetRow, 1).setValue(timestamp);          // タイムスタンプ (1列目)
          sheet.getRange(targetRow, 3).setValue(hashedPassword);     // パスワード (4列目)
          sheet.getRange(targetRow, 4).setValue(userRole);           // 権限 (3列目)
          sheet.getRange(targetRow, 5).setValue(user_name);          // ユーザー名 (5列目)
          sheet.getRange(targetRow, 6).setValue(admin_number);
          sheet.getRange(targetRow, 7).setValue(admin_city);  
          
          Logger.log(`アクティブユーザー ${emailAddress} の情報 (パスワード/権限/ユーザー名) を更新しました (行: ${targetRow})`);
          return "updated";
        }
      }
    }
  }

  // 存在しない場合: 新規行としてデータを追加 
  const rowData = [
    timestamp,                 // 1. タイムスタンプ
    emailAddress,              // 2. emailAddress (user_idの代わり)
    hashedPassword,            // 4. hashedPassword
    userRole,                  // 3. user_role (管理者 or 一般ユーザー)
    user_name,                 // 5. user_name (新規追加)
    admin_number,
    admin_city,
    0,                         // 6. deleteflag (初期値 0)
    ""                         // 7. deleteflagtimestamp (初期値 空白/null)
  ];

  sheet.appendRow(rowData);
  Logger.log(`ユーザー ${emailAddress} を新規登録しました。役割: ${userRole}`);
  return "new_entry";
}

// 互換性のためのラッパー関数 
function saveadminDataToSpreadsheet(emailAddress, hashedPassword, sheetName,user_name="未設定",admin_number,admin_city) {
    // 役割は「管理者」として saveUserDataToSpreadsheet を呼び出す
    return saveUserDataToSpreadsheet(emailAddress, hashedPassword, sheetName, "管理者",user_name,admin_number,admin_city);
}

//----------------------------------------------------------------

//dopostから呼び出されるlogon処理
//logonにはメールによる認証処理を求める
/**
 * 管理者認証システムのエントリーポイント。
 * 役割を決定し、マジックリンク認証フローを開始します。
 * @param {Object} adminData - email, password, [admincode] を含むデータオブジェクト
 * @param {string} targetSheetName - データを書き込むシート名 ('users'など) (doPost/doGet以外では利用しないが引数に残す)
 * @returns {Object} 処理結果 (status, message)
 */
function logonsystem(logonData, targetSheetName) {
  const WEB_APP_URL = ScriptApp.getService().getUrl(); 

  try {
    const email = logonData.email;
    const password = logonData.password;
    const adminCode = logonData.admincode; 
    const user_name = logonData.user_name;
    const admin_number=logonData.admin_number;
    const admin_city=logonData.admin_city;

    if (!email || !password ||!user_name) {
      return { status: "error", message: "メールアドレスとパスワードとユーザ名は必須です。" };
    }
    
    // 2. パスワードのハッシュ化
    const hashedPassword = hashPassword(password);
    
    // --- 1. 役割の決定とチェック ---
    let userRole;
    let messagePrefix = "";
    //admincodeに入力がない場合は一般ユーザとして登録
    //admincodeに入力があり間違っている場合はエラーを返す
    if (adminCode === ADMIN_CODE) {
      if (!admin_number || !admin_city) {
        return { 
          status: "error", 
          message: "管理者コードが入力された場合、判定員番号と市名は必須です。" 
        };
      }
      userRole = "管理者";
      
    } else if (!adminCode || adminCode.trim() === "") {
      userRole = "一般";
      messagePrefix = "管理者コードの入力がなかったため、一般ユーザーとして";
      
    } else {
      return { 
          status: "error", 
          message: "管理者コードが無効です。管理者登録を希望しない場合は、管理者コード欄を空欄にしてください。" 
      };
    }

    // 3. 認証トークンの生成と一時保存 (決定した userRole を保存)
    const token = generateMagicToken();
    storeTempAuthData(token, email, hashedPassword, userRole,user_name,admin_number,admin_city); 
    
    // 4. マジックリンクの生成と送信
    const magicLink = `${WEB_APP_URL}?token=${token}`;
    sendVerificationMagicLink(email, magicLink);

    return { 
      status: "success", 
      message: `${messagePrefix}認証メールを ${email} に送信しました。メール内のリンクをクリックして認証を完了してください。`
    };

  } catch (error) {
    Logger.log("logonsystem Error: " + error.toString());
    return { status: "error", message: "認証処理中にエラーが発生しました: " + error.message };
  }
}

/**
 * 認証用マジックリンクを含むメールを送信します。
 */
function sendVerificationMagicLink(email, magicLink) {
  
  if (!email || !magicLink) {
    Logger.log("sendVerificationMagicLink Error: メールアドレスまたはマジックリンクが無効です。");
    throw new Error("メール送信に必要な情報が不足しています。");
  }
  
  const subject = "【重要】応急判定アプリのアカウント認証を完了してください";
  const body = `
    新規アカウント登録を完了するには、以下のリンクをクリックしてください。
    
    有効期限は${TOKEN_EXPIRY_SECONDS / 60}分間です。
    
    リンク: ${magicLink}
    
    このメールに心当たりのない場合は、無視してください。
  `;
  
  try {
    // 自分のアカウントからメールを送信
    GmailApp.sendEmail(email, subject, body);
    Logger.log(`メール送信成功: 宛先 ${email}`);
  } catch (e) {
    Logger.log(`メール送信失敗 (GmailApp): 宛先 ${email}, エラー: ${e.toString()}`);
    throw new Error("メール送信サービスに深刻な問題が発生しています。");
  }
}