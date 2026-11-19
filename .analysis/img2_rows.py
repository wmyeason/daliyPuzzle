from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-592Z-ba3f3f6d.png").convert("L")
a = np.array(img, dtype=float)
h, w = a.shape
print("size", w, h)

# 全宽水平凹槽线（棋盘区域 x 15..350）
print("=== 水平线 (y, 暗计数/335) ===")
for y in range(h):
    cnt = int((a[y, 15:350] < 150).sum())
    if cnt > 335*0.5:
        print(f"   y={y} count={cnt}")

# 全高垂直凹槽线（棋盘区域 y 15..370）
print("=== 垂直线 (x, 暗计数/355) ===")
for x in range(w):
    cnt = int((a[15:370, x] < 150).sum())
    if cnt > 355*0.4:
        print(f"   x={x} count={cnt}")
