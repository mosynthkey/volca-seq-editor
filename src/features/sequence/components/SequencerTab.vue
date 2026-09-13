<template>
  <SequenceToolbar />
  <PianoRollEditor />
  <FluxStepEditor v-if="sequence.device === 'keys' && sequence.func.flux" />
  <SequenceFuncPanel />
  <TransferDialog />
  <EuclidCopyDialog
    v-model="showEuclid"
    :source-note="euclidNote"
    @apply="onEuclidApply"
  />
  <v-dialog v-model="sequence.showRandomizeDialog" max-width="420">
    <v-card>
      <v-card-title>{{ t('sequence.randomizeTitle') }}</v-card-title>
      <v-card-text>
        <p>{{ t('sequence.randomizeDescription') }}</p>
        <label class="randomize-skip">
          <input v-model="dontShowRandomizeAgain" type="checkbox" />
          <span>{{ t('sequence.randomizeDontShowAgain') }}</span>
        </label>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="sequence.showRandomizeDialog = false">
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn color="primary" @click="sequence.confirmRandomize(dontShowRandomizeAgain)">
          {{ t('sequence.randomizeRun') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSequencerStore } from '@/stores/sequencerStore'
import type { SequenceNote } from '@/types/sequence'
import SequenceToolbar from './SequenceToolbar.vue'
import PianoRollEditor from './PianoRollEditor.vue'
import SequenceFuncPanel from './SequenceFuncPanel.vue'
import TransferDialog from './TransferDialog.vue'
import FluxStepEditor from './FluxStepEditor.vue'
import EuclidCopyDialog from './EuclidCopyDialog.vue'

const { t } = useI18n()
const sequence = useSequencerStore()
const showEuclid = ref(false)
const euclidNote = ref<SequenceNote | null>(null)
const dontShowRandomizeAgain = ref(false)

watch(() => sequence.showRandomizeDialog, open => {
  if (open) dontShowRandomizeAgain.value = false
})

const openEuclid = (note: SequenceNote) => {
  euclidNote.value = note
  showEuclid.value = true
}

const onEuclidApply = (pulses: number) => {
  if (euclidNote.value) sequence.applyEuclidNote(euclidNote.value, pulses)
}

provide('openEuclid', openEuclid)
</script>

<style scoped>
.randomize-skip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: var(--volca-muted);
  font-size: 13px;
  cursor: pointer;
}
</style>
