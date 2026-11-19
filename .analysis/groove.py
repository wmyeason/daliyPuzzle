from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-592Z-ba3f3f6d.png").convert("L")
a = np.array(img, dtype=float)
h, w = a.shape

# 刻槽是横贯/纵贯的暗线。用"暗像素计数"投影，阈值较低捕捉槽
for thresh in (130, 140):
    dark = a < thresh
    rc = dark.sum(axis=1)
    cc = dark.sum(axis=0)
    print(f"=== thresh {thresh} ===")
    print("rows with count>120:", [ (y,int(rc[y])) for y in range(h) if rc[y] > 120 ])
    print("cols with count>100:", [ (x,int(cc[x])) for x in range(w) if cc[x] > 100 ])
