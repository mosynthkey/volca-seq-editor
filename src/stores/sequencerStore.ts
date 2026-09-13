import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getDeviceProfile } from '@/midi/deviceProfiles';
import {
  buildRealtimeTransferEvents,
  countTransferSummary,
  tickToMs,
} from '@/midi/realtimeTransfer';
import {
  createEmptySequenceState,
  createMotionGrid,
  createMotionPoints,
  createMotionStepEnabled,
  normalizeSequenceState,
  resizeMotionForDevice,
} from '@/types/sequenceFactory';
import {
  createSequenceNote,
  MIDI_CLOCKS_PER_PATTERN,
  MIDI_CLOCKS_PER_STEP,
  NUM_OF_STEPS,
  type DeviceModel,
  type SequenceNote,
  type SequenceState,
} from '@/types/sequence';
import { createMotionPattern, type MotionPatternKey } from '@/utils/motionPatterns';
import {
  moveNotes,
  noteKeyOf,
  resizeNotes,
  sameNoteKey,
  type NoteKey,
} from '@/utils/sequenceNoteEditing';
import { clearSequenceStep, copyNotesEuclid, copySequenceStep, shiftSteps } from '@/utils/sequenceStepEditing';
import { extractStepNotes, parseSmf } from '@/utils/smfImport';
import { useMidiStore } from '@/stores/midiStore';

const HISTORY_LIMIT = 80;
const cloneState = (state: SequenceState) => JSON.parse(JSON.stringify(state)) as SequenceState;

export const useSequencerStore = defineStore('sequencer', () => {
  const initial = createEmptySequenceState('keys');
  const device = ref<DeviceModel>(initial.device);
  const name = ref(initial.name);
  const velocity = ref(initial.velocity);
  const gatePercent = ref(initial.gatePercent);
  const bpm = ref(initial.bpm);
  const midiChannel = ref(initial.midiChannel);
  const notes = ref<SequenceNote[]>(initial.notes);
  const motionEnabled = ref(initial.motionEnabled);
  const motionStepEnabled = ref(initial.motionStepEnabled);
  const motionValues = ref(initial.motionValues);
  const stepOn = ref(initial.stepOn);
  const activeStep = ref(initial.activeStep);
  const slideStep = ref(initial.slideStep);
  const func = ref(initial.func);
  const motionIndex = ref(0);
  const oscillatorLane = ref(0);
  const selectedNoteKeys = ref<NoteKey[]>([]);
  const fluxDivision = ref(1);
  const transferLoops = ref(1);
  const transferIncludeMotion = ref(true);
  const showTransferDialog = ref(false);
  const transferProgress = ref(0);
  const transferStatus = ref<'idle' | 'countdown' | 'sending' | 'done' | 'error'>('idle');
  const transferError = ref<string | null>(null);
  const transferSummary = ref('');

  const history = ref<SequenceState[]>([]);
  const historyIndex = ref(-1);
  let historyTimer: ReturnType<typeof setTimeout> | null = null;

  const profile = computed(() => getDeviceProfile(device.value));

  const toState = (): SequenceState => ({
    device: device.value,
    name: name.value,
    velocity: velocity.value,
    gatePercent: gatePercent.value,
    bpm: bpm.value,
    midiChannel: midiChannel.value,
    notes: notes.value,
    motionEnabled: motionEnabled.value,
    motionStepEnabled: motionStepEnabled.value,
    motionValues: motionValues.value,
    stepOn: stepOn.value,
    activeStep: activeStep.value,
    slideStep: slideStep.value,
    func: func.value,
  });

  const loadFromState = (state: SequenceState, recordHistory = true) => {
    const normalized = normalizeSequenceState(state, state.device);
    device.value = normalized.device;
    name.value = normalized.name;
    velocity.value = normalized.velocity;
    gatePercent.value = normalized.gatePercent;
    bpm.value = normalized.bpm;
    midiChannel.value = normalized.midiChannel;
    notes.value = normalized.notes;
    motionEnabled.value = normalized.motionEnabled;
    motionStepEnabled.value = normalized.motionStepEnabled;
    motionValues.value = normalized.motionValues;
    stepOn.value = normalized.stepOn;
    activeStep.value = normalized.activeStep;
    slideStep.value = normalized.slideStep;
    func.value = normalized.func;
    motionIndex.value = Math.min(motionIndex.value, Math.max(0, normalized.motionEnabled.length - 1));
    oscillatorLane.value = Math.min(oscillatorLane.value, Math.max(0, profile.value.oscillatorLanes - 1));
    if (recordHistory) commitHistory();
  };

  const commitHistory = () => {
    const snapshot = cloneState(toState());
    const truncated = history.value.slice(0, historyIndex.value + 1);
    truncated.push(snapshot);
    if (truncated.length > HISTORY_LIMIT) truncated.shift();
    history.value = truncated;
    historyIndex.value = truncated.length - 1;
  };

  const scheduleHistory = () => {
    if (historyTimer) clearTimeout(historyTimer);
    historyTimer = setTimeout(() => commitHistory(), 320);
  };

  const undo = () => {
    if (historyIndex.value <= 0) return;
    historyIndex.value -= 1;
    loadFromState(history.value[historyIndex.value], false);
  };

  const redo = () => {
    if (historyIndex.value >= history.value.length - 1) return;
    historyIndex.value += 1;
    loadFromState(history.value[historyIndex.value], false);
  };

  const setDevice = (next: DeviceModel) => {
    const resized = resizeMotionForDevice({ ...toState(), device: next }, next);
    loadFromState(resized);
  };

  const visibleNotes = computed(() =>
    notes.value.filter(note =>
      device.value !== 'bass' || note.oscillatorLane === oscillatorLane.value));

  const noteAt = (step: number, pitch: number) =>
    visibleNotes.value.find(note =>
      note.pitch === pitch
      && note.startStep <= step
      && note.startStep + note.length - 1 >= step);

  const clearNoteSelection = () => { selectedNoteKeys.value = []; };

  const setNoteSelection = (keys: NoteKey[]) => {
    selectedNoteKeys.value = keys.map(key => ({
      pitch: key.pitch,
      startStep: key.startStep,
      oscillatorLane: key.oscillatorLane ?? oscillatorLane.value,
    }));
  };

  const isNoteSelected = (note: Pick<SequenceNote, 'pitch' | 'startStep' | 'oscillatorLane'>) =>
    selectedNoteKeys.value.some(key => sameNoteKey(key, {
      pitch: note.pitch,
      startStep: note.startStep,
      oscillatorLane: note.oscillatorLane,
    }));

  const selectNote = (note: SequenceNote | null, additive = false) => {
    if (!note) {
      clearNoteSelection();
      return;
    }
    const key = {
      pitch: note.pitch,
      startStep: note.startStep,
      oscillatorLane: note.oscillatorLane,
    };
    if (additive) {
      const exists = selectedNoteKeys.value.some(item => sameNoteKey(item, key));
      setNoteSelection(exists
        ? selectedNoteKeys.value.filter(item => !sameNoteKey(item, key))
        : [...selectedNoteKeys.value, key]);
      return;
    }
    setNoteSelection([key]);
  };

  const addNote = (pitch: number, startStep: number, length = 1) => {
    const start = Math.max(0, Math.min(NUM_OF_STEPS - 1, startStep));
    const len = Math.max(1, Math.min(NUM_OF_STEPS - start, length));
    const lane = device.value === 'bass' ? oscillatorLane.value : 0;
    const withoutOverlap = notes.value.filter(note => !(
      note.pitch === pitch
      && note.oscillatorLane === lane
      && note.startStep <= start + len - 1
      && note.startStep + note.length - 1 >= start
    ));
    for (let step = start; step < start + len; step++) {
      const voices = withoutOverlap.filter(note =>
        note.oscillatorLane === lane
        && note.startStep <= step
        && note.startStep + note.length > step).length;
      if (voices >= profile.value.maxVoices) return false;
    }
    notes.value = [...withoutOverlap, createSequenceNote(
      pitch, start, len, velocity.value, gatePercent.value, 0, lane,
    )];
    scheduleHistory();
    return true;
  };

  const removeSelectedNotes = () => {
    if (!selectedNoteKeys.value.length) return;
    const keySet = new Set(selectedNoteKeys.value.map(key => noteKeyOf({
      pitch: key.pitch,
      startStep: key.startStep,
      oscillatorLane: key.oscillatorLane ?? 0,
    })));
    notes.value = notes.value.filter(note => !keySet.has(noteKeyOf(note)));
    clearNoteSelection();
    scheduleHistory();
  };

  const moveSelectedNotes = (pitchDelta: number, stepDelta: number) => {
    const next = moveNotes(notes.value, selectedNoteKeys.value, pitchDelta, stepDelta, profile.value.maxVoices);
    if (!next) return;
    notes.value = next;
    selectedNoteKeys.value = selectedNoteKeys.value.map(key => ({
      pitch: Math.max(0, Math.min(127, key.pitch + pitchDelta)),
      startStep: ((key.startStep + stepDelta) % NUM_OF_STEPS + NUM_OF_STEPS) % NUM_OF_STEPS,
      oscillatorLane: key.oscillatorLane,
    }));
    scheduleHistory();
  };

  const resizeSelectedNotes = (lengthDelta: number) => {
    const next = resizeNotes(notes.value, selectedNoteKeys.value, lengthDelta, profile.value.maxVoices);
    if (!next) return;
    notes.value = next;
    scheduleHistory();
  };

  const setTickOffset = (note: SequenceNote, tickOffset: number) => {
    const clamped = Math.max(0, Math.min(MIDI_CLOCKS_PER_STEP - 1, tickOffset));
    notes.value = notes.value.map(candidate =>
      sameNoteKey(
        { pitch: candidate.pitch, startStep: candidate.startStep, oscillatorLane: candidate.oscillatorLane },
        { pitch: note.pitch, startStep: note.startStep, oscillatorLane: note.oscillatorLane },
      )
        ? { ...candidate, tickOffset: clamped }
        : candidate);
    scheduleHistory();
  };

  const moveNoteToTick = (note: SequenceNote, absoluteTick: number) => {
    const tick = Math.max(0, Math.min(MIDI_CLOCKS_PER_PATTERN - 1, absoluteTick));
    const startStep = Math.floor(tick / MIDI_CLOCKS_PER_STEP);
    const tickOffset = tick % MIDI_CLOCKS_PER_STEP;
    notes.value = notes.value.map(candidate =>
      sameNoteKey(
        { pitch: candidate.pitch, startStep: candidate.startStep, oscillatorLane: candidate.oscillatorLane },
        { pitch: note.pitch, startStep: note.startStep, oscillatorLane: note.oscillatorLane },
      )
        ? createSequenceNote(
          candidate.pitch,
          startStep,
          Math.min(candidate.length, NUM_OF_STEPS - startStep),
          candidate.velocity,
          candidate.gatePercent,
          tickOffset,
          candidate.oscillatorLane,
        )
        : candidate);
    setNoteSelection([{ pitch: note.pitch, startStep, oscillatorLane: note.oscillatorLane }]);
    scheduleHistory();
  };

  const toggleStepOn = (step: number) => {
    stepOn.value[step] = !stepOn.value[step];
    scheduleHistory();
  };

  const toggleActiveStep = (step: number) => {
    const next = !activeStep.value[step];
    if (!next && activeStep.value.filter(Boolean).length <= 1) return;
    activeStep.value[step] = next;
    scheduleHistory();
  };

  const toggleSlideStep = (step: number) => {
    slideStep.value[step] = !slideStep.value[step];
    scheduleHistory();
  };

  const toggleMotionStep = (paramIndex: number, step: number) => {
    motionStepEnabled.value[paramIndex][step] = !motionStepEnabled.value[paramIndex][step];
    scheduleHistory();
  };

  const setMotionValue = (paramIndex: number, step: number, point: number, value: number) => {
    const points = [...motionValues.value[paramIndex][step]];
    points[point] = Math.max(0, Math.min(127, Math.round(value)));
    motionValues.value[paramIndex][step] = points;
    motionEnabled.value[paramIndex] = true;
    motionStepEnabled.value[paramIndex][step] = true;
    func.value = { ...func.value, motionOn: true };
    scheduleHistory();
  };

  const clearMotionParam = (paramIndex: number) => {
    motionEnabled.value[paramIndex] = false;
    motionValues.value[paramIndex] = createMotionGrid(device.value, 64)[paramIndex];
    motionStepEnabled.value[paramIndex] = createMotionStepEnabled(device.value, true)[paramIndex];
    scheduleHistory();
  };

  const applyMotionPattern = (
    key: MotionPatternKey,
    options: { min?: number; max?: number; cycles?: number; offset?: number } = {},
  ) => {
    const values = createMotionPattern(key, options);
    const paramIndex = motionIndex.value;
    motionEnabled.value[paramIndex] = true;
    func.value = { ...func.value, motionOn: true };
    for (let stepIndex = 0; stepIndex < NUM_OF_STEPS; stepIndex++) {
      motionValues.value[paramIndex][stepIndex] = createMotionPoints(values[stepIndex]);
      motionStepEnabled.value[paramIndex][stepIndex] = true;
    }
    scheduleHistory();
  };

  const clearAll = () => {
    loadFromState(createEmptySequenceState(device.value));
  };

  const applyClearStep = (step: number) => {
    loadFromState(clearSequenceStep(toState(), step));
  };

  const applyCopyStep = (fromStep: number, toStep: number) => {
    loadFromState(copySequenceStep(toState(), fromStep, toStep));
  };

  const applyEuclidNote = (source: SequenceNote, pulses: number) => {
    notes.value = copyNotesEuclid(notes.value, source, pulses);
    scheduleHistory();
  };

  const applyShiftSteps = (delta: number) => {
    loadFromState(shiftSteps(toState(), delta));
  };

  const importSmf = async (file: File, barOffset = 0) => {
    const buffer = await file.arrayBuffer();
    const parsed = parseSmf(buffer);
    const imported = extractStepNotes(parsed.events, parsed.ticksPerQuarter, 4, barOffset);
    notes.value = imported.map(note => ({
      ...note,
      oscillatorLane: device.value === 'bass' ? oscillatorLane.value : 0,
    }));
    scheduleHistory();
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(toState(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${name.value || 'volca-sequence'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    const text = await file.text();
    loadFromState(normalizeSequenceState(JSON.parse(text) as Partial<SequenceState>));
  };

  let transferTimer: ReturnType<typeof setTimeout> | null = null;

  const stopTransfer = () => {
    if (transferTimer) clearTimeout(transferTimer);
    transferTimer = null;
    const midi = useMidiStore();
    midi.send([0xfc]);
    for (let pitch = 0; pitch < 128; pitch++) {
      midi.send([0x80 | ((midiChannel.value - 1) & 0x0f), pitch, 0x40]);
    }
    midi.transferring = false;
    transferStatus.value = 'idle';
    transferProgress.value = 0;
  };

  const startRealtimeTransfer = async () => {
    const midi = useMidiStore();
    transferError.value = null;
    if (!midi.selectedOutput) {
      transferStatus.value = 'error';
      transferError.value = 'No MIDI output selected.';
      return;
    }
    const events = buildRealtimeTransferEvents(toState(), {
      loops: transferLoops.value,
      includeMotion: transferIncludeMotion.value,
      bassLane: oscillatorLane.value,
    });
    const summary = countTransferSummary(events);
    transferSummary.value = `${summary.noteOns} notes / ${summary.ccs} CC / ${summary.clocks} clocks`;
    transferStatus.value = 'countdown';
    transferProgress.value = 0;
    midi.transferring = true;
    showTransferDialog.value = true;

    await new Promise<void>(resolve => {
      transferTimer = setTimeout(() => resolve(), 1500);
    });
    if (!midi.transferring) return;

    transferStatus.value = 'sending';
    const startAt = performance.now() + 40;
    const lastTick = events[events.length - 1]?.tick ?? 0;

    for (const event of events) {
      const when = startAt + tickToMs(event.tick, bpm.value);
      midi.sendAt(event.bytes, when);
    }

    const durationMs = tickToMs(lastTick, bpm.value) + 50;
    const started = performance.now();
    const tickProgress = () => {
      if (!midi.transferring) return;
      transferProgress.value = Math.min(100, ((performance.now() - started) / durationMs) * 100);
      if (transferProgress.value >= 100) {
        midi.transferring = false;
        transferStatus.value = 'done';
        return;
      }
      transferTimer = setTimeout(tickProgress, 50);
    };
    tickProgress();
  };

  // Seed history
  commitHistory();

  return {
    device,
    name,
    velocity,
    gatePercent,
    bpm,
    midiChannel,
    notes,
    visibleNotes,
    motionEnabled,
    motionStepEnabled,
    motionValues,
    stepOn,
    activeStep,
    slideStep,
    func,
    motionIndex,
    oscillatorLane,
    selectedNoteKeys,
    fluxDivision,
    transferLoops,
    transferIncludeMotion,
    showTransferDialog,
    transferProgress,
    transferStatus,
    transferError,
    transferSummary,
    profile,
    toState,
    loadFromState,
    undo,
    redo,
    setDevice,
    noteAt,
    clearNoteSelection,
    setNoteSelection,
    isNoteSelected,
    selectNote,
    addNote,
    removeSelectedNotes,
    moveSelectedNotes,
    resizeSelectedNotes,
    setTickOffset,
    moveNoteToTick,
    toggleStepOn,
    toggleActiveStep,
    toggleSlideStep,
    toggleMotionStep,
    setMotionValue,
    clearMotionParam,
    applyMotionPattern,
    clearAll,
    applyClearStep,
    applyCopyStep,
    applyEuclidNote,
    applyShiftSteps,
    importSmf,
    exportJson,
    importJson,
    startRealtimeTransfer,
    stopTransfer,
  };
});
