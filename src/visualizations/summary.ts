'use strict';

import * as d3 from 'd3';
import Color from 'color';
import _ from 'lodash';

import { useCategoryStore } from '~/stores/categories';
import { getCategoryColorFromString } from '~/util/color';
import { seconds_to_duration } from '~/util/time';
import { IEvent } from '~/util/interfaces';

const textColor = '#333';

function create(container: HTMLElement) {
  // Clear element
  container.innerHTML = '';

  // Create svg canvas
  const svg = d3.select(container).append('svg');
  svg.attr('width', '100%').attr('height', '100px').attr('class', 'appsummary');
}

function set_status(container: HTMLElement, msg: string) {
  // Select svg canvas
  const svg_elem = container.querySelector('.appsummary');
  const svg = d3.select(svg_elem);
  svg_elem.innerHTML = '';

  svg
    .append('text')
    .attr('x', '0px')
    .attr('y', '25px')
    .text(msg)
    .attr('font-family', "'Outfit', 'Inter', sans-serif")
    .attr('font-size', '16px')
    .attr('font-weight', '500')
    .attr('fill', 'var(--aw-text-muted)');
}

interface Entry {
  name: string;
  hovertext: string;
  duration: number;
  color?: string;
  colorKey?: string | string[];
  link?: string;
  category?: string;
}

function update(container: HTMLElement, apps: Entry[]) {
  // No apps, sets status to "No data"
  if (apps.length <= 0) {
    set_status(container, 'No data');
    return container;
  }

  const svg_elem = container.querySelector('.appsummary');
  svg_elem.innerHTML = '';
  const svg = d3.select(svg_elem);

  // Remove apps without a duration from list
  apps = apps.filter(function (app) {
    return app.duration !== undefined;
  });

  let curr_y = 0;
  const longest_duration = apps[0].duration;
  const containerWidth = container.getBoundingClientRect().width || 300;

  _.each(apps, function (app, i) {
    // TODO: Expand on click and list titles

    // Variables
    const width = (app.duration / longest_duration) * 100 + '%';
    const textSize = 13;

    // Check if name and duration will overlap in narrow containers
    const displayName = app.name && app.name.length > 32 ? app.name.slice(0, 29) + '...' : app.name;
    const durString = seconds_to_duration(app.duration);
    
    const approxNameWidth = (displayName || '').length * 7.2;
    const approxDurWidth = (durString || '').length * 7.8;
    const willOverlap = (approxNameWidth + approxDurWidth + 16) > containerWidth;

    const barY = willOverlap ? (curr_y + 28 + 10) : (curr_y + 24);
    const durY = willOverlap ? (curr_y + 26) : (curr_y + 14);
    const entryHeight = willOverlap ? 48 : 36;

    let appcolor: string;
    if (Array.isArray(app.colorKey)) {
      const categoryStore = useCategoryStore();
      appcolor = categoryStore.get_category_color(app.colorKey);
    } else {
      appcolor = app.color || getCategoryColorFromString(app.colorKey || app.name);
    }

    const hovercolor = Color(appcolor).lighten(0.15).hex();

    // Add a parent <a> element if link is set
    const a = app.link ? svg.append('a').attr('href', app.link) : svg;

    // The group representing an entry in the barchart
    const eg = a.append('g');
    eg.attr('id', 'summary_' + i)
      .on('mouseover', function () {
        eg.select('.progress-fill').style('fill', hovercolor);
      })
      .on('mouseout', function () {
        eg.select('.progress-fill').style('fill', appcolor);
      });

    eg.append('title').text(app.hovertext + '\n' + durString);

    // Sleek background track capsule (full width)
    eg.append('rect')
      .attr('x', 0)
      .attr('y', barY)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', '100%')
      .attr('height', 8)
      .style('fill', 'rgba(255, 255, 255, 0.05)');

    // Colored progress capsule fill (variable width)
    eg.append('rect')
      .attr('class', 'progress-fill')
      .attr('x', 0)
      .attr('y', barY)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', width)
      .attr('height', 8)
      .style('fill', appcolor)
      .style('transition', 'fill 0.2s ease');

    // App name (Left aligned)
    eg.append('text')
      .attr('x', 0)
      .attr('y', curr_y + 14)
      .text(displayName)
      .attr('font-family', "'Outfit', 'Inter', 'Segoe UI', sans-serif")
      .attr('font-size', textSize + 'px')
      .attr('font-weight', '600')
      .attr('fill', 'var(--aw-text-primary)');

    // Duration (Right aligned or shifted to next line)
    eg.append('text')
      .attr('x', '100%')
      .attr('y', durY)
      .attr('text-anchor', 'end')
      .text(durString)
      .attr('font-family', "'Outfit', 'Inter', monospace, sans-serif")
      .attr('font-size', (textSize - 1) + 'px')
      .attr('font-weight', '500')
      .attr('fill', 'var(--aw-text-muted)');

    curr_y += entryHeight + 10;
  });
  curr_y -= 10;

  svg.attr('height', curr_y);

  return container;
}

function updateSummedEvents(
  container: HTMLElement,
  summedEvents: IEvent[],
  titleKeyFunc: (event: IEvent) => string,
  hoverKeyFunc: (event: IEvent) => string,
  colorKeyFunc: (event: IEvent) => string,
  linkKeyFunc: (event: IEvent) => string = () => null
) {
  if (hoverKeyFunc == null) {
    hoverKeyFunc = titleKeyFunc;
  }
  const apps = _.map(summedEvents, e => {
    return {
      name: titleKeyFunc(e),
      hovertext: hoverKeyFunc(e),
      duration: e.duration,
      color: e.data['$color'],
      colorKey: colorKeyFunc(e),
      link: linkKeyFunc(e),
      category: e.data['$category'],
    } as Entry;
  });
  update(container, apps);
}

export default {
  create: create,
  update: update,
  updateSummedEvents: updateSummedEvents,
  set_status: set_status,
};
