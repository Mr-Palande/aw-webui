<template lang="pug">
b-modal#onboarding-modal(
  v-model="showModal"
  centered
  no-close-on-backdrop
  no-close-on-esc
  hide-header-close
  hide-footer
  size="lg"
  modal-class="onboarding-modal"
  body-class="p-0"
)
  div.onboarding-body
    //- Header
    div.onboarding-header
      h2.onboarding-title ✨ Welcome to ActivityWatch
      p.onboarding-subtitle Let's set up your dashboard preferences before you get started.

    //- Steps indicator
    div.steps-indicator.mb-4
      div.step-dot(v-for="s in 3" :key="s" :class="{ active: step === s, completed: step > s }")

    //- Step 1: Start of Day
    div.step-content(v-if="step === 1")
      h4.step-title 🕐 When does your day start?
      p.step-desc.text-muted
        | If you're a night owl who works past midnight, set this later (e.g. 4:00 AM) so late-night activity counts as the previous day.

      div.options-grid
        div.option-card(
          v-for="opt in dayStartOptions"
          :key="opt.value"
          :class="{ selected: selectedStartOfDay === opt.value }"
          @click="selectedStartOfDay = opt.value"
        )
          div.option-icon {{ opt.icon }}
          div.option-label {{ opt.label }}
          div.option-hint {{ opt.hint }}

    //- Step 2: Theme
    div.step-content(v-if="step === 2")
      h4.step-title 🎨 Choose your theme
      p.step-desc.text-muted Pick a look that suits your style.

      div.options-grid.theme-grid
        div.option-card(
          v-for="opt in themeOptions"
          :key="opt.value"
          :class="{ selected: selectedTheme === opt.value }"
          @click="selectedTheme = opt.value"
        )
          div.option-icon {{ opt.icon }}
          div.option-label {{ opt.label }}

    //- Step 3: Color Palette
    div.step-content(v-if="step === 3")
      h4.step-title 🌈 Pick a color palette
      p.step-desc.text-muted This sets the colors for all your charts and graphs.

      div.palette-grid
        div.palette-option(
          v-for="(colors, name) in palettesList"
          :key="name"
          :class="{ selected: selectedPalette === name }"
          @click="selectedPalette = name"
        )
          div.d-flex.align-items-center.mb-2
            span.palette-label {{ formatPaletteName(name) }}
            icon.ml-auto(name="check-circle" v-if="selectedPalette === name" style="color: #10b981;")
          div.d-flex.flex-wrap
            div.palette-dot(
              v-for="color in colors.slice(0, 8)"
              :key="color"
              :style="{ backgroundColor: color }"
            )

    //- Navigation buttons
    div.onboarding-nav
      b-button.nav-btn(v-if="step > 1" variant="outline-secondary" @click="step--")
        | ← Back
      div.ml-auto
        b-button.nav-btn(v-if="step < 3" variant="primary" @click="step++")
          | Next →
        b-button.nav-btn.finish-btn(v-if="step === 3" variant="success" @click="finishSetup")
          | 🚀 Start Tracking
</template>

<script lang="ts">
import { useSettingsStore } from '~/stores/settings';
import { palettes } from '~/util/color';
import 'vue-awesome/icons/check-circle';

export default {
  name: 'OnboardingModal',
  data() {
    return {
      showModal: false,
      step: 1,
      selectedStartOfDay: '04:00',
      selectedTheme: 'dark' as 'dark' | 'light' | 'auto',
      selectedPalette: 'cyberneon',
      palettesList: palettes,
      dayStartOptions: [
        { value: '00:00', label: 'Midnight', hint: '12:00 AM', icon: '🌙' },
        { value: '03:00', label: '3:00 AM', hint: 'Early morning', icon: '🌃' },
        { value: '04:00', label: '4:00 AM', hint: 'Recommended', icon: '⭐' },
        { value: '06:00', label: '6:00 AM', hint: 'Early bird', icon: '🌅' },
      ],
      themeOptions: [
        { value: 'dark', label: 'Dark', icon: '🌑' },
        { value: 'light', label: 'Light', icon: '☀️' },
        { value: 'auto', label: 'Auto', icon: '🔄' },
      ],
    };
  },
  async mounted() {
    const settingsStore = useSettingsStore();
    await settingsStore.ensureLoaded();
    if (!settingsStore.hasCompletedOnboarding) {
      this.selectedTheme = settingsStore.theme || 'dark';
      this.selectedPalette = settingsStore.graphColorScheme || 'cyberneon';
      this.selectedStartOfDay = settingsStore.startOfDay || '04:00';
      this.showModal = true;
    }
  },
  methods: {
    async finishSetup() {
      const settingsStore = useSettingsStore();
      await settingsStore.update({
        startOfDay: this.selectedStartOfDay,
        theme: this.selectedTheme,
        graphColorScheme: this.selectedPalette,
        hasCompletedOnboarding: true,
      });
      this.showModal = false;

      // Apply theme change immediately by reloading
      window.location.reload();
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
.onboarding-body {
  padding: 2rem;
  background: linear-gradient(135deg, #0d0d15 0%, #1a1a2e 100%);
  border-radius: 12px;
}

.onboarding-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.onboarding-title {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.onboarding-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.95rem;
  margin-bottom: 0;
}

.steps-indicator {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;

  &.active {
    background: #a78bfa;
    box-shadow: 0 0 10px rgba(167, 139, 250, 0.5);
    transform: scale(1.3);
  }

  &.completed {
    background: #10b981;
  }
}

.step-content {
  min-height: 220px;
}

.step-title {
  font-weight: 600;
  font-size: 1.15rem;
  margin-bottom: 0.25rem;
}

.step-desc {
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.theme-grid {
  grid-template-columns: repeat(3, 1fr);
}

.option-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  &.selected {
    background: rgba(167, 139, 250, 0.1);
    border-color: #a78bfa;
    box-shadow: 0 0 20px rgba(167, 139, 250, 0.15);
  }
}

.option-icon {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.option-label {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.15rem;
}

.option-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.palette-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.palette-option {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &.selected {
    background: rgba(16, 185, 129, 0.08);
    border-color: #10b981;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
  }
}

.palette-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.palette-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 5px;
  margin-top: 2px;
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.2);
  }
}

.onboarding-nav {
  display: flex;
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

.finish-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);

  &:hover {
    background: linear-gradient(135deg, #34d399, #10b981);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }
}
</style>

<style lang="scss">
/* Unscoped modal overrides */
.onboarding-modal .modal-content {
  background: transparent !important;
  border: none !important;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5) !important;
}

.onboarding-modal .modal-body {
  padding: 0 !important;
}
</style>
