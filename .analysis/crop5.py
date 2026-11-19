from PIL import Image

img1 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png")
w, h = img1.size  # 390x405
# 顶部条带
img1.crop((0, 0, w, int(h*0.35))).resize((w*3, int(h*0.35)*3), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/img1_top.png")
# 中间条带
img1.crop((0, int(h*0.30), w, int(h*0.70))).resize((w*3, int(h*0.40)*3), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/img1_mid.png")
