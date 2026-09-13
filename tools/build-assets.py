from PIL import Image,ImageDraw
from pathlib import Path
import json,math
OUT=Path('assets');(OUT/'portraits').mkdir(exist_ok=True)
actors=[('player','#D8AE62','#D9A17D','#463644',0),('ana','#BB7856','#E1B18B','#5B3931',1),('bruno','#648BA3','#BC8667','#34373D',2),('carla','#B89466','#925E49','#342B32',1),('diego','#668D73','#DCAB85','#433B36',0),('elisa','#9883B1','#B7846B','#493541',1),('felipe','#4E8590','#E3B68F','#687477',2),('marina','#698BA0','#A87557','#372F38',1)]
states={'walk':{'start':0,'count':6,'fps':9},'idle':{'start':6,'count':2,'fps':2},'talk':{'start':8,'count':3,'fps':3},'stamp':{'start':11,'count':5,'fps':15},'deliver':{'start':16,'count':6,'fps':12},'react':{'start':22,'count':3,'fps':5}}
atlas=Image.new('RGBA',(34*25,50*4*len(actors)))
def tint(hex,factor):
 rgb=tuple(int(hex[i:i+2],16) for i in (1,3,5));return tuple(min(255,round(c*factor)) for c in rgb)+(255,)
def character(actor,direction,frame):
 _,shirt,skin,hair,style=actor
 im=Image.new('RGBA',(32,48));d=ImageDraw.Draw(im)
 moving=frame<6;step=round(math.sin(frame/6*math.tau)*2) if moving else 0;bob=1 if moving and frame%3==1 else 0
 talk=frame in (9,10);stamp=11<=frame<=15;deliver=16<=frame<=21;react=frame>=22
 def r(box,color):d.rectangle(tuple(round(v) for v in box),fill=color)
 # Shoes and trouser legs.
 r((8,32+step,13,41+step),'#243E53');r((18,32-step,23,41-step),'#243E53');r((7,41+step,13,43+step),'#182A3B');r((18,41-step,25,43-step),'#182A3B')
 r((8,22+bob,23,34+bob),shirt);r((8,24+bob,10,32+bob),tint(shirt,1.18));r((21,24+bob,23,34+bob),tint(shirt,.8))
 arm=-3 if talk else -5 if stamp and frame in (12,13) else -3 if deliver else 0
 r((5,24+bob,7,32+bob),shirt);r((5,32+bob,7,35+bob),skin);r((24,24+arm+bob,27,32+arm+bob),shirt);r((24,32+arm+bob,27,35+arm+bob),skin)
 r((13,19+bob,18,24+bob),tint(skin,.86));r((8,7+bob,23,19+bob),skin);r((10,19+bob,21,21+bob),skin);r((7,10+bob,8,15+bob),skin);r((23,10+bob,24,15+bob),skin)
 r((8,4+bob,23,8+bob),hair);r((7,7+bob,10,13+bob),hair);r((21,7+bob,24,10+bob),hair)
 if style==1:r((6,8+bob,8,24+bob),hair);r((24,8+bob,26,23+bob),hair);r((11,3+bob,21,5+bob),hair)
 if direction==1:
  r((8,8+bob,23,19+bob),hair);r((11,19+bob,21,21+bob),hair);r((12,25+bob,19,27+bob),tint(shirt,1.1))
 else:
  ex=0 if direction==0 else -3 if direction==2 else 3
  if direction in (0,2):r((11+ex,12+bob,12+ex,14+bob),'#25333D')
  if direction in (0,3):r((19+ex,12+bob,20+ex,14+bob),'#25333D')
  r((15+ex,18+bob,18+ex,18+bob),'#945F52')
  r((13,24+bob,18,25+bob),'#EBE7D6');r((15,26+bob,16,31+bob),'#314B60')
  if actor[0]!='player':r((19,28+bob,22,32+bob),'#F2E5C9');r((20,29+bob,21,30+bob),'#557A8C')
  if style==2:
   if direction==0:r((10,11+bob,13,15+bob),'#4F5960');r((18,11+bob,21,15+bob),'#4F5960');r((14,12+bob,17,12+bob),'#4F5960');r((11,12+bob,12,13+bob),'#BBCBD0');r((19,12+bob,20,13+bob),'#BBCBD0')
 if actor[0]=='player' or deliver:
  px=24 if direction!=2 else 1;py=29+arm if deliver else 30
  r((px,py,px+6,py+10),'#8B6546');r((px,py-1,px+5,py+8),'#F5EEDC');r((px+1,py+2,px+4,py+2),'#7B998A');r((px+1,py+5,px+4,py+5),'#7B998A')
 if stamp:r((25,32+arm,28,35+arm),'#543A30');r((24,35+arm,29,36+arm),'#9D583A')
 if react and frame==23:r((13,17+bob,16,19+bob),'#805445')
 return im
for ai,actor in enumerate(actors):
 for direction in range(4):
  for frame in range(25):atlas.paste(character(actor,direction,frame),(frame*34+1,(ai*4+direction)*50+1))
 character(actor,0,6).save(OUT/'portraits'/f'{actor[0]}.png')
atlas.save(OUT/'characters.png',optimize=True)
metadata={'frameWidth':32,'frameHeight':48,'strideX':34,'strideY':50,'actors':[a[0] for a in actors],'animations':states,'directions':['down','up','left','right']}
(OUT/'atlas.js').write_text('globalThis.LB ||= {}; globalThis.LB.Atlas = '+json.dumps(metadata)+';\n',encoding='utf-8')
print('Sprite atlas created: 800 frames and 8 portraits, 32 x 48 pixels per frame.')
