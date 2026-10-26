"""Cat/rabbit original-art native Rest; dog composition remains unchanged."""
from pathlib import Path
import base64,json,math,hashlib
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
R=Path(__file__).resolve().parents[1]

import argparse
parser=argparse.ArgumentParser();parser.add_argument('species',choices=['cat','rabbit']);S=parser.parse_args().species
C={
 'cat':{'bottom':585,'sitPivot':[345,355,0],'target':[615,765,0],'targetScale':[85,75,100],
 'head':[[230,240],[600,240],[600,526],[535,528],[491,537],[445,541],[397,542],[350,538],[316,535],[292,525],[268,506],[260,475],[246,451],[240,420],[249,388],[230,350]],
 'ears':[[[230,330],[338,338],[359,382],[322,439],[275,445],[251,406]],[[369,370],[388,318],[460,260],[493,300],[508,379],[473,420],[425,405]]],
 'earPivots':[[337,393,0],[431,393,0]],'paws':[[370,559,67,28],[506,554,43,27]],'neck':[400,460],
 'eyes':[[296,267,51,46],[407,219,49,45]],'mouth':[375,300,55,42],'mouthShift':[-6,2,0],'earLift':3,'earTurn':6,'zzz':[15,-50]},
 'rabbit':{'bottom':638,'sitPivot':[350,378,0],'target':[494,743,0],'targetScale':[85,70,100],
 'head':[[0,280],[530,280],[535,443],[440,448],[410,478],[380,510],[340,541],[300,560],[264,575],[222,578],[190,567],[170,557],[170,600],[140,640],[0,640]],
 'ears':[[[177,431],[120,455],[45,523],[0,570],[0,640],[82,640],[142,609],[168,572],[175,532],[196,480],[208,454]],[[266,390],[264,341],[310,292],[386,310],[458,348],[511,399],[516,446],[459,455],[384,420],[337,420],[308,445],[282,419]]],
 'earPivots':[[197,462,0],[308,410,0]],'paws':[[228,605,57,33],[350,608,62,30]],'neck':[280,520],
 'eyes':[[278,298,46,45],[386,255,46,44]],'mouth':[338,319,48,42],'mouthShift':[12,3,0],'earLift':4,'earTurn':5,'zzz':[10,-25]},
}[S]
DOC=R/f'docs/rest-{S}';OUT=R/f'assets/animation/rest-{S}';DOC.mkdir(exist_ok=True);OUT.mkdir(exist_ok=True)

FPS=15;END=57
P=lambda v:{'a':0,'k':v}
def K(keys):
 return {'a':1,'k':[{'t':t,'s':v if isinstance(v,list) else [v],'i':{'x':[.67],'y':[1]},'o':{'x':[.33],'y':[0]}} for t,v in keys]}
def T(p=[0,0,0],a=[0,0,0],s=[100,100,100],r=0,o=100):return {k:v if isinstance(v,dict) else P(v) for k,v in dict(p=p,a=a,s=s,r=r,o=o).items()}
def poly(v):return {'v':v,'i':[[0,0]]*len(v),'o':[[0,0]]*len(v),'c':True}
def ellipse(x,y,rx,ry):
 k=.55228475;return {'v':[[x,y-ry],[x+rx,y],[x,y+ry],[x-rx,y]],'i':[[-rx*k,0],[0,-ry*k],[rx*k,0],[0,ry*k]],'o':[[rx*k,0],[0,ry*k],[-rx*k,0],[0,-ry*k]],'c':True}
def M(v,mode='a'):return {'inv':False,'mode':mode,'pt':P(v),'o':P(100),'x':P(0)}
def color(h):return [int(h[i:i+2],16)/255 for i in (1,3,5)]+[1]
L=[];idx=0
roots={}
def add(name,ty=3,parent=None,**kw):
 global idx
 idx+=1;l={'ddd':0,'ind':idx,'ty':ty,'nm':name,'sr':1,'ks':T(**kw),'ao':0,'ip':0,'op':END,'st':0,'bm':0}
 if parent:l['parent']=parent
 L.append(l);return idx
for name in ['bg_layer','pet_body_layer','pet_face_layer','fx_zzz_layer','ui_prompt_layer']:roots[name]=add(name)
def image(name,ref,parent,masks=None,**kw):
 i=add(name,2,parent,**kw);l=L[-1];l['refId']=ref
 if masks:l['hasMask']=True;l['masksProperties']=masks
 return i
def shape(name,paths,parent,fill=None,stroke=None,width=2,**kw):
 i=add(name,4,parent,**kw);items=[{'ty':'sh','ks':P(p),'nm':name} for p in paths]
 if fill:items.append({'ty':'fl','c':P(color(fill)),'o':P(100),'r':1})
 if stroke:items.append({'ty':'st','c':P(color(stroke)),'o':P(100),'w':P(width),'lc':2,'lj':2})
 L[-1]['shapes']=items;return i
def text(name,word,size,parent,fill,**kw):
 path=TextPath((0,0),word,size=size,prop=FontProperties(family='DejaVu Sans',weight='bold'))
 # Flatten font contours to portable vector outlines; runtime needs no fonts.
 contours=path.to_polygons();bounds=path.get_extents();cx=(bounds.x0+bounds.x1)/2
 paths=[poly([[float(x-cx),float(-y)] for x,y in pts]) for pts in contours if len(pts)>2]
 return shape(name,paths,parent,fill=fill,**kw)
assets=[];manifest={}
for aid,file in [('sit',f'assets/pets/{S}.png'),('blink',f'assets/pets/{S}-blink.png'),('mouth',f'assets/animation/{S}-eat.png'),('sleep',f'assets/animation/{S}-rest.png'),('bed','assets/items/cozy_cushion.png')]:
 from PIL import Image
 data=(R/file).read_bytes();w,h=Image.open(R/file).size
 assets.append({'id':aid,'w':w,'h':h,'u':'','p':'data:image/png;base64,'+base64.b64encode(data).decode(),'e':1})
 manifest[aid]={'source':file,'sha256':hashlib.sha256(data).hexdigest()}
bg=roots['bg_layer'];body=roots['pet_body_layer'];face=roots['pet_face_layer'];fx=roots['fx_zzz_layer'];ui=roots['ui_prompt_layer']
shape('Quiet violet halo',[ellipse(512,755,430,190)],bg,fill='#D8D2E5',o=K([(0,0),(12,15),(45,15),(57,0)]))
shape('Soft floor shadow',[ellipse(512,850,285,23)],bg,fill='#8C7674',o=K([(0,0),(8,16),(50,16),(57,0)]))
bed=assets[-1];image('Original cozy pet bed','bed',bg,[M(ellipse(bed['w']/2,bed['h']*.515625,bed['w']*.4375,bed['h']*.3046875))],p=[512,858,0],a=[bed['w']/2,bed['h']*.95,0],s=[250,120,100],o=K([(0,0),(4,55),(8,100),(50,100),(57,0)]))
sitComposition=json.loads((R/f'assets/animation/bath-original/{S}.json').read_text())
sitHead=next(l for l in sitComposition['layers'] if l['nm']=='Original head • ears excluded')['masksProperties'][0]['pt']['k']
tailRegion=next(l for l in sitComposition['layers'] if l['nm']=='Original tail')['masksProperties'][0]['pt']['k']
sleepHead=poly(C['head']);leftEar,rightEar=[poly(v) for v in C['ears']]
leftPaw,rightPaw=[ellipse(*p) for p in C['paws']]
offset=[212,815-C['bottom'],0]
base=[212+C['sitPivot'][0],245+C['sitPivot'][1],0]
rect=poly([[0,0],[600,0],[600,640],[0,640]])
sitOpacity=K([(0,100),(6,100),(7,0),(47,0),(48,100),(57,100)])
lieOpacity=K([(0,0),(6,0),(7,100),(47,100),(48,0),(57,0)])
sitRoot=add('Sitting body • compress and recover',parent=body,p=K([(0,[512,845,0]),(3,[512,845,0]),(6,[512,815,0]),(47,[512,815,0]),(55,[512,845,0]),(57,[512,845,0])]),a=[300,600,0],s=K([(0,[100,100,100]),(2,[101,97,100]),(6,[104,55,100]),(47,[104,55,100]),(53,[98,105,100]),(56,[100,100,100]),(57,[100,100,100])]),o=sitOpacity)
image('Original upright body','sit',sitRoot,[M(rect),M(sitHead,'s'),M(tailRegion,'s')])
image('Original upright tail','sit',sitRoot,[M(tailRegion)])
lieRoot=add('rest_loop • bottom anchored chest, 98–102%',parent=body,p=[512,815,0],a=[300,C['bottom'],0],s=K([(0,[100,100,100]),(6,[103,95,100]),(9,[99,103,100]),(15,[100,102,100]),(30,[100,98,100]),(45,[100,102,100]),(47,[103,95,100]),(50,[108,116,100]),(53,[100,102,100]),(57,[100,102,100])]),o=lieOpacity)
bodyCut=poly([[C['neck'][0]+(x-C['neck'][0])*.98,C['neck'][1]+(y-C['neck'][1])*.98] for x,y in sleepHead['v']])
image('Original resting torso and tail','sleep',lieRoot,[M(rect),M(bodyCut,'s'),M(leftPaw,'s'),M(rightPaw,'s')])
for side,paw in enumerate([leftPaw,rightPaw]):
 image(f'Original front paw {side} • wake stretch','sleep',body,[M(paw)],p=K([(0,offset),(45,offset),(48,[offset[0]-7+side*12,offset[1]+7,0]),(50,[offset[0]-7+side*16,offset[1]+7,0]),(57,offset)]),o=lieOpacity)
sitFace=add('One upright head • continuous descent/rise',parent=face,p=K([(0,base),(2,[base[0],base[1]+15,0]),(6,C['target']),(48,C['target']),(52,[base[0]+6,base[1]+35,0]),(55,[base[0],base[1]-5,0]),(57,base)]),a=C['sitPivot'],s=K([(0,[100,100,100]),(6,C['targetScale']),(48,C['targetScale']),(52,[99,103,100]),(56,[100,100,100]),(57,[100,100,100])]),r=K([(0,0),(6,-7),(48,-7),(53,2),(57,0)]),o=K([(0,100),(6,100),(7,0),(47,0),(48,100),(57,100)]))
image('Original upright face','sit',sitFace,[M(sitHead),M(tailRegion,'s')])
# All eye changes are resident native image layers. Sleep loop contains no open eyes.
image('Original drowsy closed eyes','blink',sitFace,[M(ellipse(*eye)) for eye in C['eyes']],o=K([(0,0),(1,65),(2,100),(7,100),(47,100),(48,0),(57,0)]))
image('Original yawn mouth','mouth',sitFace,[M(ellipse(*C['mouth']))],p=C['mouthShift'],o=K([(0,0),(1,100),(3,100),(5,0),(57,0)]))
lieFace=add('Closed sleeping face • no idle sway',parent=face,p=offset,o=K([(0,0),(6,0),(7,100),(47,100),(48,0),(57,0)]))
image('Original closed-eye sleep face','sleep',lieFace,[M(sleepHead),M(leftEar,'s'),M(rightEar,'s')])
for n,(ear,pivot) in enumerate(list(zip([leftEar,rightEar],C['earPivots']))):
 earRoot=add(f'Relaxed ear {n} • 1–2px breath',parent=lieFace,p=K([(0,pivot),(15,[pivot[0],pivot[1],0]),(30,[pivot[0],pivot[1]+1.5,0]),(45,pivot),(47,[pivot[0],pivot[1]-C['earLift'],0]),(57,pivot)]),a=pivot,r=K([(0,0),(45,0),(46,(-1 if n==0 else 1)*C['earTurn']),(48,0),(57,0)]))
 image(f'Original sleeping ear {n}','sleep',earRoot,[M(ear),M(sleepHead,'i')])
# Three cyclic, staggered Zzz particles: invisible at position reset, same loop boundary.
for n in range(3):
 alpha=[];position=[];scale=[]
 for f in range(15,46):
  phase=((f-15)/30+.2+n/3)%1
  alpha.append((f,math.sin(math.pi*phase)*88));position.append((f,[701+n*23+phase*35,630-phase*150,0]));scale.append((f,[70+phase*30]*2+[100]))
 startA=alpha[0][1];startP=position[0][1];startS=scale[0][1]
 z=text(f'Zzz particle {n}','Zzz',36,fx,'#7F7A9C',p=K([(0,[701+n*23,650,0]),(9,[701+n*23,650,0]),(15,startP)]+position[1:]+[(48,[760+n*23,440,0]),(57,[760+n*23,440,0])]),s=K([(0,startS),(15,startS)]+scale[1:]+[(57,startS)]),o=K([(0,0),(9+n,0),(15,startA)]+alpha[1:]+[(48,0),(57,0)]))
for n in range(2):shape(f'Dream bubble {n}',[ellipse(0,0,8+n*3,8+n*3)],fx,stroke='#ADA5C5',width=2,p=K([(0,[765+n*35,610,0]),(15,[765+n*35,610,0]),(30,[778+n*35,570,0]),(45,[765+n*35,610,0]),(57,[765+n*35,610,0])]),o=K([(0,0),(12,25),(45,25),(48,0),(57,0)]))
# Pill backgrounds are code-native vectors; text is outlined, requiring no font assets.
def pill(name,cx,cy,w,h,fill,opacity,parent=ui):
 i=add(name,4,parent,o=opacity);L[-1]['shapes']=[{'ty':'rc','p':P([cx,cy]),'s':P([w,h]),'r':P(h/2)},{'ty':'fl','c':P(color(fill)),'o':P(100),'r':1}]
 return i
hintRoot=add('Prompt follows the sleeping head',parent=ui,p=K([(0,[0,-130,0]),(15,[0,120,0]),(45,[0,120,0]),(53,[0,-130,0]),(57,[0,-130,0])]))
hint=K([(0,0),(3,100),(51,100),(57,0)])
pill('Quiet prompt bubble',512,310,420,70,'#FFF9F3',hint,hintRoot)
for word,keys in [('Time to rest',[(0,0),(2,100),(7,100),(9,0),(57,0)]),('Sweet dreams',[(0,0),(8,0),(10,100),(45,100),(48,0),(57,0)]),('All rested',[(0,0),(49,0),(51,100),(55,100),(57,0)])]:text(word,word,29,hintRoot,'#78647B',p=[512,320,0],o=K(keys))
bar=K([(0,0),(9,0),(12,100),(45,100),(48,0),(57,0)])
pill('RESTING status bar',512,926,490,88,'#F4EEF7',bar)
text('RESTING label','RESTING',27,ui,'#766084',p=[512,923,0],o=bar)
text('Wake instruction','TAP ANYWHERE TO WAKE',15,ui,'#8F7D98',p=[512,949,0],o=bar)
heart=poly([[0,10],[-30,-10],[-32,-29],[-20,-39],[-7,-38],[0,-29],[7,-38],[20,-39],[32,-29],[30,-10]])
shape('Recharged heart',[heart],ui,fill='#E68A9C',p=K([(0,[780,270,0]),(51,[780,270,0]),(54,[780,200,0]),(57,[780,180,0])]),s=K([(0,[0,0,100]),(51,[0,0,100]),(53,[120,120,100]),(55,[100,100,100]),(57,[100,100,100])]),o=K([(0,0),(51,0),(53,100),(55,100),(57,0)]))
for layer in L:
 if layer.get('parent')==fx and layer['ks']['p']['a']:
  for key in layer['ks']['p']['k']:
   key['s'][0]+=C['zzz'][0];key['s'][1]+=C['zzz'][1]
# Null transforms inherit; their opacity does not. Bake group opacity onto
# each drawable natively to guarantee only one head/body is visible.
import copy
originalLayers={l['ind']:copy.deepcopy(l) for l in L}
def value_at(prop,t):
 if not prop['a']:return prop['k']
 keys=prop['k'];prior=keys[0]
 for key in keys[1:]:
  if t<key['t']:
   q=max(0,min(1,(t-prior['t'])/(key['t']-prior['t'])));lo=0;hi=1
   for _ in range(24):
    u=(lo+hi)/2;x=3*(1-u)**2*u*.33+3*(1-u)*u*u*.67+u**3
    if x<q:lo=u
    else:hi=u
   u=(lo+hi)/2;e=3*u*u-2*u*u*u
   return prior['s'][0]+(key['s'][0]-prior['s'][0])*e
  prior=key
 return prior['s'][0]
for layer in L:
 if layer['ty'] not in [2,4]:continue
 chain=[];current=originalLayers[layer['ind']]
 while True:
  chain.append(current['ks']['o'])
  if not current.get('parent'):break
  current=originalLayers[current['parent']]
 if any(p['a'] or p['k']!=100 for p in chain):
  layer['ks']['o']=K([(f,math.prod(value_at(p,f)/100 for p in chain)*100) for f in range(58)])
for layer in L:
 if layer['ty']==3:layer['ks']['o']=P(100)
comp={'v':'5.12.2','fr':15,'ip':0,'op':57,'w':1024,'h':1024,'nm':f'Pennykin {S} • original-art Rest','ddd':0,'assets':assets,'layers':list(reversed(L)),'markers':[{'tm':0,'cm':'Rest_Enter','dr':15},{'tm':15,'cm':'rest_loop','dr':30},{'tm':45,'cm':'Rest_Exit','dr':12}]}
ids={l['ind'] for l in L};assert len(ids)==len(L);assert all(l.get('parent',1) in ids for l in L)
(OUT/f'{S}.json').write_text(json.dumps(comp,separators=(',',':')))
(DOC/'original-art-manifest.json').write_text(json.dumps(manifest,indent=2))
print(len(L),'layers; 5 named groups; 15/30/12-frame segments; original assets unchanged')
