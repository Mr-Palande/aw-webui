<template lang="pug">
div(:class="{'fixed-top-padding': fixedTopMenu}")
  b-navbar.aw-navbar(toggleable="lg" :fixed="fixedTopMenu ? 'top' : null")
    // Brand on mobile
    b-navbar-nav.d-block.d-lg-none
      b-navbar-brand(to="/" style="background-color: transparent;")
        img.align-middle(src="/logo.png" style="height: 1.5em; transition: transform 0.3s ease;")
        span.ml-2.align-middle(style="font-size: 1.1em; color: var(--aw-text-primary); font-weight: 800; letter-spacing: -0.02em;") ActivityWatch

    b-navbar-toggle(target="nav-collapse")

    b-collapse#nav-collapse(is-nav)
      b-navbar-nav
        // If only a single view (the default) is available
        b-nav-item(v-if="activityViews && activityViews.length === 1", v-for="view in activityViews", :key="view.name", :to="view.pathUrl")
          div.px-2.px-lg-1
            icon(name="calendar-day")
            | Activity

        // If multiple (or no) activity views are available
        b-nav-item-dropdown(v-if="!activityViews || activityViews.length !== 1")
          template(slot="button-content")
            div.d-inline.px-2.px-lg-1
              icon(name="calendar-day")
              | Activity
          b-dropdown-item(v-if="activityViews === null", disabled)
            span.text-muted Loading...
            br
          b-dropdown-item(v-else-if="activityViews && activityViews.length <= 0", disabled)
            | No activity reports available
            br
            small Make sure you have both an AFK and window watcher running
          b-dropdown-item(v-for="view in activityViews", :key="view.name", :to="view.pathUrl")
            icon(:name="view.icon")
            | {{ view.name }}

        b-nav-item(to="/timeline")
          div.px-2.px-lg-1
            icon(name="stream")
            | Timeline

        b-nav-item(to="/stopwatch")
          div.px-2.px-lg-1
            icon(name="stopwatch")
            | Stopwatch

      // Brand on large screens (centered)
      b-navbar-nav.abs-center.d-none.d-lg-block
        b-navbar-brand(to="/" style="background-color: transparent; display: flex; align-items: center;")
          img.ml-0.align-middle(src="/logo.png" style="height: 1.5em; transition: transform 0.3s ease;")
          span.ml-2.align-middle(style="font-size: 1.15em; color: var(--aw-text-primary); font-weight: 800; letter-spacing: -0.02em;") ActivityWatch

      b-navbar-nav.ml-auto
        b-nav-item-dropdown
          template(slot="button-content")
            div.d-inline.px-2.px-lg-1
              icon(name="tools")
              | Tools
          b-dropdown-item(to="/search")
            icon(name="search")
            | Search
          b-dropdown-item(to="/work-report")
            icon(name="briefcase")
            | Work Report
          b-dropdown-item(to="/trends" v-if="devmode")
            icon(name="chart-line")
            | Trends
          b-dropdown-item(to="/report" v-if="devmode")
            icon(name="chart-pie")
            | Report
          b-dropdown-item(to="/alerts" v-if="devmode")
            icon(name="flag-checkered")
            | Alerts
          b-dropdown-item(to="/timespiral" v-if="devmode")
            icon(name="history")
            | Timespiral
          b-dropdown-item(to="/query")
            icon(name="code")
            | Query
          b-dropdown-item(to="/graph" v-if="devmode")
            // TODO: use circle-nodes instead in the future
            icon(name="project-diagram")
            | Graph

        b-nav-item(to="/buckets")
          div.px-2.px-lg-1
            icon(name="database")
            | Raw Data
        b-nav-item(to="/settings")
          div.px-2.px-lg-1
            icon(name="cog")
            | Settings
</template>

<script lang="ts">
// only import the icons you use to reduce bundle size
import 'vue-awesome/icons/calendar-day';
import 'vue-awesome/icons/briefcase';
import 'vue-awesome/icons/calendar-week';
import 'vue-awesome/icons/stream';
import 'vue-awesome/icons/database';
import 'vue-awesome/icons/search';
import 'vue-awesome/icons/code';
import 'vue-awesome/icons/chart-line'; // TODO: switch to chart-column, when vue-awesome supports FA v6
import 'vue-awesome/icons/chart-pie';
import 'vue-awesome/icons/flag-checkered';
import 'vue-awesome/icons/stopwatch';
import 'vue-awesome/icons/cog';
import 'vue-awesome/icons/tools';
import 'vue-awesome/icons/history';

// TODO: use circle-nodes instead in the future
import 'vue-awesome/icons/project-diagram';
//import 'vue-awesome/icons/cicle-nodes';

import 'vue-awesome/icons/ellipsis-h';

import 'vue-awesome/icons/mobile';
import 'vue-awesome/icons/desktop';

import _ from 'lodash';

import { mapState } from 'pinia';
import { useSettingsStore } from '~/stores/settings';
import { useBucketsStore } from '~/stores/buckets';
import { IBucket } from '~/util/interfaces';

export default {
  name: 'Header',
  data() {
    return {
      activityViews: null,
      // Make configurable?
      fixedTopMenu: this.$isAndroid,
    };
  },
  computed: {
    ...mapState(useSettingsStore, ['devmode']),
  },
  mounted: async function () {
    const bucketStore = useBucketsStore();
    await bucketStore.ensureLoaded();
    const buckets: IBucket[] = bucketStore.buckets;
    const types_by_host = {};

    const activityViews = [];

    // TODO: Change to use same bucket detection logic as get_buckets/set_available in store/modules/activity.ts
    _.each(buckets, v => {
      types_by_host[v.hostname] = types_by_host[v.hostname] || {};
      types_by_host[v.hostname].afk ||= v.type == 'afkstatus';
      types_by_host[v.hostname].window ||= v.type == 'currentwindow';
      // TODO: Use other bucket type ID in the future
      types_by_host[v.hostname].android ||= v.type == 'currentwindow' && v.id.includes('android');
    });
    //console.log(types_by_host);

    _.each(types_by_host, (types, hostname) => {
      if (types['android']) {
        activityViews.push({
          name: `${hostname} (Android)`,
          hostname: hostname,
          type: 'android',
          pathUrl: `/activity/${hostname}`,
          icon: 'mobile',
        });
      } else if (hostname != 'unknown') {
        activityViews.push({
          name: hostname,
          hostname: hostname,
          type: 'default',
          pathUrl: `/activity/${hostname}`,
          icon: 'desktop',
        });
      }
    });

    this.activityViews = activityViews;
  },
};
</script>

<style lang="scss" scoped>
@import '../style/globals';

.aw-navbar {
  background: var(--aw-card-bg) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--aw-card-border) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.6rem 1.5rem;
  position: relative;
  z-index: 1030 !important;
  
  &:not(.fixed-top) {
    margin: 1.25rem auto 0.75rem auto;
    border-radius: 16px;
    width: calc(100% - 2rem);
    max-width: 1200px;
  }
  
  &.fixed-top {
    border-width: 0 0 1px 0 !important;
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }
}

.nav-item {
  align-items: center;
  margin-left: 0.15em;
  margin-right: 0.15em;
  border-radius: 10px;
  transition: all 0.25s ease;

  .nav-link {
    color: var(--aw-text-secondary) !important;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 0.5rem 1rem !important;
    display: flex !important;
    align-items: center;
    gap: 6px;
    transition: all 0.25s ease;
    
    .fa-icon {
      margin: 0;
      opacity: 0.7;
      transition: transform 0.25s ease, opacity 0.25s ease;
    }
  }

  /* Vibrant Colorful Hover & Active States */
  
  /* 1. Activity (Green/Emerald) */
  &:hover, &.show, &:has([href*="activity"]), &.active {
    background-color: rgba(16, 185, 129, 0.08) !important;
    .nav-link {
      color: #10b981 !important;
      .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
    }
  }
  
  /* 2. Timeline (Violet/Purple) */
  &:has([href*="timeline"]) {
    &:hover, &.active {
      background-color: rgba(139, 92, 246, 0.08) !important;
      .nav-link {
        color: #8b5cf6 !important;
        .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
      }
    }
  }

  /* 3. Stopwatch (Pink/Rose) */
  &:has([href*="stopwatch"]) {
    &:hover, &.active {
      background-color: rgba(236, 72, 153, 0.08) !important;
      .nav-link {
        color: #ec4899 !important;
        .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
      }
    }
  }

  /* 4. Tools (Cyan/Info) */
  &.dropdown {
    &:hover, &.show {
      background-color: rgba(6, 182, 212, 0.08) !important;
      .nav-link {
        color: #06b6d4 !important;
        .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
      }
    }
  }

  /* 5. Raw Data (Amber/Orange) */
  &:has([href*="buckets"]) {
    &:hover, &.active {
      background-color: rgba(245, 158, 11, 0.08) !important;
      .nav-link {
        color: #f59e0b !important;
        .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
      }
    }
  }

  /* 6. Settings (Blue) */
  &:has([href*="settings"]) {
    &:hover, &.active {
      background-color: rgba(59, 130, 246, 0.08) !important;
      .nav-link {
        color: #3b82f6 !important;
        .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
      }
    }
  }
}

.navbar-brand:hover {
  img {
    transform: rotate(10deg) scale(1.05);
  }
}

.abs-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.fixed-top-padding {
  padding-bottom: 3.5em;
}
</style>

<style lang="scss">
// Needed because dropdown somehow doesn't properly work with scoping
.nav-item {
  .nav-link {
    color: var(--aw-text-secondary) !important;
    
    &:hover {
      color: var(--aw-accent-color) !important;
    }
  }
}

.dropdown-menu {
  border-radius: 12px !important;
  padding: 0.5rem !important;
  
  .dropdown-item {
    border-radius: 8px !important;
    padding: 0.5rem 1rem !important;
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--aw-text-secondary) !important;
    
    .fa-icon {
      opacity: 0.7;
    }
    
    &:hover {
      background-color: var(--aw-accent-light) !important;
      color: var(--aw-accent-color) !important;
      
      .fa-icon {
        opacity: 1;
      }
    }
  }
}
</style>
