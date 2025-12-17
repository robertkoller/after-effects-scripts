// labels for layers in composition
var LABEL_RED = 1;
var LABEL_WHITE = 5;
(function buildUI(thisObj) {
    var win = (thisObj instanceof Panel)
        ? thisObj
        : new Window("palette", "SIMPLE LAYERS", undefined, { resizeable: true });

    win.orientation = "column";
    win.alignChildren = ["fill", "top"];

    win.minimumSize = [240, 300];

    // Null Layers Section
    var nullHeader = win.add('statictext', undefined, 'Null Layers')
    var group1 = win.add('group', undefined)
    group1.orientation = 'row'
    var addNullBtn = group1.add('button', undefined, 'Add Null')
    var parentCheckbox = group1.add('checkbox', undefined, 'Parent')
    parentCheckbox.value = true

    // Adjustment Layers Section
    var adjustmentHeader = win.add('statictext', undefined, 'Adjustment Layers')
    var group2 = win.add('group', undefined)
    group2.orientation = 'row'
    var addAdjustBtn = group2.add('button', undefined, 'Add Adjustment')
    var addFramer = group2.add('button', undefined, '1F')
    addFramer.size = [35, 25]

    // Solid Layers Section
    var solidHeader = win.add('statictext', undefined, 'Solid Layers')
    var group3 = win.add('group', undefined)
    group3.orientation = 'row'
    var addSolidBtn = group3.add('button', undefined, 'Add Solid')
    var addSFramer = group3.add('button', undefined, '1F')
    addSFramer.size = [35, 25]
    var solidColor = [0, 0, 0, 1] // black by default
    var swatch = group3.add('button', undefined, '')
    swatch.preferredSize = [28, 28]

    swatch.onDraw = function () {
        var g = this.graphics

        // background
        g.newPath()
        g.rectPath(0, 0, this.size[0], this.size[1])
        g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, solidColor))

        // border
        g.strokePath(g.newPen(g.PenType.SOLID_COLOR, [0.2, 0.2, 0.2, 1], 1))
    }

    // Made by Section
    var group4 = win.add('group', undefined)
    group4.orientation = 'row'
    var infoText = group4.add('statictext', undefined, 'Made by Dursc')

    // On Click Events
    swatch.onClick = function () {
        var dec = $.colorPicker()
        if (dec === -1) return

        solidColor = decimalToRGBA(dec)

        this.graphics.invalidate()
    }

    addSFramer.onClick = function () {
        addOneFramer(0)
    }

    addSolidBtn.onClick = function () {
        addSolidLayerWithColor()
    }

    addFramer.onClick = function () {
        addOneFramer(1)
    }

    addAdjustBtn.onClick = function () {
        addAdjustmentLayer()
    }

    addNullBtn.onClick = function () {
        addNullLayerAndParent(parentCheckbox.value)
    }

    // Adds a solid layer with the chosen color
    function addSolidLayerWithColor() {
        var comp = app.project.activeItem
        if (!(comp && comp instanceof CompItem)) {
            return;
        }

        var ref = comp.selectedLayers.length > 0 ? comp.selectedLayers[0] : null

        app.beginUndoGroup('Add Solid Layer')

        var rgb = [solidColor[0], solidColor[1], solidColor[2]]

        var solid = comp.layers.addSolid(
            rgb,
            'Solid Layer',
            comp.width,
            comp.height,
            comp.pixelAspect
        )

        solid.label = LABEL_RED
        if (ref) {
            moveAndTrimLayer(ref, solid)
        }

        app.endUndoGroup()
    }

    // Adds a one frame solid or adjustment layer,
    // if typeOfLayer = 0, its a solid framer, if 1, adjustment framer
    function addOneFramer(typeOfLayer) {
        var comp = app.project.activeItem
        if (!(comp && comp instanceof CompItem)) {
            return;
        }

        var ref = comp.selectedLayers.length > 0 ? comp.selectedLayers[0] : null

        app.beginUndoGroup('Add One Framer')

        var t = comp.time
        var frameDur = 1 / comp.frameRate
        if (typeOfLayer === 1) {
            var layer = comp.layers.addSolid(
                [1, 1, 1],
                '1F Adjustment',
                comp.width,
                comp.height,
                comp.pixelAspect
            )
            layer.adjustmentLayer = true
            layer.label = LABEL_WHITE
        } else {
            // for now this is just if typeOfLayer = 0
            var rgb = [solidColor[0], solidColor[1], solidColor[2]]
            var layer = comp.layers.addSolid(
                rgb,
                '1F Solid',
                comp.width,
                comp.height,
                comp.pixelAspect
            )
            layer.label = LABEL_RED
        }
        layer.inPoint = t
        layer.outPoint = t + frameDur

        // Place above selected layer if one exists
        if (ref) {
            layer.moveBefore(ref)
        }

        app.endUndoGroup()
    }

    // Adds an adjustment layer
    function addAdjustmentLayer() {
        var comp = app.project.activeItem
        if (!(comp && comp instanceof CompItem)) {
            return;
        }

        var ref = comp.selectedLayers.length > 0 ? comp.selectedLayers[0] : null

        app.beginUndoGroup('Add Adjustment Layer')

        var layer = comp.layers.addSolid(
            [1, 1, 1],
            'Adjustment Layer',
            comp.width,
            comp.height,
            comp.pixelAspect
        )

        layer.adjustmentLayer = true
        layer.label = LABEL_WHITE

        // If a layer is selected then cuts the layer to that length
        if (ref) {
            moveAndTrimLayer(ref, layer)
        }
        app.endUndoGroup()
    }

    function addNullLayerAndParent(shouldParent) {
        var comp = app.project.activeItem
        if (!(comp && comp instanceof CompItem)) {
            return
        }

        var ref = comp.selectedLayers.length > 0 ? comp.selectedLayers[0] : null
        app.beginUndoGroup('Add Null Layer')

        var nullLayer = comp.layers.addNull()

        nullLayer.name = 'Null'
        nullLayer.label = LABEL_RED

        // If a layer is selected then cuts the layer to that length
        if (ref) {
            moveAndTrimLayer(ref, nullLayer)
            if (shouldParent) {
                ref.parent = nullLayer
            }
        }
        app.endUndoGroup()
    }

    function moveAndTrimLayer(ref, layer) {
        layer.moveBefore(ref)
        layer.inPoint = ref.inPoint
        layer.outPoint = ref.outPoint
    }

    function placeAboveSelected(comp, layer) {
        if (comp.selectedLayers.length > 0) {
            layer.moveBefore(comp.selectedLayers[0])
        }
    }
    function trimToSelected(comp, layer) {
        if (comp.selectedLayers.length === 0) return

        var ref = comp.selectedLayers[0]
        layer.inPoint = ref.inPoint
        layer.outPoint = ref.outPoint
    }
    function decimalToRGBA(dec) {
        var r = (dec >> 16) & 255
        var g = (dec >> 8) & 255
        var b = dec & 255
        return [r / 255, g / 255, b / 255, 1]
    }

    // Enable resizing behavior
    win.onResizing = win.onResize = function () {
        this.layout.resize();
    };


    win.layout.layout(true);

    if (win instanceof Window) {
        win.center();
        win.show();
    }

})(this);