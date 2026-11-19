from PIL import Image
import numpy as np

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

def find_edges(x0, x1, y0, y1, name):
    """在区域内找凹槽矩形的四条边"""
    reg = a[y0:y1, x0:x1]
    dark = reg < 140
    # 水平边：每行暗像素数
    rc = dark.sum(axis=1)
    cc = dark.sum(axis=0)
    hpeaks = [(y0+i, int(v)) for i, v in enumerate(rc) if v >= (x1-x0)*0.5]
    vpeaks = [(x0+i, int(v)) for i, v in enumerate(cc) if v >= (y1-y0)*0.5]
    print(f"--- {name} ---")
    print("  水平边(y,暗像素数):", hpeaks)
    print("  垂直边(x,暗像素数):", vpeaks)

find_edges(120, 210, 25, 105, "10月格")
find_edges(35, 115, 150, 215, "16日格")
find_edges(180, 255, 270, 340, "星期五格")
