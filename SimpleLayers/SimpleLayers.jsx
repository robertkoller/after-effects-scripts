var LABEL_RED   = 1;
var LABEL_WHITE = 0;

var window = new Window("palette", "SIMPLE LAYERS", undefined);
window.orientation = "column";
var text = window.add("statictext", undefined, "Null Layers");

var group1 = window.add("group", undefined);
group1.orientation = "row";

var addNullBtn = group1.add("button", undefined, "Add Null Layer");

window.add("statictext", undefined, "Adjustment Layers");

var group2 = window.add("group", undefined);
group2.orientation = "row";

var addAdjustBtn = group2.add("button", undefined, "Add Adjustment Layer");
var addFramer = group2.add("button", undefined, "1Framer");
addFramer.size = [80, 25];

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
        solidColor = [
            picked[0] / 255,
            picked[1] / 255,
            picked[2] / 255
        ];
        swatch.notify("onDraw");
    }
});


var group4 = window.add("group", undefined);
group4.orientation = "row";
var infoText = group4.add("statictext", undefined, "Made by Dursc");

addSolidBtn.onClick = function () {
    addSolidLayerWithColor();
};

addFramer.onClick = function() {
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
    if (!(comp && comp instanceof CompItem)) return;
    if (comp.selectedLayers.length === 0) return;

    app.beginUndoGroup("Add Solid Layer");

    var ref = comp.selectedLayers[0];
    var solid = comp.layers.addSolid(
        solidColor,
        "Solid Layer",
        comp.width,
        comp.height,
        comp.pixelAspect
    );

    solid.label = LABEL_RED;
    solid.moveBefore(ref);
    solid.inPoint  = ref.inPoint;
    solid.outPoint = ref.outPoint;

    app.endUndoGroup();
}

function addOneFramer() {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;
    if (comp.selectedLayers.length === 0) return;

    app.beginUndoGroup("Add One Framer");

    var ref = comp.selectedLayers[0];
    var layer = comp.layers.addSolid(
        [1,1,1],
        "1F Adjustment",
        comp.width,
        comp.height,
        comp.pixelAspect
    );

    layer.adjustmentLayer = true;
    layer.label = LABEL_WHITE;
    layer.moveBefore(ref);

    layer.inPoint  = ref.inPoint;
    layer.outPoint = ref.inPoint + (1 / comp.frameRate);

    app.endUndoGroup();
}

function addAdjustmentLayer() {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;
    if (comp.selectedLayers.length === 0) return;

    app.beginUndoGroup("Add Adjustment Layer");

    var ref = comp.selectedLayers[0];
    var layer = comp.layers.addSolid(
        [1,1,1],
        "Adjustment Layer",
        comp.width,
        comp.height,
        comp.pixelAspect
    );

    layer.adjustmentLayer = true;
    layer.label = LABEL_WHITE;
    layer.moveBefore(ref);
    layer.inPoint  = ref.inPoint;
    layer.outPoint = ref.outPoint;

    app.endUndoGroup();
}

function addNullLayerAndParent() {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;
    if (comp.selectedLayers.length === 0) return;

    app.beginUndoGroup("Add Null Layer");

    var ref = comp.selectedLayers[0];
    var nullLayer = comp.layers.addNull();

    nullLayer.name = "Null";
    nullLayer.label = LABEL_RED;
    nullLayer.moveBefore(ref);
    nullLayer.inPoint  = ref.inPoint;
    nullLayer.outPoint = ref.outPoint;

    ref.parent = nullLayer;

    app.endUndoGroup();
}

function moveAndTrimLayer(comp, layer){
    layer.moveBefore(comp.selectedLayers[0]);
    layer.inPoint = comp.selectedLayers[0].inPoint;
    layer.outPoint = comp.selectedLayers[0].outPoint;
}

function placeAboveSelected(comp, layer) {
    if (comp.selectedLayers.length > 0) {
        layer.moveBefore(comp.selectedLayers[0]);
    }
}
function trimToSelected(comp, layer) {
    if (comp.selectedLayers.length === 0) return;

    var ref = comp.selectedLayers[0];
    layer.inPoint  = ref.inPoint;
    layer.outPoint = ref.outPoint;
}

window.layout.layout(true);
window.layout.resize();
window.show();
window.center();