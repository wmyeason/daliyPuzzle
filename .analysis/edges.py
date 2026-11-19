from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)
med = ndimage.median_filter(a, size=15)
dark = med - a  # 正值=比周围暗

COLW = 46.0; X0 = 18.0
colx = [X0 + i*COLW for i in range(8)]
rows_y = [13, 46, 79, 115, 155, 199, 247, 300, 358]

# 格子定义: (row, col) -> (x0,x1,y0,y1)
cells = {}
for c in range(1, 7):
    cells[(1, c)] = (colx[c-1], colx[c], rows_y[0], rows_y[1])
    cells[(2, c)] = (colx[c-1], colx[c], rows_y[1], rows_y[2])
for r in range(3, 8):
    for c in range(1, 8):
        cells[(r, c)] = (colx[c-1], colx[c], rows_y[r-1], rows_y[r])
for c in range(4, 7):
    cells[(8, c)] = (colx[c-1], colx[c], rows_y[7], rows_y[8])

def vscore(x, y0, y1):
    """垂直网格线x在y0..y1上的拼缝强度"""
    xs = [x-2, x-1, x, x+1, x+2]
    vals = []
    for xx in xs:
        for yy in range(int(y0)+4, int(y1)-4, 3):
            vals.append(dark[yy, int(round(xx))])
    return float(np.mean(vals)), float(np.max(vals))

def hscore(y, x0, x1):
    ys = [y-2, y-1, y, y+1, y+2]
    vals = []
    for yy in ys:
        for xx in range(int(x0)+4, int(x1)-4, 3):
            vals.append(dark[int(round(yy)), xx])
    return float(np.mean(vals)), float(np.max(vals))

print("=== 垂直边（左右相邻格子之间） ===")
for r in range(1, 9):
    line = []
    for c in range(1, 7):
        if (r, c) in cells and (r, c+1) in cells:
            m, mx = vscore(colx[c], rows_y[r-1], rows_y[r])
            line.append(f"C{c}|{c+1}:{m:5.1f}")
    if line: print(f"R{r}: " + "  ".join(line))

print("=== 水平边（上下相邻格子之间） ===")
for r in range(1, 8):
    line = []
    for c in range(1, 8):
        if (r, c) in cells and (r+1, c) in cells:
            m, mx = hscore(rows_y[r], colx[c-1], colx[c])
            line.append(f"R{r}|{r+1}C{c}:{m:5.1f}")
    if line: print(f"  ".join(line))
