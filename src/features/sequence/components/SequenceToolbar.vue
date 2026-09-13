<template>
  <div class="editor-toolbar">
    <div class="toolbar-group">
      <v-text-field
        v-model="sequence.name"
        :label="t('sequence.name')"
        density="compact"
        hide-details
        style="max-width: 140px"
      />
      <v-text-field
        v-model.number="sequence.bpm"
        :label="t('midi.bpm')"
        type="number"
        min="10"
        max="600"
        density="compact"
        hide-details
        style="max-width: 88px"
      />
      <v-text-field
        v-model.number="sequence.midiChannel"
        :label="t('midi.channel')"
        type="number"
        min="1"
        max="16"
        density="compact"
        hide-details
        style="max-width: 72px"
      />
    </div>

    <div class="toolbar-group">
      <v-btn size="small" variant="tonal" @click="sequence.undo()">{{ t('common.undo') }}</v-btn>
      <v-btn size="small" variant="tonal" @click="sequence.redo()">{{ t('common.redo') }}</v-btn>
      <v-btn size="small" variant="tonal" @click="sequence.applyShiftSteps(-1)">{{ t('sequence.shiftLeft') }}</v-btn>
      <v-btn size="small" variant="tonal" @click="sequence.applyShiftSteps(1)">{{ t('sequence.shiftRight') }}</v-btn>
      <v-btn size="small" variant="tonal" color="error" @click="sequence.clearAll()">{{ t('sequence.clearAll') }}</v-btn>
    </div>

    <div class="toolbar-group">
      <v-btn size="small" variant="tonal" @click="pickSmf">{{ t('sequence.importSmf') }}</v-btn>
      <v-btn size="small" variant="tonal" @click="pickJson">{{ t('sequence.importJson') }}</v-btn>
      <v-btn size="small" variant="tonal" @click="sequence.exportJson()">{{ t('sequence.exportJson') }}</v-btn>
      <input ref="smfInput" type="file" accept=".mid,.midi,audio/midi" hidden @change="onSmf" />
      <input ref="jsonInput" type="file" accept="application/json,.json" hidden @change="onJson" />
    </div>

    <div class="toolbar-group" style="margin-left:auto">
      <v-btn
        color="primary"
        :disabled="midi.transferring"
        @click="openTransfer"
      >
        {{ t('sequence.transfer') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMidiStore } from '@/stores/midiStore'
import { useSequencerStore } from '@/stores/sequencerStore'

const { t } = useI18n()
const midi = useMidiStore()
const sequence = useSequencerStore()
const smfInput = ref<HTMLInputElement | null>(null)
const jsonInput = ref<HTMLInputElement | null>(null)

const pickSmf = () => smfInput.value?.click()
const pickJson = () => jsonInput.value?.click()
const openTransfer = () => {
  sequence.transferStatus = 'idle'
  sequence.transferProgress = 0
  sequence.transferError = null
  sequence.showTransferDialog = true
}

const onSmf = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) await sequence.importSmf(file)
  ;(event.target as HTMLInputElement).value = ''
}

const onJson = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) await sequence.importJson(file)
  ;(event.target as HTMLInputElement).value = ''
}
</script>
