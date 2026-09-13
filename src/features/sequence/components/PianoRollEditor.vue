<template>
  <div class="roll" @keydown="onKey" tabindex="0">
    <div class="roll-header">
      <div class="pitch-gutter header-gutter" />
      <div
        v-for="step in 16"
        :key="step"
        class="step-cell header-cell"
        :class="{ beat: (step - 1) % 4 === 0, muted: !sequence.stepOn[step - 1] }"
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

    <div
      ref="rollBody"
      class="roll-body"
      :class="{
        'is-moving': drag?.kind === 'move',
        'is-resizing': drag?.kind === 'resize',
        'is-marquee': drag?.kind === 'marquee',
      }"
      @pointerdown="rollDown"
      @pointermove="rollMove"
      @pointerup="rollUp"
      @pointercancel="rollUp"
    >
      <div v-if="marqueeStyle" class="note-marquee" :style="marqueeStyle" />
      <div
        v-for="pitch in pitches"
        :key="pitch"
        class="roll-row"
        @contextmenu.prevent="onContext(pitch, $event)"
      >
        <div class="pitch-gutter" :class="{ 'black-key': isBlackKey(pitch) }">{{ noteLabel(pitch) }}</div>
        <div
          v-for="step in 16"
          :key="step"
          class="step-cell note-cell"
          :class="cellClass(step - 1, pitch)"
        >
          <span
            v-if="isNoteEnd(step - 1, pitch)"
            class="note-resize-handle"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSequencerStore } from '@/stores/sequencerStore'
import type { SequenceNote } from '@/types/sequence'
import {
  notesIntersectingRect,
  type NoteKey,
} from '@/utils/sequenceNoteEditing'

const { t } = useI18n()
const sequence = useSequencerStore()
const openEuclid = inject<(note: SequenceNote) => void>('openEuclid')

const ALL_PITCHES = Array.from({ length: 49 }, (_, pitchIndex) => 84 - pitchIndex)
const pitches = ALL_PITCHES
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_ROW_HEIGHT = 22
const GUTTER_WIDTH = 160
const RESIZE_HANDLE = 10
const CLICK_SLOP = 4

const isBlackKey = (pitch: number) => [1, 3, 6, 8, 10].includes(pitch % 12)
const noteLabel = (pitch: number) => `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`

const rollBody = ref<HTMLElement | null>(null)
const stepCopy = ref<{ from: number; to: number } | null>(null)

type NoteKeySnap = { pitch: number; startStep: number }
type RollDrag =
  | { kind: 'resize'; key: NoteKey; end: number; originX: number; originY: number; dragged: boolean }
  | {
    kind: 'move'
    originPitch: number
    originStep: number
    dPitch: number
    dStep: number
    originX: number
    originY: number
    dragged: boolean
  }
  | {
    kind: 'marquee'
    startStep: number
    startPitch: number
    endStep: number
    endPitch: number
    additive: boolean
    base: NoteKeySnap[]
  }

const drag = ref<RollDrag | null>(null)

const cellClass = (step: number, pitch: number) => {
  const note = sequence.noteAt(step, pitch)
  const state = drag.value
  const previewHide = note
    && sequence.isNoteSelected(note)
    && (
      (state?.kind === 'move' && (state.dPitch !== 0 || state.dStep !== 0))
      || (state?.kind === 'resize' && resizePreview.value.length > 0)
    )
  const previewHit = notePreview.value.some(item =>
    item.pitch === pitch
    && item.startStep <= step
    && item.startStep + item.length - 1 >= step)
  return {
    beat: step % 4 === 0,
    'has-note': (Boolean(note) && !previewHide) || previewHit,
    start: previewHit
      ? notePreview.value.some(item => item.pitch === pitch && item.startStep === step)
      : note?.startStep === step,
    selected: note && !previewHide ? sequence.isNoteSelected(note) : false,
    preview: previewHit,
  }
}

const isNoteEnd = (step: number, pitch: number) => {
  const preview = notePreview.value.find(item =>
    item.pitch === pitch
    && item.startStep <= step
    && item.startStep + item.length - 1 >= step)
  if (preview) return step === preview.startStep + preview.length - 1
  const note = sequence.noteAt(step, pitch)
  return Boolean(note && note.startStep + note.length - 1 === step)
}

const sameKey = (left: NoteKeySnap, right: NoteKeySnap) =>
  left.pitch === right.pitch && left.startStep === right.startStep

const markDragged = (state: RollDrag, event: PointerEvent) => {
  if (state.kind === 'marquee' || state.dragged) return
  if (Math.hypot(event.clientX - state.originX, event.clientY - state.originY) >= CLICK_SLOP) {
    state.dragged = true
  }
}

const hitRoll = (event: PointerEvent | MouseEvent) => {
  const body = rollBody.value
  if (!body) return null
  const rect = body.getBoundingClientRect()
  const x = event.clientX - rect.left
  if (x < GUTTER_WIDTH) return null
  const y = event.clientY - rect.top + body.scrollTop
  const pitch = pitches[Math.floor(y / NOTE_ROW_HEIGHT)]
  if (pitch === undefined) return null
  const cellWidth = (rect.width - GUTTER_WIDTH) / 16
  const step = Math.min(15, Math.max(0, Math.floor((x - GUTTER_WIDTH) / cellWidth)))
  const localX = (x - GUTTER_WIDTH) - step * cellWidth
  return { pitch, step, localX, cellWidth }
}

const applyMarqueeSelection = (state: Extract<RollDrag, { kind: 'marquee' }>) => {
  const picked = notesIntersectingRect(
    sequence.notes,
    state.startStep,
    state.startPitch,
    state.endStep,
    state.endPitch,
  ).map(note => ({ pitch: note.pitch, startStep: note.startStep }))
  if (!state.additive) {
    sequence.setNoteSelection(picked)
    return
  }
  const extra = picked.filter(key => !state.base.some(item => sameKey(item, key)))
  sequence.setNoteSelection([...state.base, ...extra])
}

const rollDown = (event: PointerEvent) => {
  if (event.button !== 0) return
  const hit = hitRoll(event)
  if (!hit) return
  event.preventDefault()
  const existing = sequence.noteAt(hit.step, hit.pitch)
  if (existing) {
    if (event.shiftKey) {
      sequence.selectNote(existing, true)
      return
    }
    const lastStep = existing.startStep + existing.length - 1
    const onHandle = !!(event.target as HTMLElement).closest('.note-resize-handle')
    const resize = hit.step === lastStep && (onHandle || hit.localX >= hit.cellWidth - RESIZE_HANDLE)
    if (!sequence.isNoteSelected(existing)) sequence.selectNote(existing)
    drag.value = resize
      ? {
        kind: 'resize',
        key: { pitch: existing.pitch, startStep: existing.startStep },
        end: lastStep,
        originX: event.clientX,
        originY: event.clientY,
        dragged: false,
      }
      : {
        kind: 'move',
        originPitch: hit.pitch,
        originStep: hit.step,
        dPitch: 0,
        dStep: 0,
        originX: event.clientX,
        originY: event.clientY,
        dragged: false,
      }
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    return
  }
  const additive = event.shiftKey
  drag.value = {
    kind: 'marquee',
    startStep: hit.step,
    startPitch: hit.pitch,
    endStep: hit.step,
    endPitch: hit.pitch,
    additive,
    base: additive
      ? sequence.selectedNoteKeys.map(key => ({ pitch: key.pitch, startStep: key.startStep }))
      : [],
  }
  applyMarqueeSelection(drag.value)
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

const rollMove = (event: PointerEvent) => {
  const state = drag.value
  if (!state) return
  markDragged(state, event)
  const hit = hitRoll(event)
  if (!hit) return
  if (state.kind === 'resize') {
    state.end = Math.max(state.key.startStep, hit.step)
  } else if (state.kind === 'move') {
    state.dPitch = hit.pitch - state.originPitch
    state.dStep = hit.step - state.originStep
  } else {
    state.endStep = hit.step
    state.endPitch = hit.pitch
    applyMarqueeSelection(state)
  }
}

const rollUp = (event: PointerEvent) => {
  const state = drag.value
  drag.value = null
  if (!state) return
  markDragged(state, event)
  if (state.kind === 'resize') {
    const note = sequence.notes.find(item =>
      item.pitch === state.key.pitch && item.startStep === state.key.startStep)
    const nextLength = state.end - state.key.startStep + 1
    if (note && nextLength !== note.length) {
      sequence.resizeNote(state.key, nextLength)
      return
    }
    if (note && !state.dragged && event.type === 'pointerup') {
      sequence.removeNote(note)
    }
    return
  }
  if (state.kind === 'move') {
    if (state.dPitch || state.dStep) {
      sequence.moveSelectedNotes(state.dPitch, state.dStep)
      return
    }
    const note = sequence.noteAt(state.originStep, state.originPitch)
    if (note && !state.dragged && event.type === 'pointerup') {
      sequence.removeNote(note)
    }
    return
  }
  const sameCell = state.startStep === state.endStep && state.startPitch === state.endPitch
  if (sameCell && !state.additive && event.type === 'pointerup') {
    if (sequence.addNote(state.startPitch, state.startStep, 1)) {
      const created = sequence.noteAt(state.startStep, state.startPitch)
      if (created) sequence.selectNote(created)
    }
  }
}

const movePreview = computed(() => {
  const state = drag.value
  if (state?.kind !== 'move' || (!state.dPitch && !state.dStep)) return [] as SequenceNote[]
  const keySet = new Set(sequence.selectedNoteKeys.map(key => `${key.pitch}:${key.startStep}`))
  return sequence.notes
    .filter(note => keySet.has(`${note.pitch}:${note.startStep}`))
    .map(note => ({
      ...note,
      pitch: Math.max(0, Math.min(127, note.pitch + state.dPitch)),
      startStep: ((note.startStep + state.dStep) % 16 + 16) % 16,
      length: Math.min(note.length, 16 - (((note.startStep + state.dStep) % 16 + 16) % 16)),
    }))
})

const resizePreview = computed(() => {
  const state = drag.value
  if (state?.kind !== 'resize') return [] as SequenceNote[]
  const origin = sequence.notes.find(item =>
    item.pitch === state.key.pitch && item.startStep === state.key.startStep)
  if (!origin) return []
  const nextLength = state.end - state.key.startStep + 1
  if (nextLength === origin.length) return []
  const keys = sequence.selectedNoteKeys.some(item =>
    item.pitch === state.key.pitch && item.startStep === state.key.startStep)
    ? sequence.selectedNoteKeys
    : [state.key]
  const keySet = new Set(keys.map(key => `${key.pitch}:${key.startStep}`))
  return sequence.notes
    .filter(note => keySet.has(`${note.pitch}:${note.startStep}`))
    .map(note => ({
      ...note,
      length: Math.max(1, Math.min(16 - note.startStep, note.length + (nextLength - origin.length))),
    }))
})

const notePreview = computed(() =>
  movePreview.value.length ? movePreview.value : resizePreview.value)

const marqueeStyle = computed(() => {
  const state = drag.value
  const body = rollBody.value
  if (state?.kind !== 'marquee' || !body) return null
  if (state.startStep === state.endStep && state.startPitch === state.endPitch) return null
  const pitchA = pitches.indexOf(state.startPitch)
  const pitchB = pitches.indexOf(state.endPitch)
  if (pitchA < 0 || pitchB < 0) return null
  const cellWidth = (body.clientWidth - GUTTER_WIDTH) / 16
  const stepMin = Math.min(state.startStep, state.endStep)
  const stepMax = Math.max(state.startStep, state.endStep)
  const pitchMin = Math.min(pitchA, pitchB)
  const pitchMax = Math.max(pitchA, pitchB)
  return {
    left: `${GUTTER_WIDTH + stepMin * cellWidth}px`,
    top: `${pitchMin * NOTE_ROW_HEIGHT}px`,
    width: `${(stepMax - stepMin + 1) * cellWidth}px`,
    height: `${(pitchMax - pitchMin + 1) * NOTE_ROW_HEIGHT}px`,
  }
})

const onContext = (pitch: number, event: MouseEvent) => {
  const hit = hitRoll(event)
  if (!hit || hit.pitch !== pitch) return
  const note = sequence.noteAt(hit.step, hit.pitch)
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
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
    event.preventDefault()
    sequence.setNoteSelection(sequence.notes.map(note => ({
      pitch: note.pitch,
      startStep: note.startStep,
    })))
  } else if (event.key === 'Escape') {
    sequence.clearNoteSelection()
  }
}

onMounted(() => {
  const body = rollBody.value
  if (body) body.scrollTop = 12 * NOTE_ROW_HEIGHT
})
</script>
