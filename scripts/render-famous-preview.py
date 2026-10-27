from pathlib import Path
from PIL import Image, ImageDraw

ids=['brooklyn','rucker','venice','pigalle','dyckman','tenement','mosswood','kalemegdan']
labels=['THE CAGE / WEST FOURTH','GREG MARIUS / RUCKER PARK','VENICE BEACH','PIGALLE DUPERRE','DYCKMAN / NAGLE AVE','THE TENEMENT / TAGUIG','MOSSWOOD / OAKLAND','KALEMEGDAN / BELGRADE']
out=Image.new('RGB',(854,1088),'#191e29');d=ImageDraw.Draw(out)
for i,(n,label) in enumerate(zip(ids,labels)):
    x=i%2*427;y=i//2*272
    im=Image.open('/tmp/ballout-famous/'+n+'.png').resize((427,240),Image.Resampling.NEAREST)
    out.paste(im,(x,y+24));d.text((x+12,y+7),label,fill='#efdfad')
out.save(Path(__file__).resolve().parent.parent/'docs/famous-courts.png')
