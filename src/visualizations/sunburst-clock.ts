// Original source: https://bl.ocks.org/kerryrodden/7090426
//
// Copyright 2013 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as d3 from 'd3';
import moment from 'moment';

import { IEvent } from '~/util/interfaces';

import { seconds_to_duration } from '../util/time';
import { getColorFromString } from '~/util/color';

// Dimensions of sunburst (default, will be updated dynamically).
let chartWidth = 350;
let chartHeight = 350;
let chartRadius = 175;

const legendData: Record<string, string> = {
  afk: getColorFromString('afk'),
  'not-afk': getColorFromString('not-afk'),
  hibernating: getColorFromString('hibernating'),
};

interface ArcObject extends d3.DefaultArcObject, d3.HierarchyRectangularNode<IEvent> {}

let rootEl: d3.Selection<HTMLElement, any, null, any>; // The root DOM node of the graph as a d3 object
let vis: d3.Selection<SVGElement, any, HTMLElement, any>; // The root SVG node of the graph as a d3 object
let partition_layout: d3.PartitionLayout<IEvent>; // The partition layout
let arc: d3.Arc<any, ArcObject>;

function drawLegend() {
  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  const li = {
    w: 75,
    h: 30,
    s: 3,
    r: 3,
  };

  rootEl.select('.legend').selectAll('*').remove();

  const legend = rootEl
    .select('.legend')
    .append('svg:svg')
    .attr('width', li.w)
    .attr('height', Object.keys(legendData).length * (li.h + li.s));

  const g = legend
    .selectAll('g')
    .data(
      Object.entries(legendData).map(t => {
        return { key: t[0], value: t[1] };
      })
    )
    .enter()
    .append('svg:g')
    .attr('transform', function (d, i) {
      return 'translate(0,' + i * (li.h + li.s) + ')';
    });

  g.append('svg:rect')
    .attr('rx', li.r)
    .attr('ry', li.r)
    .attr('width', li.w)
    .attr('height', li.h)
    .style('fill', function (d) {
      return d.value;
    });

  g.append('svg:text')
    .attr('x', li.w / 2)
    .attr('y', li.h / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .style('font-family', "'Outfit', sans-serif")
    .style('font-size', '0.75rem')
    .style('font-weight', '600')
    .style('fill', '#fff')
    .text(function (d) {
      return d.key;
    });
}

function drawClockTick(a: number, outerR: number) {
  const xn = Math.cos(a);
  const yn = Math.sin(a);

  vis
    .append('line')
    .attr('x1', (outerR + 2) * xn)
    .attr('y1', (outerR + 2) * yn)
    .attr('x2', (outerR + 8) * xn)
    .attr('y2', (outerR + 8) * yn)
    .style('stroke', 'rgba(255, 255, 255, 0.15)')
    .style('stroke-width', 1.5);
}

function drawClock(h: number, m: number, text: string | undefined, outerR: number) {
  const a = 2 * Math.PI * (h / 24 + m / 24 / 60) - (1 / 2) * Math.PI;
  drawClockTick(a, outerR);

  const xn = Math.cos(a);
  const yn = Math.sin(a);

  vis
    .append('text')
    .text(text || moment({ hours: h }).format('HH:mm'))
    .attr('text-anchor', 'middle')
    .attr('font-size', '0.78rem')
    .style('font-family', "'Outfit', sans-serif")
    .style('font-weight', '500')
    .style('fill', '#888')
    .attr('x', (outerR + 18) * xn)
    .attr('y', 4 + (outerR + 18) * yn);
}

function mouseclick(_: Event, d: d3.HierarchyRectangularNode<IEvent>) {
  console.log('Clicked', d);
}

function showInfo(d: d3.HierarchyRectangularNode<IEvent>) {
  const hoverEl = d3.select('.explanation > .hover');

  const e: IEvent = d.data;
  const m = moment(e.timestamp);
  hoverEl.select('.date').text(m.format('YYYY-MM-DD'));
  hoverEl.select('.time').text(m.format('HH:mm:ss'));

  const durationString = seconds_to_duration(e.duration);
  hoverEl.select('.duration').text(durationString);

  hoverEl.select('.title').text(e.data.app || e.data.status);

  hoverEl.select('.data').text(e.data.title || '');

  d3.select('.explanation > .base').style('display', 'none');
  hoverEl.style('visibility', '');
}

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(_: Event, d: d3.HierarchyRectangularNode<IEvent>) {
  showInfo(d);

  const sequenceArray = d.ancestors().reverse();
  sequenceArray.shift(); // remove root node from the array

  // Fade all the segments.
  rootEl.selectAll('path').style('opacity', 0.5);

  // Then highlight only those that are an ancestor of the current segment.
  rootEl
    .selectAll('path')
    .filter(function (node: any) {
      return sequenceArray.indexOf(node) >= 0;
    })
    .style('opacity', 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave() {
  // Deactivate all segments during transition.
  rootEl.selectAll('path').on('mouseover', null);

  // Transition each segment to full opacity and then reactivate it.
  rootEl
    .selectAll('path')
    .transition()
    .duration(100)
    .style('opacity', 1)
    .on('end', function () {
      d3.select(this).on('mouseover', mouseover);
    });

  rootEl.select('.explanation > .base').style('display', '');
  rootEl.select('.explanation > .hover').style('visibility', 'hidden');
}

function initializeBreadcrumbTrail() {
  d3.select('.sequence').selectAll('*').remove();
  // Add the svg area.
  const trail = d3
    .select('.sequence')
    .append('svg:svg')
    .attr('width', chartWidth)
    .attr('height', 50)
    .attr('id', 'trail');
  // Add the label at the end, for the percentage.
  trail.append('svg:text').attr('id', 'endlabel').style('fill', '#000');
}

function create(el: HTMLElement, heightVal: number) {
  chartHeight = heightVal || 350;
  chartWidth = chartHeight;
  chartRadius = chartHeight / 2;

  // Clear the svg in case we are redrawing
  rootEl = d3.select(el);
  rootEl.select('.chart').selectAll('svg').remove();

  vis = rootEl
    .select('.chart')
    .append('svg:svg')
    .attr('width', chartWidth)
    .attr('height', chartHeight)
    .append('svg:g')
    .attr('id', 'container')
    .attr('transform', 'translate(' + chartWidth / 2 + ',' + chartHeight / 2 + ')') as d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  >;

  drawLegend();

  partition_layout = d3.partition<IEvent>().size([2 * Math.PI, 1]);

  arc = d3
    .arc<ArcObject>()
    .startAngle(function (d: ArcObject) {
      return d.x0;
    })
    .endAngle(function (d: ArcObject) {
      return d.x1;
    })
    .innerRadius(function (d: ArcObject) {
      const outerR = chartRadius - 35;
      const innerR = outerR * 0.45;
      return innerR + d.y0 * (outerR - innerR);
    })
    .outerRadius(function (d: ArcObject) {
      const outerR = chartRadius - 35;
      const innerR = outerR * 0.45;
      return innerR + d.y1 * (outerR - innerR);
    });
}

interface ClockItem {
  h: number;
  m: number;
  text?: string;
  isSpecial: boolean;
}

function getAngle(item: ClockItem) {
  return 2 * Math.PI * (item.h / 24 + item.m / 24 / 60);
}

// Main function to draw and set up the visualization, once we have the data.
function update(
  el: HTMLElement,
  root_event: IEvent & { children: IEvent[] },
  startOfDay?: moment.Moment,
  heightVal?: number
) {
  if (heightVal) {
    chartHeight = heightVal;
    chartWidth = chartHeight;
    chartRadius = chartHeight / 2;
  }

  // Basic setup of page elements.
  initializeBreadcrumbTrail();

  const containerNode = el.querySelector('#container');
  if (containerNode) {
    containerNode.innerHTML = '';
  }

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append('svg:circle').attr('r', chartRadius).style('opacity', 0);

  // Turn the data into a d3 hierarchy and calculate the sums.
  let root: d3.HierarchyNode<IEvent> = d3.hierarchy<IEvent>(root_event);
  const root_node: d3.HierarchyRectangularNode<IEvent> = partition_layout(root);

  const mode_clock = true;
  let nodes;
  if (mode_clock) {
    const show_whole_day = true;

    let root_start = moment(root_event.timestamp);
    let root_end = root_start.clone().add(root_event.duration, 'seconds');
    if (show_whole_day) {
      if (startOfDay) {
        root_start = startOfDay.clone();
      } else {
        root_start = root_start.startOf('day');
      }
      root_end = root_start.clone().add(1, 'days');

      // non-overlapping clock algorithm
      const clocks: ClockItem[] = [];

      const now = moment();
      if (now.isBetween(root_start, root_end)) {
        clocks.push({ h: now.hour(), m: now.minute(), text: 'Now', isSpecial: true });
      }

      const start_hour = root_start.hours();
      const start_min = root_start.minutes();
      if (start_hour !== 0 || start_min !== 0) {
        clocks.push({ h: start_hour, m: start_min, text: `${root_start.format('HH:mm')} ☀`, isSpecial: true });
      }

      const standardClocks = [
        { h: 0, m: 0, isSpecial: false },
        { h: 6, m: 0, isSpecial: false },
        { h: 12, m: 0, isSpecial: false },
        { h: 18, m: 0, isSpecial: false },
      ];

      for (const std of standardClocks) {
        const stdAngle = getAngle(std);
        let tooClose = false;
        for (const spec of clocks) {
          const specAngle = getAngle(spec);
          let diff = Math.abs(stdAngle - specAngle) % (2 * Math.PI);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          
          if (diff < 0.39) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) {
          clocks.push(std);
        }
      }

      const outerR = chartRadius - 35;
      for (const clock of clocks) {
        drawClock(clock.h, clock.m, clock.text, outerR);
      }
    }

    nodes = root_node
      .each(function (d: d3.HierarchyRectangularNode<IEvent>) {
        const loc_start_sec = moment(d.data.timestamp).diff(root_start, 'seconds', true);
        const loc_end_sec = moment(d.data.timestamp)
          .add(d.data.duration, 'seconds')
          .diff(root_start, 'seconds', true);

        const loc_start = Math.max(
          0,
          loc_start_sec / ((root_end.valueOf() - root_start.valueOf()) / 1000)
        );
        const loc_end = Math.min(
          1,
          loc_end_sec / ((root_end.valueOf() - root_start.valueOf()) / 1000)
        );

        d.x0 = 2 * Math.PI * loc_start;
        d.x1 = 2 * Math.PI * loc_end;
      })
      .descendants();
  } else {
    root = root
      .sum(d => d.duration)
      .sort((a, b) => JSON.stringify(a.data.data).localeCompare(JSON.stringify(b.data.data)));
    nodes = root_node.descendants();
  }

  nodes = nodes.filter(function (d: d3.HierarchyRectangularNode<IEvent>) {
    const threshold = 0.001;
    return d.x1 - d.x0 > threshold;
  });

  vis
    .data([root_event])
    .selectAll('path')
    .data(nodes)
    .enter()
    .append('svg:path')
    .attr('display', function (d: d3.HierarchyNode<IEvent>) {
      return d.depth ? null : 'none';
    })
    .attr('d', arc)
    .attr('fill-rule', 'evenodd')
    .style('fill', function (d: d3.HierarchyNode<IEvent>) {
      const e: IEvent = d.data;
      return getColorFromString(e.data.status || e.data.app);
    })
    .style('opacity', 1)
    .on('mouseover', mouseover)
    .on('click', mouseclick);

  d3.select(el).select('#container').on('mouseleave', mouseleave);
}

export default {
  create: create,
  update: update,
};
