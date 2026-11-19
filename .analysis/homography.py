from PIL import Image, ImageDraw
import numpy as np

# 三个可见格子的凹槽矩形（像素坐标）与逻辑格子边界（0索引，列左边界=col-1，行上边界=row-1）
cells = {
    "R2C4": dict(px=(149,200), py=(46,79),  u=(3,4), v=(1,2)),
    "R5C2": dict(px=(53,80),   py=(167,189), u=(1,2), v=(4,5)),
    "R8C5": dict(px=(215,260), py=(290,330), u=(4,5), v=(7,8)),
}
pts_u, pts_x = [], []
for c in cells.values():
    for uu in c["u"]:
        for vv in c["v"]:
            pass
    # 四个角
    for (uu, vv, xx, yy) in [
        (c["u"][0], c["v"][0], c["px"][0], c["py"][0]),
        (c["u"][1], c["v"][0], c["px"][1], c["py"][0]),
        (c["u"][0], c["v"][1], c["px"][0], c["py"][1]),
        (c["u"][1], c["v"][1], c["px"][1], c["py"][1]),
    ]:
        pts_u.append([uu, vv, 1])
        pts_x.append([xx, yy])

A = np.array(pts_u, dtype=float)   # 12x3
B = np.array(pts_x, dtype=float)   # 12x2
# 解 A @ H = B，H为3x2（每输出坐标3个参数）
H, *_ = np.linalg.lstsq(A, B, rcond=None)  # 3x2
print("H =\n", H)

def uv_to_px(u, v):
    p = np.array([u, v, 1.0]) @ H
    return p[0]/p[2] if len(p)==3 else p

# 上面lstsq解的是线性近似；改用完整单应：对每个输出坐标解 8 参数（含除以w）
# 标准DLT：x = (h0*u+h1*v+h2)/(h6*u+h7*v+1)
def fit_homography(P, Q):
    rows = []
    for (u, v), (x, y) in zip(P, Q):
        rows.append([u, v, 1, 0, 0, 0, -u*x, -v*x, -x])
        rows.append([0, 0, 0, u, v, 1, -u*y, -v*y, -y])
    M = np.array(rows, dtype=float)
    _, _, Vt = np.linalg.svd(M)
    h = Vt[-1]
    Hm = h.reshape(3, 3)
    return Hm

P = [(p[0], p[1]) for p in pts_u]
Q = [(p[0], p[1]) for p in pts_x]
Hm = fit_homography(P, Q)
print("Homography:/n", Hm)

def to_px(u, v):
    vec = np.array([u, v, 1.0])
    r = Hm @ vec
    return (r[0]/r[2], r[1]/r[2])

# 验证
for name, c in cells.items():
    for uu in c["u"]:
        for vv in c["v"]:
            print(name, (uu,vv), "->", tuple(round(x,1) for x in to_px(uu,vv)))

# 叠加网格
img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("RGB")
d = ImageDraw.Draw(img)
for u in range(0, 8):
    p1 = to_px(u, 0); p2 = to_px(u, 8)
    d.line([p1, p2], fill=(255,0,0), width=1)
for v in range(0, 9):
    p1 = to_px(0, v); p2 = to_px(7, v)
    d.line([p1, p2], fill=(255,0,0), width=1)
# 标注行列号
for v in range(8):
    for u in range(7):
        p = to_px(u+0.5, v+0.5)
        d.text((p[0]-4, p[1]-4), f"{u+1},{v+1}", fill=(0,0,255))
img.save(r"D:/code/daliyPuzzle/.analysis/img1_grid.png")
print("saved img1_grid.png")
