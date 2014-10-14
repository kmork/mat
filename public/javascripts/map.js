var defaultStyle = "fill:white";
var selectedStyle = "fill:blanchedalmond";
var svgColor = "black";
var nodeTextStyle = "text-anchor: middle";
var selectedNode;
var nodeCount = 0;
var pinnedAllNodes = false;
var commands = [];
var ellipseWidth = 50;
var ellipseHeight = 25;

var error = function(message) {
    $('#map').before('<div class="alert alert-error map-error"><a class="close" data-dismiss="alert">×</a><span><b>Error: </b>' + message + '</span></div>');
};

var graph = Viva.Graph.graph();

var showNodeDescription = function(node, isOn) {
    $('#' + node.id).tipsy({
        gravity: 'w',
        offset: 10,
        html: true,
        title: function() {
            return node.data.description;
        }
    });
};

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

    node.toggleNodeSelected = function() {
        $("#description-header").html(node.data.label);
        $("#description-content").load("assets/html/" + node.data.label + ".html");
        $("#node-description").click();
    };

    ui.addEventListener("click", node.toggleNodeSelected);

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

var displayMap = function(domElement) {
    var renderer = Viva.Graph.View.renderer(graph,
        {
            graphics : graphics,
            container: document.getElementById(domElement)
        });
    renderer.run();

    // Marker should be defined only once in <defs> child element of root <svg> element:
    // Svg element does not exists until renderer.run()
    addRootElements();
};

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


// Returns an array of the selected node ids only
var selectedNodes = function() {
    var selected = [];
    graph.forEachNode(function(node) {
        if (node.selected) {
            selected.push(node.id);
        }
        false;
    });
    return selected;
};

var pinSelectedNodes = function() {
    selectedNodes().forEach(function(nodeId) {
        graph.getNode(nodeId).data.isPinned = true;
    });
}

var togglePinningOfAllNodes = function() {
    pinnedAllNodes = !pinnedAllNodes;
    graph.forEachNode(function(node) {
        node.data.isPinned = pinnedAllNodes;
    });
}

var load = function(successCallback) {
    $.ajax({
        url: window.location.pathname + "/actions",
        success: function(result) {
            initMap(result);
            if (successCallback != null) successCallback();
        },
        error: function(err) {
            console.log(err);
        }
    });
}

var initMap = function(mapData) {
    for (var key in mapData) {
        if (mapData.hasOwnProperty(key)) {
            var cmd = mapData[key].event;
            commands.push(cmd);
            var content = mapData[key].content.split(',');
            switch (cmd) {
                case "an":
                    nodeCount += 1;
                    graph.addNode(content[0], {label:'_', description:''});
                    break;
                case "al":
                    graph.addLink(content[0], content[1], {direction: parseInt(content[2])});
                    break;
                case "sl":
                    selectedNode = graph.getNode(content[0]);
                    selectedNode.data.label = mapData[key].content.substring(content[0].length + 1);
                    selectedNode.positionLabel();
                    selectedNode = null;
                    break;
                case "rl":
                    graph.removeLink(graph.getLinks(content[0]).filter(function(n) {
                        return graph.getLinks(content[1]).indexOf(n) != -1
                    })[0]);
                    break;
                case "rn":
                    graph.removeNode(content[0]);
                    break;
                default:
                    break;
            }
        }
    }
}

$(document).keypress(function(e) {
    if (e.which === 112) { // p
        togglePinningOfAllNodes();
    }
});
