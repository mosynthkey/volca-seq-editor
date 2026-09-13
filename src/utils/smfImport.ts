import { createSequenceNote, type SequenceNote } from '@/types/sequence';

interface SmfEvent {
  tick: number;
  type: 'noteOn' | 'noteOff';
  pitch: number;
  velocity: number;
}

const readVarLen = (bytes: Uint8Array, offset: { value: number }) => {
  let value = 0;
  while (offset.value < bytes.length) {
    const byte = bytes[offset.value++];
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) break;
  }
  return value;
};

export const parseSmf = (buffer: ArrayBuffer): { ticksPerQuarter: number; events: SmfEvent[] } => {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 14 || String.fromCharCode(...bytes.slice(0, 4)) !== 'MThd') {
    throw new Error('Invalid SMF: missing MThd');
  }
  const ticksPerQuarter = (bytes[12] << 8) | bytes[13];
  const events: SmfEvent[] = [];
  let cursor = 14;

  while (cursor + 8 <= bytes.length) {
    const chunkType = String.fromCharCode(...bytes.slice(cursor, cursor + 4));
    const chunkSize = (bytes[cursor + 4] << 24) | (bytes[cursor + 5] << 16) | (bytes[cursor + 6] << 8) | bytes[cursor + 7];
    cursor += 8;
    if (chunkType !== 'MTrk') {
      cursor += chunkSize;
      continue;
    }
    const trackEnd = cursor + chunkSize;
    let tick = 0;
    let runningStatus = 0;
    const offset = { value: cursor };
    while (offset.value < trackEnd) {
      tick += readVarLen(bytes, offset);
      let status = bytes[offset.value];
      if (status >= 0x80) {
        runningStatus = status;
        offset.value++;
      } else {
        status = runningStatus;
      }
      const type = status & 0xf0;
      if (type === 0x90 || type === 0x80) {
        const pitch = bytes[offset.value++] & 0x7f;
        const velocity = bytes[offset.value++] & 0x7f;
        const noteOn = type === 0x90 && velocity > 0;
        events.push({
          tick,
          type: noteOn ? 'noteOn' : 'noteOff',
          pitch,
          velocity: noteOn ? velocity : 0,
        });
      } else if (type === 0xc0 || type === 0xd0) {
        offset.value += 1;
      } else if (status === 0xff) {
        offset.value += 1;
        const length = readVarLen(bytes, offset);
        offset.value += length;
      } else if (status === 0xf0 || status === 0xf7) {
        const length = readVarLen(bytes, offset);
        offset.value += length;
      } else {
        offset.value += 2;
      }
    }
    cursor = trackEnd;
  }

  return { ticksPerQuarter, events };
};

/** Map SMF events onto a 16-step grid (default 4 steps per quarter = 16th notes). */
export const extractStepNotes = (
  events: SmfEvent[],
  ticksPerQuarter: number,
  stepsPerBeat = 4,
  barOffset = 0,
): SequenceNote[] => {
  const ticksPerStep = ticksPerQuarter / stepsPerBeat;
  const patternTicks = ticksPerStep * 16;
  const startTick = barOffset * patternTicks;
  const active = new Map<number, { startTick: number; velocity: number }>();
  const notes: SequenceNote[] = [];

  const close = (pitch: number, endTick: number) => {
    const open = active.get(pitch);
    if (!open) return;
    active.delete(pitch);
    const localStart = open.startTick - startTick;
    if (localStart < 0 || localStart >= patternTicks) return;
    const startStep = Math.min(15, Math.floor(localStart / ticksPerStep));
    const duration = Math.max(1, endTick - open.startTick);
    const length = Math.max(1, Math.min(16 - startStep, Math.ceil(duration / ticksPerStep)));
    notes.push(createSequenceNote(pitch, startStep, length, open.velocity, 80));
  };

  for (const event of events) {
    if (event.type === 'noteOn') {
      if (active.has(event.pitch)) close(event.pitch, event.tick);
      active.set(event.pitch, { startTick: event.tick, velocity: event.velocity });
    } else {
      close(event.pitch, event.tick);
    }
  }
  for (const pitch of [...active.keys()]) close(pitch, startTick + patternTicks);

  return notes;
};
