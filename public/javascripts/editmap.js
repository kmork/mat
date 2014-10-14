var keyMode = false;

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
        node.selected = !node.selected;
        if (node.selected) {
            node.svgImg.attr("style", selectedStyle);
        } else {
            node.svgImg.attr("style", defaultStyle);
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
    graph.getNode(selectedNode.id).toggleNodeSelected();
    selectedNode = null;
    keyMode = false;
};

var addLink = function() {
    var s = selectedNodes();
    var data = {"direction" : 0};
    if (s.length === 2) {
        var s1 = s[0];
        var s2 = s[1];
        var sLink = getSelectedLink();
        if (sLink) {
            if (sLink.data.direction === 0) {
                data.direction = 1;
                var s3 = s1;
                s1 = s2;
                s2 = s3;
            } else if (sLink.data.direction === 1) {
                data.direction = 2;
            } else if (sLink.data.direction === 2) {
                data.direction = 0;
            }
            removeLink();
        }
        graph.addLink(s1, s2, data);
        save("al", s1 + "," + s2 + "," + data.direction);

        //graph.getNode(s[0]).toggleNodeSelected();
        graph.getNode(s[0]).data.isPinned = false;
        //graph.getNode(s[1]).toggleNodeSelected();
        graph.getNode(s[1]).data.isPinned = false;
    }
};

var removeLink = function() {
    var s = selectedNodes();
    if (s.length === 2) {
        graph.removeLink(getSelectedLink());
        save("rl", s[0] + "," + s[1]);
        //graph.getNode(s[0]).toggleNodeSelected();
        //graph.getNode(s[1]).toggleNodeSelected();
    }
};

var removeNode = function() {
    selectedNodes().forEach(function(nodeId) {
        graph.removeNode(nodeId);
        save("rn", nodeId);
    });
}

// intersection of the links associated with the two nodes should yield the one
// we are looking for (only one link is currently allowed between two nodes).
var getSelectedLink = function() {
    var nodes = selectedNodes();
    return graph.getLinks(nodes[0]).filter(function (n) {
        return graph.getLinks(nodes[1]).indexOf(n) !== -1;
    })[0];
}


var save = function(cmd, content) {
    var id = commands.push(cmd);
    $.ajax({
        url: window.location.pathname + "/actions/" + id,
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify({"cmdType": cmd, "content": content}),
        error: function(err) {
            console.log("Failed to save command with id: " + id + ".", err);
            error("Failed to backup map on server. <br>" +
                "Further changes will not be saved. <br>" +
                "Please refresh your browser and try again.");
        }
    });
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
