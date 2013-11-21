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

var defaultStyle = "fill:white";

var graphics = Viva.Graph.View.svgGraphics();
graphics.node(function(node) {
    var ui = Viva.Graph.svg('g').attr('id', node.id);
    node.svgImg = Viva.Graph.svg('ellipse')
        .attr('rx', 50)
        .attr('ry', 25)
        .attr("stroke", svgColor)
        .attr("stroke-width", 3)
        .attr("style", defaultStyle);
    node.svgLabel = Viva.Graph.svg('text').attr('dy', '5px').text(node.data.label);
    ui.append(node.svgImg);
    ui.append(node.svgLabel);

    node.toggleNodeSelected = function() {
        node.selected = !node.selected;
        if (node.selected) {
            node.svgImg.attr("style", "fill:lightgrey");
        } else {
            node.svgImg.attr("style", defaultStyle);
        }
    };

    ui.addEventListener("click", node.toggleNodeSelected);

    $(ui).hover(function() { // mouse over
        showNodeDescription(node, true);
    }, function() { // mouse out
        showNodeDescription(node, false);
    });

    return ui;
}).placeNode(function(nodeUI, pos) {
        nodeUI.attr('transform',
            'translate(' + pos.x + ',' + pos.y + ')');
    });

var graph = Viva.Graph.graph();
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

var svgColor = "black";
var keyMode;
var selectedNode;

var addNode = function() {
    selectedNode = graph.addNode('n' + graph.getNodesCount(), {label:'_', description:'Press "n" to create another concept'});
    save("an," + selectedNode.id);
};

var labelNode = function() {
    //svgColor = "blue";
    if (!selectedNode) {
        selectedNode = graph.getNode(selectedNodes()[0]);
    }
    keyMode = true;
};

var addLink = function() {
    var s = selectedNodes();
    if (s.length === 2) {
        graph.addLink(s[0], s[1]);
        save("al," + s[0] + "," + s[1]);
        graph.getNode(s[0]).toggleNodeSelected();
        graph.getNode(s[1]).toggleNodeSelected();
    }
};

var removeLink = function() {
    var s = selectedNodes();
    if (s.length === 2) {
        // intersection of the links associated with the two nodes should yield the one
        // we are looking for (only one link is currently allowed between two nodes).
        graph.removeLink(graph.getLinks(s[0]).filter(function(n) {
            return graph.getLinks(s[1]).indexOf(n) != -1
        })[0]);
        save("rl," + s[0] + "," + s[1]);
        graph.getNode(s[0]).toggleNodeSelected();
        graph.getNode(s[1]).toggleNodeSelected();
    }
};

var removeNode = function() {
    selectedNodes().forEach(function(nodeId) {
        graph.removeNode(nodeId);
        save("rn," + nodeId);
    });
}

$(document).keypress(function(e) {
    if (keyMode) {
        if (selectedNode.data.label === '_') {
            selectedNode.data.label = '';
        }
        selectedNode.data.label += String.fromCharCode(e.which);
        if (e.which === 13) { // Enter
            selectedNode.svgLabel.text(selectedNode.data.label);
            save("sl," + selectedNode.id + "," + selectedNode.data.label);
            selectedNode.svgImg.attr("stroke", "black");
            selectedNode = null;
            keyMode = false;
        } else {
            selectedNode.svgLabel.text(selectedNode.data.label + '_');
        }
    } else {
        if (e.which === 110) { // n
            addNode();
            labelNode();
        } else if (e.which === 108) { // l
            addLink();
        } else if (e.which === 116) { // t
            if (selectedNodes().length === 1) {
                labelNode();
            }
        } else if (e.which === 117) { // u
            removeLink();
        } else if (e.which === 100) { // d
            removeNode();
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

var save = function(cmd) {
    $.ajax({
        url: window.location.pathname + "/save?content=" + cmd
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
            var cmd = mapData[key].command.split(',');
            switch (cmd[0]) {
                case "an":
                    graph.addNode(cmd[1], {label:'_', description:''});
                    break;
                case "al":
                    graph.addLink(cmd[1], cmd[2]);
                    break;
                case "sl":
                    selectedNode = graph.getNode(cmd[1]);
                    selectedNode.data.label = cmd[2];
                    selectedNode.svgLabel.text(selectedNode.data.label);
                    selectedNode = null;
                    keyMode = false;
                    break;
                default:
                    break;
            }
        }
    }
}