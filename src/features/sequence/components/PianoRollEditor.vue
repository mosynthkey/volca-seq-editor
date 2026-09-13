<template>
  <div class="roll" @keydown="onKey" tabindex="0">
    <div class="roll-header">
      <div class="pitch-gutter header-gutter">
        <button type="button" class="flag on" style="width:auto;padding:2px 6px;border-radius:4px" @click="sequence.applyShiftSteps(-1)">←</button>
        <button type="button" class="flag on" style="width:auto;padding:2px 6px;border-radius:4px" @click="sequence.applyShiftSteps(1)">→</button>
      </div>
      <div
        v-for="step in 16"
        :key="step"
        class="step-cell header-cell"
        :class="{ beat: (step - 1) % 4 === 0, muted: !sequence.stepOn[step - 1], skipped: !sequence.activeStep[step - 1] }"
        @pointerdown="startStepCopy(step - 1, $event)"
        @pointerenter="moveStepCopy(step - 1)"
        @pointerup="endStepCopy"
      >
        {{ step }}
      </div>
    </div>

    <div class="roll-row step-flags">
      <div class="pitch-gutter">{{ t('sequence.stepOn') }}</div>
      <div v-for="step in 16" :key="step" class="step-cell flag-cell" :class="{ beat: (step - 1) % 4 === 0 }">
        <button
          type="button"
          class="flag sound"
          :class="{ on: sequence.stepOn[step - 1] }"
          @click="sequence.toggleStepOn(step - 1)"
        />
      </div>
    </div>

    <div class="roll-row step-flags">
      <div class="pitch-gutter">{{ t('sequence.activeStep') }}</div>
      <div v-for="step in 16" :key="step" class="step-cell flag-cell" :class="{ beat: (step - 1) % 4 === 0 }">
        <button
          type="button"
          class="flag"
          :class="{ on: sequence.activeStep[step - 1] }"
          @click="sequence.toggleActiveStep(step - 1)"
        />
      </div>
    </div>

    <div v-if="sequence.device === 'bass'" class="roll-row step-flags">
      <div class="pitch-gutter">{{ t('sequence.slide') }}</div>
      <div v-for="step in 16" :key="step" class="step-cell flag-cell" :class="{ beat: (step - 1) % 4 === 0 }">
        <button
          type="button"
          class="flag"
          :class="{ on: sequence.slideStep[step - 1] }"
          @click="sequence.toggleSlideStep(step - 1)"
        />
      </div>
    </div>

    <div ref="rollBody" class="roll-body" @pointerleave="endDrag">
      <div
        v-for="pitch in pitches"
        :key="pitch"
        class="roll-row"
      >
        <div class="pitch-gutter" :class="{ 'black-key': isBlackKey(pitch) }">{{ noteLabel(pitch) }}</div>
        <div
          v-for="step in 16"
          :key="step"
          class="step-cell note-cell"
          :class="cellClass(step - 1, pitch)"
          @pointerdown="onCellDown(step - 1, pitch, $event)"
          @contextmenu.prevent="onContext(step - 1, pitch)"
        >
          <span v-if="isNoteStart(step - 1, pitch)" class="note-cell__label">
            {{ sequence.noteAt(step - 1, pitch)?.velocity }}
          </span>
          <span
            v-if="isNoteEnd(step - 1, pitch)"
            class="note-resize-handle"
            @pointerdown.stop="startResize(step - 1, pitch, $event)"
          />
        </div>
      </div>
    </div>

    <div class="roll-row motion-row">
      <div class="pitch-gutter" style="flex-direction:column;align-items:stretch;gap:4px;padding:6px 8px">
        <span>{{ t('sequence.motion') }}</span>
        <v-select
          v-model="sequence.motionIndex"
          :items="motionItems"
          item-title="label"
          item-value="value"
          density="compact"
          hide-details
          variant="underlined"
        />
        <div style="display:flex;gap:6px;align-items:center">
          <v-checkbox
            v-model="sequence.motionEnabled[sequence.motionIndex]"
            density="compact"
            hide-details
            :label="t('sequence.motionEnable')"
          />
          <v-btn size="x-small" variant="text" @click="sequence.clearMotionParam(sequence.motionIndex)">
            {{ t('sequence.motionClear') }}
          </v-btn>
        </div>
      </div>
      <div
        v-for="step in 16"
        :key="step"
        class="step-cell motion-col"
        :class="{ beat: (step - 1) % 4 === 0, off: !sequence.motionStepEnabled[sequence.motionIndex][step - 1] }"
        @pointerdown="paintMotion(step - 1, $event)"
        @pointermove="dragMotion(step - 1, $event)"
        @pointerup="motionDragging = false"
      >
        <template v-if="sequence.func.motionSmooth">
          <div
            v-for="point in 5"
            :key="point"
            class="motion-fill point"
            :style="{
              height: `${(sequence.motionValues[sequence.motionIndex][step - 1][point - 1] / 127) * 100}%`,
              left: `${(point - 1) * 20}%`,
              width: '20%',
            }"
          />
        </template>
        <div
          v-else
          class="motion-fill"
          :style="{ height: `${(sequence.motionValues[sequence.motionIndex][step - 1][0] / 127) * 100}%` }"
        />
        <span class="motion-value">{{ sequence.motionValues[sequence.motionIndex][step - 1][0] }}</span>
      </div>
    </div>

    <div class="roll-row step-flags">
      <div class="pitch-gutter">{{ t('sequence.motionStep') }}</div>
      <div v-for="step in 16" :key="step" class="step-cell flag-cell" :class="{ beat: (step - 1) % 4 === 0 }">
        <button
          type="button"
          class="flag"
          :class="{ on: sequence.motionStepEnabled[sequence.motionIndex][step - 1] }"
          @click="sequence.toggleMotionStep(sequence.motionIndex, step - 1)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSequencerStore } from '@/stores/sequencerStore'
import type { SequenceNote } from '@/types/sequence'

const { t } = useI18n()
const sequence = useSequencerStore()
const openEuclid = inject<(note: SequenceNote) => void>('openEuclid')

const ALL_PITCHES = Array.from({ length: 49 }, (_, pitchIndex) => 84 - pitchIndex)
const pitches = ALL_PITCHES
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const isBlackKey = (pitch: number) => [1, 3, 6, 8, 10].includes(pitch % 12)
const noteLabel = (pitch: number) => `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`

const motionItems = computed(() =>
  sequence.profile.motionParams.map((param, paramIndex) => ({
    label: `${t(`motionParams.${param.key}`)} (CC${param.cc})`,
    value: paramIndex,
  })))

const rollBody = ref<HTMLElement | null>(null)
const stepCopy = ref<{ from: number; to: number } | null>(null)
const drag = ref<{ kind: 'move' | 'resize'; pitch: number; step: number; originStep: number } | null>(null)
const motionDragging = ref(false)

const cellClass = (step: number, pitch: number) => {
  const note = sequence.noteAt(step, pitch)
  return {
    beat: step % 4 === 0,
    'has-note': Boolean(note),
    start: note?.startStep === step,
    selected: note ? sequence.isNoteSelected(note) : false,
  }
}

const isNoteStart = (step: number, pitch: number) => sequence.noteAt(step, pitch)?.startStep === step
const isNoteEnd = (step: number, pitch: number) => {
  const note = sequence.noteAt(step, pitch)
  return Boolean(note && note.startStep + note.length - 1 === step)
}

const onCellDown = (step: number, pitch: number, event: PointerEvent) => {
  const existing = sequence.noteAt(step, pitch)
  if (existing) {
    sequence.selectNote(existing, event.shiftKey)
    drag.value = { kind: 'move', pitch, step, originStep: existing.startStep }
    ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
    return
  }
  sequence.addNote(pitch, step, 1)
  const created = sequence.noteAt(step, pitch)
  if (created) sequence.selectNote(created)
}

const startResize = (step: number, pitch: number, event: PointerEvent) => {
  const note = sequence.noteAt(step, pitch)
  if (!note) return
  sequence.selectNote(note)
  drag.value = { kind: 'resize', pitch, step, originStep: note.startStep }
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}

const endDrag = () => { drag.value = null }

const onContext = (step: number, pitch: number) => {
  const note = sequence.noteAt(step, pitch)
  if (note && openEuclid) openEuclid(note)
}

const startStepCopy = (step: number, event: PointerEvent) => {
  stepCopy.value = { from: step, to: step }
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}

const moveStepCopy = (step: number) => {
  if (stepCopy.value) stepCopy.value.to = step
}

const endStepCopy = () => {
  if (stepCopy.value && stepCopy.value.from !== stepCopy.value.to) {
    sequence.applyCopyStep(stepCopy.value.from, stepCopy.value.to)
  }
  stepCopy.value = null
}

const paintMotion = (step: number, event: PointerEvent) => {
  motionDragging.value = true
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
  const value = Math.round(ratio * 127)
  if (sequence.func.motionSmooth) {
    const point = Math.min(4, Math.floor(((event.clientX - rect.left) / rect.width) * 5))
    sequence.setMotionValue(sequence.motionIndex, step, point, value)
  } else {
    sequence.setMotionValue(sequence.motionIndex, step, 0, value)
  }
}

const dragMotion = (step: number, event: PointerEvent) => {
  if (motionDragging.value) paintMotion(step, event)
}

const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    sequence.removeSelectedNotes()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    sequence.moveSelectedNotes(event.shiftKey ? 12 : 1, 0)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    sequence.moveSelectedNotes(event.shiftKey ? -12 : -1, 0)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    sequence.moveSelectedNotes(0, -1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    sequence.moveSelectedNotes(0, 1)
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) sequence.redo()
    else sequence.undo()
  }
}

onMounted(() => {
  const body = rollBody.value
  if (body) body.scrollTop = 12 * 20
})
</script>
