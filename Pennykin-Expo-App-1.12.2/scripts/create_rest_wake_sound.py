"""Reproduce the original soft synthesized Rest wake-up sound."""
from pathlib import Path
import math
import struct
import wave

output = Path(__file__).resolve().parents[1] / 'assets/audio/rest-wake.wav'
rate, duration = 22050, 0.56
phase, samples = 0.0, []
for i in range(int(rate * duration)):
    t = i / rate
    u = t / duration
    frequency = 460 + 220 * math.sin(math.pi * u) - 270 * u
    phase += 2 * math.pi * frequency / rate
    envelope = min(1, t / 0.045) * min(1, (duration - t) / 0.14)
    wobble = 1 + 0.10 * math.sin(2 * math.pi * 24 * t)
    signal = 0.22 * envelope * wobble * (math.sin(phase) + 0.23 * math.sin(2 * phase) + 0.11 * math.sin(3 * phase))
    samples.append(struct.pack('<h', int(max(-1, min(1, signal)) * 32767)))
with wave.open(str(output), 'wb') as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(rate)
    audio.writeframes(b''.join(samples))
print(output)
