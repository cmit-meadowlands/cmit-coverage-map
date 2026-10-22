import base64, io, os, json, subprocess
from PIL import Image
SK=os.path.join(os.path.dirname(os.path.abspath(__file__)),'logos')+'/'
def b64(path, w):
    im=Image.open(path); h=round(im.height*w/im.width)
    im=im.resize((w,h), Image.LANCZOS); buf=io.BytesIO(); im.save(buf,'PNG',optimize=True)
    return 'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()
src=os.path.dirname(os.path.abspath(__file__))+'/'; t=open(src+'template.html').read()
t=t.replace('/*__MAP__*/', open(src+'map.js').read().strip())
t=t.replace('/*__PRE__*/', open(src+'pre.js').read().strip())
t=t.replace('/*__APP__*/', open(src+'app.js').read().strip())
t=t.replace('__LOGO_WIDE__', b64(SK+'primary-white-slogan.png', 750))
t=t.replace('__LOGO_SQUARE__', b64(SK+'social-square-navy.png', 192))

open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','index.html'),'w').write(t)
print('bytes', len(t))
