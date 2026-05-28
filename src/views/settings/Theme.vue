<template lang="pug">
div
  div.d-sm-flex.justify-content-between
    div
      h5.mt-1.mb-2.mb-sm-0 Theme
    div
      b-select.landingpage(v-if="_loaded" size="sm" :value="theme", @change="theme = $event")
        option(value="auto") Auto (System)
        option(value="light") Light
        option(value="dark") Dark
      span(v-else)
        .aw-loading Loading...
  small
    | Change color theme of the application (you need to change categories colors manually to be suitable with dark mode).
</template>

<script lang="ts">
import { mapState } from 'pinia';
import { useSettingsStore } from '~/stores/settings';
import { detectPreferredTheme } from '~/util/theme';

export default {
  name: 'Theme',
  computed: {
    ...mapState(useSettingsStore, ['_loaded']),
    theme: {
      get() {
        const settingsStore = useSettingsStore();
        return settingsStore.theme;
      },
      set(value) {
        console.log('Set theme to ' + value);
        const settingsStore = useSettingsStore();
        settingsStore.update({
          theme: value,
        });

        // Determine the actual theme to apply
        const detectedTheme = value === 'auto' ? detectPreferredTheme() : value;

        // Remove existing theme link if present
        document.getElementById('aw-theme-dark')?.remove();

        // Append Dark Theme Element if dark theme should be applied
        if (detectedTheme === 'dark') {
          const themeLink = document.createElement('link');
          themeLink.id = 'aw-theme-dark';
          themeLink.href = window.location.protocol === 'file:' ? 'dark.css' : '/dark.css';
          themeLink.rel = 'stylesheet';
          document.querySelector('head').appendChild(themeLink);
        }
      },
    },
  },
};
</script>
