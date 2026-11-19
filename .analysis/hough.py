from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)
h, w = a.shape

med = ndimage.median_filter(a, size=21)
dark = (med - a) > 12
ys, xs = np.nonzero(dark)
print("dark pixels:", len(xs))

# 霍夫变换：角度-距离累加
angles = np.deg2rad(np.arange(0, 180, 1.0))
cos = np.cos(angles); sin = np.sin(angles)
dists = np.round(xs[:,None]*cos[None,:] + ys[:,None]*sin[None,:]).astype(int)
dmin = dists.min()
acc = np.zeros((dists.max()-dmin+1, len(angles)), dtype=np.int32)
for i in range(len(xs)):
    np.add.at(acc[:, :], (dists[i]-dmin, np.arange(len(angles))), 1)

# 找峰值（抑制邻域）
acc2 = acc.copy()
peaks = []
for _ in range(40):
    idx = np.unravel_index(np.argmax(acc2), acc2.shape)
    if acc2[idx] < 60: break
    peaks.append((angles[idx[1]], idx[0]+dmin, int(acc2[idx])))
    r, c = idx
    acc2[max(0,r-8):r+9, max(0,c-8):c+9] = 0
print("top lines (angle_deg, dist, votes):")
for ang, d, v in peaks:
    print(f"  angle={np.rad2deg(ang):6.1f}  dist={d:5d}  votes={v}")
