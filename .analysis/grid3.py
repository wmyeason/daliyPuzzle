from PIL import Image, ImageDraw

img = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png").convert("RGB")
w, h = img.size
COLW = 46.0; X0 = 18.0
colx = [X0 + i*COLW for i in range(8)]
rows_y = [13, 46, 79, 115, 155, 199, 247, 300, 358]
d = ImageDraw.Draw(img)
for x in colx: d.line([(x, 0), (x, h)], fill=(255, 0, 0), width=1)
for y in rows_y: d.line([(0, y), (w, y)], fill=(0, 200, 0), width=1)
# 左半（避开遮罩）
img.crop((0, 0, 200, 175)).resize((200*4, 175*4), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/g_tl.png")
img.crop((0, 225, 200, 405)).resize((200*4, 180*4), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/g_bl.png")
img.crop((150, 0, 390, 175)).resize((240*4, 175*4), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/g_tr.png")
img.crop((150, 225, 390, 405)).resize((240*4, 180*4), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/g_br.png")
print("ok")
