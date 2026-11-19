from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

def vprof(x, y0, y1, label):
    vals = [a[y, x] for y in range(y0, y1)]
    print(f"{label} x={x} y[{y0},{y1}]: " + " ".join(f"{v:3.0f}" for v in vals))

# R3行(y79-115)各列边界
for x in [64, 110, 156, 202]:
    vprof(x, 82, 112, f"R3 C边界{x}")
print()
# R5行(y155-199)
for x in [64, 110, 156]:
    vprof(x, 158, 196, f"R5 C边界{x}")
print()
# R2行(y46-79) 
for x in [64, 110, 156, 202, 248]:
    vprof(x, 49, 76, f"R2 C边界{x}")
