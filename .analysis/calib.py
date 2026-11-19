from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

def centroid(x0, x1, y0, y1, thresh=120):
    reg = a[y0:y1, x0:x1]
    ys, xs = np.mgrid[y0:y1, x0:x1]
    m = reg < thresh
    if m.sum() == 0:
        return None
    cx = xs[m].mean(); cy = ys[m].mean()
    return round(cx,1), round(cy,1), int(m.sum())

print("10月 (R2C4):", centroid(170, 245, 60, 125))
print("16日 (R5C2):", centroid(25, 110, 148, 205))
print("星期五 (R8C5):", centroid(228, 300, 295, 368))
print("标题:", centroid(30, 200, 0, 40))
print("口号:", centroid(20, 140, 330, 380))
