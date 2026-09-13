type Log = (message: string) => void;

export class MidiTransport {
  access: MIDIAccess | null = null;
  private stateChangeListener: ((event: Event) => void) | null = null;

  constructor(private readonly log: Log) {}

  async initialize() {
    await this.release();
    // SysEx not required for keys/bass (no SysEx in MIDI chart), but request it for future-proofing.
    this.access = await navigator.requestMIDIAccess({ sysex: false });
    return this.access;
  }

  async release() {
    this.unbindStateChange();
    const access = this.access;
    this.access = null;
    if (!access) return;
    for (const port of [...access.inputs.values(), ...access.outputs.values()]) {
      if (port.type === 'input') (port as MIDIInput).onmidimessage = null;
      try {
        await port.close();
      } catch {
        /* ignore */
      }
    }
  }

  bindStateChange(onStateChange: (port: MIDIPort) => void) {
    this.unbindStateChange();
    if (!this.access) return;
    this.stateChangeListener = (event: Event) => {
      const port = (event as MIDIConnectionEvent).port;
      if (port) onStateChange(port);
    };
    this.access.addEventListener('statechange', this.stateChangeListener);
  }

  unbindStateChange() {
    if (this.access && this.stateChangeListener) {
      this.access.removeEventListener('statechange', this.stateChangeListener);
    }
    this.stateChangeListener = null;
  }

  inputNames() {
    return this.access
      ? [...this.access.inputs.values()].map(port => port.name ?? '').filter(Boolean)
      : [];
  }

  outputNames() {
    return this.access
      ? [...this.access.outputs.values()].map(port => port.name ?? '').filter(Boolean)
      : [];
  }

  send(outputName: string | null, bytes: Uint8Array | number[]) {
    if (!outputName || !this.access) return false;
    const output = [...this.access.outputs.values()].find(candidate => candidate.name === outputName);
    if (!output) return false;
    const payload = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
    this.log(`TX → "${output.name}": ${formatMidiBytes(payload)}`);
    output.send(payload);
    return true;
  }

  sendAt(outputName: string | null, bytes: Uint8Array | number[], timestamp: number) {
    if (!outputName || !this.access) return false;
    const output = [...this.access.outputs.values()].find(candidate => candidate.name === outputName);
    if (!output) return false;
    const payload = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
    output.send(payload, timestamp);
    return true;
  }
}

export function formatMidiBytes(bytes: Uint8Array | number[], limit = 24) {
  const content = Array.from(bytes).slice(0, limit).map(byte => byte.toString(16).padStart(2, '0')).join(' ');
  return bytes.length > limit ? `${content} ... (${bytes.length} bytes)` : `${content} (${bytes.length} bytes)`;
}
