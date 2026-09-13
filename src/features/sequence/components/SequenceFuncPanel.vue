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

      <div>
        <h4 class="volca-section-title">Flags</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
          <v-checkbox v-model="sequence.func.motionOn" :label="t('sequence.motionOn')" density="compact" hide-details />
          <v-checkbox v-model="sequence.func.motionSmooth" :label="t('sequence.motionSmooth')" density="compact" hide-details />
          <v-checkbox
            v-if="sequence.device === 'keys'"
            v-model="sequence.func.flux"
            :label="t('sequence.flux')"
            density="compact"
            hide-details
          />
          <v-checkbox
            v-if="sequence.device === 'bass'"
            v-model="sequence.func.slideEnabled"
            :label="t('sequence.slide')"
            density="compact"
            hide-details
          />
        </div>
      </div>

      <div>
        <h4 class="volca-section-title">{{ t('sequence.tempo') }}</h4>
        <v-btn-toggle v-model="sequence.func.tempo" mandatory density="compact" color="primary" class="mt-1">
          <v-btn :value="0" size="small">1/1</v-btn>
          <v-btn :value="1" size="small">1/2</v-btn>
          <v-btn :value="2" size="small">1/4</v-btn>
        </v-btn-toggle>
      </div>

      <div v-if="sequence.device === 'bass'">
        <h4 class="volca-section-title">{{ t('sequence.oscillator') }}</h4>
        <v-btn-toggle v-model="sequence.oscillatorLane" mandatory density="compact" color="secondary" class="mt-1">
          <v-btn :value="0" size="small">VCO1</v-btn>
          <v-btn :value="1" size="small">VCO2</v-btn>
          <v-btn :value="2" size="small">VCO3</v-btn>
        </v-btn-toggle>
        <p style="margin:6px 0 0;color:var(--volca-muted);font-size:11px;max-width:280px">
          {{ t('sequence.oscillatorHint') }}
        </p>
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
import { useSequencerStore } from '@/stores/sequencerStore'

const { t } = useI18n()
const sequence = useSequencerStore()
</script>
