"""Import a 7x7 RGBA PNG as a recolourable garment motif.
Usage: python scripts/import-garment-texture.py my-design.png motif_id
Requires Pillow. Transparent=empty, dark/coloured=trim, very light=highlight.
"""
import json, re, sys
from pathlib import Path
from PIL import Image
if len(sys.argv)!=3 or not re.fullmatch(r'[a-z][a-z0-9_]{0,31}',sys.argv[2]):
    raise SystemExit('Usage: python scripts/import-garment-texture.py image.png lowercase_id')
im=Image.open(sys.argv[1]).convert('RGBA')
if im.size!=(7,7): raise SystemExit('PNG must be exactly 7x7 pixels.')
rows=[]
for y in range(7):
    row=''
    for x in range(7):
        r,g,b,a=im.getpixel((x,y))
        row+='.' if a<128 else '2' if min(r,g,b)>=220 else '1'
    rows.append(row)
path=Path(__file__).resolve().parent.parent/'src/garment-textures.json'
patterns=json.loads(path.read_text(encoding='utf-8'))
if sys.argv[2] in patterns: raise SystemExit('This motif id exists already; choose another.')
patterns[sys.argv[2]]=rows
path.write_text(json.dumps(patterns,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Added {sys.argv[2]}; use topTexture or bottomTexture in an item patch.')
