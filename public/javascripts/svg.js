// Defining all SVG elements - i.e. text elements, ellipses and links between them (nodes and edges)

var ellipseWidth = 50;
var ellipseHeight = 25;
var nodeTextStyle = "text-anchor: middle";
var svgColor = "black";
var selectedStyle = "fill:blanchedalmond";
var defaultStyle = "fill:white";
var edit = false;

var graphics = Viva.Graph.View.svgGraphics();
graphics.node(function(node) {
    var ui = Viva.Graph.svg('g').attr('id', node.id);
    node.svgImg = Viva.Graph.svg('ellipse')
        .attr('rx', ellipseWidth)
        .attr('ry', ellipseHeight)
        .attr("stroke", svgColor)
        .attr("stroke-width", 3)
        .attr("style", defaultStyle);
    node.svgLabel = Viva.Graph.svg('text')
        .attr('dy', '5px')
        .attr('style', nodeTextStyle)
        .text(node.data.label);
    ui.append(node.svgImg);
    ui.append(node.svgLabel);

    node.toggleNodeSelected = function () {
        node.selected = !node.selected;
        if (node.selected) {
            node.svgImg.attr("style", selectedStyle);
        } else {
            node.svgImg.attr("style", defaultStyle);
        }
    };

    node.nodeClicked = function () {
        if (!edit) {
            $("#description-header").html(node.data.label);
            $("#description-content").load("assets/html/" + node.data.label + ".html");
            $("#node-description").click();
        } else {
            node.toggleNodeSelected();
        }
    }

    ui.addEventListener("click", node.nodeClicked);

    $(ui).hover(function() { // mouse over
        if (!node.selected) { node.svgImg.attr("style", selectedStyle) };
        showNodeDescription(node, true);
    }, function() { // mouse out
        if (!node.selected) { node.svgImg.attr("style", defaultStyle) };
        showNodeDescription(node, false);
    });

    node.positionLabel = function() {
        function splitLabel(labelNode, text) {
            var wholeLabel = text.trim();
            var multiWord = wholeLabel.split(/[\s,\/]+/);
            if (multiWord.length > 1) {
                labelNode.text('');
                var svgLabelUpper = Viva.Graph.svg('tspan')
                    .attr('dy', '-4')
                    .attr('x', '0')
                    .text(wholeLabel.substr(0, wholeLabel.length - multiWord[multiWord.length - 1].length).trim());
                var svgLabelLower = Viva.Graph.svg('tspan')
                    .attr('dy', '19')
                    .attr('x', '0')
                    .text(multiWord[multiWord.length - 1]);
                labelNode.append(svgLabelUpper);
                labelNode.append(svgLabelLower);
            }
        }

        var labelNode = node.svgLabel;
        labelNode.text(node.data.label);
        var containerWidth = node.svgImg.getBBox().width;
        var labelWidth = labelNode.getComputedTextLength();

        // First we try to split the label into two parts
        if (labelWidth + 1.5 > containerWidth) {
            splitLabel(labelNode, node.data.label);
        }

        // If that was not enough or could not be done then decrease font size once
        var scale = 0.8;
        if (labelNode.getComputedTextLength() > containerWidth) {
            labelNode.attr('transform', 'scale(' + scale + ", " + scale + ')');
        }
    }

    return ui;
});

graphics.placeNode(function(nodeUI, pos) {
    nodeUI.attr('transform',
        'translate(' + pos.x + ',' + pos.y + ')');
});

var addRootElements = function() {
    var createMarker = function(id) {
        return Viva.Graph.svg('marker')
            .attr('id', id)
            .attr('viewBox', "0 0 10 10")
            .attr('refX', "10")
            .attr('refY', "5")
            .attr('markerUnits', "strokeWidth")
            .attr('markerWidth', "10")
            .attr('markerHeight', "5")
            .attr('orient', "auto");
    };

    var defs = graphics.getSvgRoot().append('defs');
    defs.append(createMarker('Triangle')).append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z');
    defs.append(createMarker('Line')).append('path').attr('d', 'M 0 0 L 10 5');
}

graphics.link(function(link){
    var marker = 'url(#Triangle)';
    if (link.data.direction === 0) {
        marker = 'url(#Line)';
    }
    return Viva.Graph.svg('path')
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('marker-end', marker);
});

graphics.placeLink(function(linkUI, fromPos, toPos) {
    //  "Links should start/stop at node's bounding edge, not at the node center."

    var deltaX = toPos.x - fromPos.x;
    var deltaY = toPos.y - fromPos.y;
    var radiansX = Math.atan2(-1 * deltaY, deltaX);
    var radiansY = Math.atan2(-1 * deltaX, deltaY);
    var ellipseX = ellipseWidth * Math.cos(radiansX);
    var ellipseY = ellipseHeight * Math.cos(radiansY);
    var toX = toPos.x - ellipseX;
    var toY = toPos.y - ellipseY;
    var fromX = fromPos.x + ellipseX;
    var fromY = fromPos.y + ellipseY;

    var data = 'M' + fromX + ',' + fromY +
        'L' + toX + ',' + toY;

    linkUI.attr("d", data);
});