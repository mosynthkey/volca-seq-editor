<template>
  <button
    class="app-toggle"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="ariaLabel ?? t('common.toggle')"
    :disabled="disabled"
    :class="{ on: modelValue }"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="app-toggle__state">{{ modelValue ? t('common.on') : t('common.off') }}</span>
    <span class="app-toggle__thumb" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
withDefaults(defineProps<{
  modelValue: boolean
  ariaLabel?: string
  disabled?: boolean
}>(), {
  ariaLabel: undefined,
  disabled: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<style scoped>
.app-toggle {
  position: relative;
  width: 50px;
  height: 50px;
  min-width: 50px;
  min-height: 50px;
  max-width: 50px;
  max-height: 50px;
  align-self: center;
  flex: 0 0 50px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--volca-muted);
  cursor: pointer;
}
.app-toggle::before {
  position: absolute;
  inset: 8px 0;
  border: 1px solid var(--volca-line);
  border-radius: 9px;
  background: var(--volca-sunken);
  content: '';
  transition: background 0.16s ease, border-color 0.16s ease;
}
.app-toggle:hover::before {
  border-color: var(--volca-line-strong);
}
.app-toggle:focus-visible {
  outline: 2px solid var(--volca-accent);
  outline-offset: 2px;
}
.app-toggle:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
.app-toggle__state {
  position: absolute;
  top: 50%;
  right: 5px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}
.app-toggle__thumb {
  position: absolute;
  top: 16px;
  left: 4px;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--volca-muted) 70%, #000);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.32);
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.16s ease;
}
.app-toggle.on {
  color: var(--volca-text);
}
.app-toggle.on::before {
  border-color: var(--volca-accent);
  background: var(--volca-accent-soft);
}
.app-toggle.on .app-toggle__state {
  right: auto;
  left: 5px;
}
.app-toggle.on .app-toggle__thumb {
  transform: translateX(24px);
  background: var(--volca-accent-bright);
}
</style>
