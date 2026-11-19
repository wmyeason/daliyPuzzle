from PIL import Image
img1 = Image.open(r"C:/Users/25063/.workbuddy/clipboard-images/clipboard-2026-10-19T09-16-32-590Z-233ea960.png")
img1.crop((30, 140, 130, 220)).resize((100*8, 80*8), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/c16_only.png")
img1.crop((130, 30, 230, 100)).resize((100*8, 70*8), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/c10_only.png")
img1.crop((180, 270, 260, 345)).resize((80*8, 75*8), Image.LANCZOS).save(r"D:/code/daliyPuzzle/.analysis/cfri_only.png")
