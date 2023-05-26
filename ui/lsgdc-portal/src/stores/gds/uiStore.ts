import {defineStore} from 'pinia';
import {type Ref, ref} from 'vue';

export const useUIStore = defineStore('ui', () => {
  const sidebarExpanded: Ref<boolean> = ref(true);

  const theme = ref(localStorage.theme || document.documentElement.attributes[1].value);
  const toggleTheme = () => {
    document.documentElement.classList.add('no-transition'); // Disable transitions

    //toggle theme
    document.documentElement.classList.remove(theme.value);
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.theme = theme.value;
    document.documentElement.classList.add(theme.value);

    document.documentElement.offsetHeight; // Trigger a reflow, flushing the CSS changes
    document.documentElement.classList.remove('no-transition'); // Enable transitions
  };

  return {
    sidebarExpanded,
    theme,
    toggleTheme,
  };
});
