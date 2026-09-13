<template>
  <div class="flux-lane">
    <div class="pitch-gutter" style="min-height:48px">
      {{ t('sequence.flux') }} · {{ t('sequence.fluxTick') }}
    </div>
    <div class="flux-ticks">
      <div
        v-for="tick in MIDI_CLOCKS_PER_PATTERN"
        :key="tick"
        class="flux-tick"
        :class="{
          on: occupiedTicks.has(tick - 1),
          'step-start': (tick - 1) % MIDI_CLOCKS_PER_STEP === 0,
        }"
        :title="`tick ${tick - 1}`"
        @click="nudgeSelected(tick - 1)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSequencerStore } from '@/stores/sequencerStore'
import { MIDI_CLOCKS_PER_PATTERN, MIDI_CLOCKS_PER_STEP, noteAbsoluteTick } from '@/types/sequence'

const { t } = useI18n()
const sequence = useSequencerStore()

const occupiedTicks = computed(() => {
  const ticks = new Set<number>()
  for (const note of sequence.visibleNotes) {
    ticks.add(noteAbsoluteTick(note))
  }
  return ticks
})

const selectedNote = computed(() => {
  const key = sequence.selectedNoteKeys[0]
  if (!key) return null
  return sequence.notes.find(note =>
    note.pitch === key.pitch && note.startStep === key.startStep) ?? null
})

const nudgeSelected = (tick: number) => {
  const note = selectedNote.value
  if (!note) return
  sequence.moveNoteToTick(note, tick)
}
</script>
