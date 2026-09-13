import {
  createSequenceNote,
  NUM_OF_STEPS,
  type SequenceNote,
} from '@/types/sequence';

export type NoteKey = { pitch: number; startStep: number; oscillatorLane?: number };

export const noteKeyOf = (note: Pick<SequenceNote, 'pitch' | 'startStep' | 'oscillatorLane'>) =>
  `${note.oscillatorLane ?? 0}:${note.pitch}:${note.startStep}`;

export const sameNoteKey = (left: NoteKey, right: NoteKey) =>
  left.pitch === right.pitch
  && left.startStep === right.startStep
  && (left.oscillatorLane ?? 0) === (right.oscillatorLane ?? 0);

const occupies = (note: SequenceNote, start: number, end: number) =>
  note.startStep <= end && note.startStep + note.length - 1 >= start;

export const notesIntersectingRect = (
  notes: SequenceNote[],
  stepA: number,
  pitchA: number,
  stepB: number,
  pitchB: number,
  oscillatorLane?: number,
): SequenceNote[] => {
  const stepMin = Math.min(stepA, stepB);
  const stepMax = Math.max(stepA, stepB);
  const pitchMin = Math.min(pitchA, pitchB);
  const pitchMax = Math.max(pitchA, pitchB);
  return notes.filter(note => {
    if (oscillatorLane !== undefined && note.oscillatorLane !== oscillatorLane) return false;
    const end = note.startStep + note.length - 1;
    return note.pitch >= pitchMin && note.pitch <= pitchMax
      && note.startStep <= stepMax && end >= stepMin;
  });
};

export const moveNotes = (
  notes: SequenceNote[],
  keys: NoteKey[],
  pitchDelta: number,
  stepDelta: number,
  maxVoices: number,
): SequenceNote[] | null => {
  if (!keys.length) return notes;
  const keySet = new Set(keys.map(key => noteKeyOf({
    pitch: key.pitch,
    startStep: key.startStep,
    oscillatorLane: key.oscillatorLane ?? 0,
  })));
  const moving = notes.filter(note => keySet.has(noteKeyOf(note)));
  if (!moving.length) return notes;

  const placements = moving.map(note => {
    const startStep = ((note.startStep + stepDelta) % NUM_OF_STEPS + NUM_OF_STEPS) % NUM_OF_STEPS;
    const length = Math.min(note.length, NUM_OF_STEPS - startStep);
    return createSequenceNote(
      Math.max(0, Math.min(127, note.pitch + pitchDelta)),
      startStep,
      length,
      note.velocity,
      note.gatePercent,
      note.tickOffset,
      note.oscillatorLane,
    );
  });

  let next = notes.filter(note => !keySet.has(noteKeyOf(note)));
  for (const placement of placements) {
    const end = placement.startStep + placement.length - 1;
    next = next.filter(note => !(
      note.pitch === placement.pitch
      && note.oscillatorLane === placement.oscillatorLane
      && occupies(note, placement.startStep, end)
    ));
  }
  for (const placement of placements) {
    for (let step = placement.startStep; step < placement.startStep + placement.length; step++) {
      const voices = next.filter(note =>
        note.oscillatorLane === placement.oscillatorLane
        && note.startStep <= step
        && note.startStep + note.length > step,
      ).length;
      if (voices >= maxVoices) return null;
    }
    next = [...next, placement];
  }
  return next;
};

export const resizeNotes = (
  notes: SequenceNote[],
  keys: NoteKey[],
  lengthDelta: number,
  maxVoices: number,
): SequenceNote[] | null => {
  if (!keys.length || !Math.round(lengthDelta)) return notes;
  const keySet = new Set(keys.map(key => noteKeyOf({
    pitch: key.pitch,
    startStep: key.startStep,
    oscillatorLane: key.oscillatorLane ?? 0,
  })));
  const resizing = notes.filter(note => keySet.has(noteKeyOf(note)));
  const resized = resizing.map(note => createSequenceNote(
    note.pitch,
    note.startStep,
    Math.max(1, Math.min(NUM_OF_STEPS - note.startStep, note.length + Math.round(lengthDelta))),
    note.velocity,
    note.gatePercent,
    note.tickOffset,
    note.oscillatorLane,
  ));
  let next = notes.filter(note => !keySet.has(noteKeyOf(note)));
  for (const note of resized) {
    for (let step = note.startStep; step < note.startStep + note.length; step++) {
      const voices = next.filter(candidate =>
        candidate.oscillatorLane === note.oscillatorLane
        && candidate.startStep <= step
        && candidate.startStep + candidate.length > step,
      ).length;
      if (voices >= maxVoices) return null;
    }
    next = [...next, note];
  }
  return next;
};
