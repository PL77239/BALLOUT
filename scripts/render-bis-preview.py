"""Run node scripts/check-bis.cjs first; assembles actual game-code sprites."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont
root=Path('/tmp/ballout-bis');frames=json.loads((root/'manifest.json').read_text())
canvas=Image.new('RGB',(1200,650),'#222630');draw=ImageDraw.Draw(canvas)
try: font=ImageFont.truetype('DejaVuSans.ttf',15);title=ImageFont.truetype('DejaVuSans-Bold.ttf',24)
except OSError: font=title=ImageFont.load_default()
draw.text((25,16),'BALLOUT / BIS CHARACTER STUDY',font=title,fill='#efe7d0')
draw.text((25,50),'Game sprites at 3x / outfit textures and finish poses',font=font,fill='#92a2ad')
for i,f in enumerate(frames):
    sprite=Image.frombytes('RGBA',(f['w'],f['h']),(root/f'{i}.rgba').read_bytes())
    box=sprite.getbbox();sprite=sprite.crop((box[0]-3,box[1]-3,box[2]+3,box[3]+3))
    sprite=sprite.resize((sprite.width*3,sprite.height*3),Image.Resampling.NEAREST)
    x=(i%5)*240;y=80+(i//5)*275
    canvas.paste(sprite,(x+(240-sprite.width)//2,y),sprite)
    draw.text((x+(240-draw.textlength(f['name'],font=font))/2,y+235),f['name'],font=font,fill='#efe7d0')
canvas.save(Path(__file__).resolve().parent.parent/'docs/bis-preview.png')
