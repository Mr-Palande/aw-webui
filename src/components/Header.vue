<template lang="pug">
div(:class="{'fixed-top-padding': fixedTopMenu}")
  b-navbar.aw-navbar(toggleable="lg" :fixed="fixedTopMenu ? 'top' : null")
    // Brand on mobile
    b-navbar-nav.d-block.d-lg-none
      b-navbar-brand(to="/" style="background-color: transparent; display: flex; align-items: center;")
        svg.align-middle.brand-svg-logo(width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="height: 1.5em; transition: transform 0.3s ease;")
          defs
            linearGradient#brandGrad(x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse")
              stop(offset="0%" stop-color="#10b981")
              stop(offset="100%" stop-color="#34d399")
          path(d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="url(#brandGrad)" stroke-width="2.5" fill="rgba(16, 185, 129, 0.05)")
          path(d="M11 9H21V11.5L16 16.5L21 21.5V24H11V21.5L16 16.5L11 11.5V9Z" fill="url(#brandGrad)")
          circle(cx="16" cy="12" r="1.5" fill="#ffffff")
          circle(cx="16" cy="21" r="1.5" fill="#ffffff")
        span.ml-2.align-middle(style="font-size: 1.1rem; color: var(--aw-text-primary); font-weight: 800; letter-spacing: -0.02em; display: inline-flex; align-items: center;") ActivityWatch

    b-navbar-toggle(target="nav-collapse")

    b-collapse#nav-collapse(is-nav)
      b-navbar-nav
        // If only a single view (the default) is available
        b-nav-item.nav-activity(v-if="activityViews && activityViews.length === 1", v-for="view in activityViews", :key="view.name", :to="view.pathUrl")
          div.px-2.px-lg-1
            icon(name="calendar-day")
            | Activity

        // If multiple (or no) activity views are available
        b-nav-item-dropdown.nav-activity(v-if="!activityViews || activityViews.length !== 1", :active="$route.path.startsWith('/activity')")
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

        b-nav-item.nav-timeline(to="/timeline")
          div.px-2.px-lg-1
            icon(name="stream")
            | Timeline

        b-nav-item.nav-stopwatch(to="/stopwatch")
          div.px-2.px-lg-1
            icon(name="stopwatch")
            | Stopwatch

      // Brand on large screens (centered)
      b-navbar-nav.abs-center.d-none.d-lg-block
        b-navbar-brand(to="/" style="background-color: transparent; display: flex; align-items: center;")
          svg.align-middle.brand-svg-logo.mr-2(width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="height: 1.6em; transition: transform 0.3s ease;")
            defs
              linearGradient#brandGradDesktop(x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse")
                stop(offset="0%" stop-color="#10b981")
                stop(offset="100%" stop-color="#34d399")
            path(d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="url(#brandGradDesktop)" stroke-width="2.5" fill="rgba(16, 185, 129, 0.05)")
            path(d="M11 9H21V11.5L16 16.5L21 21.5V24H11V21.5L16 16.5L11 11.5V9Z" fill="url(#brandGradDesktop)")
            circle(cx="16" cy="12" r="1.5" fill="#ffffff")
            circle(cx="16" cy="21" r="1.5" fill="#ffffff")
          span.ml-0.align-middle(style="font-size: 1.15em; color: var(--aw-text-primary); font-weight: 800; letter-spacing: -0.02em; display: inline-flex; align-items: center;") ActivityWatch

      b-navbar-nav.ml-auto
        b-nav-item-dropdown.nav-tools(:active="isToolsActive")
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

        b-nav-item.nav-buckets(to="/buckets")
          div.px-2.px-lg-1
            icon(name="database")
            | Raw Data
        b-nav-item.nav-settings(to="/settings")
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
    isToolsActive() {
      const paths = ['/search', '/work-report', '/trends', '/report', '/alerts', '/timespiral', '/query', '/graph'];
      return paths.some(p => this.$route.path.startsWith(p));
    },
    currentPageName() {
      const path = this.$route.path;
      if (path.startsWith('/activity/')) {
        const parts = path.split('/');
        const host = parts[2] || '';
        return host ? `Activity (${host})` : 'Activity';
      }
      if (path === '/timeline') return 'Timeline';
      if (path === '/stopwatch') return 'Stopwatch';
      if (path.startsWith('/buckets')) return 'Raw Data';
      if (path.startsWith('/settings')) {
        if (path.includes('category-builder')) return 'Category Builder';
        return 'Settings';
      }
      if (path === '/search') return 'Search';
      if (path === '/work-report') return 'Work Report';
      if (path === '/trends') return 'Trends';
      if (path === '/report') return 'Report';
      if (path === '/alerts') return 'Alerts';
      if (path === '/timespiral') return 'Timespiral';
      if (path === '/query') return 'Query Explorer';
      if (path === '/graph') return 'Graph';
      if (path === '/dev') return 'Dev';
      if (path === '/home') return 'Home';
      return '';
    },
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
    padding: 0.5rem 1.1rem 0.65rem 1.1rem !important;
    display: flex !important;
    align-items: center;
    gap: 6px;
    position: relative !important;
    transition: all 0.25s ease;
    
    .fa-icon {
      margin: 0;
      opacity: 0.7;
      transition: transform 0.25s ease, opacity 0.25s ease;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 10%;
      width: 80%;
      height: 3px;
      border-radius: 99px;
      background: transparent;
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
    }
  }

  /* Vibrant Colorful Underline Hover & Active States */
  
  /* 1. Activity (Green/Emerald) */
  &:hover, &.show, &:has([href*="activity"]), &.active {
    background-color: transparent !important;
    .nav-link {
      color: #10b981 !important;
      .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
      &::after {
        background: #10b981 !important;
        transform: scaleX(1) !important;
      }
    }
  }
  
  /* 2. Timeline (Violet/Purple) */
  &:has([href*="timeline"]) {
    &:hover, &.active {
      background-color: transparent !important;
      .nav-link {
        color: #8b5cf6 !important;
        .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
        &::after {
          background: #8b5cf6 !important;
          transform: scaleX(1) !important;
        }
      }
    }
  }

  /* 3. Stopwatch (Pink/Rose) */
  &:has([href*="stopwatch"]) {
    &:hover, &.active {
      background-color: transparent !important;
      .nav-link {
        color: #ec4899 !important;
        .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
        &::after {
          background: #ec4899 !important;
          transform: scaleX(1) !important;
        }
      }
    }
  }

  /* 4. Tools (Cyan/Info) */
  &.dropdown {
    &:hover, &.show {
      background-color: transparent !important;
      .nav-link {
        color: #06b6d4 !important;
        .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
        &::after {
          background: #06b6d4 !important;
          transform: scaleX(1) !important;
        }
      }
    }
  }

  /* 5. Raw Data (Amber/Orange) */
  &:has([href*="buckets"]) {
    &:hover, &.active {
      background-color: transparent !important;
      .nav-link {
        color: #f59e0b !important;
        .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
        &::after {
          background: #f59e0b !important;
          transform: scaleX(1) !important;
        }
      }
    }
  }

  /* 6. Settings (Blue) */
  &:has([href*="settings"]) {
    &:hover, &.active {
      background-color: transparent !important;
      .nav-link {
        color: #3b82f6 !important;
        .fa-icon { opacity: 1; transform: translateY(-1px) scale(1.05); }
        &::after {
          background: #3b82f6 !important;
          transform: scaleX(1) !important;
        }
      }
    }
  }
}

.navbar-brand:hover {
  .brand-svg-logo {
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

/* Page name transition */
.fade-enter-active, .fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter {
  opacity: 0;
  transform: translateX(-4px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateX(4px);
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
