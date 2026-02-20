/**
 * Photoshop ExtendScript - 全画像の「背景を削除」バッチ処理
 *
 * 使い方:
 *   Photoshop > ファイル > スクリプト > 参照 > このファイルを選択
 *   または: Photoshop.exe にコマンドラインで渡す
 *
 * 処理内容:
 *   1. 指定フォルダ内の全 .png/.jpg ファイルを開く
 *   2. Photoshop の「背景を削除」(Remove Background) を実行
 *   3. 透過 PNG として上書き保存
 */

// --- 設定 ---
var basePath = "O:/AI_/Claudecode/ramen-road/public/assets/images/";

var folders = [
    "ingredients",
    "characters",
    "customers",
    "soup",
    "backgrounds",
    "ui"
];

// --- メイン処理 ---
var processedCount = 0;
var errorCount = 0;
var errorFiles = [];

for (var f = 0; f < folders.length; f++) {
    var folderPath = basePath + folders[f] + "/";
    var folder = new Folder(folderPath);

    if (!folder.exists) {
        alert("フォルダが見つかりません: " + folderPath);
        continue;
    }

    // PNG と JPG ファイルを取得
    var files = folder.getFiles(function(file) {
        var name = file.name.toLowerCase();
        return name.match(/\.(png|jpg|jpeg)$/) && file instanceof File;
    });

    for (var i = 0; i < files.length; i++) {
        var file = files[i];

        try {
            // ファイルを開く
            var doc = app.open(file);

            // 背景レイヤーを通常レイヤーに変換
            if (doc.activeLayer.isBackgroundLayer) {
                doc.activeLayer.isBackgroundLayer = false;
            }

            // 「背景を削除」(Remove Background) を実行
            // Photoshop CC 2021+ の AI ベース背景削除
            try {
                var desc = new ActionDescriptor();
                executeAction(stringIDToTypeID("autoCutout"), desc, DialogModes.NO);
            } catch (e) {
                // autoCutout が使えない場合、Select Subject + 反転 + 削除で代替
                try {
                    // Select Subject
                    var selectDesc = new ActionDescriptor();
                    selectDesc.putBoolean(stringIDToTypeID("sampleAllLayers"), false);
                    executeAction(stringIDToTypeID("selectSubject"), selectDesc, DialogModes.NO);

                    // 選択範囲を反転
                    executeAction(stringIDToTypeID("inverse"), undefined, DialogModes.NO);

                    // 削除
                    executeAction(stringIDToTypeID("delete"), undefined, DialogModes.NO);

                    // 選択解除
                    executeAction(stringIDToTypeID("deselect"), undefined, DialogModes.NO);
                } catch (e2) {
                    errorFiles.push(file.name + " - " + e2.message);
                    errorCount++;
                    doc.close(SaveOptions.DONOTSAVECHANGES);
                    continue;
                }
            }

            // 透過 PNG として保存
            var pngPath = folderPath + file.name.replace(/\.(jpg|jpeg)$/i, ".png");
            var pngFile = new File(pngPath);

            var pngOpts = new PNGSaveOptions();
            pngOpts.compression = 6;
            pngOpts.interlaced = false;

            doc.saveAs(pngFile, pngOpts, true, Extension.LOWERCASE);
            doc.close(SaveOptions.DONOTSAVECHANGES);

            processedCount++;

        } catch (e) {
            errorFiles.push(file.name + " - " + e.message);
            errorCount++;
            try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch(ex) {}
        }
    }
}

// --- 結果表示 ---
var resultMsg = "背景削除 完了!\n\n";
resultMsg += "処理済み: " + processedCount + " ファイル\n";
resultMsg += "エラー: " + errorCount + " ファイル\n";

if (errorFiles.length > 0) {
    resultMsg += "\n--- エラー詳細 ---\n";
    for (var e = 0; e < errorFiles.length; e++) {
        resultMsg += errorFiles[e] + "\n";
    }
}

alert(resultMsg);
