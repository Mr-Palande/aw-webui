<template lang="pug">
div.vis-widget-card
  // Hoverable Right-Edge Resize Handle
  div.resize-handle(v-if="editable" @mousedown="onResizeStart")
    div.resize-bar

  h5
    icon.handle(name="bars" v-if="editable" style="opacity: 0.6; cursor: grab;")
    | {{ visualizations[type].title }}

  div.vis-style-dropdown-btn
    b-button.p-0.mr-2(v-if="has_prerequisites" size="sm" variant="outline-secondary" @click="isFocused = true" title="Focus view & details")
      icon(name="expand")

    b-button.p-0.mr-1(v-if="editable" size="sm" variant="outline-secondary" @click="$emit('openSettings', { index: id, type: type, colSpan: colSpan, rowSpan: rowSpan, rect: $el.getBoundingClientRect() })" title="Widget settings")
      icon(name="cog")

    b-button.p-0(v-if="editable" size="sm" variant="outline-danger" @click="$emit('onRemove', id)")
      icon(name="times")


  div(v-if="!supports_period")
    b-alert.small.px-2.py-1(show variant="warning")
      | This feature doesn't support the current time period.

  div(v-if="activityStore.buckets.loaded")
    // Check data prerequisites
    div(v-if="!has_prerequisites")
      b-alert.small.px-2.py-1(show variant="warning")
        | This feature is missing data from a required watcher.
        | You can find a list of all watchers in #[a(href="https://activitywatch.readthedocs.io/en/latest/watchers.html") the documentation].

    div(v-if="type == 'top_apps'")
      aw-summary(:fields="activityStore.window.top_apps",
                 :namefunc="e => e.data.app",
                 :colorfunc="e => e.data.app",
                 with_limit)
    div(v-if="type == 'top_titles' && !activityStore.android.available")
      aw-summary(:fields="activityStore.window.top_titles",
                 :namefunc="e => e.data.title",
                 :colorfunc="e => e.data['$category']",
                 with_limit)
    div(v-if="type == 'top_domains'")
      aw-summary(:fields="activityStore.browser.top_domains",
                 :namefunc="e => e.data.$domain",
                 :colorfunc="e => e.data.$domain",
                 with_limit)
    div(v-if="type == 'top_urls'")
      aw-summary(:fields="activityStore.browser.top_urls",
                 :namefunc="e => e.data.url",
                 :colorfunc="e => e.data.$domain",
                 with_limit)
    div(v-if="type == 'top_browser_titles'")
      aw-summary(:fields="activityStore.browser.top_titles",
                 :namefunc="e => e.data.title",
                 :colorfunc="e => e.data.$domain",
                 with_limit)
    div(v-if="type == 'top_editor_files'")
      aw-summary(:fields="activityStore.editor.top_files",
                 :namefunc="top_editor_files_namefunc",
                 :hoverfunc="top_editor_files_hoverfunc",
                 :colorfunc="e => e.data.language",
                 with_limit)
    div(v-if="type == 'top_editor_languages'")
      aw-summary(:fields="activityStore.editor.top_languages",
                 :namefunc="e => e.data.language",
                 :colorfunc="e => e.data.language",
                 with_limit)
    div(v-if="type == 'top_editor_projects'")
      aw-summary(:fields="activityStore.editor.top_projects",
                 :namefunc="top_editor_projects_namefunc",
                 :hoverfunc="top_editor_projects_hoverfunc",
                 :colorfunc="e => e.data.language",
                 with_limit)
    div(v-if="type == 'top_categories'")
      aw-summary(:fields="activityStore.category.top",
                 :namefunc="e => e.data['$category'].join(' > ')",
                 :colorfunc="e => e.data['$category']",
                 :linkfunc="e => '#' + $route.path + '?category=' + encodeURIComponent(e.data['$category'].join('>'))",
                 with_limit)
    div(v-if="type == 'category_tree'")
      aw-categorytree(:events="activityStore.category.top")
    div(v-if="type == 'category_sunburst'" :style="{ height: visHeight + 'px' }")
      aw-sunburst-categories(:data="top_categories_hierarchy", :style="{ height: visHeight + 'px' }")
    div(v-if="type == 'category_doughnut'" :style="{ height: visHeight + 'px' }")
      aw-categorydoughnut(:events="activityStore.category.top", :height="visHeight")
    div(v-if="type == 'category_polar'" :style="{ height: visHeight + 'px' }")
      aw-categorypolar(:events="activityStore.category.top", :height="visHeight")
    div(v-if="type == 'timeline_barchart'" :style="{ height: visHeight + 'px' }")
      aw-timeline-barchart(:datasets="datasets", :timeperiod_start="activityStore.query_options.timeperiod.start", :timeperiod_length="activityStore.query_options.timeperiod.length", :height="visHeight")
    div(v-if="type == 'sunburst_clock'" :style="{ height: visHeight + 'px' }")
      aw-sunburst-clock(:date="date", :afkBucketId="activityStore.buckets.afk[0]", :windowBucketId="activityStore.buckets.window[0]", :height="visHeight")
    div(v-if="type == 'custom_vis'")
      aw-custom-vis(:visname="props.visname" :title="props.title")
    div(v-if="type == 'vis_timeline' && isSingleDay" :style="{ height: visHeight + 'px' }")
      vis-timeline(:buckets="timeline_buckets", :showRowLabels='true', :queriedInterval="timeline_daterange")
    div(v-if="type == 'score'")
      aw-score()
    div(v-if="type == 'top_stopwatches'")
      aw-summary(:fields="activityStore.stopwatch.top_stopwatches",
                 :namefunc="e => e.data.label",
                 :colorfunc="e => e.data.label",
                 with_limit)
    div(v-if="type == 'top_bucket_data'")
      aw-top-bucket-data(
        :initialBucketId="props ? props.bucketId : ''",
        :initialField="props ? props.field : ''",
        :initialCustomField="props ? props.customField : ''",
        @update-props="onWatcherPropsChange"
      )

  // Fullscreen Focus Modal for detailed breakdown
  b-modal(v-model="isFocused" size="xl" :title="visualizations[type].title + ' - Detailed View'" hide-footer centered modal-class="aw-focus-modal")
    div.focus-modal-content(v-if="isFocused")
      h4.text-center.mb-4(style="font-family: 'Outfit', sans-serif; font-weight: 700; color: var(--aw-text-primary); letter-spacing: -0.01em;")
        | {{ visualizations[type].title }} (Focused)
      
      // Top Half: Larger focused visualization
      div.focused-chart-wrapper.mb-4.p-4(style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; min-height: 320px;")
        div(v-if="type == 'top_apps'")
          aw-summary(:fields="activityStore.window.top_apps",
                     :namefunc="e => e.data.app",
                     :colorfunc="e => e.data.app")
        div(v-if="type == 'top_titles' && !activityStore.android.available")
          aw-summary(:fields="activityStore.window.top_titles",
                     :namefunc="e => e.data.title",
                     :colorfunc="e => e.data['$category']")
        div(v-if="type == 'top_domains'")
          aw-summary(:fields="activityStore.browser.top_domains",
                     :namefunc="e => e.data.$domain",
                     :colorfunc="e => e.data.$domain")
        div(v-if="type == 'top_urls'")
          aw-summary(:fields="activityStore.browser.top_urls",
                     :namefunc="e => e.data.url",
                     :colorfunc="e => e.data.$domain")
        div(v-if="type == 'top_browser_titles'")
          aw-summary(:fields="activityStore.browser.top_titles",
                     :namefunc="e => e.data.title",
                     :colorfunc="e => e.data.$domain")
        div(v-if="type == 'top_editor_files'")
          aw-summary(:fields="activityStore.editor.top_files",
                     :namefunc="top_editor_files_namefunc",
                     :hoverfunc="top_editor_files_hoverfunc",
                     :colorfunc="e => e.data.language")
        div(v-if="type == 'top_editor_languages'")
          aw-summary(:fields="activityStore.editor.top_languages",
                     :namefunc="e => e.data.language",
                     :colorfunc="e => e.data.language")
        div(v-if="type == 'top_editor_projects'")
          aw-summary(:fields="activityStore.editor.top_projects",
                     :namefunc="top_editor_projects_namefunc",
                     :hoverfunc="top_editor_projects_hoverfunc",
                     :colorfunc="e => e.data.language")
        div(v-if="type == 'top_categories'")
          aw-summary(:fields="activityStore.category.top",
                     :namefunc="e => e.data['$category'].join(' > ')",
                     :colorfunc="e => e.data['$category']")
        div(v-if="type == 'category_tree'")
          aw-categorytree(:events="activityStore.category.top")
        div(v-if="type == 'category_sunburst'")
          aw-sunburst-categories(:data="top_categories_hierarchy", style="height: 25em")
        div(v-if="type == 'category_doughnut'")
          aw-categorydoughnut(:events="activityStore.category.top", :height="350")
        div(v-if="type == 'category_polar'")
          aw-categorypolar(:events="activityStore.category.top", :height="350")
        div(v-if="type == 'timeline_barchart'")
          aw-timeline-barchart(:datasets="datasets", :timeperiod_start="activityStore.query_options.timeperiod.start", :timeperiod_length="activityStore.query_options.timeperiod.length", style="height: 220")
        div(v-if="type == 'sunburst_clock'")
          aw-sunburst-clock(:date="date", :afkBucketId="activityStore.buckets.afk[0]", :windowBucketId="activityStore.buckets.window[0]", :height="350")
        div(v-if="type == 'custom_vis'")
          aw-custom-vis(:visname="props.visname" :title="props.title")
        div(v-if="type == 'vis_timeline' && isSingleDay")
          vis-timeline(:buckets="timeline_buckets", :showRowLabels='true', :queriedInterval="timeline_daterange")
        div(v-if="type == 'score'")
          aw-score()
        div(v-if="type == 'top_stopwatches'")
          aw-summary(:fields="activityStore.stopwatch.top_stopwatches",
                     :namefunc="e => e.data.label",
                     :colorfunc="e => e.data.label")
        div(v-if="type == 'top_bucket_data'")
          aw-top-bucket-data(
            :initialBucketId="props ? props.bucketId : ''",
            :initialField="props ? props.field : ''",
            :initialCustomField="props ? props.customField : ''"
          )

      // Bottom Half: Detailed Table of contributing events
      div.detailed-table-wrapper.mt-4
        h5.mb-3(style="font-family: 'Outfit', sans-serif; font-weight: 600; color: var(--aw-text-primary); display: flex; align-items: center; gap: 8px;")
          icon(name="list" style="color: #10b981;")
          | Detailed Action Logs (Ranked by Duration)
        
        div.table-responsive(style="max-height: 350px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;")
          table.table.table-striped.table-hover.m-0(style="background: #111; color: var(--aw-text-secondary); font-size: 0.88rem; width: 100%;")
            thead(style="position: sticky; top: 0; background: #1a1a1a; z-index: 10; color: var(--aw-text-primary); border-bottom: 2px solid rgba(255,255,255,0.08);")
              tr
                th(style="padding: 10px 15px; width: 60px;") Rank
                th(style="padding: 10px 15px; width: 180px;") App / Source
                th(style="padding: 10px 15px; width: 120px;") Duration
                th(style="padding: 10px 15px;") Detailed Action / Context
            tbody
              tr(v-for="evt, idx in focusedTableData" :key="idx" style="border-bottom: 1px solid rgba(255,255,255,0.04);")
                td.text-muted.font-weight-bold(style="padding: 8px 15px;") # {{ idx + 1 }}
                td(style="padding: 8px 15px; font-weight: 600; color: var(--aw-text-primary);") {{ evt.app }}
                td(style="padding: 8px 15px; font-family: monospace; color: #10b981; font-weight: bold;") {{ evt.duration | friendlyduration }}
                td.text-wrap(style="padding: 8px 15px; max-width: 400px; word-break: break-word; color: var(--aw-text-secondary);") {{ evt.details }}
</template>

<style lang="scss">
.vis-widget-card {
  background: rgba(255, 255, 255, 0.02) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  border-radius: 16px !important;
  padding: 1.25rem !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative !important;
  height: 100% !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  display: flex !important;
  flex-direction: column !important;

  /* Thin scrollbar for widget content */
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.04) !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.08) !important;
  }

  h5 {
    font-family: 'Outfit', sans-serif !important;
    font-weight: 700 !important;
    font-size: 1rem !important;
    color: var(--aw-text-primary) !important;
    margin-bottom: 0.8rem !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding-right: 115px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    flex-shrink: 0 !important;
  }

  // Content area fills remaining space
  > div:not(.resize-handle):not(.vis-style-dropdown-btn) {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  // Hoverable Right Resize Handle
  .resize-handle {
    position: absolute;
    top: 0;
    right: 0;
    width: 14px;
    height: 100%;
    cursor: col-resize;
    z-index: 15;
    display: flex;
    align-items: center;
    justify-content: center;

    .resize-bar {
      width: 3px;
      height: 30px;
      border-radius: 2px;
      background-color: rgba(255, 255, 255, 0.08);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &:hover .resize-bar {
      background-color: #10b981;
      box-shadow: 0 0 8px #10b981;
      height: 60px;
      width: 4px;
    }
  }
}

.vis-style-dropdown-btn {
  position: absolute;
  top: 0.95rem;
  right: 1.1rem;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 10;

  .btn, .btn-secondary, .btn-link {
    border: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    color: var(--aw-text-muted) !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: none !important;

    &:hover {
      color: var(--aw-text-primary) !important;
      background: rgba(255, 255, 255, 0.08) !important;
    }
  }

  .btn-outline-danger {
    &:hover {
      color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.12) !important;
    }
  }
}

/* Deep scoped custom styles for obsidian glass modal */
::v-deep .modal-content {
  background: rgba(20, 20, 20, 0.85) !important;
  backdrop-filter: blur(25px) !important;
  -webkit-backdrop-filter: blur(25px) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5) !important;
}

::v-deep .modal-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  padding: 1.25rem 2rem !important;
  .modal-title {
    font-family: 'Outfit', sans-serif !important;
    font-weight: 700 !important;
    color: var(--aw-text-primary) !important;
  }
  .close {
    color: var(--aw-text-muted) !important;
    text-shadow: none !important;
    opacity: 0.7;
    &:hover {
      color: var(--aw-text-primary) !important;
      opacity: 1;
    }
  }
}

::v-deep .modal-body {
  padding: 2rem !important;
  background: transparent !important;
}

/* Custom scrollbars inside the detailed table */
.detailed-table-wrapper {
  .table-responsive {
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.12);
      border-radius: 4px;
      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }
}
</style>

<script lang="ts">
import _ from 'lodash';
import 'vue-awesome/icons/cog';
import 'vue-awesome/icons/times';
import 'vue-awesome/icons/bars';
import 'vue-awesome/icons/expand';
import 'vue-awesome/icons/list';
import 'vue-awesome/icons/plus-circle';
import 'vue-awesome/icons/minus-circle';
import 'vue-awesome/icons/th-large';
import 'vue-awesome/icons/arrows-alt';
import 'vue-awesome/icons/chart-bar';

import { buildBarchartDataset } from '~/util/datasets';

// TODO: Move this somewhere else
import { build_category_hierarchy } from '~/util/classes';

import { useActivityStore } from '~/stores/activity';
import { useCategoryStore } from '~/stores/categories';
import { useBucketsStore } from '~/stores/buckets';
import { useViewsStore } from '~/stores/views';

import moment from 'moment';

function pick_subname_as_name(c) {
  c.name = c.subname;
  c.children = c.children.map(pick_subname_as_name);
  return c;
}

export default {
  name: 'aw-selectable-vis',
  props: {
    id: Number,
    type: String,
    props: Object,
    viewId: { type: String, default: '' },
    editable: { type: Boolean, default: true },
  },
  data: function () {
    return {
      activityStore: useActivityStore(),
      categoryStore: useCategoryStore(),
      isFocused: false,
      types: [
        'top_apps',
        'top_titles',
        'top_domains',
        'top_urls',
        'top_browser_titles',
        'top_categories',
        'category_tree',
        'category_sunburst',
        'category_doughnut',
        'category_polar',
        'top_editor_files',
        'top_editor_languages',
        'top_editor_projects',
        'timeline_barchart',
        'sunburst_clock',
        'custom_vis',
        'vis_timeline',
        'score',
        'top_stopwatches',
        'top_bucket_data',
      ],
      // TODO: Move this function somewhere else
      top_editor_files_namefunc: e => {
        let f = e.data.file || '';
        f = f.split('/');
        f = f[f.length - 1];
        return f;
      },
      top_editor_files_hoverfunc: e => {
        return 'file: ' + e.data.file + '\n' + 'project: ' + e.data.project;
      },
      // TODO: Move this function somewhere else
      top_editor_projects_namefunc: e => {
        let f = e.data.project || '';
        f = f.split('/');
        f = f[f.length - 1];
        return f;
      },
      top_editor_projects_hoverfunc: e => e.data.project,
      timeline_buckets: null,
    };
  },
  computed: {
    visualizations: function () {
      return {
        top_apps: {
          title: 'Top Applications',
          available: this.activityStore.window.available || this.activityStore.android.available,
        },
        top_titles: {
          title: 'Top Window Titles',
          available: this.activityStore.window.available,
        },
        top_domains: {
          title: 'Top Browser Domains',
          available: this.activityStore.browser.available,
        },
        top_urls: {
          title: 'Top Browser URLs',
          available: this.activityStore.browser.available,
        },
        top_browser_titles: {
          title: 'Top Browser Titles',
          available: this.activityStore.browser.available,
        },
        top_editor_files: {
          title: 'Top Editor Files',
          available: this.activityStore.editor.available,
        },
        top_editor_languages: {
          title: 'Top Editor Languages',
          available: this.activityStore.editor.available,
        },
        top_editor_projects: {
          title: 'Top Editor Projects',
          available: this.activityStore.editor.available,
        },
        top_categories: {
          title: 'Top Categories',
          available: this.activityStore.category.available,
        },
        category_tree: {
          title: 'Category Tree',
          available: this.activityStore.category.available,
        },
        category_sunburst: {
          title: 'Category Sunburst',
          available: this.activityStore.category.available,
        },
        category_doughnut: {
          title: 'Category Doughnut (Glassmorphic)',
          available: this.activityStore.category.available,
        },
        category_polar: {
          title: 'Category Polar Area',
          available: this.activityStore.category.available,
        },
        timeline_barchart: {
          title: 'Timeline (barchart)',
          available: true,
        },
        sunburst_clock: {
          title: 'Sunburst clock',
          available: this.activityStore.window.available && this.activityStore.active.available,
        },
        vis_timeline: {
          title: 'Daily Timeline (Chronological)',
          available: true,
        },
        custom_vis: {
          title: 'Custom Visualization',
          available: true, // TODO: Implement
        },
        score: {
          title: 'Score',
          available: this.activityStore.category.available,
        },
        top_stopwatches: {
          title: 'Top Stopwatch Events',
          available: this.activityStore.stopwatch.available,
        },
        top_bucket_data: {
          title: 'Top Bucket Data',
          available: true,
        },
      };
    },
    has_prerequisites() {
      return this.visualizations[this.type].available;
    },
    supports_period: function () {
      if (this.type == 'sunburst_clock' || this.type == 'vis_timeline') {
        return this.isSingleDay;
      }
      return true;
    },
    top_categories_hierarchy: function () {
      const top_categories = this.activityStore.category.top;
      if (top_categories) {
        const categories = top_categories.map(c => {
          return { name: c.data.$category, size: c.duration };
        });

        return {
          name: 'All',
          children: build_category_hierarchy(categories).map(c => pick_subname_as_name(c)),
        };
      } else {
        return null;
      }
    },
    datasets: function () {
      // Return empty array if not loaded
      if (!this.activityStore.category.by_period) return [];

      const datasets = buildBarchartDataset(
        this.activityStore.category.by_period,
        this.categoryStore.classes
      );

      // Return dataset if data found, else return null (indicating no data)
      if (datasets.length > 0) return datasets;
      else return null;
    },
    date: function () {
      let date = this.activityStore.query_options.date;
      if (!date) {
        date = this.activityStore.query_options.timeperiod.start;
      }
      return date;
    },
    timeline_daterange: function () {
      if (this.activityStore.query_options === null) return null;

      let date = this.activityStore.query_options.date;
      if (!date) {
        date = this.activityStore.query_options.timeperiod.start;
      }

      return [moment(date), moment(date).add(1, 'day')];
    },
    isSingleDay: function () {
      return _.isEqual(this.activityStore.query_options.timeperiod.length, [1, 'day']);
    },
    focusedTableData() {
      const store = this.activityStore;
      if (!store) return [];
      
      let list = [];
      if (this.type === 'top_apps') {
        list = store.window.top_apps || [];
        return list.map(e => ({ app: e.data.app, duration: e.duration, details: 'Application Usage' }));
      } else if (this.type === 'top_titles') {
        list = store.window.top_titles || [];
        return list.map(e => ({ app: e.data.app, duration: e.duration, details: e.data.title }));
      } else if (this.type === 'top_domains') {
        list = store.browser.top_domains || [];
        return list.map(e => ({ app: e.data.$domain || 'Browser', duration: e.duration, details: 'Domain Visit' }));
      } else if (this.type === 'top_urls') {
        list = store.browser.top_urls || [];
        return list.map(e => ({ app: e.data.$domain || 'Browser', duration: e.duration, details: e.data.url }));
      } else if (this.type === 'top_browser_titles') {
        list = store.browser.top_titles || [];
        return list.map(e => ({ app: e.data.$domain || 'Browser', duration: e.duration, details: e.data.title }));
      } else if (this.type === 'top_editor_files') {
        list = store.editor.top_files || [];
        return list.map(e => ({ app: e.data.project || 'Editor', duration: e.duration, details: `${e.data.file} (${e.data.language})` }));
      } else if (this.type === 'top_editor_languages') {
        list = store.editor.top_languages || [];
        return list.map(e => ({ app: e.data.language, duration: e.duration, details: 'Coding Language Activity' }));
      } else if (this.type === 'top_editor_projects') {
        list = store.editor.top_projects || [];
        return list.map(e => ({ app: e.data.project, duration: e.duration, details: 'Coding Project Work' }));
      } else if (['top_categories', 'category_tree', 'category_sunburst', 'category_doughnut', 'category_polar', 'score'].includes(this.type)) {
        list = store.category.top || [];
        return list.map(e => ({ app: e.data.$category ? e.data.$category.join(' > ') : 'Category', duration: e.duration, details: 'Categorized Activity' }));
      } else if (this.type === 'top_stopwatches') {
        list = store.stopwatch.top_stopwatches || [];
        return list.map(e => ({ app: 'Stopwatch', duration: e.duration, details: e.data.label }));
      } else {
        list = store.window.top_titles || [];
        return list.map(e => ({ app: e.data.app, duration: e.duration, details: e.data.title }));
      }
    },
    colSpan() {
      if (!this.viewId) return 1;
      const viewsStore = useViewsStore();
      const view = viewsStore.views.find(v => v.id === this.viewId);
      if (!view || !view.elements[this.id]) return 1;
      const el = view.elements[this.id];
      // Min-size map (mirrors ActivityView's MIN_GRID_SIZES)
      const minCols = {
        vis_timeline: 4, category_sunburst: 3, sunburst_clock: 3,
        category_doughnut: 2, category_polar: 2, timeline_barchart: 2,
        category_tree: 1,
      }[el.type] || 1;
      let defaultCol = el.size === 3 ? 4 : (el.size === 2 ? 2 : minCols);
      defaultCol = Math.max(minCols, defaultCol);
      return Math.max(minCols, el.colSpan || defaultCol);
    },
    rowSpan() {
      if (!this.viewId) return 1;
      const viewsStore = useViewsStore();
      const view = viewsStore.views.find(v => v.id === this.viewId);
      if (!view || !view.elements[this.id]) return 1;
      const el = view.elements[this.id];
      // Min-size map (mirrors ActivityView's MIN_GRID_SIZES)
      const minRows = {
        category_sunburst: 3, sunburst_clock: 3,
        category_doughnut: 2, category_polar: 2, timeline_barchart: 2,
        vis_timeline: 2, category_tree: 2,
      }[el.type] || 1;
      return Math.max(minRows, el.rowSpan || minRows);
    },
    isVisLargeFallback() {
      return this.type === 'sunburst_clock' || this.type === 'vis_timeline';
    },
    elMinWidth() {
      if (!this.viewId) return null;
      const viewsStore = useViewsStore();
      const view = viewsStore.views.find(v => v.id === this.viewId);
      if (!view || !view.elements[this.id]) return null;
      return view.elements[this.id].minWidth || null;
    },
    elMinHeight() {
      if (!this.viewId) return null;
      const viewsStore = useViewsStore();
      const view = viewsStore.views.find(v => v.id === this.viewId);
      if (!view || !view.elements[this.id]) return null;
      return view.elements[this.id].minHeight || null;
    },
    minWidth() {
      const wideTypes = ['timeline_barchart', 'vis_timeline', 'sunburst_clock', 'category_sunburst'];
      if (wideTypes.includes(this.type)) {
        return 500;
      }
      const midTypes = ['category_doughnut', 'category_polar', 'category_tree'];
      if (midTypes.includes(this.type)) {
        return 350;
      }
      return 280;
    },
    visHeight() {
      const rowSpanVal = this.rowSpan;
      return 190 + (rowSpanVal - 1) * 276;
    },
  },
  watch: {
    timeline_daterange: async function () {
      await this.getTimelineBuckets();
    },
    type: async function (newType) {
      if (newType == 'vis_timeline') await this.getTimelineBuckets();
    },
  },
  mounted: async function () {
    if (this.type == 'vis_timeline') {
      await this.getTimelineBuckets();
    }
  },
  methods: {
    onWatcherPropsChange(newProps) {
      if (!this.viewId) return;
      const mergedProps = { ...(this.props || {}), ...newProps };
      useViewsStore().editView({
        view_id: this.viewId,
        el_id: this.id,
        type: this.type,
        props: mergedProps,
      });
    },
    adjustGrid(prop: 'colSpan' | 'rowSpan', delta: number) {
      if (!this.viewId) return;
      const currentVal = prop === 'colSpan' ? this.colSpan : this.rowSpan;
      const newVal = Math.max(1, Math.min(4, currentVal + delta));
      useViewsStore().changeElementGrid({
        view_id: this.viewId,
        el_id: this.id,
        prop,
        value: newVal,
      });
      useViewsStore().save();
    },

    setMinDimension(prop: 'minWidth' | 'minHeight', value: number) {
      if (!this.viewId) return;
      useViewsStore().changeElementMinDimensions({
        view_id: this.viewId,
        el_id: this.id,
        [prop]: value,
      });
      useViewsStore().save();
    },

    changeSize(size) {
      if (!this.viewId) return;
      useViewsStore().changeElementSize({
        view_id: this.viewId,
        el_id: this.id,
        size,
      });
      useViewsStore().save();
    },
    changeWidth(width) {
      if (!this.viewId) return;
      useViewsStore().changeElementWidth({
        view_id: this.viewId,
        el_id: this.id,
        width,
      });
    },
    onResizeStart(event: MouseEvent) {
      event.preventDefault();
      const startX = event.clientX;
      const parentEl = this.$el.parentElement || this.$el;
      const startWidth = parentEl.getBoundingClientRect().width;
      
      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.max(this.minWidth, startWidth + deltaX);
        this.changeWidth(newWidth);
      };
      
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        useViewsStore().save();
      };
      
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    getTimelineBuckets: async function () {
      if (this.type != 'vis_timeline') return;
      if (!this.timeline_daterange) return;

      await useBucketsStore().ensureLoaded();
      this.timeline_buckets = Object.freeze(
        await useBucketsStore().getBucketsWithEvents({
          start: this.timeline_daterange[0].format(),
          end: this.timeline_daterange[1].format(),
        })
      );
    },

  },
};
</script>
