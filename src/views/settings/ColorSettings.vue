<template lang="pug">
div
  div.d-flex.justify-content-between.align-items-center.mb-4
    div
      h5.mb-0 Use fallback colors
      small.text-muted
        | Uses the old coloring style for some visualizations when uncategorized or no category color.
    div
      b-form-checkbox(v-model="useColorFallback", switch)

  hr.my-4(style="border-color: rgba(255, 255, 255, 0.08)")

  div
    h5.mb-1 Graph Color Palette
    p.small.text-muted.mb-3
      | Choose the color palette for your activity tracking charts and visualizations.
    
    div.row
      div.col-12.col-md-6.mb-3(v-for="(colors, name) in palettesList" :key="name")
        div.palette-card.p-3(:class="{ active: graphColorScheme === name }" @click="setScheme(name)")
          div.d-flex.justify-content-between.align-items-center.mb-2
            span.palette-name {{ formatPaletteName(name) }}
            icon(name="check-circle" v-if="graphColorScheme === name" style="color: #10b981; font-size: 1.1rem;")
          div.d-flex.flex-wrap
            div.color-capsule(
              v-for="color in colors.slice(0, 8)"
              :key="color"
              :style="{ backgroundColor: color }"
            )
</template>

<script lang="ts">
import { useSettingsStore } from '~/stores/settings';
import { palettes } from '~/util/color';
import 'vue-awesome/icons/check-circle';

export default {
  name: 'ColorSettings',
  data() {
    return {
      palettesList: palettes,
    };
  },
  computed: {
    useColorFallback: {
      get: function () {
        const settingsStore = useSettingsStore();
        return settingsStore.useColorFallback;
      },
      set: function (val) {
        const settingsStore = useSettingsStore();
        settingsStore.update({ useColorFallback: val });
      },
    },
    graphColorScheme: function () {
      const settingsStore = useSettingsStore();
      return settingsStore.graphColorScheme || 'default';
    },
  },
  methods: {
    setScheme(name: string) {
      const settingsStore = useSettingsStore();
      settingsStore.update({ graphColorScheme: name });
    },
    formatPaletteName(name: string): string {
      const mapping: Record<string, string> = {
        default: 'Default Slate',
        cyberneon: 'Cyber Neon',
        sunset: 'Sunset Aura',
        nordicocean: 'Nordic Ocean',
        forest: 'Forest Meadow',
      };
      return mapping[name] || name;
    },
  },
};
</script>

<style scoped lang="scss">
.palette-card {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background-color: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  &.active {
    background-color: rgba(16, 185, 129, 0.06);
    border-color: #10b981;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
  }
}

.palette-name {
  font-weight: 600;
  font-size: 0.95rem;
  text-transform: capitalize;
}

.color-capsule {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 6px;
  margin-top: 4px;
  display: inline-block;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.15);
    z-index: 2;
  }
}
</style>
