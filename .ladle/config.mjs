/**
 * @type {import('@ladle/react').UserConfig}
 */
export default {
  stories: 'stories/**/*.stories.{js,jsx,ts,tsx}',
  outDir: 'ladle-build',
  appendToHead: '',
  viteConfig: undefined,
  addons: {
    a11y: {
      enabled: true,
    },
    action: {
      enabled: true,
    },
    control: {
      enabled: true,
    },
    ladle: {
      enabled: true,
    },
    mode: {
      enabled: true,
      defaultState: 'full',
    },
    msw: {
      enabled: false,
    },
    source: {
      enabled: true,
    },
    theme: {
      enabled: true,
      defaultState: 'light',
    },
    width: {
      enabled: true,
      options: {
        xsmall: 414,
        small: 640,
        medium: 768,
        large: 1024,
      },
      defaultState: 0,
    },
  },
  base: '/',
  defaultStory: '',
  hotkeys: {
    search: ['/'],
    nextStory: ['ArrowDown'],
    previousStory: ['ArrowUp'],
    nextComponent: ['ArrowRight'],
    previousComponent: ['ArrowLeft'],
    control: ['c'],
    darkMode: ['d'],
    fullscreen: ['f'],
    width: ['w'],
    rtl: ['r'],
  },
};
