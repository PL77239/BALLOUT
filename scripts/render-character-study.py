from pathlib import Path
import json
from PIL import Image, ImageDraw
p=Path('/tmp/ballout-study');m=json.loads((p/'manifest.json').read_text());frames=[]
for f in range(m['count']):
    out=Image.new('RGB',(768,288),'#252b36');d=ImageDraw.Draw(out)
    for i,label in enumerate(m['labels']):
        im=Image.frombytes('RGBA',(m['w'],m['h']),(p/f'{f}-{i}.rgba').read_bytes())
        im=im.crop((25,25,103,118)).resize((156,186),Image.Resampling.NEAREST)
        out.paste(im,(i*192+18,48),im);d.text((i*192+12,18),label,fill='#edd8a6');d.line((i*192+12,236,i*192+178,236),fill='#697785')
    frames.append(out.quantize(colors=96))
target=Path(__file__).resolve().parent.parent/'docs/character-motion-study.gif'
frames[0].save(target,save_all=True,append_images=frames[1:],duration=50,loop=0,disposal=2,optimize=True)
print(target)
