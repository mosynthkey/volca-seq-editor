# MIDI / SysEx notes for volca keys & bass

Sources: KORG official MIDI Implementation Charts (2013.06.10).

## System Exclusive

Both **volca keys** and **volca bass** list System Exclusive as empty (not transmitted, not recognized).
There is no public sequence dump / program dump SysEx comparable to volca fm2 (`F0 42 3n 00 01 2F …`).

## Ports

Hardware has **MIDI In only** (no MIDI Out / Thru). Editors cannot request dumps from the device.

## Transfer strategy used by this app

Write patterns into the hardware sequencer via **REAL TIME REC**:

1. User arms REC on the device.
2. App sends `Start (FA)`, then 24-PPQN `Clock (F8)` while emitting `Note On/Off`.
3. App sends `Stop (FC)` after the configured number of loops.

What can be written via MIDI REAL TIME REC:

- Notes (pitch, timing; fixed velocity; length via Note Off)
- MIDI Clock / Start / Stop
- Keys Flux fine timing (`tickOffset`) when Flux is ON on the device

What **cannot** be written via MIDI (hardware-only):

- Motion sequence / Motion On / Smooth
- Active Step
- Bass per-step Slide
- Tempo division FUNC
- Independent Bass oscillator lanes (MIDI Note drives currently enabled VCOs together)

Global prerequisites on the hardware:

- MIDI Clock Src = **Auto**
- MIDI RX ShortMessage = **On**
- Keys Flux: enable **Flux** on the device if using tick offsets

## Control Change maps (reference only)

CC messages can change live sound parameters, but they are **not** stored into the sequencer via REAL TIME REC in this app. Charts below are kept for documentation.

### volca keys

| CC | Parameter | Notes |
|----|-----------|-------|
| 5 | Portamento | |
| 11 | Expression | MIDI-only |
| 40 | Voice | |
| 41 | Octave | |
| 42 | Detune | |
| 43 | VCO EG Int | |
| 44 | Cutoff | |
| 45 | VCF EG Int | |
| 46 | LFO Rate | |
| 47 | LFO Pitch Int | |
| 48 | LFO Cutoff Int | |
| 49 | EG Attack | |
| 50 | EG Decay/Release | |
| 51 | EG Sustain | |
| 52 | Delay Time | |
| 53 | Delay Feedback | |

Peak (resonance) is neither MIDI CC nor motion-recordable.

### volca bass

| CC | Parameter | Notes |
|----|-----------|-------|
| 5 | Slide Time | MIDI-only panel equivalent (not per-step Slide) |
| 11 | Expression | MIDI-only |
| 40 | Octave | front-panel keyboard octave; limited effect on MIDI notes |
| 41 | LFO Rate | |
| 42 | LFO Int | |
| 43–45 | VCO Pitch 1–3 | relative pitch offsets, not independent note streams |
| 46 | EG Attack | |
| 47 | EG Decay/Release | |
| 48 | Cutoff EG Int | |
| 49 | Gate Time | MIDI-only |

Cutoff and Peak are **not** MIDI-addressable.

## Oscillator routing (bass)

The hardware sequencer can program three VCO parts independently.
**MIDI Note messages cannot target individual oscillators**; a Note On drives the currently enabled VCOs together.
This editor therefore does **not** expose fictional oscillator lanes.
