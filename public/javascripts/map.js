var defaultStyle = "fill:white";
var selectedStyle = "fill:blanchedalmond";
var svgColor = "black";
var nodeTextStyle = "text-anchor: middle";
var keyMode;
var selectedNode;
var commands = [];
var readonly = true;
var nodeCount = 0;
var pinnedAllNodes = false;

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
        .attr('rx', 50)
        .attr('ry', 25)
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
        if (readonly) {
            $("#description-header").html(node.data.label);
            $("#description-content").load("assets/html/" + node.data.label + ".html");
            $("#node-description").click();
        } else {
            node.selected = !node.selected;
            if (node.selected) {
                node.svgImg.attr("style", selectedStyle);
            } else {
                node.svgImg.attr("style", defaultStyle);
            }
        }
    };

    ui.addEventListener("click", node.toggleNodeSelected);

    $(ui).hover(function() { // mouse over
        if (!node.selected) { node.svgImg.attr("style", selectedStyle) };
        showNodeDescription(node, true);
    }, function() { // mouse out
        if (!node.selected) { node.svgImg.attr("style", defaultStyle) };
        showNodeDescription(node, false);
    });

    return ui;
}).placeNode(function(nodeUI, pos) {
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
};

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

var addNode = function() {
    nodeCount += 1;
    selectedNode = graph.addNode('n' + nodeCount, {label: '_', description: 'Press "n" to create another concept'});
    selectedNode.data.isPinned = true;
    save("an", selectedNode.id);
};

var labelNodeStart = function() {
    //svgColor = "blue";
    if (!selectedNode) {
        selectedNode = graph.getNode(selectedNodes()[0]);
    }
    keyMode = true;
};

var labelNodeFinish = function () {
    positionLabel(selectedNode, selectedNode.data.label);
    save("sl", selectedNode.id + "," + selectedNode.data.label);
    selectedNode.svgImg.attr("stroke", "black");
    selectedNode = null;
    keyMode = false;
};


var addLink = function() {
    var s = selectedNodes();
    if (s.length === 2) {
        graph.addLink(s[0], s[1]);
        save("al", s[0] + "," + s[1]);
        graph.getNode(s[0]).toggleNodeSelected();
        graph.getNode(s[0]).data.isPinned = false;
        graph.getNode(s[1]).toggleNodeSelected();
        graph.getNode(s[1]).data.isPinned = false;
    }
};

var removeLink = function() {
    var s = selectedNodes();
    if (s.length === 2) {
        // intersection of the links associated with the two nodes should yield the one
        // we are looking for (only one link is currently allowed between two nodes).
        graph.removeLink(graph.getLinks(s[0]).filter(function (n) {
            return graph.getLinks(s[1]).indexOf(n) !== -1;
        })[0]);
        save("rl", s[0] + "," + s[1]);
        graph.getNode(s[0]).toggleNodeSelected();
        graph.getNode(s[1]).toggleNodeSelected();
    }
};

var removeNode = function() {
    selectedNodes().forEach(function(nodeId) {
        graph.removeNode(nodeId);
        save("rn", nodeId);
    });
}

var pinnSelectedNodes = function() {
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


var save = function(cmd, content) {
    var id = commands.push(cmd);
    $.ajax({
        url: window.location.pathname + "/save?cmdId=" + id + "&cmd=" + cmd + "&content=" + content,
        error: function(err) {
            console.log("Failed to save command with id: " + id + ".", err);
            error("Failed to backup map on server. <br>" +
                "Further changes will not be saved. <br>" +
                "Please refresh your browser and try again.");
        }
    });
}

var load = function() {
    $.ajax({
        url: window.location.pathname + "/load",
        success: initMap,
        error: function(err) {
            console.log(err);
        }
    });
}

var initMap = function(mapData) {
    for (var key in mapData) {
        if (mapData.hasOwnProperty(key)) {
            var cmd = mapData[key].event;
            var content = mapData[key].content.split(',');
            switch (cmd) {
                case "an":
                    nodeCount += 1;
                    graph.addNode(content[0], {label:'_', description:''});
                    break;
                case "al":
                    graph.addLink(content[0], content[1]);
                    break;
                case "sl":
                    selectedNode = graph.getNode(content[0]);
                    selectedNode.data.label = mapData[key].content.substring(content[0].length + 1);
                    positionLabel(selectedNode, selectedNode.data.label);
                    selectedNode = null;
                    keyMode = false;
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



var positionLabel = function(node, text) {
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
    labelNode.text(text);
    var containerWidth = node.svgImg.getBBox().width;
    var labelWidth = labelNode.getComputedTextLength();

    // First we try to split the label into two parts
    if (labelWidth + 1.5 > containerWidth) {
        splitLabel(labelNode, text);
    }

    // If that was not enough or could not be done then decrease font size once
    var scale = 0.8;
    if (labelNode.getComputedTextLength() > containerWidth) {
        labelNode.attr('transform', 'scale(' + scale + ", " + scale + ')');
    }
}


$(document).keypress(function(e) {
    if (keyMode) {
        if (selectedNode.data.label === '_') {
            selectedNode.data.label = '';
        }
        selectedNode.data.label += String.fromCharCode(e.which);
        if (e.which === 13) { // Enter
            labelNodeFinish();
        } else {
            selectedNode.svgLabel.text(selectedNode.data.label + '_');
        }
    } else {
        if (e.which === 110) { // n
            addNode();
            labelNodeStart();
        } else if (e.which === 108) { // l
            addLink();
        } else if (e.which === 116) { // t
            if (selectedNodes().length === 1) {
                labelNodeStart();
            }
        } else if (e.which === 117) { // u
            removeLink();
        } else if (e.which === 100) { // d
            removeNode();
        } else if (e.which === 112) { // p
            togglePinningOfAllNodes();
        }
    }
});

$(document).on("keydown", function (e) {
    if (e.which === 8) { // del
        if (keyMode) {
            selectedNode.data.label = selectedNode.data.label.substring(0, selectedNode.data.label.length - 1);
            selectedNode.svgLabel.text(selectedNode.data.label + '_');
        }
        if (!$(e.target).is("input, textarea")) { // Do not act as browser back button
            e.preventDefault();
        }
    }
});
