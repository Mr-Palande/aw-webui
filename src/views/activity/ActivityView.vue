<template lang="pug">
div(v-if="view" style="position: relative;")
  // Layout Lock / Unlock Dashboard Control Bar
  div.dashboard-control-bar.d-flex.justify-content-between.align-items-center.mb-3.p-3(style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);")
    div.d-flex.align-items-center
      h4.m-0.font-weight-bold(style="font-family: 'Outfit', sans-serif; color: var(--aw-text-primary); font-size: 1.25rem;") Dashboard: {{ view.name }}
      span.badge.ml-2(:class="editing ? 'badge-warning' : 'badge-success'" style="font-size: 0.75rem; padding: 4px 8px; border-radius: 6px;")
        | {{ editing ? '🔓 Move & Customize Mode' : '🔒 Fixed & Locked' }}
    
    div.d-flex(style="gap: 8px;")
      template(v-if="editing")
        b-button(variant="success" size="sm" @click="save(); editing = false" style="border-radius: 8px; display: flex; align-items: center; gap: 6px;")
          icon(name="save")
          span Save & Lock
        b-button(variant="outline-secondary" size="sm" @click="discard(); editing = false" style="border-radius: 8px; display: flex; align-items: center; gap: 6px;")
          icon(name="times")
          span Cancel
        b-button(variant="outline-warning" size="sm" @click="restoreDefaults()" style="border-radius: 8px; display: flex; align-items: center; gap: 6px;")
          icon(name="undo")
          span Defaults
        b-button(variant="outline-danger" size="sm" @click="remove()" style="border-radius: 8px; display: flex; align-items: center; gap: 6px;")
          icon(name="trash")
          span Delete View
      template(v-else)
        b-button(variant="outline-primary" size="sm" @click="editing = true" style="border-radius: 8px; display: flex; align-items: center; gap: 6px; border-color: rgba(6, 182, 212, 0.4); color: #06b6d4;")
          icon(name="lock-open")
          span Move & Customize

  // Technical Blueprint Snapping Grid Backdrop
  div.grid-background(v-if="editing")
    div.grid-bg-cell(v-for="n in 24" :key="n")

  draggable.aw-grid-dashboard(v-model="elements" handle=".handle" :disabled="!editing")
    div.grid-item-wrapper(v-for="el, index in elements", :key="index", :style="getVisStyle(el)")
      aw-selectable-vis(
        :id="index"
        :type="el.type"
        :props="el.props"
        :view-id="view.id"
        @onTypeChange="onTypeChange"
        @onRemove="onRemove"
        @openSettings="onOpenSettings"
        :editable="editing"
      )

    div.p-2(v-if="editing" style="grid-column: span 1; grid-row: span 1;")
      b-button.h-100.w-100.d-flex.flex-column.align-items-center.justify-content-center.p-4(@click="addVisualization" variant="outline-secondary" style="border: 2px dashed rgba(255,255,255,0.15); border-radius: 16px; background: rgba(255,255,255,0.01); min-height: 240px; color: var(--aw-text-muted);")
        icon(name="plus" style="font-size: 1.5rem; margin-bottom: 8px;")
        span.font-weight-bold Add visualization

  // Floating Draggable Settings Panel (Fixed/Absolute Position outside individual cards)
  div.settings-floating-panel(
    v-if="showSettingsPanel && activeSettingsEl"
    :style="{ left: panelX + 'px', top: panelY + 'px' }"
    @mousedown.self="onPanelDragStart"
  )
    // Draggable Title Bar
    div.settings-panel-header(@mousedown="onPanelDragStart")
      div.d-flex.align-items-center(style="gap: 6px;")
        icon(name="cog" style="color: #10b981; font-size: 0.8rem;")
        span {{ visualizations[activeSettingsEl.type].title }}
      b-button.p-0(size="sm" variant="link" @click="showSettingsPanel = false" style="color: var(--aw-text-muted); line-height: 1;")
        icon(name="times")

    div.settings-panel-body
      // Grid Squares Picker
      h6.settings-section-title
        icon(name="th-large" style="color: #10b981; font-size: 0.8rem;")
        | Grid Size

      div.grid-picker-container.mb-3
        div.grid-picker-label.d-flex.justify-content-between.small.text-muted.mb-2
          span Cells:
          span.font-weight-bold(style="font-family: monospace; color: #10b981; font-size: 0.85rem;") {{ hoverColSpan || activeSettingsEl.colSpan }}w × {{ hoverRowSpan || activeSettingsEl.rowSpan }}h

        div.grid-picker-cells
          div(v-for="r in 4" :key="r" style="display: flex; gap: 4px; margin-bottom: 4px;")
            div.grid-picker-cell(
              v-for="c in 4"
              :key="c"
              @mouseenter="hoverColSpan = c; hoverRowSpan = r"
              @mouseleave="hoverColSpan = 0; hoverRowSpan = 0"
              @click="setGridSpan(activeSettingsEl.index, c, r)"
              :class="getGridCellClass(c, r)"
            )

      div.settings-divider

      // Widget Type Picker
      h6.settings-section-title
        icon(name="chart-bar" style="color: #06b6d4; font-size: 0.8rem;")
        | Widget Type

      div.vis-type-list
        div.vis-type-item(
          v-for="t in types"
          :key="t"
          @click="onTypeChange(activeSettingsEl.index, t)"
          :class="{ active: activeSettingsEl.type === t }"
        )
          | {{ visualizations[t].title }}
          span.small.ml-1(v-if="!visualizations[t].available" style="color: rgba(245, 158, 11, 0.7); font-size: 0.65rem;") [no data]
</template>

<script lang="ts">
import 'vue-awesome/icons/save';
import 'vue-awesome/icons/times';
import 'vue-awesome/icons/trash';
import 'vue-awesome/icons/undo';
import 'vue-awesome/icons/lock';
import 'vue-awesome/icons/lock-open';
import 'vue-awesome/icons/cog';
import 'vue-awesome/icons/th-large';
import 'vue-awesome/icons/chart-bar';

import { mapState } from 'pinia';
import draggable from 'vuedraggable';

import { useViewsStore } from '~/stores/views';
import { useActivityStore } from '~/stores/activity';

export default {
  name: 'ActivityView',
  components: {
    draggable: draggable,
  },
  props: {
    view_id: { type: String, default: 'default' },
  },
  data() {
    return {
      editing: false,
      activityStore: useActivityStore(),
      // Floating settings panel state (Fixed Position, fully draggable outside widget card containment)
      showSettingsPanel: false,
      activeSettingsEl: null as { index: number; type: string; colSpan: number; rowSpan: number } | null,
      panelX: 300,
      panelY: 200,
      panelDragStartX: 0,
      panelDragStartY: 0,
      panelStartLeft: 0,
      panelStartTop: 0,
      hoverColSpan: 0,
      hoverRowSpan: 0,
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
    };
  },
  computed: {
    ...mapState(useViewsStore, ['views']),
    view: function () {
      if (this.view_id == 'default') {
        return this.views[0];
      } else {
        return this.views.find(v => v.id == this.view_id);
      }
    },
    elements: {
      get() {
        return this.view.elements;
      },
      set(elements) {
        useViewsStore().setElements({ view_id: this.view.id, elements });
      },
    },
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
          available: true,
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
  },
  methods: {
    save() {
      useViewsStore().save();
    },
    discard() {
      useViewsStore().load();
    },
    remove() {
      useViewsStore().removeView({ view_id: this.view.id });
      // If we're on an URL that'll be invalid after removing the view, navigate to the main/default view
      if (!this.$route.path.includes('default')) {
        this.$router.replace('./default');
      }
    },
    restoreDefaults() {
      useViewsStore().restoreDefaults();
      alert(
        "All views have been restored to defaults. Changes won't be saved until you click 'Save'."
      );
      // If we're on an URL that might become invalid, navigate to the main/default view
      if (!this.$route.path.includes('default')) {
        this.$router.replace('./default');
      }
    },
    addVisualization: function () {
      useViewsStore().addVisualization({ view_id: this.view.id, type: 'top_apps' });
    },
    async onTypeChange(id, type) {
      let props = {};

      if (type === 'custom_vis') {
        const visname = prompt('Please enter the watcher name', 'aw-watcher-');
        if (!visname) return;

        const title = prompt('Please enter the visualization title');
        if (!title) return;

        props = {
          visname,
          title,
        };
      }

      await useViewsStore().editView({ view_id: this.view.id, el_id: id, type, props });

      if (this.activeSettingsEl && this.activeSettingsEl.index === id) {
        this.activeSettingsEl.type = type;
      }
    },
    async onRemove(id) {
      await useViewsStore().removeVisualization({ view_id: this.view.id, el_id: id });
      if (this.activeSettingsEl && this.activeSettingsEl.index === id) {
        this.showSettingsPanel = false;
      }
    },
    isVisLarge(el) {
      return el.type == 'sunburst_clock' || el.type == 'vis_timeline';
    },
    getVisClass(el) {
      const size = el.size !== undefined ? el.size : (this.isVisLarge(el) ? 3 : 1);
      return {
        'col-md-6 col-lg-4': size === 1,
        'col-md-6 col-lg-6': size === 2,
        'col-md-12 col-lg-12': size === 3,
      };
    },
    getVisStyle(el) {
      const colSpan = el.colSpan || (el.size === 3 ? 4 : (el.size === 2 ? 2 : 1));
      // Default rowSpan: timeline_barchart=2, vis_timeline/category_sunburst=2, others=1
      let defaultRowSpan = 1;
      if (el.type === 'timeline_barchart' || el.type === 'vis_timeline' || el.type === 'category_sunburst') {
        defaultRowSpan = 2;
      }
      const rowSpan = el.rowSpan || defaultRowSpan;

      return {
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        overflow: 'hidden',
      };
    },
    onOpenSettings({ index, type, colSpan, rowSpan, rect }) {
      this.activeSettingsEl = { index, type, colSpan, rowSpan };
      this.panelX = Math.min(rect.left + window.scrollX, window.innerWidth - 300);
      this.panelY = rect.bottom + window.scrollY + 8;
      // Clamp so panel doesn't go off screen
      if (this.panelY + 400 > window.innerHeight) {
        this.panelY = Math.max(40, rect.top + window.scrollY - 400);
      }
      this.showSettingsPanel = true;
    },
    onPanelDragStart(event: MouseEvent) {
      if ((event.target as HTMLElement).closest('button')) return;
      event.preventDefault();
      this.panelDragStartX = event.clientX;
      this.panelDragStartY = event.clientY;
      this.panelStartLeft = this.panelX;
      this.panelStartTop = this.panelY;

      const onMove = (e: MouseEvent) => {
        const dx = e.clientX - this.panelDragStartX;
        const dy = e.clientY - this.panelDragStartY;
        this.panelX = Math.max(0, Math.min(window.innerWidth - 280, this.panelStartLeft + dx));
        this.panelY = Math.max(0, Math.min(window.innerHeight - 100, this.panelStartTop + dy));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    setGridSpan(index: number, c: number, r: number) {
      useViewsStore().changeElementGrid({
        view_id: this.view.id,
        el_id: index,
        prop: 'colSpan',
        value: c,
      });
      useViewsStore().changeElementGrid({
        view_id: this.view.id,
        el_id: index,
        prop: 'rowSpan',
        value: r,
      });
      useViewsStore().save();
      if (this.activeSettingsEl && this.activeSettingsEl.index === index) {
        this.activeSettingsEl.colSpan = c;
        this.activeSettingsEl.rowSpan = r;
      }
    },
    getGridCellClass(c: number, r: number) {
      if (!this.activeSettingsEl) return {};
      const activeC = this.hoverColSpan || this.activeSettingsEl.colSpan;
      const activeR = this.hoverRowSpan || this.activeSettingsEl.rowSpan;
      const isSelectedOrHovered = c <= activeC && r <= activeR;
      const isCurrentSelection = c <= this.activeSettingsEl.colSpan && r <= this.activeSettingsEl.rowSpan;
      return {
        'grid-picker-cell-active': isSelectedOrHovered,
        'grid-picker-cell-current': isCurrentSelection,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.aw-grid-dashboard {
  position: relative !important;
  z-index: 2 !important;
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  grid-auto-rows: 260px !important;
  gap: 1rem !important;
  padding: 0.5rem 0 !important;
  width: 100% !important;

  &::before, &::after {
    display: none !important;
  }

  .grid-item-wrapper {
    overflow: hidden;
    border-radius: 16px;
  }

  @media (max-width: 991.98px) {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  @media (max-width: 575.98px) {
    grid-template-columns: repeat(1, 1fr) !important;
  }
}

.grid-background {
  position: absolute;
  top: 0.5rem;
  left: 0;
  right: 0;
  bottom: 0.5rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 260px;
  gap: 1rem;
  pointer-events: none;
  z-index: 1;
  opacity: 0.25;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 991.98px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 575.98px) {
    grid-template-columns: repeat(1, 1fr);
  }
}

.grid-bg-cell {
  border: 1.5px dashed rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.005);
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.3);
}

/* ========== FLOATING DRAGGABLE SETTINGS PANEL ========== */
.settings-floating-panel {
  position: absolute;
  z-index: 10000;
  width: 280px;
  background: rgba(14, 14, 14, 0.96);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04);
  color: var(--aw-text-primary);
  animation: panelSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.settings-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: grab;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--aw-text-primary);
  border-radius: 16px 16px 0 0;
  background: rgba(255, 255, 255, 0.02);

  &:active {
    cursor: grabbing;
  }

  .btn {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px;
    border-radius: 50% !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
    border: 0 !important;

    &:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: var(--aw-text-primary) !important;
    }
  }
}

.settings-panel-body {
  padding: 12px 14px;
  max-height: 400px;
  overflow-y: auto;

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
}

.settings-section-title {
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--aw-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.settings-divider {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin: 10px 0;
}

/* Grid squares picker */
.grid-picker-cells {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.25);
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
}

.grid-picker-cell {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1.5px dashed rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  &.grid-picker-cell-current {
    border-color: rgba(16, 185, 129, 0.35);
    background: rgba(16, 185, 129, 0.08);
  }

  &.grid-picker-cell-active {
    border-style: solid;
    border-color: #10b981 !important;
    background: rgba(16, 185, 129, 0.5) !important;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.45);
  }

  &:hover {
    transform: scale(1.08);
  }
}

/* Widget type list */
.vis-type-list {
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
}

.vis-type-item {
  padding: 6px 10px;
  font-size: 0.78rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  color: var(--aw-text-secondary);
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--aw-text-primary) !important;
  }

  &.active {
    background: rgba(6, 182, 212, 0.15) !important;
    color: #06b6d4 !important;
    font-weight: 700 !important;
  }
}
</style>
