// PreTwix Script for After Effects
// Gets rid of dead frames in a layer
// Last Updated: 12/22/2025

var layer;
var scriptDir;
var tempDir;
var comp;
var isMac = $.os.indexOf("Mac") !== -1;
var isWindows = $.os.indexOf("Win") !== -1;
var separator = isMac ? "/" : "\\";

(function(thisObj) {
    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ?
            thisObj :
            new Window("palette", "PreTwix", undefined, {
                resizeable: true
            });

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.minimumSize = [200, 150];


        win.add("statictext", undefined, "PreTwix");
        var bigGroup = win.add('group', undefined)
        bigGroup.orientation = 'row';
        var remDFrame = bigGroup.add("button", undefined, "PreTwix Layer");

        // A V frame is a frame that is kept as a reference for the remapped layer
        // to see when the twixtored frames are used up.
        var keepLast = bigGroup.add("checkbox", undefined, "V Frame");
        keepLast.value = true;
        var cleanUpPre = bigGroup.add("checkbox", undefined, "Clean Temp");
        cleanUpPre.value = true;


        win.add("statictext", undefined, "Developer Tools");
        var group1 = win.add('group', undefined)
        group1.orientation = 'row';

        var renFrame = group1.add("button", undefined, "Render"); // Render Frames
        var runAnaly = group1.add("button", undefined, "Analyze"); // Run Analysis
        var applyRemap = group1.add("button", undefined, "Remap"); // Apply Remap

        cleanUp = win.add("button", undefined, "Clean Up Temp Files");
        win.add("statictext", undefined, "Made by Dursc");

        cleanUp.onClick = function() {
            scriptDir = File($.fileName).parent.fsName;
            tempDir = scriptDir + "/PreTwix_Files/PreTwix_temp";
            resetPreTwixTemp(tempDir, true);

        }

        renFrame.onClick = function() {
            app.beginUndoGroup("Render Frames for PreTwix");
            getLayers();

            renderLayerToSequence(comp, layer, tempDir);
            alert("Rendering Complete");
            app.endUndoGroup();
        }

        applyRemap.onClick = function() {
            app.beginUndoGroup("Apply Time Remap");
            getLayers();

            applyTimeRemap(layer, tempDir, keepLast.value);

            alert("Time Remap Applied");
            app.endUndoGroup();
        }
        runAnaly.onClick = function() {
            getLayers();

            runPythonAnalysis(scriptDir, tempDir);

            alert("Analysis Complete");
        }


        remDFrame.onClick = function() {
            app.beginUndoGroup("Remove Dead Frames - Render");

            getLayers();

            resetPreTwixTemp(tempDir);

            renderLayerToSequence(comp, layer, tempDir);
            app.endUndoGroup();

            app.beginUndoGroup("Remove Dead Frames - Analysis, Remap");
            runPythonAnalysis(scriptDir, tempDir);
            applyTimeRemap(layer, tempDir, keepLast.value);

            if (cleanUpPre.value) {
                resetPreTwixTemp(tempDir, false);
            }

            app.endUndoGroup();
        };

        win.layout.layout(true);
        return win;
    }

    var ui = buildUI(thisObj);
    if (ui instanceof Window) ui.show();

})(this);

// Gets the currently selected layer and sets up script and temp directories
function getLayers() {
    comp = app.project.activeItem;
    if (!(comp instanceof CompItem) || comp.selectedLayers.length === 0) {
        alert("Select a layer first.");
        return;
    }

    layer = comp.selectedLayers[0];
    if (layer.timeRemapEnabled) {
        layer.timeRemapEnabled = false;
    }
    scriptDir = File($.fileName).parent.fsName;

    // untested code starts here
    tempDir = Folder.myDocuments.fsName + separator + "PreTwix_Temp";
    
    // Create the temp directory if it doesn't exist
    var tempFolder = new Folder(tempDir);
    if (!tempFolder.exists) {
        tempFolder.create();
    }
    copyFileToTemp(scriptDir + separator + "analyze_frames.py", tempDir + separator + "analyze_frames.py");
    // untested code ends here, next line should be uncommented to use original temp dir

    //tempDir = scriptDir + "/PreTwix_Files/PreTwix_temp"; 
}
function copyFileToTemp(sourcePath, destPath) {
    var sourceFile = new File(sourcePath);
    var destFile = new File(destPath);

    if (sourceFile.exists && !destFile.exists) {
        sourceFile.copy(destFile);
        $.writeln("Copied " + sourceFile.name + " to temp directory");
    } else {
        $.writeln("Source file does not exist: " + sourceFile.fsName);
    }
}

// Renders the specified layer of the composition to a PNG sequence in the output directory
function renderLayerToSequence(comp, layer, outputDir) {
    var rq = app.project.renderQueue.items.add(comp);
    rq.timeSpanStart = layer.inPoint;
    rq.timeSpanDuration = layer.outPoint - layer.inPoint;

    var om = rq.outputModule(1);

    // untested code starts here
    tempDir = Folder.myDocuments.fsName + separator + "PreTwix_Temp";
    om.file = new File(tempDir + separator + "frames_[####].png");

    // untested code ends here, next line should be uncommented to use original output dir
    //om.file = new File(outputDir + "/frames_[####].png");
    om.applyTemplate("PNG Sequence");

    rq.render = true;
    app.project.renderQueue.render();
}

// Runs the external Python script to analyze the rendered frames
function runPythonAnalysis(scriptDir, tempDir) {
    var pythonPath;
    //var script = '"' + scriptDir + '/PreTwix_Files/analyze_frames.py"';
    // untested code
    var script = '"' + tempDir + (isMac ? "/" : "\\") + 'analyze_frames.py"';

    if (isWindows) {
        // Try Python Launcher with specific version first
        pythonPath = "py -3.11";
        var cmd = pythonPath + " " + script + " " + '"' + tempDir + '"';
        $.writeln("Attempting: " + cmd);
        var result = system.callSystem(cmd);

        if (result !== 0) {
            // Fallback to findPython
            pythonPath = findPython();
            cmd = pythonPath + " " + script + " " + '"' + tempDir + '"';
            $.writeln("Fallback: " + cmd);
            system.callSystem(cmd);
        }
        
    } else {
        // Mac/Linux: try versioned commands
        pythonPath = "python3.11";
        var cmd = pythonPath + " " + script + " " + '"' + tempDir + '"';
        $.writeln("Attempting: " + cmd);
        var result = system.callSystem(cmd);

        if (result !== 0) {
            // Fallback to findPython
            pythonPath = findPython();
            cmd = pythonPath + " " + script + " " + '"' + tempDir + '"';
            $.writeln("Fallback: " + cmd);
            system.callSystem(cmd);
        }
    }
}

// Applies time remapping to the given layer based on dead frames identified in deadFrames.json
function applyTimeRemap(layer, tempDir, keepLast) {
    var file = new File(tempDir + "/deadFrames.json");
    file.open("r");
    var raw = file.read();

    // Remove BOM if present
    if (raw.charCodeAt(0) === 0xFEFF) {
        raw = raw.substring(1);
    }

    var dead = eval(raw);
    var deadLookup = {};

    for (var i = 0; i < dead.length; i++) {
        deadLookup[Number(dead[i]) - 1] = true;
    }
    file.close();
    var frameDur = layer.containingComp.frameDuration;
    var totalFrames = Math.floor((layer.outPoint - layer.inPoint) / frameDur);

    // Enables time remapping and removes all keys except for the first one.
    layer.timeRemapEnabled = true;
    var tr = layer.property("ADBE Time Remapping");
    while (tr.numKeys > 1) tr.removeKey(1);

    var newTime = 0;
    var sourceTime = (layer.inPoint + f * frameDur) - layer.startTime;

    // Loops through all frames and sets keyframes for non-dead frames
    for (var f = 0; f < totalFrames; f++) {
        if (!deadLookup[f]) {
            var sourceTime = (layer.inPoint + f * frameDur) - layer.startTime;
            tr.setValueAtTime(newTime, sourceTime);
            newTime += frameDur;
        }
    }
    // Adds a keyframe for the first frame in the clip
    // I personally use this to see when the twixtored frames are all used up
    // but it can be removed if not needed.
    tr.setValueAtTime(newTime, 0);
    tr.removeKey(tr.numKeys);

    var inPoint = layer.inPoint;
    newTime = keepLast ? newTime + frameDur : newTime;

    // Moves layer to beginning of composition temporarily
    layer.inPoint = 0;
    layer.outPoint = newTime;
    originalFPS = layer.containingComp.frameRate;


    var dur = newTime;
    var originalIndex = layer.index;
    var comp = layer.containingComp;

    // Precomposes the layer to clean up the timeline
    var newComp = comp.layers.precompose(
        [layer.index],
        layer.name + "_PRETWIX",
        true
    );

    // Adjusts the new precomp settings and puts the layer back in place
    var precompLayer = comp.layer(originalIndex);
    newComp.frameRate = originalFPS;
    newComp.duration = dur;
    precompLayer.startTime = inPoint;

}

// Cleans up the temporary directory by deleting generated PNGs and resetting deadFrames.json
function resetPreTwixTemp(tempDir, giveMessage) {
    var dir = new Folder(tempDir);
    if (!dir.exists) {
        alert("Temp directory does not exist.");
        return;
    }

    var files = dir.getFiles();
    var deletedCount = 0;
    var failedCount = 0;

    // Delete all generated frame PNGs except the placeholder
    for (var i = 0; i < files.length; i++) {
        var f = files[i];

        if (f instanceof File && /\.png$/i.test(f.name)) {
            // keep the placeholder frame only
            if (f.name !== "frames_####.png") {
                try {
                    if (f.remove()) {
                        deletedCount++;
                    } else {
                        failedCount++;
                    }
                } catch (e) {
                    failedCount++;
                    $.writeln("Failed to delete: " + f.fsName + " - Error: " + e.toString());
                }
            }
        }
    }

    // Reset the deadFrames.json file
    var deadFile = new File(tempDir + "/deadFrames.json");
    try {
        deadFile.open("w");
        deadFile.write("[]");
        deadFile.close();
        if (giveMessage) {
            alert("Cleanup complete!\nDeleted: " + deletedCount + " files\nFailed: " + failedCount + " files\nReset deadFrames.json");
        }
    } catch (e) {
        alert("Cleanup complete!\nDeleted: " + deletedCount + " files\nFailed: " + failedCount + " files\nFailed to reset deadFrames.json: " + e.toString());
    }
}

// Tries to find the python executable in common location on Windows and Mac
function findPython() {
    

    var pythonPaths = [];

    if (isMac) {
        pythonPaths = [
            "python3.11",
            "python3.10",
            "python3.9",
            "python3",
            "python",
            "/usr/bin/python3.11",
            "/usr/bin/python3.10",
            "/usr/bin/python3.9",
            "/usr/bin/python3",
            "/usr/bin/python",
            "/usr/local/bin/python3.11",
            "/usr/local/bin/python3.10",
            "/usr/local/bin/python3.9",
            "/usr/local/bin/python3",
            "/usr/local/bin/python",
            "/opt/homebrew/bin/python3.11",
            "/opt/homebrew/bin/python3.10",
            "/opt/homebrew/bin/python3.9",
            "/opt/homebrew/bin/python3",
            "/opt/homebrew/bin/python",
            "/usr/local/opt/python@3.11/bin/python3",
            "/usr/local/opt/python@3.10/bin/python3",
            "/usr/local/opt/python@3.9/bin/python3",
            "/Library/Frameworks/Python.framework/Versions/3.11/bin/python3",
            "/Library/Frameworks/Python.framework/Versions/3.10/bin/python3",
            "/Library/Frameworks/Python.framework/Versions/3.9/bin/python3",
            "~/Library/Python/3.11/bin/python3",
            "~/Library/Python/3.10/bin/python3",
            "~/Library/Python/3.9/bin/python3"
        ];
    } else if (isWindows) {
        pythonPaths = [
            "python3.11",
            "python3.10",
            "python3.9",
            "python",
            "python3",
            "C:/Python311/python.exe",
            "C:/Python310/python.exe",
            "C:/Python39/python.exe",
            "C:/Program Files/Python311/python.exe",
            "C:/Program Files/Python310/python.exe",
            "C:/Program Files/Python39/python.exe",
            "C:/Users/" + $.getenv("USERNAME") + "/AppData/Local/Programs/Python/Python311/python.exe",
            "C:/Users/" + $.getenv("USERNAME") + "/AppData/Local/Programs/Python/Python310/python.exe",
            "C:/Users/" + $.getenv("USERNAME") + "/AppData/Local/Programs/Python/Python39/python.exe",
            "C:/Users/" + $.getenv("USERNAME") + "/AppData/Local/Microsoft/WindowsApps/python3.11.exe",
            "C:/Users/" + $.getenv("USERNAME") + "/AppData/Local/Microsoft/WindowsApps/python3.10.exe",
            "C:/Users/" + $.getenv("USERNAME") + "/AppData/Local/Microsoft/WindowsApps/python3.9.exe",
            "C:/Users/" + $.getenv("USERNAME") + "/AppData/Local/Microsoft/WindowsApps/python.exe",
            "C:/Users/" + $.getenv("USERNAME") + "/AppData/Local/Microsoft/WindowsApps/python3.exe"
        ];
    } else {
        // Fallback for other systems (Linux, etc.)
        pythonPaths = [
            "python3.11",
            "python3.10",
            "python3.9",
            "python3",
            "python",
            "/usr/bin/python3.11",
            "/usr/bin/python3.10",
            "/usr/bin/python3.9",
            "/usr/bin/python3",
            "/usr/bin/python",
            "/usr/local/bin/python3.11",
            "/usr/local/bin/python3.10",
            "/usr/local/bin/python3.9",
            "/usr/local/bin/python3",
            "/usr/local/bin/python"
        ];
    }

    for (var i = 0; i < pythonPaths.length; i++) {
        var testPath = pythonPaths[i];

        // For simple commands, try them directly
        if (testPath === "python" || testPath === "python3") {
            return testPath;
        }

        // Expand ~ to home directory on Mac/Linux
        if (testPath.indexOf("~") === 0 && (isMac || !isWindows)) {
            testPath = testPath.replace("~", $.getenv("HOME"));
        }

        // Check if the file exists
        var f = new File(testPath);
        if (f.exists) {
            $.writeln("Found Python at: " + testPath);
            return testPath;
        }
    }

    // If nothing found, default based on OS
    var defaultCmd = isMac ? "python3" : "python";
    alert("Python not found in common locations.\nMake sure Python is installed and in your system PATH.\nTrying '" + defaultCmd + "' command...");
    return defaultCmd;
}