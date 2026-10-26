from pathlib import Path
from PIL import Image
import subprocess,json,tempfile,shutil,argparse
parser=argparse.ArgumentParser();parser.add_argument('species',choices=['cat','rabbit']);species=parser.parse_args().species
root=Path(__file__).resolve().parents[1];frames=root/f'docs/rest-{species}/frames'
points=[0,1,3,5,6,7,10,14,15,22,30,37,44,45,47,48,50,52,54,56]
canvas=Image.new('RGB',(1280,1120),'#F7F2E9')
for i,frame in enumerate(points):
 im=Image.open(frames/f'{frame:02}.png').convert('RGB');im.thumbnail((256,280));canvas.paste(im,((i%5)*256,(i//5)*280))
canvas.save(root/f'docs/rest-{species}/{species}-rest-contact.jpg',quality=94)
for name,cycles in [('preview',3),('30s',15)]:
 folder=Path(tempfile.mkdtemp(prefix=f'pennykin-rest-{name}-'))
 sequence=list(range(15))+list(range(15,45))*cycles+list(range(45,57))
 for i,f in enumerate(sequence):
  link=folder/f'{i:04}.png'
  if not link.exists():
   try:link.symlink_to(frames/f'{f:02}.png')
   except OSError:shutil.copyfile(frames/f'{f:02}.png',link)
 target=root/f'docs/rest-{species}/{species}-rest-{name}.mp4'
 cmd=['ffmpeg','-y','-loglevel','error','-framerate','15','-i',str(folder/'%04d.png')]
 if name=='preview':
  cmd+=['-i',str(root/'assets/audio/rest-wake.wav'),'-filter_complex','[1:a]volume=0.3,adelay=7000|7000,apad[a]','-map','0:v','-map','[a]','-c:a','aac']
 cmd+=['-t',str(len(sequence)/15),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(target)]
 subprocess.run(cmd,check=True)
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_type,r_frame_rate,duration,nb_frames','-of','json',str(target)]))
 video=next(s for s in info['streams'] if s['codec_type']=='video')
 assert int(video['nb_frames'])==len(sequence);assert abs(float(video['duration'])-len(sequence)/15)<.001;assert video['r_frame_rate']=='15/1'
 (root/f'docs/rest-{species}/video-{name}-check.json').write_text(json.dumps(info,indent=2))
 shutil.rmtree(folder)
 print(name,len(sequence),'frames;',len(sequence)/15,'seconds; PASS')
