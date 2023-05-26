<template>
  <button
    v-if="type === 'bold'"
    class="btn btn-borderless btn-sm btn-square text-ui-700"
    :disabled="!editor.can().chain().focus().toggleBold().run()"
    :class="{ 'is-active text-ui-900 bg-primary-100': editor.isActive('bold') }"
    @click="editor.chain().focus().toggleBold().run()"
  >
    <span class="material-symbols-outlined text-xl">
      format_bold
    </span>
  </button>
  <button
    v-else-if="type === 'italic'"
    class="btn btn-borderless btn-sm btn-square text-ui-700"
    :disabled="!editor.can().chain().focus().toggleItalic().run()"
    :class="{ 'is-active text-ui-900 bg-primary-100': editor.isActive('italic') }"
    @click="editor.chain().focus().toggleItalic().run()"
  >
    <span class="material-symbols-outlined text-xl">
      format_italic
    </span>
  </button>
  <button
    v-else-if="type === '@'"
    class="btn btn-borderless btn-sm btn-square text-ui-700"
  >
    <span class="material-symbols-outlined text-lg">
      alternate_email
    </span>
  </button>
</template>

<script setup lang="ts">
import {Editor} from '@tiptap/vue-3';

interface Props {
  editor: Editor;
  type: 'bold' | 'italic' | '@';
}

defineProps<Props>();
</script>

<style scoped>

</style>
