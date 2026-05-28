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

  draggable.aw-grid-dashboard(v-model="elements" handle=".vis-header-drag" :disabled="!editing")
    div.p-2(v-for="el, index in elements", :key="index", :style="getVisStyle(el)")
      aw-selectable-vis(:id="index" :type="el.type" :props="el.props" :view-id="view.id" @onTypeChange="onTypeChange" @onRemove="onRemove" :editable="editing")

    div.p-2(v-if="editing" style="grid-column: span 1; grid-row: span 1;")
      b-button.h-100.w-100.d-flex.flex-column.align-items-center.justify-content-center.p-4(@click="addVisualization" variant="outline-secondary" style="border: 2px dashed rgba(255,255,255,0.15); border-radius: 16px; background: rgba(255,255,255,0.01); min-height: 240px; color: var(--aw-text-muted);")
        icon(name="plus" style="font-size: 1.5rem; margin-bottom: 8px;")
        span.font-weight-bold Add visualization
</template>

<script lang="ts">
import 'vue-awesome/icons/save';
import 'vue-awesome/icons/times';
import 'vue-awesome/icons/trash';
import 'vue-awesome/icons/undo';
import 'vue-awesome/icons/lock';
import 'vue-awesome/icons/lock-open';

import { mapState } from 'pinia';
import draggable from 'vuedraggable';

import { useViewsStore } from '~/stores/views';

export default {
  name: 'ActivityView',
  components: {
    draggable: draggable,
  },
  props: {
    view_id: { type: String, default: 'default' },
  },
  data() {
    return { editing: false };
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
    },
    async onRemove(id) {
      await useViewsStore().removeVisualization({ view_id: this.view.id, el_id: id });
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
      const rowSpan = el.rowSpan || (el.type === 'vis_timeline' || el.type === 'category_sunburst' ? 2 : 1);
      
      const minWidth = el.minWidth ? `${el.minWidth}px` : '100%';
      const minHeight = el.minHeight ? `${el.minHeight}px` : '260px';
      
      return {
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        height: '100%',
        minWidth: minWidth,
        minHeight: minHeight,
        maxWidth: '100%',
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
  grid-auto-rows: minmax(260px, auto) !important;
  gap: 1rem !important;
  padding: 0.5rem 0 !important;
  width: 100% !important;

  &::before, &::after {
    display: none !important;
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
  grid-auto-rows: minmax(260px, auto);
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
</style>
