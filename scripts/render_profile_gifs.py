#!/usr/bin/env python3
"""Render real GIF banner and cutout GIFs for the Grand Line profile.
User-supplied Luffy and Nami clips; Zoro original link supplied by user.
These are 2D fan GIFs, not official 3D models.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np
import cv2,io,math,urllib.request,sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/profile'
OUT.mkdir(parents=True,exist_ok=True)
SOURCES={
 'luffy':ROOT/'docs/assets/luffy-film-z.webp',
 'nami':'https://giffiles.alphacoders.com/218/218680.gif',
 'zoro':'https://giffiles.alphacoders.com/221/221831.gif'
}
def font(sz):
 for fn in ['/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
  if Path(fn).exists():return ImageFont.truetype(fn,sz)
 return ImageFont.load_default()
def source(name):
 u=SOURCES[name]
 if isinstance(u,Path):return Image.open(u)
 req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0','Accept':'image/gif,image/*'})
 with urllib.request.urlopen(req,timeout=28) as r:blob=r.read(9000000)
 if not blob.startswith((b'GIF8',b'RIFF')):raise ValueError('not a GIF: '+name)
 return Image.open(io.BytesIO(blob))
def alpha_for(im,who):
 rgb=np.asarray(im.convert('RGB'));h,w=rgb.shape[:2];m=np.full((h,w),cv2.GC_PR_BGD,np.uint8)
 if who=='nami':
  outer=[(.30,0),(.80,0),(.90,.08),(.86,.20),(.92,.32),(.95,.50),(.98,.75),(1,1),(0,1),(0,.65),(.07,.52),(.11,.25),(.18,.08)]
  inner=[(.36,.10),(.70,.10),(.79,.23),(.78,.56),(.70,.78),(.3,.8),(.18,.53),(.22,.22)]
 elif who=='luffy':
  outer=[(.44,0),(.63,0),(.67,.16),(.65,.28),(.74,.38),(.76,.58),(.84,1),(.12,1),(.22,.57),(.26,.38),(.36,.25),(.32,.13)]
  inner=[(.43,.13),(.55,.13),(.62,.30),(.62,.55),(.70,1),(.29,1),(.35,.48),(.36,.30)]
 else:
  outer=[(.22,0),(.78,0),(.91,.19),(.96,.57),(.89,1),(.10,1),(.04,.60),(.10,.20)]
  inner=[(.37,.08),(.67,.08),(.78,.28),(.78,.72),(.65,.95),(.3,.95),(.2,.65),(.21,.27)]
 P=lambda pts:np.array([(int(x*w),int(y*h)) for x,y in pts],np.int32)
 cv2.fillPoly(m,[P(outer)],cv2.GC_PR_FGD);cv2.fillPoly(m,[P(inner)],cv2.GC_FGD)
 m[:3,:int(w*.07)]=cv2.GC_BGD;m[:3,int(w*.93):]=cv2.GC_BGD
 cv2.grabCut(rgb,m,None,np.zeros((1,65),np.float64),np.zeros((1,65),np.float64),5,cv2.GC_INIT_WITH_MASK)
 a=np.where((m==cv2.GC_FGD)|(m==cv2.GC_PR_FGD),255,0).astype(np.uint8)
 a=cv2.morphologyEx(a,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
 a=cv2.morphologyEx(a,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
 n,lab,st,_=cv2.connectedComponentsWithStats(a,8)
 if n>1:
  big=np.argsort(st[1:,cv2.CC_STAT_AREA])[::-1][:3]+1
  a=np.where(np.isin(lab,big),255,0).astype(np.uint8)
 return Image.fromarray(cv2.GaussianBlur(a,(5,5),.8),'L')
def indexed(rgba):
 alpha=np.asarray(rgba.getchannel('A'))>90
 pal=rgba.convert('RGB').quantize(colors=77,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
 values=np.asarray(pal,dtype=np.uint8).copy()+1;values[~alpha]=0
 out=Image.fromarray(values,'P')
 palette=[0,0,0]+(pal.getpalette() or [])[:77*3]
 out.putpalette(palette+[0]*(768-len(palette)))
 out.info['transparency']=0;out.info['disposal']=2
 return out
def crew(name):
 clip=source(name);count=getattr(clip,'n_frames',1)
 ids=np.linspace(0,count-1,min(count,{'luffy':10,'nami':11,'zoro':12}[name]),dtype=int)
 clip.seek(0);a=alpha_for(clip.convert('RGBA'),name)
 bounds=a.point(lambda t:255 if t>90 else 0).getbbox() or (0,0,clip.width,clip.height)
 pad=int(min(clip.size)*.035)
 bounds=(max(0,bounds[0]-pad),max(0,bounds[1]-pad),min(clip.width,bounds[2]+pad),min(clip.height,bounds[3]+pad))
 frames=[];times=[]
 for id in ids:
  clip.seek(int(id));im=clip.convert('RGBA');im.putalpha(a)
  im=im.crop(bounds);im.thumbnail((192,211),Image.Resampling.LANCZOS)
  out=Image.new('RGBA',(216,230),(0,0,0,0))
  out.alpha_composite(im,((216-im.width)//2,230-im.height))
  frames.append(indexed(out));times.append(max(70,int(clip.info.get('duration',90))*max(1,round(count/len(ids)))))
 dest=OUT/(name+'-cutout.gif')
 frames[0].save(dest,save_all=True,append_images=frames[1:],duration=times,loop=0,disposal=2,transparency=0,optimize=True)
 print(name,len(frames),'frames',dest.stat().st_size,'bytes')
def ship(t):
 img=Image.new('RGBA',(460,270),(0,0,0,0));d=ImageDraw.Draw(img)
 d.polygon([(37,199),(412,190),(382,250),(111,255)],fill='#593b32',outline='#e3b978',width=5)
 d.line([(45,200),(400,192)],fill='#e6c17c',width=7)
 d.line([(119,250),(378,248)],fill='#9e6f46',width=4)
 d.line([(95,190),(391,190)],fill='#c6a175',width=8)
 for x in range(109,395,26):d.line([(x,187),(x,200)],fill='#e6ce9c',width=3)
 d.line([(200,200),(200,38)],fill='#7b5245',width=10);d.line([(296,197),(296,69)],fill='#7b5245',width=8)
 swing=math.sin(t)*6
 d.polygon([(195,49),(65+swing,178),(196,182)],fill='#efd5a7',outline='#9a7860',width=3)
 d.polygon([(208,48),(297+swing,179),(208,181)],fill='#e6c38e',outline='#9a7860',width=3)
 d.polygon([(292,78),(397+swing,184),(297,182)],fill='#f4e1b9',outline='#9a7860',width=3)
 d.line([(194,49),(61,191),(299,192)],fill='#e5c797',width=2)
 d.polygon([(202,38),(202,14),(255+math.sin(t)*6,25),(202,48)],fill='#b94f44',outline='#e5bd77',width=3)
 d.ellipse((194,10,205,22),fill='#f6d9a1')
 for x in (132,168,234,267,322,357):d.ellipse((x,213,x+8,221),fill='#e6bc77')
 return img
def banner():
 W,H=1080,350
 top=np.array([5,19,33],dtype=np.float32)
 mid=np.array([20,53,69],dtype=np.float32)
 low=np.array([10,36,57],dtype=np.float32)
 y=np.arange(H,dtype=np.float32)[:,None]/(H-1)
 t=np.minimum(1,y/.62);s=np.maximum(0,(y-.62)/.38)
 row=np.where((y<.62)[...,None],top*(1-t[...,None])+mid*t[...,None],mid*(1-s[...,None])+low*s[...,None])
 back=Image.fromarray(np.broadcast_to(np.uint8(np.clip(row,0,255)),(H,W,3)).copy()).convert('RGBA')
 glow=Image.new('RGBA',(W,H),(0,0,0,0));g=ImageDraw.Draw(glow)
 g.ellipse((740,12,1090,350),fill=(238,182,108,66))
 back.alpha_composite(glow.filter(ImageFilter.GaussianBlur(44)))
 d=ImageDraw.Draw(back)
 d.ellipse((834,60,1015,243),fill='#d8af80')
 d.ellipse((856,83,993,221),fill='#edcd9e')
 d.polygon([(0,262),(70,230),(158,253),(268,213),(358,248),(455,216),(545,252),(690,224),(795,261),(1080,227),(1080,350),(0,350)],fill='#153447')
 d.polygon([(0,284),(105,256),(247,286),(344,258),(445,284),(583,250),(721,287),(832,257),(944,276),(1080,258),(1080,350),(0,350)],fill='#0e2c43')
 d.rounded_rectangle((24,24,667,305),radius=14,fill=(5,20,33,245),outline=(202,156,92,135),width=2)
 d.text((54,53),"THE ENGINEER'S GRAND LINE",font=font(21),fill='#edc889')
 d.text((49,108),'SIVANESAN B.',font=font(67),fill='#fff1d4')
 d.line((53,202,572,202),fill='#dcb77b',width=3)
 d.text((54,218),'AI ENGINEER  •  GENAI  •  RAG  •  VOICE AI',font=font(18),fill='#ccdee2')
 d.text((54,255),'BUILD REAL SYSTEMS. CHART NEW WORLDS.',font=font(15),fill='#f3d4a0')
 frames=[]
 for i in range(16):
  angle=i*2*math.pi/16
  f=back.copy()
  f.alpha_composite(ship(angle),(640,36+round(math.sin(angle)*5)))
  draw=ImageDraw.Draw(f)
  for layer in range(3):
   y0=325+layer*10
   points=[(x,int(y0+math.sin(x*.015+angle*(layer+1)*.45)*3.5)) for x in range(-10,W+20,9)]
   draw.line(points,fill=(65+layer*25,147+layer*18,158+layer*12,190),width=2)
  for k,(x,y) in enumerate([(722,38),(777,93),(1026,45),(711,165),(1032,271)]):
   opacity=(1+math.sin(angle+k*1.4))/2;r=1+round(opacity*2)
   draw.ellipse((x-r,y-r,x+r,y+r),fill=(255,235,181,70+int(opacity*185)))
  frames.append(f.convert('RGB').quantize(colors=72,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE))
 dest=OUT/'grand-line-banner.gif'
 frames[0].save(dest,save_all=True,append_images=frames[1:],duration=110,loop=0,optimize=True,disposal=2)
 print('banner',len(frames),'frames',dest.stat().st_size,'bytes')
if __name__=='__main__':
 for name in ('luffy','nami','zoro'):
  try:crew(name)
  except Exception as ex:print('Warning: unavailable clip',name,repr(ex),file=sys.stderr)
 banner()
