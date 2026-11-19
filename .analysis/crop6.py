from PIL import Image
img1 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png")
# 16日 及左侧区域
img1.crop((0, 130, 150, 220)).resize((150*5, 90*5), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/cell16.png")
# 10月 及周边
img1.crop((140, 40, 280, 120)).resize((140*5, 80*5), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/cell10.png")
# 星期五 及周边
img1.crop((200, 270, 330, 390)).resize((130*5, 120*5), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/cell_fri.png")
