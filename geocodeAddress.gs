/**
 * 単一のレコード（行）に対してジオコーディングを実行し、座標をスプレッドシートに書き込みます。
 *
 * @param {string} sheetName - 処理対象のシート名
 * @param {number} rowNumber - 処理対象の行番号 (1ベース, ヘッダー行は 1)
 * @param {string} addressValue - ジオコーディングを行う住所文字列
 * @param {string} latKey - 緯度を記録する列のヘッダー名
 * @param {string} lngKey - 経度を記録する列のヘッダー名
 */
function geocodeAddress(sheetName, rowNumber, addressValue, citywardKey, latKey, lngKey) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log(`エラー: シート「${sheetName}」が見つかりません。`);
    return false;
  }
  
  // 住所が空の場合は処理スキップ
  if (!addressValue || rowNumber <= 1) { // 1行目（ヘッダー）はスキップ
      Logger.log(`ジオコーディングスキップ (行${rowNumber}): 住所がないか、ヘッダー行です。`);
      return false;
  }

  // ヘッダー行を取得してインデックスを特定
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const latCol = header.indexOf(latKey);
  const lngCol = header.indexOf(lngKey);
  const cityWardCol = header.indexOf(citywardKey);
  
  // 緯度・経度キーの列がシートに存在するかチェック
  if (latCol === -1 || lngCol === -1) {
    Logger.log(`エラー: 座標キー「${latKey}」または「${lngKey}」がシートヘッダーに見つかりません。`);
    return false;
  }
  const writeCityWard = (cityWardCol !== -1);
  if (!writeCityWard) {
    Logger.log(`警告: 市/郡/区キー「${citywardKey}」がシートヘッダーに見つかりません。抽出結果の書き込みはスキップされます。`);
  }

  // 座標を取得
  const coords = getLatLonFromAddress(addressValue);

  if (coords) {
    // スプレッドシートの行番号と列インデックスをセル範囲の指定 (1ベース) に変換
    const latCell = sheet.getRange(rowNumber, latCol + 1);
    const lngCell = sheet.getRange(rowNumber, lngCol + 1);
    
    // 書き込み
    latCell.setValue(coords.latitude);
    lngCell.setValue(coords.longitude);
    
    if (writeCityWard) {
        const cityWardResult = extractCityWard(addressValue); 
        const cityWardCell = sheet.getRange(rowNumber, cityWardCol + 1);
        cityWardCell.setValue(cityWardResult);
        Logger.log(`ジオコーディング・抽出成功 (行${rowNumber})。市/郡/区: ${cityWardResult}`);
    }


    Logger.log(`ジオコーディング成功 (行${rowNumber})。座標を記録しました。`);
    return true;
  } else {
    Logger.log(`ジオコーディング失敗 (行${rowNumber})。住所: ${addressValue}`);
    return false;
  }
}


/**
 * 指定された住所文字列から緯度・経度を取得します。
 * @param {string} address - ジオコーディングを行う住所文字列
 * @returns {Object|null} - {latitude: number, longitude: number} のオブジェクト、または null
 */
function getLatLonFromAddress(address) {
  if (!address) return null;
  
  try {
    const geocoder = Maps.newGeocoder();
    const response = geocoder.geocode(address);
    
    if (response.status !== 'OK' || response.results.length === 0) {
      Logger.log('ジオコーディング失敗 (住所: ' + address + ')。ステータス: ' + response.status);
      return null;
    }
    
    const location = response.results[0].geometry.location;
    
    return {
      latitude: location.lat,
      longitude: location.lng
    };
    
  } catch (e) {
    Logger.log('ジオコーディング中にエラーが発生しました: ' + e.toString());
    return null;
  }
}


/**
 * 緯度・経度の値から住所を取得し、指定されたセルに書き込みます。
 * * @param {string} sheetName - 処理対象のシート名
 * @param {number} rowNumber - 処理対象の行番号 (1ベース)
 * @param {number} latitude - 緯度データ (数値)
 * @param {number} longitude - 経度データ (数値)
 * @param {string} addressKey - 住所を書き込む列のヘッダー名
 * @returns {boolean} - 処理が成功した場合 true
 */
function reversegeocodeAddress(sheetName, rowNumber, latitude, longitude, addressKey, cityWardKey) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet || rowNumber <= 1) return false;

    // ヘッダー行を取得して住所キーのインデックスを特定
    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const addressCol = header.indexOf(addressKey);
    const cityWardCol = header.indexOf(cityWardKey);

    if (addressCol === -1) {
        Logger.log(`エラー: 住所キー「${addressKey}」がシートヘッダーに見つかりません。`);
        return false;
    }
    const writeCityWard = (cityWardCol !== -1);
    if (!writeCityWard) {
        Logger.log(`警告: 抽出結果の書き込みキー「${cityWardKey}」がシートヘッダーに見つかりません。抽出結果の書き込みはスキップされます。`);
    }
    // 座標の有効性チェック
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        Logger.log(`警告: 逆ジオコーディングに必要な座標が数値ではありません。`);
        return false;
    }

    // 逆ジオコーディングを実行
    const addressResult = getAddressFromLatLon(latitude, longitude); // getAddressFromLatLonを呼び出す

    if (addressResult) {
        sheet.getRange(rowNumber, addressCol + 1).setValue(addressResult);
        
        if (writeCityWard) {
            const cityWardResult = extractCityWard(addressResult); 
            sheet.getRange(rowNumber, cityWardCol + 1).setValue(cityWardResult);
            Logger.log(`逆ジオコーディング成功 (行${rowNumber})。住所: ${addressResult}, 抽出結果: ${cityWardResult}`);
        } else {
            Logger.log(`逆ジオコーディング成功 (行${rowNumber})。完全住所を記録しました。`);
        }
        return true;
    } else {
        sheet.getRange(rowNumber, addressCol + 1).setValue("座標からの住所取得失敗");
        Logger.log(`逆ジオコーディング失敗 (行${rowNumber})。`);
        return false;
    }
}

/**
 * 指定された緯度・経度から住所を取得し、生の住所文字列を日本語表記に整形します。
 * * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @returns {string|null} - 整形された住所文字列、または null
 */
function getAddressFromLatLon(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    Logger.log('エラー: 緯度または経度が無効です。');
    return null;
  }
  
  try {
    const geocoder = Maps.newGeocoder();
    geocoder.setLanguage('ja'); // 日本語表記を強制
    
    const response = geocoder.reverseGeocode(latitude, longitude); 
    
    if (response.status !== 'OK' || response.results.length === 0) {
      Logger.log(`逆ジオコーディング失敗 (緯度: ${latitude}, 経度: ${longitude})。`);
      return null;
    }
    
    let formattedAddress = response.results[0].formatted_address; 
    
    if (!formattedAddress) return null;

    // ----------------------------------------------------
    // 整形処理
    // ----------------------------------------------------
    
    // 1. 郵便番号を抽出
    let zipCode = '';
    const zipMatch = formattedAddress.match(/(\d{3}-\d{4})/); 
    if (zipMatch) {
      zipCode = zipMatch[0]; // ハイフン付きの郵便番号
      // 元の文字列から郵便番号と郵便マーク（〒）を削除
      formattedAddress = formattedAddress.replace(zipCode, '').replace('〒', '').trim();
    }
    
    // 2. 「日本」を削除
    formattedAddress = formattedAddress.replace('日本', '').trim();
    
    // 3. カンマ、連続するスペースを削除
    formattedAddress = formattedAddress
        .replace(/,/g, '')  // すべてのカンマを削除
        .replace(/、/g, '')
        .replace(/\s+/g, '')// 連続する空白をすべて削除
        .trim(); 

    // 4. 郵便番号が抽出できた場合のみ、先頭に「〒」を付けて結合
    let finalAddress = formattedAddress;
    if (zipCode) {
        finalAddress = '〒' + zipCode + finalAddress;
    }
    
    return finalAddress.trim(); // 最後の空白も除去
    
  } catch (e) {
    Logger.log('逆ジオコーディング中にエラーが発生しました: ' + e.toString());
    return null;
  }
}

/**
 * 住所文字列から「市/郡」および「区」までの部分を抽出するヘルパー関数
 * (以前の議論で作成した関数を再掲。GASプロジェクトに別途追加が必要です)
 * @param {string} fullAddress - 抽出元の完全な住所文字列
 * @returns {string} - 抽出された市/郡/区の名前 (例: 静岡市葵区)
 */
function extractCityWard(fullAddress) {
  if (!fullAddress) return "";
    
  // 1. 郵便番号と都道府県名を除去
  let address = fullAddress.replace(/〒\d{3}-\d{4}/, '').trim(); // 郵便番号を除去
  // 正規表現: 文字列の先頭から、[都道府県]で終わるまで（非貪欲マッチ*?）を除去
  address = address.replace(/^.+?[都道府県]/, '');      

  // 2. 「市/郡」とその後に続く「区」までを抽出
  // パターン: 市/郡 + 区 のパターン | 市/郡 のパターンの順でマッチ
  const match = address.match(/^(.+?[市郡].+?[区])|^(.+?[市郡])/); 

  if (match) {
    // match[1]：市/郡 + 区 の場合 (例: 静岡市葵区)
    if (match[1]) {
        return match[1];
    } 
    // match[2]：市/郡 のみの場合 (例: 沼津市、田方郡)
    else if (match[2]) {
        return match[2];
    }
  } 

  return "";
}


/**
 * 指定された緯度・経度から住所を取得し、生の住所文字列を日本語表記に整形します。
 * 【郵便番号、カンマ、"日本"を削除し、先頭に"〒"を追加する最終版】
 * * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @returns {string|null} - 整形された住所文字列、または null
 */
function getAddressFromLatLon(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    Logger.log('エラー: 緯度または経度が無効です。');
    return null;
  }
  
  try {
    const geocoder = Maps.newGeocoder();
    geocoder.setLanguage('ja'); // 日本語表記を強制
    
    // 逆ジオコーディングを実行
    const response = geocoder.reverseGeocode(latitude, longitude); 
    
    if (response.status !== 'OK' || response.results.length === 0) {
      Logger.log(`逆ジオコーディング失敗 (緯度: ${latitude}, 経度: ${longitude})。ステータス: ${response.status}`);
      return null;
    }
    
    let formattedAddress = response.results[0].formatted_address; 
    
    if (!formattedAddress) return null;

    // ----------------------------------------------------
    // 整形処理
    // ----------------------------------------------------
    
    // 1. 郵便番号を抽出
    let zipCode = '';
    // 〒や半角/全角スペースが混入している可能性を考慮して処理
    const zipMatch = formattedAddress.match(/(\d{3}-\d{4})/); 
    if (zipMatch) {
      zipCode = zipMatch[0]; // ハイフン付きの郵便番号
      // 元の文字列から郵便番号と郵便マーク（〒）を削除
      formattedAddress = formattedAddress.replace(zipCode, '').replace('〒', '').trim();
    }
    
    // 2. 「日本」を削除
    formattedAddress = formattedAddress.replace('日本', '').trim();
    
    // 3. カンマ、連続するスペースを削除
    formattedAddress = formattedAddress
        .replace(/,/g, '')  // すべてのカンマを削除
        .replace(/、/g, '') // 全角カンマも削除
        .replace(/\s+/g, '')// 連続する空白をすべて削除 (半角・全角対応)
        .trim(); 

    // 4. 郵便番号が抽出できた場合のみ、先頭に「〒」を付けて結合
    let finalAddress = formattedAddress;
    if (zipCode) {
        finalAddress = '〒' + zipCode + finalAddress;
    }
    
    return finalAddress.trim(); // 最後の空白も除去
    
  } catch (e) {
    Logger.log('逆ジオコーディング中にエラーが発生しました: ' + e.toString());
    return null;
  }
}




