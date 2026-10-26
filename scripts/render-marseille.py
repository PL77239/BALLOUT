from PIL import Image
from pathlib import Path
im=Image.new('RGBA',(427,240))
for key in ['sky','base','glow']:
    layer=Image.frombytes('RGBA',(427,240),Path('/tmp/marseille-'+key+'.rgba').read_bytes())
    im=Image.alpha_composite(im,layer)
im.resize((1281,720),Image.Resampling.NEAREST).save(Path(__file__).resolve().parent.parent/'docs/marseille-vieux-port.png')
