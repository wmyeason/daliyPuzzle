from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)
h, w = a.shape

def find_h_line(y0, y1, x0, x1, min_len=25, thresh=150):
    """在区域找水平暗线，返回 (y, x_start, x_end)"""
    best = []
    for y in range(y0, y1):
        row = a[y, x0:x1] < thresh
        # 找最长连续段
        runs = []
        s = None
        for i, v in enumerate(row):
            if v and s is None: s = i
            elif not v and s is not None:
                runs.append((s, i)); s = None
        if s is not None: runs.append((s, len(row)))
        for s, e in runs:
            if e - s >= min_len:
                best.append((y, x0+s, x0+e, e-s))
    return best

def find_v_line(x0, x1, y0, y1, min_len=20, thresh=150):
    best = []
    for x in range(x0, x1):
        col = a[y0:y1, x] < thresh
        runs = []
        s = None
        for i, v in enumerate(col):
            if v and s is None: s = i
            elif not v and s is not None:
                runs.append((s, i)); s = None
        if s is not None: runs.append((s, len(col)))
        for s, e in runs:
            if e - s >= min_len:
                best.append((x, y0+s, y0+e, e-s))
    return best

print("=== 10月 格周边水平线 ===")
for r in find_h_line(55, 135, 140, 290): print(r)
print("=== 10月 格周边垂直线 ===")
for r in find_v_line(140, 290, 45, 145): print(r)
