<template>
  <SequenceToolbar />
  <p class="hint-banner">{{ t('sequence.transferHint') }}</p>
  <PianoRollEditor />
  <FluxStepEditor v-if="sequence.device === 'keys' && sequence.func.flux" />
  <SequenceFuncPanel />
  <TransferDialog />
  <EuclidCopyDialog
    v-model="showEuclid"
    :source-note="euclidNote"
    @apply="onEuclidApply"
  />
</template>

<script setup lang="ts">
import { provide, ref } from 'vue'
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

const openEuclid = (note: SequenceNote) => {
  euclidNote.value = note
  showEuclid.value = true
}

const onEuclidApply = (pulses: number) => {
  if (euclidNote.value) sequence.applyEuclidNote(euclidNote.value, pulses)
}

provide('openEuclid', openEuclid)
</script>
