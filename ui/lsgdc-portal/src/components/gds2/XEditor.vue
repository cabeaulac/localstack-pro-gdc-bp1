<template>
  <div
    class="editor"
  >
    <editor-content
      class="editor-content"
      :editor="editor"
      :class="editorContentClass"
      @click="editor?.chain().focus().run()"
    />
    <div
      v-if="editor" class="editor-toolbar"
      :class="editorToolbarClass"
      @click="editor.chain().focus().run()"
    >
      <slot :editor="editor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {useEditor, EditorContent} from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import {Placeholder} from '@tiptap/extension-placeholder';
import {computed, onBeforeUnmount, watch} from 'vue';

interface Props {
  modelValue: string | null;
  buttons?: ('bold' | 'italic' | '@')[];

  placeholder?: string;
  editorContentClass?: string;
  editorToolbarClass?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'editor', 'focused']);

const value = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  }
});

const editor = useEditor({
  content: props.modelValue,
  onUpdate: () => {
    emit('update:modelValue', editor.value?.getHTML());
  },
  onFocus: () => {
    emit('focused', true);
  },
  onBlur: () => {
    emit('focused', false);
  },
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder || ''
    })
  ],
});

emit('editor', editor);

watch(value, () => {
  // HTML
  const isSame = editor.value?.getHTML() === value.value;

  // JSON
  // const isSame = JSON.stringify(this.editor.getJSON()) === JSON.stringify(value)

  if (isSame) {
    return;
  }

  editor.value?.commands.setContent(value.value, false);
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>
