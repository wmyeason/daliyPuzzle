from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

def scan_region(x0, x1, y0, y1, name):
    print(f"--- {name} (x{x0}-{x1}, y{y0}-{y1}) ---")
    # 垂直线：每列暗像素数
    print("垂直边(x, 暗计数/区域高):")
    for x in range(x0, x1):
        cnt = int((a[y0:y1, x] < 150).sum())
        if cnt > (y1-y0)*0.4:
            print(f"   x={x} count={cnt}")
    print("水平边(y, 暗计数/区域宽):")
    for y in range(y0, y1):
        cnt = int((a[y, x0:x1] < 150).sum())
        if cnt > (x1-x0)*0.4:
            print(f"   y={y} count={cnt}")

scan_region(170, 290, 275, 345, "星期五格周边")
print()
scan_region(30, 130, 140, 215, "16日格周边")
print()
scan_region(130, 230, 30, 115, "10月格周边")
