from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

def hscan(x0, x1, y0, y1, name):
    print(f"--- {name}: 水平线 (y, 暗像素数/{x1-x0}) ---")
    for y in range(y0, y1):
        cnt = int((a[y, x0:x1] < 152).sum())
        if cnt > (x1-x0)*0.45:
            print(f"   y={y} count={cnt}")

# C1-C2 区域（左侧，被拼图覆盖）
hscan(30, 105, 0, 405, "C1-C2区域")
print()
# C3-C4 区域
hscan(120, 200, 0, 405, "C3-C4区域")
print()
# C5-C7 区域
hscan(215, 295, 0, 405, "C5-C7区域")
