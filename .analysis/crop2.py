from PIL import Image

img1 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png")
w, h = img1.size  # 390x405
# 棋盘区域大致占满整张图，分四象限放大
img1.crop((0, 0, w//2, h//2)).resize((w//2*3, h//2*3), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/q_tl.png")
img1.crop((w//2, 0, w, h//2)).resize((w//2*3, h//2*3), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/q_tr.png")
img1.crop((0, h//2, w//2, h)).resize((w//2*3, h//2*3), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/q_bl.png")
img1.crop((w//2, h//2, w, h)).resize((w//2*3, h//2*3), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/q_br.png")
