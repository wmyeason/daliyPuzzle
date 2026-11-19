from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-592Z-ba3f3f6d.png").convert("L")
a = np.array(img, dtype=float)
h, w = a.shape
print("size", w, h)

# 找棋盘区域：木质背景较亮，刻槽较暗。先看行列亮度剖面
row_mean = a.mean(axis=1)
col_mean = a.mean(axis=0)

def peaks(profile, thresh):
    idx = []
    for i in range(2, len(profile)-2):
        if profile[i] < thresh and profile[i] == min(profile[max(0,i-3):i+4]):
            idx.append(i)
    return idx

# 暗线阈值
print("row min", row_mean.min(), "col min", col_mean.min())
# 打印每10行的均值找网格线
for y in range(0, h, 5):
    bar = "#" * int((255-row_mean[y]) / 4)
    print(f"y={y:3d} {row_mean[y]:6.1f} {bar}")
