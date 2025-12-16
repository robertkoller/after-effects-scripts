(function(thisObj){

function buildUI(thisObj) {
    var win = (thisObj instanceof Panel)
        ? thisObj
        : new Window("palette", "PreTwix", undefined, {resizeable:true});

    var btn = win.add("button", undefined, "Remove Dead Frames");

    btn.onClick = function() {
        app.beginUndoGroup("Remove Dead Frames");

        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem) || comp.selectedLayers.length === 0) {
            alert("Select a layer first.");
            return;
        }

        var layer = comp.selectedLayers[0];
        var scriptDir = File($.fileName).parent.fsName;
        var tempDir = scriptDir + "/temp";

        renderLayerToSequence(comp, layer, tempDir);
        runPythonAnalysis(scriptDir, tempDir);
        applyTimeRemap(layer, tempDir);

        app.endUndoGroup();
    };

    win.layout.layout(true);
    return win;
}

var ui = buildUI(thisObj);
if (ui instanceof Window) ui.show();

})(this);

function renderLayerToSequence(comp, layer, outputDir) {
    var rq = app.project.renderQueue.items.add(comp);
    rq.timeSpanStart = layer.inPoint;
    rq.timeSpanDuration = layer.outPoint - layer.inPoint;

    var om = rq.outputModule(1);
    om.file = new File(outputDir + "/frames_[####].png");
    om.applyTemplate("PNG Sequence");

    rq.render = true;
    app.project.renderQueue.render();
}
function runPythonAnalysis(scriptDir, tempDir) {
    var pythonPath = "python"; // or full path if needed
    var script = '"' + scriptDir + '/analyze_frames.py"';
    var cmd = pythonPath + " " + script + " " + '"' + tempDir + '"';

    system.callSystem(cmd);
}
function applyTimeRemap(layer, tempDir) {
    var file = new File(tempDir + "/deadFrames.json");
    file.open("r");
    var dead = JSON.parse(file.read());
    file.close();

    layer.timeRemapEnabled = true;
    var tr = layer.property("ADBE Time Remapping");

    while (tr.numKeys > 1) tr.removeKey(1);

    var frameDur = layer.containingComp.frameDuration;
    var newTime = 0;

    for (var f = 0; f < tr.maxValue / frameDur; f++) {
        if (dead.indexOf(f) === -1) {
            tr.setValueAtTime(newTime, f * frameDur);
            newTime += frameDur;
        }
    }
}

