from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)

# 局部对比度：像素比15x15邻域中位数暗多少
med = ndimage.median_filter(a, size=15)
diff = med - a  # 正值表示比周围暗
print("diff stats:", diff.min(), diff.max(), np.percentile(diff, 99))

# 拼缝应该是细长暗结构：diff > 12
seam = diff > 12
# 水平拼缝：对每行统计seam像素数（限制在棋盘区域）
rc = seam[:, 20:370].sum(axis=1)
cc = seam[20:380, :].sum(axis=0)
print("row seam counts (y: count) where count>30:")
print([(y, int(rc[y])) for y in range(len(rc)) if rc[y] > 30])
print("col seam counts (x: count) where count>25:")
print([(x, int(cc[x])) for x in range(len(cc)) if cc[x] > 25])

# 保存seam图用于查看
out = np.clip(seam.astype(np.uint8) * 255, 0, 255)
Image.fromarray(out).resize((390*2, 405*2), Image.NEAREST).save(r"D:/code/daliyPuzzle/.analysis/seam_map.png")
