/**
 * データの型を厳密に検証するデバッグ関数
 * Flutterの InvestigationUnit モデルの要求（String or List<String>）を満たしているかチェックします。
 */
function debugGetRecordResponse() {
  // --- テスト設定 ---
  const TEST_UUID = "W_72207ee1-6097-4dd9-b8d9-4e56ae544b97"; // 検証したい実データのUUID
  
  const e = {
    parameter: {
      mode: "getrecord",
      uuid: TEST_UUID
    }
  };

  try {
    // 実際にAPI(doGet)を実行してレスポンスを取得
    const output = doGet(e);
    const response = JSON.parse(output.getContent());

    if (response.status !== "success") {
      Logger.log("❌ エラーレスポンス: " + response.message);
      if (response.message.includes("見つかりません")) {
        Logger.log("💡 アドバイス: 指定した UUID がスプレッドシートに存在するか確認してください。");
      }
      return;
    }

    const data = response.data;
    
    // 検証ターゲットの設定（Flutterの型定義に準拠）
    // expected: 'string' (単一文字列), 'list' (文字列の配列)
const checkTargets = [
      // --- String型 (IDや管理番号) ---
      { key: 'number', parent: data.unit, name: 'unit.number', expected: 'string' },
      { key: 'buildingNumber', parent: data.overview, name: 'overview.buildingNumber', expected: 'string' },
      { key: 'mapNumber', parent: data.overview, name: 'overview.mapNumber', expected: 'string' },
      { key: 'scale', parent: data.overview, name: 'overview.scale', expected: 'string' },
      { key: 'overallExteriorScore', parent: data.content, name: 'content.overallExteriorScore', expected: 'string' },

      // --- Int型 (数値) ---
      { key: 'surveyCount', parent: data.unit, name: 'unit.surveyCount', expected: 'int' },
      { key: 'floors', parent: data.overview, name: 'overview.floors', expected: 'int' },
      { key: 'exteriorInspectionScore', parent: data.content, name: 'content.exteriorInspectionScore', expected: 'int' },

      // --- List型 (Stringの配列) ---
      { key: 'investigator', parent: data.unit, name: 'unit.investigator', expected: 'list' },
      { key: 'investigatorPrefecture', parent: data.unit, name: 'unit.investigatorPrefecture', expected: 'list' },
      { key: 'investigatorNumber', parent: data.unit, name: 'unit.investigatorNumber', expected: 'list' }
    ];

    Logger.log("========== 📋 Flutter互換性 型チェック開始 ==========");
    
    let allOk = true;

    checkTargets.forEach(target => {
      // 1. 親オブジェクトの存在確認
      if (!target.parent) {
        Logger.log(`⚠️  ${target.name}: 親オブジェクト(unit/overview)が取得データ内に存在しません`);
        allOk = false;
        return;
      }

      const val = target.parent[target.key];
      const typeLabel = typeof val;
      let isValid = false;
      let displayType = typeLabel;

      // 2. 型判定ロジック
      if (target.expected === 'string') {
        // String型であること
        isValid = (typeLabel === 'string');
      } else if (target.expected === 'list') {
        // 配列（List）であり、かつ中身がStringであること
        const isArray = Array.isArray(val);
        const contentIsString = isArray && (val.length === 0 || typeof val[0] === 'string');
        isValid = isArray && contentIsString;
        displayType = isArray ? `List<${typeof val[0]}>` : typeLabel;
      }

      // 3. 結果の出力
      const icon = isValid ? "✅" : "❌";
      Logger.log(`${icon} [${target.name}]`);
      Logger.log(`   期待される型: ${target.expected === 'list' ? 'List<String>' : 'String'}`);
      Logger.log(`   実際の値    : ${JSON.stringify(val)}`);
      Logger.log(`   実際の型    : ${displayType}`);

      if (!isValid) {
        allOk = false;
        Logger.log(`   🚨 問題: ${target.name} が Flutter側で型エラー（Type Mismatch）を起こす可能性があります。`);
      }
    });

    Logger.log("==================================================");
    
    if (allOk) {
      Logger.log("🎉 判定結果: 全ての対象項目が Flutter のモデル通りに構成されています。");
      Logger.log("このデータであればアプリはクラッシュせずにパースできるはずです。");
    } else {
      Logger.log("🚨 判定結果: 型が不一致です！");
      Logger.log("GASの保存処理、または getrecord のレスポンス整形処理を見直してください。");
    }

  } catch (err) {
    Logger.log("❌ 実行エラー: " + err.toString());
    Logger.log("スタックトレース: " + err.stack);
  }
}
