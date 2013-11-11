/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Diagrams addon app code.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

(function() {

documentView.createTabPanel('diagrams', 'Diagrams', {
  stylesheets: ['diagrams-app.css'],
  scripts: []
}, function(document) {
  var el = document.createElement('div');
  el.className = 'panelRoot';
  document.body.appendChild(el);

  var db = documentView.db;

  var sankeyEl = document.createElement('div');
  setupSankeyDiagram(sankeyEl, db);
  el.appendChild(sankeyEl);

  return {
    onLayout: function(width, height) {
      //console.log('onLayout ' + width + ', ' + height);
    },
    onVisibilityChange: function(value) {
      //console.log('onVisibilityChange ' + value);
    },
  };
});

function computeScopeGraph(db, zoneIndex) {
  // Edges in the graph, keyed by 'eventName|eventName', value is sum user time.
  var edges = {};
  var nodeList = [];
  var nodeIndices = {};

  nodeList.push({
    name: '<root>',
    eventType: null
  });
  nodeIndices['<root>'] = 0;

  zoneIndex.forEach(-Number.MAX_VALUE, Number.MAX_VALUE, function(e) {
    var eventType = e.eventType;
    if (eventType.eventClass == wtf.data.EventClass.SCOPE &&
        !(eventType.flags & wtf.data.EventFlag.INTERNAL)) {
      var scope = e.scope;
      if (!nodeIndices[eventType.name]) {
        nodeIndices[eventType.name] = nodeList.length;
        nodeList.push({
          name: eventType.name,
          eventType: eventType
        });
      }

      var key;
      var parentScope = scope.getParent();
      if (parentScope) {
        // Child.
        var parentEventType = parentScope.getEnterEvent().eventType;
        if (!nodeIndices[parentEventType.name]) {
          nodeIndices[parentEventType.name] = nodeList.length;
          nodeList.push({
            name: parentEventType.name,
            eventType: parentEventType
          });
        }
        key = parentEventType.name + '|' + eventType.name;
      } else {
        // Root scope.
        key = '<root>|' + eventType.name;
      }

      var value = edges[key] || 0;
      value += scope.getUserDuration();
      edges[key] = value;
    }
  });

  var edgeList = [];
  for (var key in edges) {
    var value = edges[key];
    if (!value) {
      continue;
    }
    var keyParts = key.split('|');
    var parentName = keyParts[0];
    var childName = keyParts[1];
    if (parentName == childName) {
      continue;
    }
    if (parentName == '<root>') {
      continue;
    }
    edgeList.push({
      source: nodeIndices[parentName],
      target: nodeIndices[childName],
      value: edges[key]
    });
  }

  return {
    nodes: nodeList,
    edges: edgeList
  };
};

function trimGraphCycles(graph) {
  // Prevent cycles here - sankey.js doesn't support them yet.
};

function setupSankeyDiagram(el, db) {
  var nodes = [];
  var links = [];

  var table = new wtf.analysis.db.EventDataTable(db);
  var scopeTypes = table.getEntriesByClass(wtf.data.EventClass.SCOPE);

  var zoneIndices = db.getZoneIndices();
  for (var n = 0; n < zoneIndices.length; n++) {
    var graph = computeScopeGraph(db, zoneIndices[n]);
    trimGraphCycles(graph);
    nodes = graph.nodes;
    links = graph.edges;
  }

  var margin = {
    top: 1,
    right: 1,
    bottom: 6,
    left: 1
  };
  var width = 7000 - margin.left - margin.right;
  var height = 7000 - margin.top - margin.bottom;

  var formatNumber = d3.format(',.0f'),
      format = function(d) { return formatNumber(d) + 'ms'; },
      color = d3.scale.category20();

  var svg = d3.select(el).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var sankey = d3.sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .size([width, height]);

  var path = sankey.link();

  sankey
      .nodes(nodes)
      .links(links)
      .layout(1000);

  var link = svg.append('g').selectAll('.link')
      .data(links)
    .enter().append('path')
      .attr('class', 'link')
      .attr('d', path)
      .style('stroke-width', function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });

  link.append('title')
      .text(function(d) { return d.source.name + ' → ' + d.target.name + '\n' + format(d.value); });

  var node = svg.append('g').selectAll('.node')
      .data(nodes)
    .enter().append('g')
      .attr('class', 'node')
      .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
    .call(d3.behavior.drag()
      .origin(function(d) { return d; })
      .on('dragstart', function() { this.parentNode.appendChild(this); })
      .on('drag', dragmove));

  node.append('rect')
      .attr('height', function(d) { return d.dy; })
      .attr('width', sankey.nodeWidth())
      .style('fill', function(d) { return d.color = color(d.name.replace(/ .*/, '')); })
      .style('stroke', function(d) { return d3.rgb(d.color).darker(2); })
    .append('title')
      .text(function(d) { return d.name + '\n' + format(d.value); });

  node.append('text')
      .attr('x', -6)
      .attr('y', function(d) { return d.dy / 2; })
      .attr('dy', '.35em')
      .attr('text-anchor', 'end')
      .attr('transform', null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
      .attr('x', 6 + sankey.nodeWidth())
      .attr('text-anchor', 'start');

  function dragmove(d) {
    var ey = d3.event.sourceEvent.pageY;
    d3.select(this).attr('transform', 'translate(' + d.x + ',' + (d.y = Math.max(0, Math.min(height - d.dy, ey))) + ')');
    sankey.relayout();
    link.attr('d', path);
  }
}

})();
