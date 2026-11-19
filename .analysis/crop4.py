from PIL import Image

img2 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-592Z-ba3f3f6d.png")
# R7-R8 右侧区域（星期条）
img2.crop((140, 250, 360, 380)).resize((220*5, 130*5), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/week_strip.png")
# R7 整行（29-31日 + 星期）
img2.crop((0, 250, 376, 320)).resize((376*3, 70*3), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/r7.png")
