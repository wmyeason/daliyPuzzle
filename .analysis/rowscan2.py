from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

# 相对阈值：比本行中位数暗25以上
print("y : 暗像素数(x25..300, 阈值=行中位数-25)")
for y in range(0, 405):
    row = a[y, 25:300]
    base = np.median(row)
    cnt = int((row < base - 25).sum())
    if cnt > 90:
        bar = "#" * (cnt // 4)
        print(f"y={y:3d} base={base:5.0f} count={cnt:3d} {bar}")
