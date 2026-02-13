/**
 * ユーザー認証、登録、データ保存、ユーザーの変更/削除のためのPOSTリクエストを処理します。
 * JSONデータのトップレベルのメインキーで処理を分岐します。
 * @param {Object} e - POSTリクエストのイベントオブジェクト
 * @returns {GoogleAppsScript.Content.TextOutput} - 応答メッセージ (JSON形式)
 */
function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    let response;
    // JSONデータの解析
    if (!e.postData || !e.postData.contents) {
      throw new Error("POSTデータ（JSON）がありません。リクエスト形式を確認してください。");
    }


    //jsonlogの記録------------------------------------------
    const rawContent = e.postData.contents;
    saveRawLog(rawContent);

    //------------------------------------------------------
    const data = JSON.parse(e.postData.contents);


    
    // 1. トップレベルのメインキー（最初のキー）を取得してswitchの判断に使用
    const keys = Object.keys(data);
    if (keys.length === 0) {
        throw new Error("POSTデータが空です。");
    }
    const mainKey = keys[0];

    switch (mainKey) {
//ユーザ情報
//---------------------------------------------------------------------------
      // Case  ユーザー情報の変更
      case 'user_update': {
        const updatePayload = data.user_update;
        const email = updatePayload.email;
        
        if (!email) { 
          throw new Error(`メインキー「${mainKey}」には 'email' が必須です。`); 
        }

        const updateData = { ...updatePayload };
        delete updateData.email;

        if (Object.keys(updateData).length === 0) {
           throw new Error("更新データフィールドがJSONボディに提供されていません。");
        }

        updateUser(email, updateData);
        response = { 
          status: "success", 
          message: `ユーザーID「${userId}」のデータが正常に変更されました。`
        };
        break;
      }
        
      // Case  ユーザーの削除
      case 'user_delete': {
        const deletePayload = data.user_delete;
        const email = deletePayload.email;
        
        if (!email) { 
          throw new Error(`メインキー「${mainKey}」には 'email' が必須です。`); 
        }
        
        deleteUser(email);
        response = { 
          status: "success", 
          message: `ユーザーID「${email}」のデータが正常に削除されました。`
        };
        break;
      }
      
      // Case  ユーザー認証 
      case 'login_data': {
        const { email, password } = data.login_data;
        const authResult = authenticateUser(email, password); 

        if (authResult) {
          response = { 
            status: "success", 
            message: `ログイン成功`,
            user: authResult.user
          };
        } else {
          throw new Error("ユーザー名またはパスワードが間違っています。");
        }
        break;
      }
      // ユーザ登録
      case 'logon_data':{
        const logonData = data.logon_data;
        const targetSheetName=USER_SHEET_NAME;

        logonsystem(logonData,targetSheetName);
        response = { 
    status: "success", 
    message: `認証メールを ${logonData.email} に送信しました。メール内のリンクをクリックして登録を完了してください。` 
  };
        break;
      }
//----------------------------------------------------------------------
//判定項目の挿入
//------------------------------------------------------------------------
      //Case 構造データ削除
      case 'unit_deleteflag':{
       const deletePayload = data.unit_deleteflag; 
       const uuid = deletePayload.uuid;
       const email = deletePayload.email;
       deleteRecordByUuid(uuid,email);
       response = { 
         status: "success", 
         message: `正常にレコードを削除しました。` 
       };
       break;
      //構造データ更新
    }
      // Case 構造データ保存
      case 'investigator_post': {
          let targetSheetName;
          const postdata=data.investigator_post;
          // buildingtypeの値を取得
          const structureType = postdata.unit?.buildingtype || '不明';
          if (structureType =="W"){
              targetSheetName='木造シート';
              post_saveDataToSpreadsheet(postdata, targetSheetName,structureType,0,"","");
          }
          if(structureType =="S"){
            targetSheetName='S構造シート';
            post_saveDataToSpreadsheet(postdata, targetSheetName,structureType,0,"","");
          }
          if(structureType =="R"){
            targetSheetName='R構造シート';
            post_saveDataToSpreadsheet(postdata, targetSheetName,structureType,0,"","");
          }
          response = { status: "success", message: `データ (${structureType}構造) はシート「${targetSheetName}」に保存されました` };
          break;
        }

      //Case 一般投稿された情報保存
      case 'general_post':{
        let targetSheetName;
        const postdata = data.general_post;
        // buildingtypeの値を取得
        const structureType = postdata.unit?.buildingtype || '不明';
        const generalpostflag=1;
        const username = postdata?.postusername || "匿名ユーザー";
          if (structureType =="W"){
              targetSheetName='木造シート';
              post_saveDataToSpreadsheet(postdata, targetSheetName,structureType,generalpostflag, username,"");
          }
          if(structureType =="S"){
            targetSheetName='S構造シート';
            post_saveDataToSpreadsheet(postdata, targetSheetName,structureType,generalpostflag, username,"");
          }
          if(structureType =="R"){
            targetSheetName='R構造シート';
            post_saveDataToSpreadsheet(postdata, targetSheetName,structureType,generalpostflag, username,"");
          }
        response ={ status: "success", message: `データ (${structureType}構造) はシート「${targetSheetName}」に保存されました` };
        break;
      }
      //Case レコードの更新
      case 'update_post':{
          let targetSheetName;
          const postdata=data.update_post;
          // buildingtypeの値を取得
          const structureType = postdata.unit?.buildingtype || '不明';
          const postuuid = postdata?.UUID || postdata?.uuid || "";
          let postflag=null;
          if (structureType =="W"){
              targetSheetName='木造シート';
              post_saveDataToSpreadsheet(postdata, targetSheetName,structureType,postflag,"",postuuid);
          }
          if(structureType =="S"){
            targetSheetName='S構造シート';
            post_saveDataToSpreadsheet(postdata, targetSheetName,structureType,postflag,"",postuuid);
          }
          if(structureType =="R"){
            targetSheetName='R構造シート';
            post_saveDataToSpreadsheet(postdata, targetSheetName,structureType,postflag,"",postuuid);
          }
          response = { status: "success", message: `データ (${structureType}構造) はシート「${targetSheetName}」に保存されました` };
          break;
        }

//--------------------------------------------------------------------------
        //Case どの定義済みキーにも該当しない
        default:{
          // どの定義済みキーにも該当せず、かつ構造データでもない場合
          throw new Error(`不明なメインキーが指定されました: ${mainKey}`);
        }
    } // End of switch
    
    // ------------------------------------------------------------------
    // 成功応答の出力
    // ------------------------------------------------------------------
    output.setContent(JSON.stringify(response));

  } catch (error) {
    // エラー応答の作成
    const response = { status: "error", message: "データ処理中にエラーが発生しました: " + error.message };
    output.setContent(JSON.stringify(response));
    Logger.log("データ処理エラー: " + error.message + " スタック: " + error.stack);
  }

  return output;
}