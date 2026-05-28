<template lang="pug">
div.aw-doughnut-vis
  div.d-flex.flex-column.align-items-center.justify-content-center
    div.svg-container(:style="{ position: 'relative', width: size + 'px', height: size + 'px' }")
      svg(:width="size" :height="size" :viewBox="'0 0 ' + size + ' ' + size" style="overflow: visible;")
        g(:transform="'translate(' + (size / 2) + ', ' + (size / 2) + ')'")
          // Outer glow/shadow paths
          path(
            v-for="slice in slices"
            :key="'glow-' + slice.id"
            :d="slice.path"
            :fill="slice.color"
            opacity="0.15"
            style="filter: blur(8px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);"
            :transform="hoveredSlice === slice.id ? 'scale(1.08)' : 'scale(1)'"
          )
          
          // Solid arc segments
          path(
            v-for="slice in slices"
            :key="slice.id"
            :d="slice.path"
            :fill="slice.color"
            :stroke="hoveredSlice === slice.id ? '#ffffff' : 'transparent'"
            stroke-width="1.5"
            style="cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);"
            :transform="hoveredSlice === slice.id ? 'scale(1.05)' : 'scale(1)'"
            @mouseover="setHovered(slice)"
            @mouseleave="clearHovered()"
          )
          
      // Center Glassmorphic display
      div.center-display.d-flex.flex-column.align-items-center.justify-content-center(:style="centerDisplayStyle")
        span.center-label {{ hoveredLabel || 'Total Time' }}
        span.center-value {{ hoveredValue || totalDurationFormatted }}
        span.center-percent(v-if="hoveredPercent") {{ hoveredPercent }}%

    // Legends container
    div.legends-container.mt-3.w-100(style="max-width: 100%;")
      div.legend-item(
        v-for="slice in slices.slice(0, 7)"
        :key="'legend-' + slice.id"
        :class="{ active: hoveredSlice === slice.id }"
        @mouseover="setHovered(slice)"
        @mouseleave="clearHovered()"
      )
        div.d-flex.align-items-center.justify-content-between.py-1.px-2.legend-row
          div.d-flex.align-items-center.text-truncate
            div.legend-indicator(:style="{ backgroundColor: slice.color }")
            span.legend-text.text-truncate {{ slice.name }}
          span.legend-time.ml-2 {{ slice.time }}
</template>

<script lang="ts">
import * as d3 from 'd3';
import { useActivityStore } from '~/stores/activity';
import { useCategoryStore } from '~/stores/categories';
import { getColorFromCategory } from '~/util/color';
import { seconds_to_duration } from '~/util/time';
import _ from 'lodash';

export default {
  name: 'CategoryDoughnut',
  props: {
    events: {
      type: Array,
      default: null,
    },
    height: {
      type: Number,
      default: 260,
    },
  },
  data() {
    return {
      hoveredSlice: null as string | null,
      hoveredLabel: null as string | null,
      hoveredValue: null as string | null,
      hoveredPercent: null as number | null,
    };
  },
  computed: {
    categoryData() {
      // If events are passed via props, use them, otherwise read from store
      if (this.events) {
        return this.events;
      }
      const activityStore = useActivityStore();
      return activityStore.category.top || [];
    },
    totalDuration() {
      return _.sumBy(this.categoryData, (c: any) => c.duration || 0);
    },
    totalDurationFormatted() {
      return seconds_to_duration(this.totalDuration);
    },
    size() {
      // Fit dynamically inside card bounds
      return Math.min(230, this.height);
    },
    centerDisplayStyle() {
      const displaySize = Math.round(this.size * 0.63);
      const offset = Math.round((this.size - displaySize) / 2);
      return {
        width: displaySize + 'px',
        height: displaySize + 'px',
        top: offset + 'px',
        left: offset + 'px',
        fontSize: this.size < 200 ? '0.7rem' : '0.85rem',
      };
    },
    slices() {
      const topCategories = this.categoryData.slice(0, 10); // Limit to top 10 categories
      if (topCategories.length === 0) return [];

      const pieData = d3.pie().value((d: any) => d.duration)(topCategories);
      
      const scaleFactor = this.size / 260;
      const innerRadius = 78 * scaleFactor;
      const outerRadius = 112 * scaleFactor;
      
      const arcGenerator = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius).cornerRadius(4 * scaleFactor).padAngle(0.02);

      const categoryStore = useCategoryStore();
      
      return pieData.map((d: any, idx) => {
        const item = d.data;
        const name = item.data['$category'].join(' > ');
        const cat = categoryStore.get_category(item.data['$category']);
        const color = getColorFromCategory(cat, categoryStore.classes);
        const path = arcGenerator(d) || '';

        return {
          id: 'slice-' + idx,
          name,
          duration: item.duration,
          time: seconds_to_duration(item.duration),
          color,
          path,
          percentage: Math.round((item.duration / this.totalDuration) * 100),
        };
      });
    },
  },
  methods: {
    setHovered(slice: any) {
      this.hoveredSlice = slice.id;
      this.hoveredLabel = slice.name;
      this.hoveredValue = slice.time;
      this.hoveredPercent = slice.percentage;
    },
    clearHovered() {
      this.hoveredSlice = null;
      this.hoveredLabel = null;
      this.hoveredValue = null;
      this.hoveredPercent = null;
    },
  },
};
</script>

<style scoped lang="scss">
.aw-doughnut-vis {
  padding: 1rem;
}

.center-display {
  position: absolute;
  top: 48px;
  left: 48px;
  width: 164px;
  height: 164px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
  text-align: center;
  padding: 10px;
  box-shadow: inset 0 2px 10px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.2);
}

.center-label {
  font-size: 0.8rem;
  color: var(--aw-text-muted);
  font-weight: 500;
  max-width: 130px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.center-value {
  font-size: 1.25rem;
  color: var(--aw-text-primary);
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  margin-top: 2px;
}

.center-percent {
  font-size: 0.85rem;
  color: #10b981;
  font-weight: 600;
}

.legend-row {
  border-radius: 8px;
  transition: all 0.2s;
}

.legend-item {
  cursor: pointer;
  transition: all 0.2s;

  &:hover, &.active {
    .legend-row {
      background-color: rgba(255, 255, 255, 0.04);
    }
    .legend-text {
      color: var(--aw-text-primary);
    }
  }
}

.legend-indicator {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  margin-right: 8px;
  flex-shrink: 0;
}

.legend-text {
  font-size: 0.85rem;
  color: var(--aw-text-muted);
  font-weight: 500;
}

.legend-time {
  font-size: 0.85rem;
  color: var(--aw-text-primary);
  font-weight: 600;
  font-family: monospace;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
