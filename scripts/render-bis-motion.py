"""Assemble actual browser frames from scripts/capture-bis-motion.cjs."""
from pathlib import Path
from PIL import Image
root=Path('/tmp/ballout-bis-motion')
frames=[]
for path in sorted(root.glob('*.png')):
    im=Image.open(path).convert('RGB').resize((322,224),Image.Resampling.NEAREST)
    frames.append(im.quantize(colors=64,method=Image.Quantize.MEDIANCUT))
if not frames: raise SystemExit('Capture the game frames first.')
out=Path(__file__).resolve().parent.parent/'docs/bis-motion.gif'
frames[0].save(out,save_all=True,append_images=frames[1:],duration=85,loop=0,optimize=True,disposal=2)
print(out, out.stat().st_size,'bytes')
