<template>
  <div class="volca-inline-panel" style="margin:10px 12px 12px;padding:10px 12px;border:1px solid var(--volca-line);border-radius:10px;background:rgba(18,24,29,.45)">
    <div class="volca-groups" style="display:flex;flex-wrap:wrap;gap:16px">
      <div>
        <h4 class="volca-section-title">{{ t('sequence.velocity') }} / {{ t('sequence.gate') }}</h4>
        <div style="display:flex;gap:8px;margin-top:6px">
          <v-text-field v-model.number="sequence.velocity" type="number" min="1" max="127" density="compact" hide-details style="max-width:90px" :label="t('sequence.velocity')" />
          <v-text-field v-model.number="sequence.gatePercent" type="number" min="1" max="100" density="compact" hide-details style="max-width:90px" :label="t('sequence.gate')" />
        </div>
      </div>

      <div v-if="sequence.device === 'keys'">
        <h4 class="volca-section-title">{{ t('sequence.flux') }}</h4>
        <div class="flag-toggles">
          <div class="flag-toggle">
            <span>{{ t('sequence.flux') }}</span>
            <AppToggle v-model="sequence.func.flux" :aria-label="t('sequence.flux')" />
          </div>
        </div>
      </div>

      <div v-if="sequence.device === 'keys' && sequence.func.flux">
        <h4 class="volca-section-title">{{ t('sequence.fluxDivision') }}</h4>
        <v-btn-toggle v-model="sequence.fluxDivision" mandatory density="compact" color="secondary" class="mt-1">
          <v-btn :value="1" size="small">1</v-btn>
          <v-btn :value="2" size="small">2</v-btn>
          <v-btn :value="3" size="small">3</v-btn>
          <v-btn :value="6" size="small">6</v-btn>
        </v-btn-toggle>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppToggle from '@/components/AppToggle.vue'
import { useSequencerStore } from '@/stores/sequencerStore'

const { t } = useI18n()
const sequence = useSequencerStore()
</script>

<style scoped>
.flag-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}
.flag-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--volca-muted);
  font-size: 11px;
}
</style>
