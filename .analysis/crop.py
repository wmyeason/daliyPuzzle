from PIL import Image

img2 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-592Z-ba3f3f6d.png")
print("img2 size:", img2.size)
w, h = img2.size
# 底部区域（星期条）
img2.crop((0, int(h*0.60), w, h)).resize((w*2, int(h*0.40)*2), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/img2_bottom.png")
# 顶部区域（月份行）
img2.crop((0, 0, w, int(h*0.30))).resize((w*2, int(h*0.30)*2), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/img2_top.png")

img1 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png")
print("img1 size:", img1.size)
w1, h1 = img1.size
img1.resize((w1*2, h1*2), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/img1_full2x.png")
