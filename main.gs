/**
 * 
 * 
 */
const SPREADSHEET_ID = '1Wq8_4dzG3KSLlZTEtScjdPBIAB92DgR9SIOmmro2PRI'; // データを保存したいスプレッドシートのID
const DRIVE_FOLDER_ID = '1GUyoIF6q3hHPZ2ELix8cIPIVG6HoWoaW'; //データを保存したいDriveのID
const ALL_DATA_SHEET_NAMES =["木造シート","S構造シート","R構造シート"];
const USER_SHEET_NAME = 'user';
const DEBUG_LOG_SHEET_NAME = "jsonログ";
const STRUCTURE_MAP = {
  "W": { sheetName: "木造シート", prefix: "W_" },
  "S": { sheetName: "S構造シート", prefix: "S_" },
  "R": { sheetName: "R構造シート", prefix: "R_" }
};

//ログイン機能関連
// 管理者専用コード (POSTリクエストで送られてくるべきコード)
const ADMIN_CODE = "12345";
// 認証トークンの有効期限 (秒) - 推奨: 300秒 (5分)
const TOKEN_EXPIRY_SECONDS = 300; 