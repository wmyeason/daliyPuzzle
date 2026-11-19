from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-592Z-ba3f3f6d.png").convert("L")
a = np.array(img, dtype=float)
h, w = a.shape
dark = a < 110  # 文字/刻槽

# 列方向投影：每列暗像素数
col_count = dark.sum(axis=0)
row_count = dark.sum(axis=1)

# 找文字列的聚类（列计数>0的区间）
def runs(mask):
    out = []
    s = None
    for i, v in enumerate(mask):
        if v and s is None:
            s = i
        elif not v and s is not None:
            out.append((s, i-1))
            s = None
    if s is not None:
        out.append((s, len(mask)-1))
    return out

col_runs = runs(col_count > 0)
print("column dark runs:", col_runs)
row_runs = runs(row_count > 0)
print("row dark runs:", row_runs)

# 按x聚类文字块中心
cols = sorted([(s+e)/2 for s, e in col_runs])
print("col centers:", [round(c) for c in cols])
rows = sorted([(s+e)/2 for s, e in row_runs])
print("row centers:", [round(r) for r in rows])
