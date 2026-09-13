<template>
  <v-dialog :model-value="modelValue" max-width="360" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ t('sequence.euclid') }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model.number="pulses"
          :label="t('sequence.pulses')"
          type="number"
          min="1"
          max="16"
          density="compact"
        />
        <p v-if="sourceNote" class="text-medium-emphasis">
          {{ sourceNote.pitch }} @ step {{ sourceNote.startStep + 1 }}
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">{{ t('common.cancel') }}</v-btn>
        <v-btn color="primary" @click="apply">{{ t('common.ok') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SequenceNote } from '@/types/sequence'

const props = defineProps<{
  modelValue: boolean
  sourceNote: SequenceNote | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  apply: [pulses: number]
}>()

const { t } = useI18n()
const pulses = ref(4)

watch(() => props.modelValue, open => {
  if (open) pulses.value = 4
})

const apply = () => {
  emit('apply', pulses.value)
  emit('update:modelValue', false)
}
</script>
