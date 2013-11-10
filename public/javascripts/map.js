$(document).ready(function(){
    var graph = Viva.Graph.graph();
    graph.addNode('MAT', "MAT-Maps");
    graph.addNode('about', 'About MAT-Maps');
    graph.addNode('examples', 'Various examples of concept maps');
    graph.addLink('MAT', 'about');
    graph.addLink('MAT', 'examples');

    var graphics = Viva.Graph.View.svgGraphics();

    var showNodeDescription = function(node, isOn) {
        document.getElementById(node.id ).hidden = !isOn;
//            if (isOn) {
//                document.getElementById(node.id).innerHTML = desc;
//            } else {
//                document.getElementById(node.id).innerHTML = '';
//            }
    }

    graphics.node(function(node) {
        var ui = Viva.Graph.svg('g'),
            svgText = Viva.Graph.svg('text').attr('dx', node.id.length * -4 + 'px').attr('dy', '5px').text(node.id),
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
