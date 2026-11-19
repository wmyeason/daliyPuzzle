from PIL import Image

img2 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-592Z-ba3f3f6d.png")
w, h = img2.size  # 376x380
# 底部1/3，右侧2/3
img2.crop((int(w*0.30), int(h*0.72), w, h)).resize((int(w*0.70)*4, int(h*0.28)*4), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/img2_br4x.png")
# 右上角（看月份行第7列是否存在）
img2.crop((int(w*0.55), 0, w, int(h*0.30))).resize((int(w*0.45)*4, int(h*0.30)*4), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/img2_tr4x.png")
# 右下角边界
img2.crop((int(w*0.60), int(h*0.80), w, h)).resize((int(w*0.40)*4, int(h*0.20)*4), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/img2_edge4x.png")
