import _ from 'lodash';
import { Category, matchString, loadClasses } from './classes';
import Color from 'color';
import * as d3 from 'd3';
import { IEvent, IBucket } from './interfaces';

import { useSettingsStore } from '../stores/settings';

// See here for examples:
//   https://bl.ocks.org/pstuffa/3393ff2711a53975040077b7453781a9
//

const COLOR_UNCAT = '#64748b'; // Muted slate instead of #CCC

export const palettes = {
  default: [
    '#3b82f6', // Indigo-Blue
    '#10b981', // Emerald Green
    '#8b5cf6', // Violet Purple
    '#f43f5e', // Coral Rose
    '#f59e0b', // Warm Amber
    '#06b6d4', // Bright Cyan
    '#ec4899', // Hot Pink
    '#14b8a6', // Cool Teal
    '#f97316', // Tangerine Orange
    '#6366f1', // Indigo Purple
  ],
  cyberneon: [
    '#00f5ff', // Neon Cyan
    '#ff007f', // Neon Pink/Rose
    '#39ff14', // Neon Green
    '#e0b0ff', // Neon Violet
    '#ffef00', // Neon Yellow
    '#ff5f1f', // Neon Orange
    '#bf00ff', // Neon Purple
    '#00e5ff', // Bright Blue
    '#ff00ff', // Fuchsia
    '#1f51ff', // Neon Cobalt
  ],
  sunset: [
    '#ff5e62', // Coral Sunset
    '#ff9966', // Warm Orange
    '#ff4e50', // Rose Red
    '#f9d423', // Sun Yellow
    '#e14eca', // Sunset Violet
    '#f05a28', // Flame
    '#f857a6', // Petal Pink
    '#ff5858', // Crimson
    '#e65c00', // Dark Amber
    '#f953c6', // Hot Magenta
  ],
  nordicocean: [
    '#0083b0', // Deep Aqua
    '#00b4db', // Ice Blue
    '#00c6ff', // Sky Blue
    '#0072ff', // Royal Blue
    '#0f2027', // Obsidian Blue
    '#203a43', // Teal Slate
    '#2c5364', // Deep Teal
    '#3a7bd5', // Ocean Blue
    '#3a6073', // Sea Slate
    '#11998e', // Coastal Teal
  ],
  forest: [
    '#11998e', // Teal/Mint
    '#38ef7d', // Emerald Grass
    '#134e5e', // Pine Blue
    '#71b280', // Soft Sage
    '#00b09b', // Jade
    '#96c93d', // Lime Gold
    '#a8ff78', // Spring Green
    '#56ab2f', // Olive/Leaf
    '#a8e063', // Meadow Yellow
    '#2ecc71', // Clean Mint
  ],
};

export function getPalette(): string[] {
  try {
    const settingsStore = useSettingsStore();
    if (settingsStore && settingsStore.graphColorScheme && palettes[settingsStore.graphColorScheme]) {
      return palettes[settingsStore.graphColorScheme];
    }
  } catch (e) {
    // Pinia not yet initialized or outside Vue context
  }
  return palettes.default;
}

const scale = d3.scaleOrdinal(palettes.default);
scale.domain(
  '0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20'.split(/, /)
);

const customColors = {
  afk: '#334155', // Sleek slate/grey for AFK
  'not-afk': '#10b981', // Emerald green instead of #7F6
  hibernating: '#f59e0b', // Amber instead of #DD6

  'google-chrome': '#6AA7FE', // Google Blue
  chromium: '#8CF',
  firefox: '#f97316', // Firefox Orange
  spotify: '#10b981', // Spotify Emerald
  alacritty: '#f59e0b',

  vue: '#10b981', // Vue green
  python: '#3b82f6', // Python blue
  javascript: '#ec4899', // JavaScript Pink

  // Developer domains
  localhost: '#64748b',
  'github.com': '#8b5cf6',
  'stackoverflow.com': '#f97316',

  'google.com': '#3b82f6',
  'google.se': '#3b82f6',

  // Social media sites
  'messenger.com': '#0084FF',
  'facebook.com': '#1877F2',

  // Categories
  uncategorized: COLOR_UNCAT,
};

export function upgradeLegacyColor(color: string): string {
  const settingsStore = useSettingsStore();
  const scheme = settingsStore?.graphColorScheme || 'default';

  const mapping: Record<string, Record<string, string>> = {
    default: {
      '#0F0': '#10b981',     // Work green -> Emerald Mint
      '#0f0': '#10b981',
      '#F33': '#e11d48',     // Media red -> Premium Rose/Coral
      '#f33': '#e11d48',
      '#F80': '#f97316',     // Games orange -> Warm Sunset
      '#f80': '#f97316',
      '#FCC400': '#f59e0b',  // Social yellow -> Warm Amber
      '#fcc400': '#f59e0b',
      '#A8FC00': '#d946ef',  // Music yellow-green -> Vibrant Fuchsia/Magenta
      '#a8fc00': '#d946ef',
      '#9FF': '#0ea5e9',     // Comms cyan -> Deep Sky Blue
      '#9ff': '#0ea5e9',
      '#CCC': '#64748b',     // Uncategorized grey -> Slate
      '#ccc': '#64748b',
      '#7F6': '#10b981',
      '#7f6': '#10b981',
      '#DD6': '#f59e0b',
      '#dd6': '#f59e0b'
    },
    cyberneon: {
      '#0F0': '#39ff14',     // Neon Green
      '#0f0': '#39ff14',
      '#F33': '#ff007f',     // Neon Pink/Rose
      '#f33': '#ff007f',
      '#F80': '#ff5f1f',     // Neon Orange
      '#f80': '#ff5f1f',
      '#FCC400': '#ffef00',  // Neon Yellow
      '#fcc400': '#ffef00',
      '#A8FC00': '#bf00ff',  // Neon Purple
      '#a8fc00': '#bf00ff',
      '#9FF': '#00f5ff',     // Neon Cyan
      '#9ff': '#00f5ff',
      '#CCC': '#e0b0ff',     // Neon Violet
      '#ccc': '#e0b0ff',
      '#7F6': '#39ff14',
      '#7f6': '#39ff14',
      '#DD6': '#ffef00',
      '#dd6': '#ffef00'
    },
    sunset: {
      '#0F0': '#f953c6',     // Hot Magenta
      '#0f0': '#f953c6',
      '#F33': '#ff4e50',     // Rose Red
      '#f33': '#ff4e50',
      '#F80': '#ff5e62',     // Coral Sunset
      '#f80': '#ff5e62',
      '#FCC400': '#f9d423',  // Sun Yellow
      '#fcc400': '#f9d423',
      '#A8FC00': '#e14eca',  // Sunset Violet
      '#a8fc00': '#e14eca',
      '#9FF': '#ff9966',     // Warm Orange
      '#9ff': '#ff9966',
      '#CCC': '#f857a6',     // Petal Pink
      '#ccc': '#f857a6',
      '#7F6': '#f953c6',
      '#7f6': '#f953c6',
      '#DD6': '#f9d423',
      '#dd6': '#f9d423'
    },
    nordicocean: {
      '#0F0': '#0083b0',     // Deep Aqua
      '#0f0': '#0083b0',
      '#F33': '#0072ff',     // Royal Blue
      '#f33': '#0072ff',
      '#F80': '#203a43',     // Teal Slate
      '#f80': '#203a43',
      '#FCC400': '#3a7bd5',  // Ocean Blue
      '#fcc400': '#3a7bd5',
      '#A8FC00': '#2c5364',  // Deep Teal
      '#a8fc00': '#2c5364',
      '#9FF': '#00b4db',     // Ice Blue
      '#9ff': '#00b4db',
      '#CCC': '#00c6ff',     // Sky Blue
      '#ccc': '#00c6ff',
      '#7F6': '#0083b0',
      '#7f6': '#0083b0',
      '#DD6': '#3a7bd5',
      '#dd6': '#3a75d5'
    },
    forest: {
      '#0F0': '#38ef7d',     // Emerald Grass
      '#0f0': '#38ef7d',
      '#F33': '#56ab2f',     // Olive/Leaf
      '#f33': '#56ab2f',
      '#F80': '#134e5e',     // Pine Blue
      '#f80': '#134e5e',
      '#FCC400': '#96c93d',  // Lime Gold
      '#fcc400': '#96c93d',
      '#A8FC00': '#00b09b',  // Jade
      '#a8fc00': '#00b09b',
      '#9FF': '#71b280',     // Soft Sage
      '#9ff': '#71b280',
      '#CCC': '#11998e',     // Teal/Mint
      '#ccc': '#11998e',
      '#7F6': '#38ef7d',
      '#7f6': '#38ef7d',
      '#DD6': '#96c93d',
      '#dd6': '#96c93d'
    }
  };

  const activeMapping = mapping[scheme] || mapping.default;
  return activeMapping[color] || color;
}

function hashcode(str: string): number {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const character = str.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export function getColorFromString(appname: string): string {
  appname = appname || '';
  appname = appname.toLowerCase();
  
  // Custom status color mapping matching the active palette dynamically!
  if (customColors[appname]) {
    const settingsStore = useSettingsStore();
    const scheme = settingsStore?.graphColorScheme || 'default';
    if (appname === 'afk') {
      return scheme === 'cyberneon' ? '#1f51ff' : (scheme === 'nordicocean' ? '#0f2027' : '#334155');
    }
    if (appname === 'not-afk') {
      return scheme === 'cyberneon' ? '#39ff14' : (scheme === 'nordicocean' ? '#00b4db' : '#10b981');
    }
    if (appname === 'hibernating') {
      return scheme === 'cyberneon' ? '#ffef00' : (scheme === 'nordicocean' ? '#2c5364' : '#f59e0b');
    }
    return customColors[appname];
  }
  
  const palette = getPalette();
  const dynamicScale = d3.scaleOrdinal(palette);
  dynamicScale.domain('0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20'.split(/, /));
  return dynamicScale(Math.abs(hashcode(appname) % palette.length).toString());
}

// TODO: Move into vuex?
export function getColorFromCategory(c: Category, allCats: Category[]): string {
  // Returns the color for a certain category, falling back to parents if none set
  if (c && c.data && c.data.color) {
    return upgradeLegacyColor(c.data.color);
  } else if (c && c.name.slice(0, -1).length > 0) {
    // If no color is set on category, traverse parents until one is found
    const parent = c.name.slice(0, -1);
    const parentCat = allCats.find(cc => _.isEqual(cc.name, parent));
    if (parentCat === undefined) {
      console.error("Couldn't find parent!", parent);
    }
    return getColorFromCategory(parentCat, allCats);
  } else {
    return COLOR_UNCAT;
  }
}

// TODO: Move into vuex?
export function getCategoryColorFromString(str: string): string {
  // TODO: Don't load classes on every call
  const allCats = loadClasses();
  const c = matchString(str, allCats);
  if (c !== null) {
    return getColorFromCategory(c, allCats);
  } else {
    return fallbackColor(str);
  }
}

function fallbackColor(str: string): string {
  // Get fallback color
  // TODO: Fetch setting from somewhere better, where defaults are respected
  const useColorFallback =
    localStorage !== undefined ? localStorage.useColorFallback === 'true' : true;
  if (useColorFallback) {
    return getColorFromString(str);
  } else {
    return COLOR_UNCAT;
  }
}

export function getTitleAttr(bucket: { type?: string }, e: IEvent) {
  if (bucket.type == 'currentwindow') {
    return e.data.app;
  } else if (bucket.type == 'web.tab.current') {
    const domainRegex = /^.+:\/\/(?:www.)?([^/]+)/;
    const match = e.data.url.match(domainRegex);
    return match ? match[1] : e.data.url;
  } else if (bucket.type == 'afkstatus') {
    return e.data.status;
  } else if (bucket.type?.startsWith('app.editor')) {
    return _.last(e.data.file.split('/'));
  } else if (bucket.type?.startsWith('general.stopwatch')) {
    return e.data.label;
  } else {
    const title = e.data.title;
    if (title && typeof title === 'string') {
      return title;
    }

    const keys = Object.keys(e.data);
    if (keys.length === 1) {
      const val = e.data[keys[0]];
      if (typeof val === 'string') {
        return val.length > 50 ? val.slice(0, 50) : val;
      }
    }

    return '';
  }
}

export function getCategorizationStringFromEvent(bucket: IBucket, e: IEvent): string | null {
  if (bucket.type == 'currentwindow') {
    // using linebreak and "m" regex flag to make `$` and `^` work
    return e.data.app + '\n' + e.data.title;
  } else if (bucket.type == 'web.tab.current') {
    // same as above
    return e.data.title + '\n' + e.data.url;
  } else if (bucket.type?.startsWith('app.editor')) {
    return e.data.file;
  } else if (bucket.type?.startsWith('general.stopwatch')) {
    return e.data.label;
  }

  return null;
}

export function getCategoryColorFromEvent(bucket: IBucket, e: IEvent) {
  const categorizationString = getCategorizationStringFromEvent(bucket, e);
  if (categorizationString !== null) {
    return getCategoryColorFromString(categorizationString);
  }

  if (bucket.type == 'afkstatus') {
    return getColorFromString(e.data.status);
  }

  return getColorFromString(getTitleAttr(bucket, e));
}
