from pathlib import Path
from PIL import Image,ImageDraw
import json
root=Path('/tmp/ballout-hem-drape');m=json.loads((root/'manifest.json').read_text());frames=[]
for f in range(m['count']):
 out=Image.new('RGB',(552,528),'#262d38');d=ImageDraw.Draw(out)
 for i,top in enumerate(m['tops']):
  d.text((i*184+30,9),top.upper(),fill='#eedaae')
 for i in range(6):
  x=i%3*184+18;y=i//3*250+27
  im=Image.frombytes('RGBA',(128,144),(root/f'{f}-{i}.rgba').read_bytes()).crop((26,23,104,139)).resize((156,232),Image.Resampling.NEAREST)
  out.paste(im,(x,y),im)
 d.text((8,34),'BEFORE',fill='#c3c6ce');d.text((8,284),'AFTER',fill='#82deb0')
 frames.append(out.quantize(colors=112))
target=Path(__file__).resolve().parent.parent/'docs/hem-drape-comparison.gif'
frames[0].save(target,save_all=True,append_images=frames[1:],duration=50,loop=0,optimize=True,disposal=2)
frames[15].save(root/'sample.png');print(target)
