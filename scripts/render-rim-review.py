from pathlib import Path
from PIL import Image, ImageDraw
p=Path('/tmp/ballout-rim');frames=[]
for i in range(24):
    out=Image.new('RGB',(520,324),'#252c36');d=ImageDraw.Draw(out)
    for j,style in enumerate(['money','splash']):
        im=Image.open(p/f'{style}-{i:02}.png').convert('RGB');out.paste(im,(j*260,24));d.text((j*260+12,8),style.upper(),fill='#e8deb9')
    frames.append(out.quantize(colors=96))
out=Path(__file__).resolve().parent.parent/'docs/rim-rewards.gif'
frames[0].save(out,save_all=True,append_images=frames[1:],duration=70,loop=0,disposal=2,optimize=True)
print(out)
