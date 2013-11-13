var keyMode;
var selectedNode;
var graph = Viva.Graph.graph();
var numNodes = 0;
var svgColor = "black";

var graphics = Viva.Graph.View.svgGraphics();

var showNodeDescription = function(node, isOn) {
    $('#' + node.id).tipsy({
        gravity: 'w',
        offset: 10,
        html: true,
        title: function() {
            return node.data.description;
        }
    });
}

graphics.node(function(node) {
    var ui = Viva.Graph.svg('g').attr('id', node.id);
    node.svgImg = Viva.Graph.svg('ellipse')
        .attr('rx', 50)
        .attr('ry', 25)
        .attr("stroke", svgColor)
        .attr("stroke-width", 3)
        .attr("style", "fill:white");
    node.svgLabel = Viva.Graph.svg('text').attr('dy', '5px').text(node.data.label);
    ui.append(node.svgImg);
    ui.append(node.svgLabel);

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

var displayMap = function(domElement) {
    var renderer = Viva.Graph.View.renderer(graph,
        {
            graphics : graphics,
            container: document.getElementById(domElement)
        });
    renderer.run();
}

var addNode = function() {
    svgColor = "blue";
    selectedNode = graph.addNode('n' + numNodes, {label:'_', description:'Press "n" to create another concept'});
    numNodes += 1;
    keyMode = true;
}

var addSiteMap = function() {
    // TODO: Dirty, should probably be put in separate js-files for each html-page?
    graph.addNode('MAT', {label: "MAT", description: "The FREE Concept Map Tool. Structure your thoughts on a complex topic by creating concept maps, topic maps, or mind maps of your knowledge."});
    graph.addNode('about', {label: 'about', description: 'About MAT-Maps'});
    graph.addNode('examples', {label: 'examples', description: 'Various examples of concept maps'});
    graph.addLink('MAT', 'about');
    graph.addLink('MAT', 'examples');
}

$(document).ready(function(){
    // TODO: Dirty, should probably be put in separate js-files for each html-page?
    if ($('#newMap').length ) {
        addNode();
        displayMap("newMap");
    } else if ($('#map').length ) {
        addSiteMap();
        displayMap("map");
    }
});

$(document).keypress(function(e) {
    if (keyMode) {
        if (selectedNode.data.label === '_') {
            selectedNode.data.label = '';
        }
        selectedNode.data.label += String.fromCharCode(e.which);
        if (e.which === 13) {
            selectedNode.svgLabel.text(selectedNode.data.label);
            selectedNode.svgImg.attr("stroke", "black");
            keyMode = false;
        } else {
            selectedNode.svgLabel.text(selectedNode.data.label + '_');
        }
    } else {
        if (e.which === 110) {
            addNode();
        }
    }
});

$(document).on("keydown", function (e) {
    if (e.which === 8) {
        if (keyMode) {
            selectedNode.data.label = selectedNode.data.label.substring(0, selectedNode.data.label.length - 1);
            selectedNode.svgLabel.text(selectedNode.data.label + '_');
        }
        if (!$(e.target).is("input, textarea")) {
            e.preventDefault();
        }
    }
});