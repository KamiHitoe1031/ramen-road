/**
 * Photoshop ExtendScript - キービジュアルの背景削除
 */
#target photoshop

app.preferences.rulerUnits = Units.PIXELS;
app.displayDialogs = DialogModes.NO;

var file = new File("O:/AI_/Claudecode/ramen-road/public/assets/images/ui/key_visual.png");
var errors = [];
var success = false;

try {
    var doc = app.open(file);

    try { doc.activeLayer.isBackgroundLayer = false; } catch (e) {}

    try {
        executeAction(stringIDToTypeID("removeBackground"), new ActionDescriptor(), DialogModes.NO);
        success = true;
    } catch (e1) {
        try {
            var desc = new ActionDescriptor();
            desc.putInteger(stringIDToTypeID("sampleAllLayers"), 0);
            executeAction(stringIDToTypeID("autoCutout"), desc, DialogModes.NO);
            doc.selection.invert();
            doc.selection.clear();
            doc.selection.deselect();
            success = true;
        } catch (e2) {
            errors.push(e2.message);
        }
    }

    if (success) {
        var pngOpts = new PNGSaveOptions();
        pngOpts.compression = 6;
        pngOpts.interlaced = false;
        doc.saveAs(file, pngOpts, true, Extension.LOWERCASE);
    }

    doc.close(SaveOptions.DONOTSAVECHANGES);
} catch (e) {
    errors.push(e.message);
    try { app.activeDocument.close(SaveOptions.DONOTSAVECHANGES); } catch (ex) {}
}

var resultFile = new File("O:/AI_/Claudecode/ramen-road/scripts/bg_remove_result.txt");
resultFile.open("w");
resultFile.writeln(success ? "完了: 1/1" : "失敗: " + errors.join(", "));
resultFile.close();

app.quit();
