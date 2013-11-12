$(document).ready(function(){
    var graph = Viva.Graph.graph();
    graph.addNode('MAT', {label: "MAT", description: "The FREE Concept Map Tool. Structure your thoughts on a complex topic by creating concept maps, topic maps, or mind maps of your knowledge."});
    graph.addNode('about', {label: 'about', description: 'About MAT-Maps'});
    graph.addNode('examples', {label: 'examples', description: 'Various examples of concept maps'});
    graph.addLink('MAT', 'about');
    graph.addLink('MAT', 'examples');

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
        //$('#' + node.id).popover({trigger: 'focus', content: 'test'}).popover("show");
        //document.getElementById(node.id ).hidden = !isOn;
//            if (isOn) {
//                document.getElementById(node.id).innerHTML = desc;
//            } else {
//                document.getElementById(node.id).innerHTML = '';
//            }
    }

    graphics.node(function(node) {
        var ui = Viva.Graph.svg('g').attr('id', node.id),
            svgText = Viva.Graph.svg('text').attr('dx', node.id.length * -4 + 'px').attr('dy', '5px').text(node.data.label),
            img = Viva.Graph.svg('ellipse')
                .attr('rx', 50)
                .attr('ry', 25)
                .attr("stroke", "black")
                .attr("stroke-width", 3)
                .attr("style", "fill:white");

        ui.append(img);
        ui.append(svgText);

        $(ui).hover(function() { // mouse over
            showNodeDescription(node, true);
        }, function() { // mouse out
            showNodeDescription(node, false);
        });

        return ui;
    }).placeNode(function(nodeUI, pos) {
            // 'g' element doesn't have convenient (x,y) attributes, instead
            // we have to deal with transforms: http://www.w3.org/TR/SVG/coords.html#SVGGlobalTransformAttribute
            nodeUI.attr('transform',
                'translate(' +
                    (pos.x) + ',' + (pos.y) +
                    ')');
        });
    var renderer = Viva.Graph.View.renderer(graph,
        {
            graphics : graphics,
            container: document.getElementById("map")
        });
    renderer.run();
});

var rootNode;
var rootNodeText;
var rootImg;
var nodeColor = "blue";
var keyMode = true;

$(document).ready(function(){
    var graph = Viva.Graph.graph();
    rootNode = graph.addNode('root', {label:'', description:''});
    //var rootNode2 = graph.addNode('root2', {label:'', description:''});
    //var rootNode3 = graph.addNode('root3', {label:'', description:''});

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
        rootImg = Viva.Graph.svg('ellipse')
            .attr('rx', 50)
            .attr('ry', 25)
            .attr("stroke", nodeColor)
            .attr("stroke-width", 3)
            .attr("style", "fill:white");
        rootNodeText = Viva.Graph.svg('text').attr('dx', node.id.length * -4 + 'px').attr('dy', '5px').text('_'),

        ui.append(rootImg);
        ui.append(rootNodeText);

        $(ui).hover(function() { // mouse over
            showNodeDescription(node, true);
        }, function() { // mouse out
            showNodeDescription(node, false);
        });

        return ui;
    }).placeNode(function(nodeUI, pos) {
            nodeUI.attr('transform',
                'translate(' +
                    (pos.x) + ',' + (pos.y) +
                    ')');
        });
    var renderer = Viva.Graph.View.renderer(graph,
        {
            graphics : graphics,
            container: document.getElementById("newMap")
        });
    renderer.run();
});

$(document).keypress(function(e) {
    if (keyMode) {
        rootNode.data.label += String.fromCharCode(e.which);
        if (e.which === 13) {
            rootNodeText.text(rootNode.data.label);
            rootImg.attr("stroke", "black");
            keyMode = false;
        } else {
            rootNodeText.text(rootNode.data.label + '_');
        }
    }
});

$(document).on("keydown", function (e) {
    if (e.which === 8) {
        if (keyMode) {
            rootNode.data.label = rootNode.data.label.substring(0, rootNode.data.label.length - 1);
            rootNodeText.text(rootNode.data.label + '_');
        }
        if (!$(e.target).is("input, textarea")) {
            e.preventDefault();
        }
    }
});