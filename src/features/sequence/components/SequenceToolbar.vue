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
      <v-btn size="small" variant="tonal" :title="t('common.undo')" @click="sequence.undo()">
        <Undo2 :size="16" class="btn-icon" />
        {{ t('common.undo') }}
      </v-btn>
      <v-btn size="small" variant="tonal" :title="t('common.redo')" @click="sequence.redo()">
        <Redo2 :size="16" class="btn-icon" />
        {{ t('common.redo') }}
      </v-btn>
      <v-btn size="small" variant="tonal" :title="t('sequence.shiftLeft')" @click="sequence.applyShiftSteps(-1)">
        <ChevronLeft :size="16" class="btn-icon" />
        {{ t('sequence.shiftLeft') }}
      </v-btn>
      <v-btn size="small" variant="tonal" :title="t('sequence.shiftRight')" @click="sequence.applyShiftSteps(1)">
        <ChevronRight :size="16" class="btn-icon" />
        {{ t('sequence.shiftRight') }}
      </v-btn>
      <div class="randomize-split">
        <v-btn
          size="small"
          variant="tonal"
          class="randomize-main"
          :title="t('sequence.randomize')"
          @click="sequence.requestRandomize()"
        >
          <Dices :size="16" class="btn-icon" />
          {{ t('sequence.randomize') }}
        </v-btn>
        <v-menu location="bottom end" offset="6">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              size="small"
              variant="tonal"
              class="randomize-menu-btn"
              :title="t('sequence.randomizeMore')"
              :aria-label="t('sequence.randomizeMore')"
            >
              <ChevronDown :size="14" />
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item
              :title="t('sequence.randomizeNotes')"
              @click="sequence.randomizeSteps(Math.random, 'notes')"
            />
            <v-list-item
              :title="t('sequence.reverseSequence')"
              @click="sequence.reverseSteps()"
            />
          </v-list>
        </v-menu>
      </div>
      <v-btn size="small" variant="tonal" color="error" :title="t('sequence.clearAll')" @click="sequence.clearAll()">
        <Trash2 :size="16" class="btn-icon" />
        {{ t('sequence.clearAll') }}
      </v-btn>
    </div>

    <div class="toolbar-group">
      <v-btn size="small" variant="tonal" :title="t('sequence.importSmf')" @click="pickSmf">
        <FileUp :size="16" class="btn-icon" />
        {{ t('sequence.importSmf') }}
      </v-btn>
      <v-btn size="small" variant="tonal" :title="t('sequence.importJson')" @click="pickJson">
        <FileInput :size="16" class="btn-icon" />
        {{ t('sequence.importJson') }}
      </v-btn>
      <v-btn size="small" variant="tonal" :title="t('sequence.exportJson')" @click="sequence.exportJson()">
        <Download :size="16" class="btn-icon" />
        {{ t('sequence.exportJson') }}
      </v-btn>
      <input ref="smfInput" type="file" accept=".mid,.midi,audio/midi" hidden @change="onSmf" />
      <input ref="jsonInput" type="file" accept="application/json,.json" hidden @change="onJson" />
    </div>

    <div class="toolbar-group" style="margin-left:auto">
      <v-btn
        color="primary"
        :disabled="midi.transferring"
        :title="t('sequence.transfer')"
        @click="openTransfer"
      >
        <HardDriveDownload :size="16" class="btn-icon" />
        {{ t('sequence.transfer') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dices,
  Download,
  FileInput,
  FileUp,
  HardDriveDownload,
  Redo2,
  Trash2,
  Undo2,
} from '@lucide/vue'
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

<style scoped>
.btn-icon {
  margin-right: 6px;
  flex-shrink: 0;
}

.randomize-split {
  display: inline-flex;
  align-items: stretch;
}

.randomize-split :deep(.randomize-main) {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.randomize-split :deep(.randomize-menu-btn) {
  min-width: 28px !important;
  padding: 0 4px !important;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  border-left: 0 !important;
}
</style>
