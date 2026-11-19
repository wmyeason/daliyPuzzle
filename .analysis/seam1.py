from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)
h, w = a.shape
print("size", w, h)

# 只看棋盘内部 x 25..360
sub = a[:, 25:360]
# 每行亮度（去掉文字影响：用中位数）
row_med = np.median(sub, axis=1)
for y in range(0, h, 2):
    v = row_med[y]
    bar = "#" * int((200 - v))
    print(f"y={y:3d} {v:6.1f} {bar}")
