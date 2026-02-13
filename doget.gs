/**
 * スプレッドシートからデータを取得するためのGETリクエストを処理します。
 * クエリパラメータ: 
 * mode: 実行したい検索の種類を指定 ('lat_lng_search' または 'exact_match')
 * sheetName: 検索対象のシート名をカンマ区切りで複数指定可能 (例: "Sheet1,Sheet2")
 * @param {Object} e - GETリクエストのイベントオブジェクト
 * @returns {GoogleAppsScript.Content.TextOutput} - 応答メッセージ (JSON形式)
 */
function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);//json情報を受け取るための処理

//ログオン認証のトークン処理
//---------------------------------------------
  const token = e.parameter.token;//tokenパラメータの取得
if(token) {
  if (!token) {
    return createHtmlOutput("エラー", "認証トークンが指定されていません。", "#cc0000");
  }


  const authData = retrieveTempAuthData(token);

  if (!authData) {
    // 認証失敗（トークンが見つからない、または期限切れ）
    return createHtmlOutput("認証失敗", "認証トークンが無効であるか、有効期限が切れています。", "#cc0000");
  }

  try {
    // 認証成功 -> スプレッドシートに保存/更新
    const result = saveUserDataToSpreadsheet(authData.email, authData.hashedPassword, USER_SHEET_NAME,authData.userRole,authData.user_name,authData.admin_number,authData.admin_city);
    
    let message = "";
    if (result === "updated") {
       message = `ユーザー: ${authData.email} のパスワードが更新されました。認証が完了しました。`;
    } else {
       message = `ユーザー: ${authData.email} の登録が完了し、データがスプレッドシート「${USER_SHEET_NAME}」に保存されました。`;
    }

    // 成功時、html画面を返す
    return createHtmlOutput(
      "認証完了", 
      message, 
      "#008000"
    );
  //エラー処理
  } catch (error) {
    Logger.log("doGet - Save Error: " + error.toString());
    return createHtmlOutput("エラー", `データ保存中にエラーが発生しました: ${error.message}`, "#cc0000");
  }
}
//---------------------------------------------

  try {
    const params = e.parameter;//パラメータ統合
    const mode = params.mode;  //パラメータ統合

    
    //変数を定義
    let resultData;
    let sheetNames;
    let combinedResults = [];
    let conditions;
    let extractKeys;
    let name;
    let currentResult;
    let latKey;
    let lngKey;

    switch (mode) {//?mode="???"によって処理を分岐
      
      // 緯度・経度による範囲検索
      case 'lat_lng_search':
        // 必須パラメータのバリデーション
        if (!params.extractKeys || isNaN(parseFloat(params.lat)) || isNaN(parseFloat(params.lng))) {
          throw new Error("緯度経度検索に必要なパラメータ (lat, lng, extractKeys) が不足しているか、数値形式が正しくありません。");
        }
        sheetNames =ALL_DATA_SHEET_NAMES;//対象シート指定
        latKey =  'latitude'; //端末の座標緯度
        lngKey =  'longitude';//端末の座標経度
        rangeValue = parseFloat(params.range || '5'); //rangeの指定がない場合デフォルト5m
        keysToExtract = params.extractKeys.split(',').map(key => key.trim());//カンマ区切りを配列に変換

        // 各シートに対してループを実行し結果を結合
        for (name of sheetNames) {
            currentResult = searchByLatLonRange(
              name, 
              parseFloat(params.lat),
              parseFloat(params.lng),
              rangeValue,
              latKey,
              lngKey,
              keysToExtract
            );
            combinedResults.push(...currentResult);
        }
        resultData = combinedResults;
        break;
        //集計した全情報から分析
      case 'Analysis/total':
        sheetNames =ALL_DATA_SHEET_NAMES;
        resultData = getAnalysisSummary(sheetNames);
        break;
      //応急危険度判定待ち物件一覧
      case 'checkwaiting_list':
        sheetNames=ALL_DATA_SHEET_NAMES;
        conditions={overallScore:["uRed","uYellow","uGreen"]};//対象のヘッダと条件
        extractKeys=['uuid','generalpostflag','postusername','date','buildingtype','address','latitude','longitude','buildingName','buildingUse','overallScore'];//取得するヘッダ
        // 各シートに対してループを実行し結果を結合
        for (name of sheetNames) {
            currentResult = getDataToSpreadsheet(
              name, 
              conditions,
              extractKeys
            );
            combinedResults.push(...currentResult);
        }
        resultData = combinedResults;
        break; 
      //応急危険度判定完了物件一覧
      case 'checkcomplete_list':
        sheetNames=ALL_DATA_SHEET_NAMES;
        conditions={overallScore:["red", "yellow", "green"]};//対象のヘッダと条件
        extractKeys=['uuid','generalpostflag','postusername','date','buildingtype','address','latitude','longitude','buildingName','buildingUse','overallScore'];//取得するヘッダ
        // 各シートに対してループを実行し結果を結合
        for (name of sheetNames) {
            currentResult = getDataToSpreadsheet(
              name, 
              conditions,
              extractKeys
            );
            combinedResults.push(...currentResult);
        }
        resultData = combinedResults;
        break; 
        //一般投稿された情報の一覧
      case 'generalpost_list':
        sheetNames=ALL_DATA_SHEET_NAMES;
        conditions = {
        generalpostflag: "1",
        //overallScore:["uRed","uYellow","uGreen"]
    };//対象のヘッダと条件
        keysToExtract=['uuid','generalpostflag','postusername','date','buildingtype','address','latitude','longitude','buildingName','buildingUse','overallScore'];//取得するヘッダ
        // 各シートに対してループを実行し結果を結合
        for (name of sheetNames) {
            currentResult = getDataToSpreadsheet(
              name, 
              conditions,
              keysToExtract
            );
            combinedResults.push(...currentResult);
        }
        resultData = combinedResults;
      break;
      //一般投稿された情報の位置情報をもとに周辺の情報のみを表示
      case 'generalpost_search':
        if (!params.extractKeys || isNaN(parseFloat(params.lat)) || isNaN(parseFloat(params.lng))) {
          throw new Error("緯度経度検索に必要なパラメータ (lat, lng, extractKeys) が不足しているか、数値形式が正しくありません。");
        }
        sheetNames =ALL_DATA_SHEET_NAMES;
        latKey =  'latitude'; 
        lngKey =  'longitude';
        rangeValue = parseFloat(params.range || '5'); 
        keysToExtract = params.extractKeys.split(',').map(key => key.trim());

        // 各シートに対してループを実行し結果を結合
        for (name of sheetNames) {
            currentResult = getuserpost_search(
              name, 
              parseFloat(params.lat),
              parseFloat(params.lng),
              rangeValue,
              latKey,
              lngKey,
              keysToExtract
            );
            combinedResults.push(...currentResult);
        }
        resultData = combinedResults;
      break;
      //判定情報レコードの取得
      case 'getrecord':
      const postData = getrecord(params.uuid);//パラメータからuuidを取得
      resultData = postData;
      break;

      //完全一致検索
      case 'exact_match':
        if (!params.searchConditions || !params.extractKeys) {
          throw new Error("完全一致検索に必要なパラメータ (searchConditions, extractKeys) が不足しています。");
        }
        
        sheetNames =ALL_DATA_SHEET_NAMES;
        conditions = JSON.parse(params.searchConditions);
        extractKeys = params.extractKeys.split(',').map(key => key.trim());

        // 各シートに対してループを実行し結果を結合
        for (name of sheetNames) {
            currentResult = getDataToSpreadsheet(
              name, 
              conditions,
              extractKeys
            );
            combinedResults.push(...currentResult);
        }
        resultData = combinedResults;
        break;

      //  不明なモード
      default:
        throw new Error(`不明なモードが指定されました: ${mode}。`);
    }

    let response = { 
      status: "success", 
      mode_executed: mode,
      sheets_queried: sheetNames
    };

    output.setContent(JSON.stringify(response));

  } catch (error) {
    // エラー応答の作成
    const response = { status: "error", message: "データ処理中にエラーが発生しました: " + error.message };
    output.setContent(JSON.stringify(response));
    Logger.log("データ処理エラー: " + error.message + " スタック: " + error.stack);
  }

  return output;
}