"""Original five-second, 15fps bath foley, stdlib only."""
import math,random,wave,struct
from pathlib import Path
RATE=22050;rng=random.Random(75);samples=[0.]*(RATE*5)
def tone(start,freq,duration=.16,gain=.13):
 for i in range(int(RATE*duration)):
  t=i/RATE;index=int(start*RATE)+i
  if index<len(samples):samples[index]+=gain*math.sin(2*math.pi*freq*t)*math.exp(-t*22)*min(1,t*120)
for t,f in [(.4,1046),(37/15,460),(55/15,520),(70/15,1046),(71/15,1318),(72/15,1568)]:tone(t,f)
for start,duration,gain in [(.47,.55,.04),(63/15,.15,.10),(66/15,.15,.10)]:
 for i in range(int(RATE*duration)):
  t=i/RATE;samples[int(start*RATE)+i]+=gain*rng.uniform(-1,1)*math.sin(math.pi*t/duration)**2
out=Path(__file__).resolve().parents[1]/'assets/audio/bath.wav'
with wave.open(str(out),'wb') as wav:
 wav.setparams((1,2,RATE,0,'NONE','not compressed'))
 wav.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*32767)) for v in samples))
