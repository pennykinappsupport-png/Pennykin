"""5s/75f bath using unchanged original PNG bytes and native masks/rigs.
No character is redrawn; base, blink and mouth images are the shipped artwork.
"""
from pathlib import Path
import base64,copy,hashlib,json,math
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/animation/bath-original';OUT.mkdir(exist_ok=True)
def prop(v):return {'a':0,'k':v}
def anim(points):
 keys=[]
 for t,v in points:
  keys.append({'t':t,'s':v if isinstance(v,list) else [v],'o':{'x':[.33],'y':[0]},'i':{'x':[.67],'y':[1]}})
 return {'a':1,'k':keys}
def tr(p=[0,0,0],a=[0,0,0],r=0,s=[100,100,100],o=100):
 return {k:v if isinstance(v,dict) else prop(v) for k,v in dict(p=p,a=a,r=r,s=s,o=o).items()}
def polygon(v):return {'v':v,'i':[[0,0]]*len(v),'o':[[0,0]]*len(v),'c':True}
def ellipse(cx,cy,rx,ry):
 k=.55228475
 return {'v':[[cx,cy-ry],[cx+rx,cy],[cx,cy+ry],[cx-rx,cy]],
 'i':[[-rx*k,0],[0,-ry*k],[rx*k,0],[0,ry*k]],'o':[[rx*k,0],[0,ry*k],[-rx*k,0],[0,-ry*k]],'c':True}
def mask(shape,mode='a'):
 return {'inv':False,'mode':mode,'pt':prop(shape),'o':prop(100),'x':prop(0)}
CFG={
 'dog':{
  'head':[[0,0],[600,0],[600,298],[510,300],[484,321],[442,338],[390,347],[335,345],[290,337],[273,334],[258,365],[217,379],[180,375],[150,350],[128,315],[0,315]],
  'ears':[
   [[128,250],[163,206],[210,163],[254,146],[272,169],[263,220],[253,263],[277,300],[265,344],[239,373],[207,383],[170,371],[144,336]],
   [[390,104],[388,70],[418,21],[463,27],[511,55],[553,89],[572,124],[558,145],[520,165],[476,167],[421,146]]],
  'earPivots':[[260,185,0],[410,115,0]],'headPivot':[350,340,0],
  'tail':[[0,420],[85,445],[140,465],[189,507],[198,570],[160,620],[15,620]],'tailPivot':[158,529,0],
  'eyes':[[322,234,48,44],[424,185,48,43]],'mouth':[399,273,59,51],'mouthShift':[-5,0],
  'foamBody':[345,635,0],'foamHead':[355,200,0],
 },
 'cat':{
  'head':[[0,0],[600,0],[600,280],[500,280],[477,309],[450,330],[416,342],[370,351],[325,357],[280,364],[250,370],[235,400],[205,420],[0,420]],
  'ears':[[[100,100],[235,118],[290,170],[260,260],[168,285],[105,195]],[[305,165],[318,90],[375,0],[435,50],[462,160],[415,187]]],
  'earPivots':[[247,177,0],[373,149,0]],'headPivot':[345,355,0],
  'tail':[[0,300],[150,310],[208,365],[230,450],[210,580],[170,620],[80,603],[0,470]],'tailPivot':[195,535,0],
  'eyes':[[296,267,51,46],[407,219,49,45]],'mouth':[369,302,55,42],'mouthShift':[-6,2],
  'foamBody':[330,650,0],'foamHead':[330,185,0],
  'neckPatch':[330,421,25,20],'neckPosition':[335,360,0],'neckScale':[230,240,100],
  'tailSwing':9,'earPerk':7,'earShake':10,
 },
 'rabbit':{
  'head':[[0,0],[600,0],[600,280],[490,280],[478,316],[464,336],[440,348],[415,360],[380,369],[340,374],[300,376],[265,371],[235,390],[219,420],[205,455],[174,490],[130,520],[0,540]],
  'ears':[[[234,207],[120,210],[0,300],[0,540],[180,540],[220,440],[230,370],[228,310],[252,249]],[[295,163],[293,88],[351,0],[478,0],[580,75],[600,188],[519,203],[440,127],[420,132],[410,182],[356,209]]],
  'earPivots':[[240,245,0],[368,175,0]],'headPivot':[350,378,0],
  'tail':[[447,320],[480,296],[531,297],[570,330],[578,395],[548,425],[515,423],[491,403],[478,384],[465,368],[451,362]],'tailPivot':[485,385,0],
  'eyes':[[278,298,46,45],[386,255,46,44]],'mouth':[350,322,48,42],'mouthShift':[12,3],
  'foamBody':[365,640,0],'foamHead':[355,170,0],
  'neckPatch':[300,453,20,25],'neckPosition':[343,373,0],'neckScale':[260,210,100],
  'tailSwing':5,'earPerk':4,'earShake':8,
 }
}
TEMPLATE=json.loads((ROOT/'assets/animation/bath-effects.json').read_text())
manifest={}
for species,c in CFG.items():
 swing=c.get('tailSwing',12);perk=c.get('earPerk',8);shake=c.get('earShake',15)
 original=json.loads((ROOT/'docs/bath-v4/timeline.json').read_text())
 layers=[];assets=[];hashes={}
 for name,source in [('base',f'assets/pets/{species}.png'),('blink',f'assets/pets/{species}-blink.png'),('mouth',f'assets/animation/{species}-eat.png')]:
  data=(ROOT/source).read_bytes();hashes[name]=hashlib.sha256(data).hexdigest()
  assets.append({'id':name,'w':600,'h':640,'u':'','p':'data:image/png;base64,'+base64.b64encode(data).decode(),'e':1})
 def add(idx,name,ty=3,parent=None,**kw):
  l={'ddd':0,'ind':idx,'ty':ty,'nm':name,'sr':1,'ks':tr(**kw),'ao':0,'ip':0,'op':75,'st':0,'bm':0}
  if parent:l['parent']=parent
  layers.append(l);return l
 def image(idx,name,asset,parent,masks,**kw):
  l=add(idx,name,2,parent,**kw);l['refId']=asset;l['masksProperties']=masks;l['hasMask']=True;return l
 head=polygon(c['head']);ears=[polygon(v) for v in c['ears']];tail=polygon(c['tail'])
 body=add(1001,'BODY • original floor pivot',p=anim([(0,[512,845,0]),(3,[512,845,0]),(5,[508,835,0]),(7,[512,845,0]),(10,[512,855,0]),(12,[512,845,0]),(60,[512,845,0]),(62,[512,858,0]),(64,[512,845,0]),(75,[512,845,0])]),a=[300,600,0],r=anim(original['bodyDegrees']),s=anim([(0,[100,100,100]),(4,[102,96,100]),(7,[100,100,100]),(60,[100,100,100]),(62,[108,89,100]),(64,[100,100,100]),(68,[103,97,100]),(70,[99,101,100]),(72,[100,100,100])]))
 add(1002,'HEAD • original neck pivot ±60°',parent=1001,p=c['headPivot'],a=c['headPivot'],r=anim(original['headDegrees']))
 add(1003,'TAIL • original fur',parent=1001,p=c['tailPivot'],a=c['tailPivot'],r=anim([(0,0),(3,swing*7/12),(7,0),(25,0),(31,-swing),(37,swing*10/12),(42,0),(43,0),(49,-swing),(55,swing*10/12),(60,0),(64,-swing),(68,swing*10/12),(71,0)]))
 for i,pivot in enumerate(c['earPivots']):
  side=-1 if i==0 else 1
  add(1004+i,f'EAR {i} • original pixels',parent=1002,p=pivot,a=pivot,r=anim([(0,0),(1,-side*perk),(3,-side*perk),(6,0),(62,0),(63,side*shake),(65,-side*shake*2/3),(67,side*shake*14/15),(69,-side*shake*.4),(71,0)]))
 # Native masks only: original visible source pixels are never repainted.
 image(1101,'Original tail','base',1003,[mask(tail)])
 image(1102,'Original body • head/tail excluded','base',1001,[mask(polygon([[0,0],[600,0],[600,640],[0,640]])),mask(head,'s'),mask(tail,'s')])
 # A cached chest-fur patch appears only during extreme head turns, behind
 # the head. It fills the previously occluded neck without inventing artwork.
 nx,ny,nrx,nry=c.get('neckPatch',[383,431,28,19])
 patch=ellipse(nx,ny,nrx,nry)
 image(1103,'Occluded neck • original chest texture','base',1001,[mask(patch)],p=c.get('neckPosition',[352,348,0]),a=[nx,ny,0],s=c.get('neckScale',[250,300,100]),o=anim([(0,0),(60,0),(62,100),(68,100),(70,0),(75,0)]))
 image(1104,'Original head • ears excluded','base',1002,[mask(head),mask(tail,'s'),*[mask(e,'s') for e in ears]])
 for i,e in enumerate(ears):image(1105+i,f'Original ear {i}','base',1004+i,[mask(e),mask(head,'i'),mask(tail,'s')])
 image(1107,'Original closed-eye expression','blink',1002,[mask(ellipse(*eye)) for eye in c['eyes']],o=anim([(0,0),(7,0),(8,100),(69,100),(70,0),(75,0)]))
 x,y,rx,ry=c['mouth'];dx,dy=c['mouthShift']
 image(1108,'Original happy mouth','mouth',1002,[mask(ellipse(x-dx,y-dy,rx,ry))],p=[dx,dy,0],o=anim([(0,0),(3,0),(4,100),(6,100),(7,0),(15,0),(16,100),(60,100),(61,0),(69,0),(70,100),(75,100)]))
 # Map the existing independent water/foam/reward effects onto the real art.
 add(1010,'Body effects frame',parent=1001,p=c['foamBody'])
 add(1011,'Head effects frame',parent=1002,p=c['foamHead'])
 fx=copy.deepcopy(TEMPLATE['layers'])
 for l in fx:
  if l.get('parent')==2:l['parent']=1010
  if l.get('parent')==11:l['parent']=1011
  if l['nm']=='Hint • bubbles':l['ks']['p']=anim([(0,[792,255,0]),(1,[792,218,0]),(3,[792,210,0]),(6,[792,194,0]),(75,[792,194,0])])
  if l['nm'].startswith('REWARD •'):l['ks']['p']=prop([512,155,0])
  if l['nm'].startswith('Ground shadow'):
   l['ks']['p']=prop([0,-9,0])
 # Effects above the character; its null parents do not draw.
 comp={'v':'5.12.2','fr':15,'ip':0,'op':75,'w':1024,'h':1024,'nm':f'Pennykin {species} • original art layered bath','ddd':0,'assets':assets,'layers':fx+list(reversed(layers)),'markers':TEMPLATE['markers']}
 ids={l['ind'] for l in comp['layers']};assert len(ids)==len(comp['layers'])
 assert all(l.get('parent',1001) in ids for l in comp['layers'])
 (OUT/f'{species}.json').write_text(json.dumps(comp,separators=(',',':')))
 manifest[species]={'sha256':hashes,'headPolygon':c['head'],'headPivot':c['headPivot'],'layers':len(comp['layers'])}
 print(species,len(comp['layers']),'layers; exact original embedded asset bytes')
(ROOT/'docs/bath-v4/original-art-manifest.json').write_text(json.dumps(manifest,indent=2))
