from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("RGB")
a = np.array(img.convert("L"), dtype=float)
med = ndimage.median_filter(a, size=21)
dark = (med - a) > 14

out = np.array(img)
# 暗结构标红
out[dark] = (255, 60, 60)
res = Image.fromarray(out)
# 分象限（避开遮罩）
res.crop((0, 0, 200, 172)).resize((200*4, 172*4), Image.NEAREST).save(r"D:/code/daliyPuzzle/.analysis/o_tl.png")
res.crop((0, 228, 200, 405)).resize((200*4, 177*4), Image.NEAREST).save(r"D:/code/daliyPuzzle/.analysis/o_bl.png")
res.crop((150, 0, 390, 172)).resize((240*4, 172*4), Image.NEAREST).save(r"D:/code/daliyPuzzle/.analysis/o_tr.png")
res.crop((150, 228, 390, 405)).resize((240*4, 177*4), Image.NEAREST).save(r"D:/code/daliyPuzzle/.analysis/o_br.png")
# 全图
res.save(r"D:/code/daliyPuzzle/.analysis/overlay_full.png")
print("ok")
