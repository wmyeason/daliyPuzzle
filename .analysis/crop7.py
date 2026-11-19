from PIL import Image
img1 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png")
# 右下角大区域
img1.crop((180, 270, 360, 405)).resize((180*5, 135*5), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/br_big.png")
# 16日区域（含上下文中）
img1.crop((0, 120, 180, 260)).resize((180*5, 140*5), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/c16_big.png")
