"""Render the game's CPU-rasterized QA frames. Requires Pillow.
Run SPRITE_QA=1 node scripts/check-wardrobe.cjs first.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

source = Path('/tmp/ballout-redesign')
manifest = json.loads((source / 'manifest.json').read_text())
output = Path(__file__).resolve().parent.parent / 'docs'
output.mkdir(exist_ok=True)
try:
    font = ImageFont.truetype('DejaVuSans.ttf', 16)
    title = ImageFont.truetype('DejaVuSans-Bold.ttf', 24)
except OSError:
    font = title = ImageFont.load_default()
for filename, indices, cols in [
    ('character-redesign.png', range(8, 14), 6),
    ('garment-cuts.png', range(8), 4),
    ('character-poses.png', range(14, 20), 6),
]:
    rows = (len(indices) + cols - 1) // cols
    image = Image.new('RGB', (cols * 200, rows * 270 + 100), '#222630')
    draw = ImageDraw.Draw(image)
    draw.text((24, 18), 'BALLOUT / CHARACTER REDESIGN', font=title, fill='#efe7d0')
    draw.text((24, 54), 'Rendered from game code / 3x nearest-neighbour', font=font, fill='#92a2ad')
    for cell, index in enumerate(indices):
        data = manifest[index]
        sprite = Image.frombytes('RGBA', (data['w'], data['h']), (source / f'{index}.rgba').read_bytes())
        left, top, right, bottom = sprite.getbbox()
        sprite = sprite.crop((left-3, top-3, right+3, bottom+3))
        sprite = sprite.resize((sprite.width*3, sprite.height*3), Image.Resampling.NEAREST)
        x, y = cell % cols * 200, cell // cols * 270 + 95
        image.paste(sprite, (x + (200-sprite.width)//2, y), sprite)
        label = data['name'].upper()
        draw.text((x+(200-draw.textlength(label, font=font))/2, y+232), label, font=font, fill='#efe7d0')
    image.save(output / filename)
    print(output / filename)
