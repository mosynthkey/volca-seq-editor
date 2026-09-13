<template>
  <v-app :theme="sequence.device">
    <div class="app-shell" :data-device="sequence.device">
      <header class="app-header">
        <div class="app-brand">
          <h1 class="app-brand__title">{{ t('app.title') }}</h1>
          <p class="app-brand__sub">{{ t('app.subtitle') }}</p>
        </div>

        <span class="device-chip" aria-hidden="true">
          <span class="device-chip__dot" />
          {{ sequence.device === 'keys' ? 'KEYS' : 'BASS' }}
        </span>

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

        <v-btn size="small" variant="tonal" color="primary" :title="t('midi.connect')" @click="midi.initialize()">
          <Cable :size="16" class="btn-icon" />
          {{ t('midi.connect') }}
        </v-btn>

        <v-spacer />

        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              variant="text"
              size="small"
              :aria-label="t('common.language')"
              :title="t('common.language')"
            >
              <Globe :size="18" />
            </v-btn>
          </template>
          <v-list density="compact" min-width="140">
            <v-list-item
              v-for="option in localeItems"
              :key="option.value"
              :title="option.title"
              :active="locale === option.value"
              @click="locale = option.value"
            />
          </v-list>
        </v-menu>
      </header>

      <main class="app-main">
        <section class="panel">
          <SequencerTab />
        </section>
        <aside class="side-panel">
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
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { Cable, Globe } from '@lucide/vue'
import { setAppLocale } from '@/i18n'
import { useMidiStore } from '@/stores/midiStore'
import { useSequencerStore } from '@/stores/sequencerStore'
import SequencerTab from '@/features/sequence/components/SequencerTab.vue'
import LibraryPanel from '@/components/LibraryPanel.vue'
import type { DeviceModel } from '@/types/sequence'

const { t, locale: i18nLocale } = useI18n()
const theme = useTheme()
const midi = useMidiStore()
const sequence = useSequencerStore()

const deviceItems = [
  { title: 'volca keys', value: 'keys' },
  { title: 'volca bass', value: 'bass' },
]

const localeItems = [
  { title: '日本語', value: 'ja' as const },
  { title: 'English', value: 'en' as const },
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

watch(() => sequence.device, device => {
  theme.change(device)
  document.documentElement.dataset.device = device
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) {
    themeColor.setAttribute('content', device === 'keys' ? '#1a1613' : '#141516')
  }
}, { immediate: true })

onMounted(() => {
  midi.initialize()
})
</script>

<style scoped>
.btn-icon {
  margin-right: 6px;
  flex-shrink: 0;
}
</style>
