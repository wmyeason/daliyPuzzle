from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-592Z-ba3f3f6d.png").convert("L")
a = np.array(img, dtype=float)

# 文字比刻槽更暗：用自适应阈值
dark = a < 95
lab, n = ndimage.label(dark)
print("components:", n)
objs = ndimage.find_objects(lab)
boxes = []
for i, sl in enumerate(objs):
    ys, xs = sl
    area = (lab[sl] == i+1).sum()
    hh, ww = ys.stop-ys.start, xs.stop-xs.start
    if 4 <= area <= 400 and hh <= 30 and ww <= 60:
        boxes.append((xs.start, ys.start, xs.stop, ys.stop, area))
# 按y聚类成行
boxes.sort(key=lambda b: (b[1], b[0]))
for b in boxes:
    print(b)
