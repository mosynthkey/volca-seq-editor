<template>
  <v-app>
    <div class="app-shell">
      <header class="app-header">
        <div class="app-brand">
          <h1 class="app-brand__title">{{ t('app.title') }}</h1>
          <p class="app-brand__sub">{{ t('app.subtitle') }}</p>
        </div>

        <v-select
          v-model="deviceModel"
          :items="deviceItems"
          :label="t('device.label')"
          density="compact"
          hide-details
          style="max-width: 180px"
        />

        <v-select
          v-model="midi.selectedOutput"
          :items="midi.outputNames"
          :label="t('midi.output')"
          density="compact"
          hide-details
          clearable
          style="max-width: 260px"
        />

        <v-btn size="small" variant="tonal" @click="midi.initialize()">
          {{ t('midi.connect') }}
        </v-btn>

        <v-spacer />

        <v-btn-toggle v-model="locale" mandatory density="compact" color="primary">
          <v-btn value="ja" size="small">JA</v-btn>
          <v-btn value="en" size="small">EN</v-btn>
        </v-btn-toggle>
      </header>

      <main class="app-main">
        <section class="panel">
          <SequencerTab />
        </section>
        <aside class="side-panel">
          <div class="panel side-card">
            <h3>MIDI / Device</h3>
            <p class="hint-banner" style="border: 0; padding: 0 0 8px">
              {{ t('sequence.sysexNone') }}
            </p>
            <p class="hint-banner" style="border: 0; padding: 0 0 8px">
              {{ t('sequence.midiOutNone') }}
            </p>
            <ul class="note-list">
              <li v-for="noteKey in sequence.profile.notes" :key="noteKey">
                {{ t(`notes.${noteKey}`) }}
              </li>
            </ul>
          </div>
          <LibraryPanel />
          <div class="panel side-card">
            <h3>Log</h3>
            <div class="log-panel">{{ midi.logs.slice(-30).join('\n') }}</div>
          </div>
        </aside>
      </main>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { setAppLocale } from '@/i18n'
import { useMidiStore } from '@/stores/midiStore'
import { useSequencerStore } from '@/stores/sequencerStore'
import SequencerTab from '@/features/sequence/components/SequencerTab.vue'
import LibraryPanel from '@/components/LibraryPanel.vue'
import type { DeviceModel } from '@/types/sequence'

const { t, locale: i18nLocale } = useI18n()
const midi = useMidiStore()
const sequence = useSequencerStore()

const deviceItems = [
  { title: 'volca keys', value: 'keys' },
  { title: 'volca bass', value: 'bass' },
]

const deviceModel = computed({
  get: () => sequence.device,
  set: (value: DeviceModel) => sequence.setDevice(value),
})

const locale = computed({
  get: () => i18nLocale.value as 'ja' | 'en',
  set: (value: 'ja' | 'en') => setAppLocale(value),
})

watch(locale, value => setAppLocale(value))

onMounted(() => {
  midi.initialize()
})
</script>
