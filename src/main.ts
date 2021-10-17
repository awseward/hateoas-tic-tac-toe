import App from './App.svelte';
import { fillTemplate } from './links';

const linkTemplateValues = {
  authority: window.location.origin,
};

const app = new App({
  target: document.body,
  props: {
    entrypoint: {
      rel: 'entrypoint',
      href:
        window.location.pathname === '/'
        ? '/api'
        : `/api${window.location.pathname + window.location.search}`,
      method: 'GET',
      title: '',
    },
    fillTemplate: fillTemplate(linkTemplateValues),
  }
});

export default app;
