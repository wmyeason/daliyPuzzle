from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

def hscan(x, y0=0, y1=405, label=""):
    vals = [a[y, x] for y in range(y0, y1)]
    # 找局部极小（凹槽）
    print(f"--- {label} x={x} ---")
    line = ""
    for y in range(y0, y1):
        v = vals[y-y0]
        line += "#" if v < 150 else ("+" if v < 175 else ".")
    for i in range(0, len(line), 100):
        print(f"y={y0+i:3d} {line[i:i+100]}")

hscan(85, 0, 405, "C2中心")
hscan(175, 0, 405, "C4中心")
hscan(220, 0, 405, "C5中心")
hscan(270, 0, 405, "C6中心")
