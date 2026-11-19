from PIL import Image, ImageDraw, ImageFont

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("RGB")
d = ImageDraw.Draw(img)
try:
    font = ImageFont.truetype("arial.ttf", 12)
except Exception:
    font = ImageFont.load_default()

COLW = 46.0
X0 = 18.0
# 7列网格的列边界
colx = [X0 + i*COLW for i in range(8)]
# 行边界（R2锚定 y[46,79]，向下行高递增）
rows_y = [13, 46, 79, 115, 155, 199, 247, 300, 358]

for x in colx:
    d.line([(x, 0), (x, 405)], fill=(255, 0, 0), width=1)
for y in rows_y:
    d.line([(0, y), (390, y)], fill=(0, 200, 0), width=1)

# 标注每个格子中心
labels = []
for r in range(1, 13):
    labels.append((f"{r}月", (r-1)//6+1, (r-1)%6+1))
for dd in range(1, 32):
    r = 2 + (dd-1)//7 + 1
    c = (dd-1)%7 + 1
    labels.append((f"{dd}日", r, c))
wk = ["星期一","星期二","星期三","星期四","星期五","星期六","星期日"]
# R7: C4-C7 = 日一二三 ; R8: C4-C6 = 四五六
labels.append(("星期日", 7, 4)); labels.append(("星期一", 7, 5)); labels.append(("星期二", 7, 6)); labels.append(("星期三", 7, 7))
labels.append(("星期四", 8, 4)); labels.append(("星期五", 8, 5)); labels.append(("星期六", 8, 6))

for text, r, c in labels:
    cx = colx[c-1] + COLW/2
    cy = (rows_y[r-1] + rows_y[r]) / 2
    d.text((cx-10, cy-6), text, fill=(0, 0, 255), font=font)

img.save(r"D:/code/daliyPuzzle/.analysis/img1_grid2.png")
print("saved")

# 同时输出16日和星期五区域放大图（带网格）
img2 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("RGB")
d2 = ImageDraw.Draw(img2)
for x in colx: d2.line([(x, 130), (x, 230)], fill=(255, 0, 0), width=1)
for y in rows_y:
    if 130 < y < 230: d2.line([(0, y), (150, y)], fill=(0, 200, 0), width=1)
img2.crop((0, 130, 150, 230)).resize((150*5, 100*5), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/cell16_grid.png")

img3 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("RGB")
d3 = ImageDraw.Draw(img3)
for x in colx: d3.line([(x, 270), (x, 390)], fill=(255, 0, 0), width=1)
for y in rows_y:
    if 270 < y < 390: d3.line([(150, y), (390, y)], fill=(0, 200, 0), width=1)
img3.crop((150, 270, 390, 390)).resize((240*4, 120*4), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/cellfri_grid.png")
print("saved zooms")
