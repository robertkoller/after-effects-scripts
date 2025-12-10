var window = new Window("pallete", "SIMPLE LAYERS", undefined);
window.orientation = "column";
var text = window.add("statictext", undefined, "Null Layers");

var group1 = window.add("group", undefined);
group1.orientation = "row";

var addNullBtn = group1.add("button", undefined, "Add Null Layer");

window.add("statictext", undefined, "Adjustment Layers");

var group2 = window.add("group", undefined);
group2.orientation = "row";

var addAdjustBtn = group2.add("button", undefined, "Add Adjustment Layer");
var addOneFramer = group2.add("button", undefined, "1Framer");
addOneFramer.size = [80, 25];

window.add("statictext", undefined, "Solid Layers");

var group3 = window.add("group", undefined);
group3.orientation = "row";

var addSolidBtn = group3.add("button", undefined, "Add Solid Layer");

var solidColor = [0,0,0] // Black
var swatch = group3.add("button", undefined, "");
swatch.preferredSize = [25, 25];

// Draw the color swatch
swatch.onDraw = function () {
    var g = this.graphics;
    var brush = g.newBrush(g.BrushType.SOLID_COLOR, solidColor);
    g.fillPath(brush, g.newPath());
};

swatch.addEventListener("click", function () {
    var picked = app.showColorPicker();
    if (picked) {
        solidColor = picked.slice(); // store new color
        swatch.notify("onDraw"); // repaint
    }
});

addSolidBtn.onClick = function () {
    addSolidLayerWithColor();
};

addOneFramer.onClick = function() {
    addOneFramer();
}

addAdjustBtn.onClick = function() {
    addAdjustmentLayer();
}

addNullBtn.onClick = function() {
    addNullLayerAndParent();
}
function addSolidLayerWithColor() {
    var comp = app.project.activeItem;

    if (comp && comp instanceof CompItem) {
        app.beginUndoGroup("Add Solid Layer");

        // Create the colored solid
        var solid = comp.layers.addSolid(
            solidColor,
            "Solid Layer",
            comp.width,
            comp.height,
            comp.pixelAspect
        );

        // Place it above the selected layer if one is selected
        if (comp.selectedLayers.length > 0) {
            moveAndTrimLayer(comp, solid);
        }

        app.endUndoGroup();
    } else {
        alert("Please select an active composition.");
    }
}
function addOneFramer(){
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        app.beginUndoGroup("Add One Framer Adjustment Layer");
        var adjustLayer = comp.layers.addSolid([1, 1, 1], "Adjustment Layer", comp.width, comp.height, comp.pixelAspect);
        adjustLayer.adjustmentLayer = true;
        adjustLayer.moveBefore(comp.selectedLayers[0]);
        adjustLayer.inPoint = comp.selectedLayers[0].inPoint;
        adjustLayer.outPoint = adjustLayer.inPoint + (1 / comp.frameRate);
        app.endUndoGroup();
    } else {
        alert("Please select an active composition.");
    }
}
function addAdjustmentLayer(){
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        app.beginUndoGroup("Add Adjustment Layer");
        var adjustLayer = comp.layers.addSolid([1, 1, 1], "Adjustment Layer", comp.width, comp.height, comp.pixelAspect);
        adjustLayer.adjustmentLayer = true;
        moveAndTrimLayer(comp, adjustLayer);
        app.endUndoGroup();
    } else {
        alert("Please select an active composition.");
    }
}
function addNullLayerAndParent() {
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {

        // Add Null to top
        app.beginUndoGroup("Add Null Layer");
        var nullLayer = comp.layers.addNull();
        nullLayer.name = "Null Layer";

        moveAndTrimLayer(comp, nullLayer);

        // Parent selected layer to Null
        comp.selectedLayers[0].parent = nullLayer;
        app.endUndoGroup();
    } else {
        alert("Please select an active layer.");
    }
}
function moveAndTrimLayer(comp, layer){
    layer.moveBefore(comp.selectedLayers[0]);
    layer.inPoint = comp.selectedLayers[0].inPoint;
    layer.outPoint = comp.selectedLayers[0].outPoint;
}
window.show();
window.center();