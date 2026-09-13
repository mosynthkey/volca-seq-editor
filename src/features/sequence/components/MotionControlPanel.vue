<template>
  <div class="volca-inline-panel" style="margin:0 12px 12px;padding:10px 12px;border:1px solid var(--volca-line);border-radius:10px;background:rgba(18,24,29,.45)">
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:end">
      <v-select
        v-model="patternKey"
        :items="patternItems"
        :label="t('sequence.pattern')"
        density="compact"
        hide-details
        style="max-width:160px"
      />
      <v-text-field v-model.number="minValue" :label="t('sequence.min')" type="number" min="0" max="127" density="compact" hide-details style="max-width:90px" />
      <v-text-field v-model.number="maxValue" :label="t('sequence.max')" type="number" min="0" max="127" density="compact" hide-details style="max-width:90px" />
      <v-text-field v-model.number="cycles" :label="t('sequence.cycles')" type="number" min="1" max="8" density="compact" hide-details style="max-width:90px" />
      <v-text-field v-model.number="offset" :label="t('sequence.offset')" type="number" min="0" max="15" density="compact" hide-details style="max-width:90px" />
      <v-btn color="secondary" :title="t('sequence.applyPattern')" @click="apply">
        <Sparkles :size="16" class="btn-icon" />
        {{ t('sequence.applyPattern') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sparkles } from '@lucide/vue'
import { useSequencerStore } from '@/stores/sequencerStore'
import { MOTION_PATTERN_KEYS, type MotionPatternKey } from '@/utils/motionPatterns'

const { t } = useI18n()
const sequence = useSequencerStore()
const patternKey = ref<MotionPatternKey>('sine')
const minValue = ref(0)
const maxValue = ref(127)
const cycles = ref(1)
const offset = ref(0)

const patternItems = computed(() =>
  MOTION_PATTERN_KEYS.map(key => ({ title: t(`motionPatterns.${key}`), value: key })))

const apply = () => {
  sequence.applyMotionPattern(patternKey.value, {
    min: minValue.value,
    max: maxValue.value,
    cycles: cycles.value,
    offset: offset.value,
  })
}
</script>

<style scoped>
.btn-icon {
  margin-right: 6px;
  flex-shrink: 0;
}
</style>
