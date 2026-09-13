# MIDI / SysEx notes for volca keys & bass

Sources: KORG official MIDI Implementation Charts (2013.06.10).

## System Exclusive

Both **volca keys** and **volca bass** list System Exclusive as empty (not transmitted, not recognized).
There is no public sequence dump / program dump SysEx comparable to volca fm2 (`F0 42 3n 00 01 2F …`).

## Ports

Hardware has **MIDI In only** (no MIDI Out / Thru). Editors cannot request dumps from the device.

## Transfer strategy used by this app

Write patterns into the hardware sequencer via **REAL TIME REC**:

1. User arms REC on the device (and enables motion record if desired).
2. App sends `Start (FA)`, then 24-PPQN `Clock (F8)` while emitting `Note On/Off` and optional `CC`.
3. App sends `Stop (FC)` after the configured number of loops.

Global prerequisites on the hardware:

- MIDI Clock Src = **Auto**
- MIDI RX ShortMessage = **On**

## Control Change maps

### volca keys

| CC | Parameter | Motion-recordable on hardware |
|----|-----------|-------------------------------|
| 5 | Portamento | yes |
| 11 | Expression | MIDI-only |
| 40 | Voice | no (Voice/Octave/Peak not motion) |
| 41 | Octave | no |
| 42 | Detune | yes |
| 43 | VCO EG Int | yes |
| 44 | Cutoff | yes |
| 45 | VCF EG Int | yes |
| 46 | LFO Rate | yes |
| 47 | LFO Pitch Int | yes |
| 48 | LFO Cutoff Int | yes |
| 49 | EG Attack | yes |
| 50 | EG Decay/Release | yes |
| 51 | EG Sustain | yes |
| 52 | Delay Time | yes |
| 53 | Delay Feedback | yes |

Peak (resonance) is neither MIDI CC nor motion-recordable.

### volca bass

| CC | Parameter | Notes |
|----|-----------|-------|
| 5 | Slide Time | MIDI-only panel equivalent |
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
This editor keeps three lanes for authoring convenience; REAL TIME REC transmits the selected lane as notes and can send VCO Pitch CCs for motion.
