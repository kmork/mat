// Extends on functionality and variables defined in svg.js

var selectedNode;
var nodeCount = 0;
var pinnedAllNodes = false;
var commands = [];

var graph = Viva.Graph.graph();

var error = function (message) {
    $('#map').before('<div class="alert alert-error map-error"><a class="close" data-dismiss="alert">×</a><span><b>Error: </b>' + message + '</span></div>');
};

var showNodeDescription = function (node, isOn) {
    $('#' + node.id).tipsy({
        gravity: 'w',
        offset: 10,
        html: true,
        title: function() {
            return node.data.description;
        }
    });
};

var displayMap = function (domElement) {
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
