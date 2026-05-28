<template lang="pug">
div
  h2 Timeline

  input-timeinterval(v-model="daterange", :defaultDuration="timeintervalDefaultDuration", :maxDuration="maxDuration").mb-3

  // blocks
  div.timeline-action-bar.p-3.mb-4
    div.d-flex.flex-wrap.align-items-center.justify-content-between.gap-3
      // Left Group: Info & Swimlanes
      div.d-flex.flex-wrap.align-items-center.gap-2
        div.info-capsule
          icon.mr-1(name="calendar-check")
          | Events shown: {{ num_events }}
        
        div.control-capsule.d-flex.align-items-center
          span.mr-2.small.text-muted.font-weight-bold Swimlanes:
          b-select(v-model="swimlane" size="sm" style="width: auto; min-width: 140px;")
            option(:value='null') None
            option(value='category') Categories
            option(value='bucketType') Bucket Specific

      // Right Group: Advanced Filters Panel & Duration Filters
      div.d-flex.flex-wrap.align-items-center.gap-2.ml-md-auto
        // Duration dropdown styled inside capsule
        div.control-capsule.d-flex.align-items-center
          span.mr-2.small.text-muted.font-weight-bold Min Duration:
          b-select(v-model="filter_duration" size="sm" style="width: auto; min-width: 120px;")
            option(:value='null') All
            option(:value='2') 2+ secs
            option(:value='5') 5+ secs
            option(:value='10') 10+ secs
            option(:value='30') 30+ sec
            option(:value='1 * 60') 1+ mins
            option(:value='2 * 60') 2+ mins
            option(:value='3 * 60') 3+ mins
            option(:value='10 * 60') 10+ mins
            option(:value='30 * 60') 30+ mins
            option(:value='1 * 60 * 60') 1+ hrs
            option(:value='2 * 60 * 60') 2+ hrs

        // Advanced Filter Dropdown Overlay
        details.details-filter-panel
          summary.filter-summary-btn.d-flex.align-items-center
            icon.mr-1(name="filter")
            span.font-weight-bold Filters: {{ filter_summary }}
          
          div.filter-dropdown-card.p-3
            h6.mb-2.small.text-muted.font-weight-bold Advanced Filter Configurations
            div.filter-grid
              div.filter-field
                label Host
                b-select(v-model="filter_hostname" size="sm")
                  option(:value='null') All
                  option(v-for="host in hosts", :value="host") {{ host }}
              
              div.filter-field.mt-2
                label Client
                b-select(v-model="filter_client" size="sm")
                  option(:value='null') All
                  option(v-for="client in clients", :value="client") {{ client }}

              div.filter-field.mt-2.d-flex.justify-content-between.align-items-center
                span.small.font-weight-bold Filter AFK:
                b-form-checkbox(v-model="filter_afk" size="sm" switch)
              
              div.filter-field.mt-2.d-flex.justify-content-between.align-items-center
                span.small.font-weight-bold Merge by App:
                b-form-checkbox(v-model="filter_merge_similar" size="sm" switch)

              div.filter-field.mt-3
                label Categories
                b-select(@change="onCategorySelect($event)", :value="''" size="sm")
                  option(value="" disabled) {{ filter_categories.length > 0 ? 'Add category...' : 'All' }}
                  option(v-for="cat in category_options", :key="cat.text", :value="cat.text") {{ cat.text }}
                
                div.mt-2.d-flex.flex-wrap.gap-1(v-if="filter_categories.length > 0")
                  span.badge.badge-info.mr-1.p-1.d-flex.align-items-center(v-for="(cat, idx) in filter_categories", :key="idx")
                    | {{ cat.join(' > ') }}
                    span.ml-1.close-btn(@click="removeCategory(idx)" style="cursor: pointer; font-weight: bold;") &times;

  // Warning for empty results
  b-alert.mb-3(v-if="num_events === 0", variant="warning", show)
    | No events match the selected criteria. The timeline remains fixed on the previous query.

  // Action hint label
  div.d-flex.justify-content-between.align-items-center.mb-3.px-1
    span.small.text-muted
      icon.mr-1(name="info-circle")
      | Use scroll to zoom, click-drag to pan, or arrow keys to navigate the timeline grid.

  div(v-if="buckets !== null")
    div(style="clear: both")
    vis-timeline(:buckets="buckets", :showRowLabels='true', :queriedInterval="daterange", :swimlane="swimlane", :updateTimelineWindow='updateTimelineWindow')

    aw-devonly(reason="Not ready for production, still experimenting")
      aw-calendar(:buckets="buckets")
  div(v-else)
    h1.aw-loading Loading...
</template>

<script lang="ts">
import _ from 'lodash';
import { mapState } from 'pinia';
import { useSettingsStore } from '~/stores/settings';
import { useBucketsStore } from '~/stores/buckets';
import { getClient } from '~/util/awclient';
import { canonicalEvents } from '~/queries';
import { useCategoryStore } from '~/stores/categories';
import { matchString } from '~/util/classes';
import { getCategorizationStringFromEvent } from '~/util/color';
import { seconds_to_duration } from '~/util/time';
import 'vue-awesome/icons/calendar-check';
import 'vue-awesome/icons/filter';
import 'vue-awesome/icons/info-circle';

export default {
  name: 'Timeline',
  data() {
    return {
      all_buckets: null,
      hosts: null,
      buckets: null,
      clients: null,
      daterange: null,
      maxDuration: 31 * 24 * 60 * 60,
      filter_hostname: null,
      filter_client: null,
      filter_duration: null,
      filter_afk: false,
      filter_merge_similar: false,
      filter_categories: [],
      swimlane: null,
      updateTimelineWindow: true,
    };
  },
  computed: {
    ...mapState(useSettingsStore, ['always_active_pattern']),
    timeintervalDefaultDuration() {
      const settingsStore = useSettingsStore();
      return Number(settingsStore.durationDefault);
    },
    // This does not match the chartData which is rendered in the timeline, as chartData excludes short events.
    num_events() {
      return _.sumBy(this.buckets, 'events.length');
    },
    category_options() {
      const categoryStore = useCategoryStore();
      return categoryStore.allCategoriesSelect;
    },
    filter_summary() {
      const desc = [];
      if (this.filter_hostname) {
        desc.push(this.filter_hostname);
      }
      if (this.filter_client) {
        desc.push(this.filter_client);
      }
      if (this.filter_duration > 0) {
        desc.push(seconds_to_duration(this.filter_duration));
      }
      if (this.filter_afk) {
        desc.push('AFK filtered');
      }
      if (this.filter_merge_similar) {
        desc.push('merged by app');
      }
      if (this.filter_categories.length > 0) {
        desc.push(
          this.filter_categories.length +
            ' categor' +
            (this.filter_categories.length === 1 ? 'y' : 'ies')
        );
      }

      if (desc.length > 0) {
        return desc.join(', ');
      }
      return 'none';
    },
  },
  watch: {
    daterange() {
      this.updateTimelineWindow = true;
      this.getBuckets();
    },
    filter_hostname() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    filter_client() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    filter_duration() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    filter_afk() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    filter_merge_similar() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    filter_categories() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    swimlane() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
  },
  methods: {
    onCategorySelect(event) {
      const text = event.target.value;
      if (!text) return;
      const cat = this.category_options.find(c => c.text === text);
      if (cat && !this.filter_categories.some(fc => _.isEqual(fc, cat.value))) {
        this.filter_categories = [...this.filter_categories, cat.value];
      }
      event.target.value = '';
    },
    removeCategory(idx) {
      this.filter_categories = this.filter_categories.filter((_cat, i) => i !== idx);
    },
    getBuckets: async function () {
      if (this.daterange == null) return;

      this.all_buckets = Object.freeze(
        await useBucketsStore().getBucketsWithEvents({
          start: this.daterange[0].format(),
          end: this.daterange[1].format(),
        })
      );

      this.hosts = this.all_buckets
        .map(a => a.hostname)
        .filter((value, index, array) => array.indexOf(value) === index);
      this.clients = this.all_buckets
        .map(a => a.client)
        .filter((value, index, array) => array.indexOf(value) === index);

      let buckets = this.all_buckets;
      if (this.filter_hostname) {
        buckets = _.filter(buckets, b => b.hostname == this.filter_hostname);
      }
      if (this.filter_client) {
        buckets = _.filter(buckets, b => b.client == this.filter_client);
      }

      if (this.filter_duration > 0) {
        for (const bucket of buckets) {
          bucket.events = _.filter(bucket.events, e => e.duration >= this.filter_duration);
        }
      }

      if (this.filter_categories.length > 0) {
        const categoryStore = useCategoryStore();
        const allCats = categoryStore.classes;
        for (const bucket of buckets) {
          // Skip AFK buckets — they don't have meaningful categorization
          if (bucket.type === 'afkstatus') continue;
          bucket.events = _.filter(bucket.events, e => {
            const str = getCategorizationStringFromEvent(bucket, e);
            if (str === null) return true; // Keep events from unknown bucket types
            const matched = matchString(str, allCats);
            const eventCat = matched ? matched.name : ['Uncategorized'];
            // Check if the event's category matches any selected filter category
            // (including parent matches: selecting "Work" also shows "Work > Programming")
            return this.filter_categories.some(filterCat =>
              _.isEqual(eventCat.slice(0, filterCat.length), filterCat)
            );
          });
        }
      }

      // AFK filtering: use query engine to filter window events by AFK status
      if (this.filter_afk) {
        buckets = await this._applyAfkFilter(buckets);
      }

      // Merge adjacent events by app name for window buckets.
      // Runs after AFK filtering so merges operate on already-filtered events.
      // Reduces visual clutter from apps that produce many small events (e.g.
      // Adobe Illustrator's TAB key toggling UI panels). See: activitywatch#1165
      if (this.filter_merge_similar) {
        buckets = this._applyMergeSimilar(buckets);
      }

      this.buckets = buckets;
    },

    // Merges adjacent events with the same app name within window buckets.
    // This collapses rapid title changes (e.g. toggling UI panels) into single
    // blocks per app, fixing timeline flooding for apps like Adobe Illustrator.
    _applyMergeSimilar: function (buckets) {
      return buckets.map(bucket => {
        if (bucket.type !== 'currentwindow' || !bucket.events || bucket.events.length <= 1) {
          return bucket;
        }

        const sorted = [...bucket.events].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const merged = [];
        let current = { ...sorted[0] };

        for (let i = 1; i < sorted.length; i++) {
          const next = sorted[i];
          const currentEnd = new Date(current.timestamp).getTime() + current.duration * 1000;
          const nextStart = new Date(next.timestamp).getTime();
          const gap = nextStart - currentEnd;

          // Merge if same app and gap is small (< 30 seconds)
          if (current.data?.app && current.data.app === next.data?.app && gap < 30000) {
            const nextEnd = nextStart + next.duration * 1000;
            current.duration =
              (Math.max(currentEnd, nextEnd) - new Date(current.timestamp).getTime()) / 1000;
          } else {
            merged.push(current);
            current = { ...next };
          }
        }
        merged.push(current);

        return { ...bucket, events: merged };
      });
    },

    // Replaces raw window bucket events with AFK-filtered events via aw query engine.
    // Also hides AFK status buckets since they're used for filtering, not display.
    _applyAfkFilter: async function (buckets) {
      const bucketsStore = useBucketsStore();
      const result = [];

      for (const bucket of buckets) {
        // Hide AFK status buckets when AFK filtering is active
        if (bucket.type === 'afkstatus') {
          continue;
        }

        // For window buckets, replace events with AFK-filtered query results
        if (bucket.type === 'currentwindow' && bucket.hostname) {
          const afkBucketIds = bucketsStore.bucketsAFK(bucket.hostname);
          if (afkBucketIds.length > 0) {
            try {
              const filteredEvents = await this._queryAfkFilteredEvents(bucket.id, afkBucketIds[0]);
              // Create a copy with filtered events to avoid mutating frozen all_buckets
              result.push({ ...bucket, events: filteredEvents });
              continue;
            } catch (e) {
              console.warn('AFK filter query failed, falling back to raw events:', e);
            }
          }
        }

        // Keep other buckets unchanged
        result.push(bucket);
      }

      return result;
    },

    // Runs a canonicalEvents query to get window events filtered by AFK status,
    // respecting the user's always_active_pattern setting.
    _queryAfkFilteredEvents: async function (windowBucketId, afkBucketId) {
      const queryCode =
        canonicalEvents({
          bid_window: windowBucketId,
          bid_afk: afkBucketId,
          filter_afk: true,
          always_active_pattern: this.always_active_pattern || undefined,
          categories: [],
          filter_categories: null,
        }) + '\nRETURN = events;';

      const queryArray = queryCode
        .split(';')
        .map(s => s.trim())
        .filter(s => s)
        .map(s => s + ';');

      const start = this.daterange[0].format();
      const end = this.daterange[1].format();
      const timeperiods = [`${start}/${end}`];

      const data = await getClient().query(timeperiods, queryArray);
      return data[0] || [];
    },
  },
};
</script>

<style scoped lang="scss">
.timeline-action-bar {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
}

.info-capsule {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 6px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--aw-text-primary);
  display: flex;
  align-items: center;
}

.control-capsule {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
}

.details-filter-panel {
  position: relative;
}

.filter-summary-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 8px 16px;
  font-size: 0.9rem;
  color: var(--aw-text-primary);
  cursor: pointer;
  list-style: none;
  transition: all 0.2s;

  &::-webkit-details-marker {
    display: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
  }
}

.filter-dropdown-card {
  visibility: visible;
  position: absolute;
  right: 0;
  top: 2.9rem;
  width: 280px;
  background: #0b0f19;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.filter-field {
  label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--aw-text-muted);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
}

.close-btn {
  font-size: 1.15rem;
  color: #fff;
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.aw-loading {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  text-align: center;
  margin-top: 3rem;
  color: var(--aw-text-muted);
  animation: pulse 1.8s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 2px rgba(255,255,255,0)); }
  50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.3)); }
}

.gap-1 { gap: 0.25rem !important; }
.gap-2 { gap: 0.5rem !important; }
.gap-3 { gap: 1rem !important; }
</style>
