from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

COLW = 46.0; X0 = 18.0
colx = [X0 + i*COLW for i in range(8)]
rows_y = [13, 46, 79, 115, 155, 199, 247, 300, 358]

cells = {}
for c in range(1, 7):
    cells[(1, c)] = (colx[c-1], colx[c], rows_y[0], rows_y[1])
    cells[(2, c)] = (colx[c-1], colx[c], rows_y[1], rows_y[2])
for r in range(3, 8):
    for c in range(1, 8):
        cells[(r, c)] = (colx[c-1], colx[c], rows_y[r-1], rows_y[r])
for c in range(4, 7):
    cells[(8, c)] = (colx[c-1], colx[c], rows_y[7], rows_y[8])

def seam_ratio_v(x, y0, y1):
    """垂直边：采样x±1，统计暗像素比例"""
    samples = []
    for yy in range(int(y0)+5, int(y1)-5):
        for xx in (x-1, x, x+1):
            samples.append(a[yy, int(round(xx))])
    samples = np.array(samples)
    base = np.median(samples)
    return float((samples < base - 22).mean()), float(base)

def seam_ratio_h(y, x0, x1):
    samples = []
    for xx in range(int(x0)+5, int(x1)-5):
        for yy in (y-1, y, y+1):
            samples.append(a[int(round(yy)), xx])
    samples = np.array(samples)
    base = np.median(samples)
    return float((samples < base - 22).mean()), float(base)

print("=== 垂直边（比例>0.15 判为有拼缝） ===")
for r in range(1, 9):
    out = []
    for c in range(1, 7):
        if (r, c) in cells and (r, c+1) in cells:
            ratio, base = seam_ratio_v(colx[c], rows_y[r-1], rows_y[r])
            mark = "<<" if ratio > 0.15 else ""
            out.append(f"C{c}|{c+1}:{ratio:.2f}{mark}")
    if out: print(f"R{r}: " + " ".join(out))

print("=== 水平边 ===")
for r in range(1, 8):
    out = []
    for c in range(1, 8):
        if (r, c) in cells and (r+1, c) in cells:
            ratio, base = seam_ratio_h(rows_y[r], colx[c-1], colx[c])
            mark = "<<" if ratio > 0.15 else ""
            out.append(f"C{c}:{ratio:.2f}{mark}")
    if out: print(f"R{r}|{r+1}: " + " ".join(out))
