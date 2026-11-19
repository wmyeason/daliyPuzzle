from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("L")
a = np.array(img, dtype=float)
h, w = a.shape

# 拼缝/刻槽：比21x21局部中位数暗18以上
med = ndimage.median_filter(a, size=21)
dark = (med - a) > 16
# 去掉遮罩区域与水印
dark[172:230, :] = False
dark[:, 344:] = False
dark[:6, :] = False
dark[396:, :] = False

def hsegments(mask, min_len=14):
    segs = []
    for y in range(mask.shape[0]):
        row = mask[y]
        x = 0
        while x < len(row):
            if row[x]:
                x0 = x
                while x < len(row) and row[x]:
                    x += 1
                if x - x0 >= min_len:
                    segs.append((y, x0, x-1))
            else:
                x += 1
    return segs

def vsegments(mask, min_len=12):
    segs = []
    for x in range(mask.shape[1]):
        col = mask[:, x]
        y = 0
        while y < len(col):
            if col[y]:
                y0 = y
                while y < len(col) and col[y]:
                    y += 1
                if y - y0 >= min_len:
                    segs.append((x, y0, y-1))
            else:
                y += 1
    return segs

hsegs = hsegments(dark)
vsegs = vsegments(dark)
print(f"horizontal segments: {len(hsegs)}, vertical: {len(vsegs)}")

# 聚合：相近的y(±2)合并，取x范围并集
def aggregate(segs, keyidx, minspan):
    segs = sorted(segs)
    groups = []
    for s in segs:
        placed = False
        for g in groups:
            if abs(g[keyidx] - s[keyidx]) <= 2:
                g['x0'] = min(g['x0'], s[1] if keyidx==0 else s[0])
                # 统一处理
                placed = True
                break
        if not placed:
            groups.append({'y': s[0], 'x0': s[1], 'x1': s[2]})
    return groups

# 简单聚合：按中心y聚类
def cluster(segs, is_h):
    items = []
    for s in segs:
        if is_h:
            y, x0, x1 = s
            items.append(dict(y=y, x0=x0, x1=x1))
        else:
            x, y0, y1 = s
            items.append(dict(y=x, x0=y0, x1=y1))
    items.sort(key=lambda d: d['y'])
    clusters = []
    for it in items:
        if clusters and abs(clusters[-1]['y'] - it['y']) <= 2:
            c = clusters[-1]
            c['x0'] = min(c['x0'], it['x0']); c['x1'] = max(c['x1'], it['x1'])
            c['ys'].append(it['y'])
        else:
            clusters.append(dict(y=it['y'], x0=it['x0'], x1=it['x1'], ys=[it['y']]))
    for c in clusters:
        c['y'] = int(np.mean(c['ys']))
        c['span'] = c['x1'] - c['x0']
    return clusters

hc = cluster(hsegs, True)
vc = cluster(vsegs, False)
print("\n=== 水平线段（y, x范围, 跨度）跨度>100的是行边界 ===")
for c in sorted(hc, key=lambda d: -d['span'])[:30]:
    print(f"  y={c['y']:3d}  x[{c['x0']:3d},{c['x1']:3d}]  span={c['span']}")
print("\n=== 垂直线段（x, y范围, 跨度）跨度>60的是列边界 ===")
for c in sorted(vc, key=lambda d: -d['span'])[:30]:
    print(f"  x={c['y']:3d}  y[{c['x0']:3d},{c['x1']:3d}]  span={c['span']}")
