<template lang="pug">
div.sunburst-container(:style="{ height: height + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }")
  div.sidebar
    div.legend

  div.main(:style="{ width: size + 'px', height: size + 'px', position: 'relative' }")
    div.chart(:style="{ width: size + 'px', height: size + 'px' }")
      div.explanation
        div.base
          | {{ centerMsg }}
        div.hover(style="visibility: hidden")
          div.date
          div.title
          div.time
          div.duration
          div.data(style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;")
</template>

<style scoped lang="scss">
.sunburst-container {
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  width: 100%;
  margin-top: 0;
  overflow: hidden;
  position: relative;

  .main {
    margin: 0 auto;
  }

  .sidebar {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 100;
    pointer-events: none;
  }

  .legend {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: rgba(0, 0, 0, 0.4);
    padding: 6px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .chart {
    position: relative;
  }

  .explanation {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150px;
    text-align: center;
    color: var(--aw-text-muted);
    z-index: 10;
    pointer-events: none;

    .base {
      color: var(--aw-text-primary);
      font-size: 0.9rem;
      font-weight: 600;
      font-family: 'Outfit', sans-serif;
    }

    .hover {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;

      .date {
        font-size: 0.65rem;
        color: var(--aw-text-muted);
      }

      .time {
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--aw-text-primary);
        font-family: monospace;
      }

      .title {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--aw-text-primary);
        font-family: 'Outfit', sans-serif;
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .duration {
        font-size: 0.72rem;
        color: #10b981;
        font-weight: 600;
      }

      .data {
        font-size: 0.65rem;
        color: var(--aw-text-muted);
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>

<script>
import sunburst from './sunburst-clock';
import moment from 'moment';
import _ from 'lodash';

export default {
  name: 'aw-sunburst-clock',
  props: {
    date: { type: String },
    afkBucketId: { type: String },
    windowBucketId: { type: String },
    height: { type: Number, default: 350 },
  },

  data: () => {
    return {
      starttime: moment(),
      endtime: moment(),
      centerMsg: 'Loading...',
    };
  },

  computed: {
    size() {
      // Return a perfect square size to fit inside card height bounds
      return Math.max(200, this.height);
    },
  },

  watch: {
    date: function (to) {
      this.starttime = moment(to).startOf('day');
      this.endtime = moment(this.starttime).add(1, 'days');
      this.visualize();
    },
    height: function (to) {
      sunburst.create(this.$el, to);
      this.visualize();
    },
  },
  mounted: function () {
    sunburst.create(this.$el, this.height);
    this.starttime = moment(this.date).startOf('day');
    this.endtime = moment(this.date).startOf('day').add(1, 'days');
    this.visualize();
  },

  methods: {
    todaysEvents: async function (bucket_id) {
      const querystr = [`RETURN = flood(query_bucket("${bucket_id}"));`];
      const data = await this.$aw.query(
        [`${this.starttime.format()}/${this.endtime.format()}`],
        querystr
      );
      return data[0];
    },

    visualize: function () {
      function buildHierarchy(parents, children) {
        parents = _.sortBy(parents, 'timestamp', 'desc');
        children = _.sortBy(children, 'timestamp', 'desc');

        let i_child = 0;
        for (let i_parent = 0; i_parent < parents.length; i_parent++) {
          const p = parents[i_parent];
          const p_start = moment(p.timestamp);
          const p_end = p_start.clone().add(p.duration, 'seconds');

          p.children = [];
          while (i_child < children.length) {
            const e = children[i_child];
            const e_start = moment(e.timestamp);
            const e_end = e_start.clone().add(e.duration, 'seconds');

            const before_parent = e_end.isBefore(p_start);
            const within_parent = e_start.isAfter(p_start) && e_end.isBefore(p_end);
            const after_parent = e_start.isAfter(p_end);

            if (before_parent) {
              i_child++;
            } else if (within_parent) {
              p.children = _.concat(p.children, e);
              i_child++;
            } else if (after_parent) {
              break;
            } else {
              p.children = _.concat(p.children, e);
              i_child++;
            }
          }
        }

        const m_start = moment(_.first(parents).timestamp);
        const m_end = moment(_.tail(parents).timestamp);
        const duration = (m_end - m_start) / 1000;
        return {
          timestamp: _.first(parents).timestamp,
          duration: duration,
          data: { title: 'ROOT' },
          children: parents,
        };
      }

      this.todaysEvents(this.afkBucketId).then(events_afk => {
        this.todaysEvents(this.windowBucketId).then(events_window => {
          let hierarchy = null;
          if (events_afk.length > 0 && events_window.length > 0) {
            hierarchy = buildHierarchy(events_afk, events_window);
            this.centerMsg = 'Hover to inspect';
          } else {
            hierarchy = {
              timestamp: '',
              duration: 0,
              data: { title: 'ROOT' },
              children: [],
            };
            this.centerMsg = 'No data';
          }
          sunburst.update(this.$el, hierarchy, this.starttime, this.height);
        });
      });
    },
  },
};
</script>
