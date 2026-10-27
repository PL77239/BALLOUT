from pathlib import Path
import json
from PIL import Image,ImageDraw
for kind,cols,cell in [('outfits',4,(240,245)),('shoes',4,(240,140))]:
    p=Path('/tmp/ballout-streetwear-'+kind);m=json.loads((p/'manifest.json').read_text());out=Image.new('RGB',(cols*cell[0],((len(m)+cols-1)//cols)*cell[1]),'#252d39');d=ImageDraw.Draw(out)
    for i,v in enumerate(m):
        im=Image.frombytes('RGBA',(v['w'],v['h']),(p/f'{i}.rgba').read_bytes());box=im.getbbox();im=im.crop(box)
        scale=min((cell[0]-24)/im.width,(cell[1]-44)/im.height);im=im.resize((int(im.width*scale),int(im.height*scale)),Image.Resampling.NEAREST)
        x=i%cols*cell[0];y=i//cols*cell[1];out.paste(im,(x+(cell[0]-im.width)//2,y+12),im);d.text((x+12,y+cell[1]-24),v['name'],fill='#eee0be')
    out.save(Path(__file__).resolve().parent.parent/f'docs/streetwear-{kind}.png')
