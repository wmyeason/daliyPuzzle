from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

med = ndimage.median_filter(a, size=21)
dark = (med - a) > 10  # 比局部暗

def profile(x0, x1, y0, y1, name):
    reg = dark[y0:y1, x0:x1]
    xp = reg.sum(axis=0)
    yp = reg.sum(axis=1)
    print(f"--- {name} x-profile (x: count) ---")
    print([(x0+i, int(v)) for i, v in enumerate(xp) if v >= 8])
    print(f"--- {name} y-profile (y: count) ---")
    print([(y0+i, int(v)) for i, v in enumerate(yp) if v >= 8])

profile(150, 270, 50, 140, "10月格")
profile(15, 120, 140, 215, "16日格")
profile(215, 310, 285, 375, "星期五格")
