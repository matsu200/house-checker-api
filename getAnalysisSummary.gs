/**
 * スプレッドシートの全データから、複数の集計情報を計算しJSONで返します。
 * 複数のシートのデータを合算して集計します。
 * @param {string[]} sheetNames - 検索対象のシート名の配列
 * @returns {Object} - 集計結果を格納したオブジェクト
 */
//集計機能関連
const MAX_RETRIES = 5;// リトライ設定
const INITIAL_BACKOFF_MS = 1000; // 最初の待機時間 (1秒)

function getAnalysisSummary(sheetNames) {
  Logger.log("getAnalysisSummary: データ集計処理を開始します。対象シート: " + sheetNames.join(', '));
  
  // 初期値の定義
  let totalbuilding = 0;//総建物数
  let checkcomplete = 0;//判定完了数
  let dangerbuilding = 0;//危険建物数
  let checkwaiting = 0;//判定待ち建物数
  const workercount = {};//各判定士の判定数
  const checksituation = { red: 0, yellow: 0, green: 0,"値なし": 0 };//各判定結果数
  const regionanalysis = {};//エリアごとの判定情報
  const dateAnalysis = {};//日別判定件数
  
  // 各シートのデータをループ処理
  for (const sheetName of sheetNames) {
      const { header, dataRows } = getBuildingSurveyData(sheetName);
      
      if (dataRows.length === 0) continue;

      // ヘッダーインデックスをシートごとに取得
      const indices = {
        number: header.indexOf('number'),
        overallscore: header.indexOf('overallScore'),
        surveyCount: header.indexOf('surveyCount'),
        investigator: header.indexOf('investigator'),
        date: header.indexOf('date'),
        cityward: header.indexOf('generate_cityward'),
        deleteflag: header.indexOf('deleteflag')
      };
      
      // データ行をループして集計を実行
      dataRows.forEach(row => {
          // deleteflagが１になっているレコードを除外する
            if (indices.deleteflag !== -1 && String(row[indices.deleteflag]) === '1') {
                return; // deleteflagが1の場合はこのレコードの集計をスキップ
            }
          totalbuilding++; // 全てのレコードの数を合算

          // ----------------------------------------------------
          // 1. 各種カウント
          // ----------------------------------------------------


          const scoreValue = String(row[indices.overallscore] || "").trim().toLowerCase();//小文字として比較を行う
          //カウントする条件の指定
          const isRedOrYellow = (scoreValue === 'red' || scoreValue === 'yellow');
          const hasOverallScore = (scoreValue === 'ured' || scoreValue === 'uyellow' ||scoreValue==='ugreen');
          const hasOverallScore2= (scoreValue === 'red' || scoreValue === 'yellow' ||scoreValue==='green');

          if (isRedOrYellow) { dangerbuilding++; }//危険建物のカウント
          if (hasOverallScore) { checkwaiting++; }//判定未確定のカウント
          if (hasOverallScore2) { checkcomplete++; }//判定完了数のカウント


          // ----------------------------------------------------
          // 2. 調査者別レコード数 
          // ----------------------------------------------------
          //判定士名を取得、カウント
          const investigatorRaw = row[indices.investigator];
          try {
            const investigators = JSON.parse(investigatorRaw);
            if (Array.isArray(investigators)) {
              investigators.forEach(inv => {
                const invName = String(inv).trim();
                workercount[invName] = (workercount[invName] || 0) + 1;
              });
            } else {
              const invName = String(investigatorRaw).trim();
              workercount[invName] = (workercount[invName] || 0) + 1;
            }
          } catch (e) {
            const invName = String(investigatorRaw).trim();
            workercount[invName] = (workercount[invName] || 0) + 1;
          }

          // ----------------------------------------------------
          // 3. checksituation
          // ----------------------------------------------------
          //危険、注意、安全、未判定の４項目をカウント
          if (scoreValue === 'red') {
            checksituation.red++; 
          } else if (scoreValue === 'yellow') {
            checksituation.yellow++;
          } else if (scoreValue == 'green'){
            checksituation.green++;
          } else if (scoreValue === 'uRed'||'uYellow'||'uGreen') {
            checksituation["値なし"]++;
          }

// ----------------------------------------------------
// 4. 日付別レコード数
// ----------------------------------------------------
//日付ごとに判定結果数を集計
          const dateRaw = row[indices.date];

          if (dateRaw) {
            try {
              const dateObj = new Date(dateRaw);
              if (!isNaN(dateObj)) {
                const dateKey = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "yyyy-MM-dd");//日付として情報が正確かどうかチェックを行いdateを文字列化して配列情報を追加

                if (!dateAnalysis[dateKey]) {
                    dateAnalysis[dateKey] = { totalbuilding: 0, checkcomplete: 0 };//配列の初期化
                }

                // 日別の建物総数 (totalbuilding) をカウント
                dateAnalysis[dateKey].totalbuilding++; 

                // 日別の判定完了件数 (checkcomplete) をカウント
                if (hasOverallScore2) { 
                    dateAnalysis[dateKey].checkcomplete++;
                }
              }
            } catch (e) {
              Logger.log(`日付解析エラー: ${dateRaw}`);
            }
          }
          // ----------------------------------------------------
          // 5. 都道府県別集計
          // ----------------------------------------------------
          //住所から取得したヘッダcitywardごと集計
          const citywardRaw = row[indices.cityward];
          let citywardName = 'その他/値なし';
          try {
            
            const citywards = JSON.parse(citywardRaw);
            if (Array.isArray(citywards) && citywards.length > 0) {//citywardを文字列化して配列情報を追加
              citywardName = String(citywards[0]).trim();
            } else if (typeof citywardRaw === 'string' && citywardRaw.trim() !== '') {
                citywardName = citywardRaw.trim();
            }
          } catch (e) {
             if (typeof citywardRaw === 'string' && citywardRaw.trim() !== '') {
                citywardName = citywardRaw.trim();
             }
          }
          
          if (!regionanalysis[citywardName]) { 
            regionanalysis[citywardName] = { 
              totalbuilding: 0,
              checkcomplete: 0, 
              dangerbuilding: 0,
              checkwaiting: 0 
            };
          }
          
          // 都道府県別の各種カウントを更新 (合算)
          regionanalysis[citywardName].totalbuilding++;
          if (hasOverallScore2) { regionanalysis[citywardName].checkcomplete++; }
          if (isRedOrYellow) { regionanalysis[citywardName].dangerbuilding++; }
          if (hasOverallScore) { regionanalysis[citywardName].checkwaiting++;}


      }); // dataRows.forEach 終了
  } // sheetNamesループ終了

  // ----------------------------------------------------
  // 6. 比率の計算 (合算結果から計算) 
  // ----------------------------------------------------
  //判定結果割合の計算
  const completionRatioTotal = (totalbuilding > 0) ? (checkcomplete / totalbuilding) * 100 : 0; 
  const dangerRatioCompleted = (checkcomplete > 0) ? (dangerbuilding / checkcomplete) * 100 : 0;

  // checksituationの比率計算 (新規追加)
  const checksituationRatio = {};
  if (totalbuilding > 0) {
    // 各スコアの比率を計算し、小数点第2位まで丸める
    checksituationRatio.red = parseFloat(((checksituation.red / totalbuilding) * 100).toFixed(2));
    checksituationRatio.yellow = parseFloat(((checksituation.yellow / totalbuilding) * 100).toFixed(2));
    checksituationRatio.green = parseFloat(((checksituation.green / totalbuilding) * 100).toFixed(2));
    checksituationRatio.noValue = parseFloat(((checksituation["値なし"] / totalbuilding) * 100).toFixed(2));
  } else {
     // totalbuildingが0の場合のデフォルト値
    checksituationRatio.red = 0;
    checksituationRatio.yellow = 0;
    checksituationRatio.green = 0;
    checksituationRatio.noValue = 0;
  }

  // ----------------------------------------------------
  // 7. 結果の整形 
  // ----------------------------------------------------

//都道府県別の各種カウントの降順ソート -------------------------------------------
const regionEntries = Object.entries(regionanalysis);
regionEntries.sort(([, a], [, b]) => b.totalbuilding - a.totalbuilding);
const otherIndex = regionEntries.findIndex(([key]) => key === 'その他/値なし');
if (otherIndex !== -1) {
    const otherEntry = regionEntries.splice(otherIndex, 1)[0];
    regionEntries.push(otherEntry);
}
const formattedRegionAnalysis = Object.fromEntries(regionEntries);
//---------------------------------------------------------------------------

//8日間のデータ集計----------------------------------------------------------------
const today = new Date();
const timeZone = Session.getScriptTimeZone();
const latest8DateAnalysis = {};
const { previousTotal, previousCheckComplete } = getPreviousCumulativeData(dateAnalysis, today, timeZone);
// 2. 現在日を最終日として、8日前の日付（startDay）までを計算する
// 8日間は、今日を含めて今日から-7日前まで (i=0が今日、i=7が7日前)
for (let i = 7; i >= 0; i--) { // 期間を7日間 (i=6まで) から 8日間 (i=7まで) に変更
    // 現在日のクローンを作成
    const currentDate = new Date(today.getTime());
    currentDate.setDate(today.getDate() - i); 
    
    // yyyy-MM-dd形式のキーを生成
    const dateKey = Utilities.formatDate(currentDate, timeZone, "yyyy-MM-dd");
    
    // 3. 生成した日付キーを使い、データがあればその値、なければデフォルト値（0）を設定する
    if (dateAnalysis[dateKey]) {
        // データがある場合: 既存の集計結果を使用
        latest8DateAnalysis[dateKey] = dateAnalysis[dateKey];
    } else {
        // データがない場合: totalbuilding, checkcomplete を 0 で埋める
        latest8DateAnalysis[dateKey] = { totalbuilding: 0, checkcomplete: 0 };
    }
}
//累計情報加算処理
const sortedKeys = Object.keys(latest8DateAnalysis).sort();
const finalDateAnalysis = {};
let cumulativeTotal = previousTotal; 
let cumulativeCheckComplete = previousCheckComplete;
sortedKeys.forEach(key => {
    const dailyTotalFromData = latest8DateAnalysis[key].totalbuilding;
    const dailyCheckCompleteFromData = latest8DateAnalysis[key].checkcomplete;
    cumulativeTotal += dailyTotalFromData; // 累計値を加算
    cumulativeCheckComplete += dailyCheckCompleteFromData; // 累積完了件数を加算
    finalDateAnalysis[key] = {
        // 累積総数 (totalbuilding)
        totalbuilding: cumulativeTotal, 
        // 累積判定完了件数 (checkcomplete)
        checkcomplete: cumulativeCheckComplete
}
});
//-----------------------------------------------------------------------



  // ----------------------------------------------------
  // 8. 最終的な戻り値の調整
  // ----------------------------------------------------
  return {
    totalbuilding: totalbuilding,//総建物数
    checkcomplete: checkcomplete,//判定完了数
    dangerbuilding: dangerbuilding,//危険建物数
    checkwaiting: checkwaiting,//判定待ち数
    completionRatioTotal: parseFloat(completionRatioTotal.toFixed(2)),//全体進捗の割合
    dangerRatioCompleted: parseFloat(dangerRatioCompleted.toFixed(2)),//redとyellowの割合
    workercount: workercount,//判定士ごとの判定数
    checksituation: checksituation,//各判定結果数
    checksituationRatio: checksituationRatio,//各判定結果の割合
    dateAnalysis: finalDateAnalysis,//日別判定件数
    regionanalysis: formattedRegionAnalysis//エリアごとの判定数
  };
}


/**
 * 指定されたシートからヘッダーとデータ行を全て取得します。
 * 429エラー対策として、指数関数的バックオフによるリトライ処理を実装しています。
 * @param {string} sheetName - 取得対象のシート名
 * @returns {{header: string[], dataRows: Array[]}} - ヘッダー配列とデータ行配列
 */
function getBuildingSurveyData(sheetName) {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('【')) {
    throw new Error("SPREADSHEET_IDが設定されていません。");
  }

  let lastError;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        // シートが存在しない場合はリトライせず即座にエラー
        throw new Error(`シート「${sheetName}」が見つかりません。`);
      }
      
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) {
        return { header: [], dataRows: [] };
      }

      const header = values[0];
      const dataRows = values.slice(1);
      return { header, dataRows }; // 成功したら結果を返す

    } catch (error) {
      lastError = error;
      // 429エラーまたは一時的なエラーの場合のみリトライ
      if (error.message.includes('Service invoked too many times') || error.message.includes('Spreadsheet timed out') || error.message.includes('429')) {
        const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, i);
        Logger.log(`リトライ ${i + 1}/${MAX_RETRIES}: ${error.message}. ${backoffTime / 1000}秒待機します...`);
        Utilities.sleep(backoffTime);
      } else {
        // その他の致命的なエラーはリトライせずスロー
        throw error;
      }
    }
  }

  // 最大リトライ回数を超えた場合は、最後に発生したエラーをスロー
  throw new Error(`最大リトライ回数を超えました。最後に発生したエラー: ${lastError.message}`);
}

//直近８日間以前の全期間の累計情報計算
/**
 * 直近8日間の開始日より前の全期間の累積合計を計算します。
 * @param {Object} dateAnalysis - 日付別の集計データ ({'yyyy-MM-dd': {totalbuilding: N, checkcomplete: M}})
 * @param {Date} today - 現在の日付オブジェクト
 * @param {string} timeZone - スクリプトのタイムゾーン
 * @returns {{previousTotal: number, previousCheckComplete: number}} - 直近8日以前の累積データ
 */
function getPreviousCumulativeData(dateAnalysis, today, timeZone) {
  // 直近8日間の開始日 (今日から8日前の日付) を計算
  const startOf8Days = new Date(today.getTime());
  startOf8Days.setDate(today.getDate() - 7); // i=7までが8日間なので、その前の日付は9日前
  
  // yyyy-MM-dd形式で8日間の開始日を取得 (この日付以降は直近8日間として扱う)
  const startDayKey = Utilities.formatDate(startOf8Days, timeZone, "yyyy-MM-dd");

  let previousTotal = 0;
  let previousCheckComplete = 0;

  // dateAnalysisのキーを日付昇順でソート
  const allDatesSorted = Object.keys(dateAnalysis).sort();

  for (const dateKey of allDatesSorted) {
      // 累積計算を始める前の日付（8日間の開始日よりも前）を判定
      if (dateKey < startDayKey) {
          previousTotal += dateAnalysis[dateKey].totalbuilding;
          previousCheckComplete += dateAnalysis[dateKey].checkcomplete;
      } else {
          // 日付が startDayKey 以上になったらループを終了
          break;
      }
  }

  return { previousTotal, previousCheckComplete };
}