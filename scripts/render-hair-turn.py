"""Render CPU game sprites after node scripts/check-character-turn.cjs."""
from PIL import Image, ImageDraw
from pathlib import Path
import json
root=Path('/tmp/ballout-turn')
frames=json.loads((root/'manifest.json').read_text())
out=Image.new('RGB',(1200,600),'#222630')
d=ImageDraw.Draw(out)
for i,f in enumerate(frames):
    im=Image.frombytes('RGBA',(f['w'],f['h']),(root/f'{i}.rgba').read_bytes())
    box=im.getbbox()
    im=im.crop((box[0]-2,box[1]-2,box[2]+2,box[3]+2))
    im=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST)
    x=(i%6)*200; y=(i//6)*300
    out.paste(im,(x+(200-im.width)//2,y+20),im)
    d.text((x+35,y+265),f['name'].upper(),fill='white')
out.save(Path(__file__).resolve().parent.parent/'docs/hair-turn-preview.png')
