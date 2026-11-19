from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)
h, w = a.shape

med = ndimage.median_filter(a, size=21)
dark = (med - a) > 12
# 屏蔽：视频遮罩条(y175-225)、右侧水印(x>345)、图像边缘
mask = np.ones_like(dark)
mask[172:228, :] = False
mask[:, 345:] = False
mask[:8, :] = False
mask[395:, :] = False
dark = dark & mask
ys, xs = np.nonzero(dark)
print("dark pixels:", len(xs))

angles = np.deg2rad(np.arange(0, 6, 0.5))  # 只找近水平线
cos = np.cos(angles); sin = np.sin(angles)
dists = np.round(xs[:,None]*cos[None,:] + ys[:,None]*sin[None,:]).astype(int)
dmin = dists.min()
acc = np.zeros((dists.max()-dmin+1, len(angles)), dtype=np.int32)
for i in range(len(xs)):
    np.add.at(acc[:, :], (dists[i]-dmin, np.arange(len(angles))), 1)

acc2 = acc.copy()
peaks = []
for _ in range(60):
    idx = np.unravel_index(np.argmax(acc2), acc2.shape)
    if acc2[idx] < 50: break
    peaks.append((np.rad2deg(angles[idx[1]]), idx[0]+dmin, int(acc2[idx])))
    r, c = idx
    acc2[max(0,r-6):r+7, max(0,c-6):c+7] = 0
print("horizontal-ish lines (angle, y, votes):")
for ang, d, v in peaks:
    print(f"  angle={ang:5.1f}  y={d:4d}  votes={v}")
