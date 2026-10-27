from pathlib import Path
from PIL import Image

root = Path('/tmp/ballout-bis-fall')
frames = [Image.open(p).convert('RGB').resize((405, 240), Image.Resampling.NEAREST).quantize(colors=64) for p in sorted(root.glob('*.png'))]
if not frames:
    raise SystemExit('Capture the game frames first.')
out = Path(__file__).resolve().parent.parent / 'docs/bis-ankle-break.gif'
frames[0].save(out, save_all=True, append_images=frames[1:], duration=50, loop=0, optimize=True, disposal=2)
print(out)
