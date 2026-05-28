<template lang="pug">
div.footer-container.container
  hr.footer-divider
  
  div.d-flex.flex-column.flex-md-row.justify-content-between.align-items-center.py-4
    div.footer-left.text-center.text-md-left.mb-3.mb-md-0
      div.footer-made-with
        | Made with
        a.heart-link(href="https://activitywatch.net/donate/", target="_blank")
          icon(name="heart" scale=0.8)
        | by the #[a.dev-link(href="http://activitywatch.net/contributors/") ActivityWatch developers]
      
      div.footer-info.mt-1(v-if="info")
        span.mr-3
          span.info-label Host:
          span.info-value &nbsp;{{ info.hostname }}
        span
          span.info-label Version:
          span.info-value &nbsp;{{ info.version }}

    div.footer-right.text-center.text-md-right
      div.footer-links.d-flex.flex-wrap.justify-content-center.gap-3
        a.footer-link(href="https://github.com/ActivityWatch/activitywatch/issues/new/choose", target="_blank")
          icon(name="bug")
          span Report a bug
        a.footer-link(href="https://forum.activitywatch.net/c/support", target="_blank")
          icon(name="question-circle")
          span Ask for help
        a.footer-link(href="https://forum.activitywatch.net/c/features", target="_blank")
          icon(name="vote-yea")
          span Vote on features
        a.footer-link(href="https://twitter.com/ActivityWatchIt", target="_blank")
          icon(name="brands/twitter")
          span Twitter
        a.footer-link(href="https://github.com/ActivityWatch", target="_blank")
          icon(name="brands/github")
          span GitHub
        a.footer-link.donate-link(href="https://activitywatch.net/donate/", target="_blank")
          icon(name="hand-holding-heart")
          span Donate
</template>

<script lang="ts">
// only import the icons you use to reduce bundle size
import 'vue-awesome/icons/brands/twitter';
import 'vue-awesome/icons/brands/github';
import 'vue-awesome/icons/hand-holding-heart';
import 'vue-awesome/icons/vote-yea';
import 'vue-awesome/icons/question-circle';
import 'vue-awesome/icons/bug';
import 'vue-awesome/icons/heart';

import { mapState } from 'pinia';
import { useServerStore } from '~/stores/server';

export default {
  name: 'Footer',
  computed: {
    ...mapState(useServerStore, ['info']),
  },
};
</script>

<style lang="scss" scoped>
.footer-container {
  color: var(--aw-text-secondary);
  font-size: 0.88rem;
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.footer-divider {
  border-color: var(--aw-card-border);
  opacity: 0.5;
  margin-bottom: 1.5rem;
}

.footer-made-with {
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (min-width: 768px) {
    justify-content: flex-start;
  }
}

.heart-link {
  display: inline-flex;
  align-items: center;
  margin: 0 4px;
  
  .fa-icon {
    fill: #ef4444;
    transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  &:hover .fa-icon {
    transform: scale(1.3);
  }
}

.dev-link {
  color: var(--aw-text-primary);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px dashed var(--aw-text-secondary);
  transition: color 0.2s ease, border-color 0.2s ease;
  
  &:hover {
    color: var(--aw-accent-color);
    border-color: var(--aw-accent-color);
  }
}

.footer-info {
  font-size: 0.78rem;
  color: var(--aw-text-muted);
  
  .info-label {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .info-value {
    color: var(--aw-text-secondary);
  }
}

.footer-links {
  gap: 15px;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--aw-text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease, transform 0.2s ease;
  
  .fa-icon {
    opacity: 0.7;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  
  &:hover {
    color: var(--aw-text-primary);
    transform: translateY(-1px);
    
    .fa-icon {
      opacity: 1;
      transform: scale(1.08);
    }
  }
  
  &.donate-link {
    color: #ef4444;
    font-weight: 600;
    
    .fa-icon {
      fill: #ef4444;
      opacity: 0.9;
    }
    
    &:hover {
      color: #dc2626;
      
      .fa-icon {
        opacity: 1;
      }
    }
  }
}
</style>
