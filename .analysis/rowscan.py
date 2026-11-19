from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

# 每行在 x25..300 范围内的暗像素数（阈值140）
for y in range(0, 405):
    cnt = int((a[y, 25:300] < 140).sum())
    if cnt > 60:
        bar = "#" * (cnt // 5)
        print(f"y={y:3d} count={cnt:3d} {bar}")
