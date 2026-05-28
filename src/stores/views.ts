import { defineStore } from 'pinia';
import { useSettingsStore } from './settings';

interface IElement {
  type: string;
  size?: number;
  width?: number;
  colSpan?: number;
  rowSpan?: number;
  minWidth?: number;
  minHeight?: number;
  props?: Record<string, unknown>;
}

export interface View {
  id: string;
  name: string;
  elements: IElement[];
}

const desktopViews: View[] = [
  {
    id: 'summary',
    name: 'Summary',
    elements: [
      { type: 'timeline_barchart', size: 3, colSpan: 4, rowSpan: 2 },
      { type: 'category_doughnut', size: 2 },
      { type: 'category_polar', size: 2 },
      { type: 'top_apps', size: 2 },
      { type: 'top_categories', size: 2 },
    ],
  },
  {
    id: 'window',
    name: 'Window',
    elements: [
      { type: 'top_apps', size: 2 },
      { type: 'top_titles', size: 2 },
    ],
  },
  {
    id: 'browser',
    name: 'Browser',
    elements: [
      { type: 'top_domains', size: 2 },
      { type: 'top_urls', size: 2 },
      { type: 'top_browser_titles', size: 2 },
    ],
  },
  {
    id: 'editor',
    name: 'Editor',
    elements: [
      { type: 'top_editor_files', size: 2 },
      { type: 'top_editor_projects', size: 2 },
      { type: 'top_editor_languages', size: 2 },
    ],
  },
];

const androidViews = [
  {
    id: 'summary',
    name: 'Summary',
    elements: [
      { type: 'timeline_barchart', size: 3, colSpan: 4, rowSpan: 2 },
      { type: 'category_doughnut', size: 2 },
      { type: 'category_polar', size: 2 },
      { type: 'top_apps', size: 2 },
      { type: 'top_categories', size: 2 },
    ],
  },
];

// FIXME: Decide depending on what kind of device is being viewed, not from which device it is being viewed from.
export const defaultViews = !process.env.VUE_APP_ON_ANDROID ? desktopViews : androidViews;

interface State {
  views: View[];
}

export const useViewsStore = defineStore('views', {
  state: (): State => ({
    views: [],
  }),
  getters: {
    getViewById: state => (id: string) => state.views.find(view => view.id === id),
  },
  actions: {
    async load() {
      const settingsStore = useSettingsStore();
      await settingsStore.ensureLoaded();
      const views = settingsStore.views;
      this.loadViews(views);
    },
    async save() {
      const settingsStore = useSettingsStore();
      settingsStore.update({ views: this.views });
      await this.load();
    },
    loadViews(views: View[]) {
      const migrated = (views || []).map(v => ({
        ...v,
        elements: (v.elements || []).map(el => {
          // If the element has size 3 and is not a timeline or clock chronogram, migrate it to size 2 to show 2-in-a-line!
          if (el.size === 3 && el.type !== 'timeline_barchart' && el.type !== 'vis_timeline' && el.type !== 'sunburst_clock') {
            return { ...el, size: 2 };
          }
          return el;
        })
      }));
      this.$patch({ views: migrated });
      console.log('Loaded and migrated views:', this.views);
    },
    clearViews(this: State) {
      this.views = [];
    },
    setElements(this: State, { view_id, elements }: { view_id: string; elements: IElement[] }) {
      this.views.find(v => v.id == view_id).elements = elements;
    },
    restoreDefaults(this: State) {
      this.views = defaultViews;
    },
    addView(this: State, view: View) {
      this.views.push({ ...view, elements: [] });
    },
    removeView(this: State, { view_id }) {
      const idx = this.views.map(v => v.id).indexOf(view_id);
      this.views.splice(idx, 1);
    },
    editView(
      this: State,
      {
        view_id,
        el_id,
        type,
        props,
      }: { view_id: string; el_id: string; type: string; props: Record<string, unknown> }
    ) {
      console.log(view_id, el_id, type, props);
      console.log(this.views);
      const element = this.views.find(v => v.id == view_id).elements[el_id];
      element.type = type;
      element.props = props;
    },
    addVisualization(this: State, { view_id, type }) {
      this.views.find(v => v.id == view_id).elements.push({ type: type });
    },
    removeVisualization(this: State, { view_id, el_id }) {
      this.views.find(v => v.id == view_id).elements.splice(el_id, 1);
    },
    changeElementSize(
      this: State,
      { view_id, el_id, size }: { view_id: string; el_id: number; size: number }
    ) {
      const view = this.views.find(v => v.id == view_id);
      if (view && view.elements[el_id]) {
        const updated = { ...view.elements[el_id], size };
        view.elements.splice(el_id, 1, updated);
      }
    },
    changeElementWidth(
      this: State,
      { view_id, el_id, width }: { view_id: string; el_id: number; width: number }
    ) {
      const view = this.views.find(v => v.id == view_id);
      if (view && view.elements[el_id]) {
        const updated = { ...view.elements[el_id], width };
        view.elements.splice(el_id, 1, updated);
      }
    },
    changeElementGrid(
      this: State,
      {
        view_id,
        el_id,
        prop,
        value,
      }: { view_id: string; el_id: number; prop: 'colSpan' | 'rowSpan'; value: number }
    ) {
      const view = this.views.find(v => v.id == view_id);
      if (view && view.elements[el_id]) {
        const updated = { ...view.elements[el_id], [prop]: value };
        view.elements.splice(el_id, 1, updated);
      }
    },
    changeElementMinDimensions(
      this: State,
      {
        view_id,
        el_id,
        minWidth,
        minHeight,
      }: { view_id: string; el_id: number; minWidth?: number; minHeight?: number }
    ) {
      const view = this.views.find(v => v.id == view_id);
      if (view && view.elements[el_id]) {
        const updated = { ...view.elements[el_id] };
        if (minWidth !== undefined) updated.minWidth = minWidth;
        if (minHeight !== undefined) updated.minHeight = minHeight;
        view.elements.splice(el_id, 1, updated);
      }
    },
  },
});
