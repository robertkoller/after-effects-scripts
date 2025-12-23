import cv2, os, json, sys
import numpy as np

folder = sys.argv[1]
files = sorted([f for f in os.listdir(folder) if f.endswith(".png")])
print("here")

dead = []
prev = None
thresh = 0.2

for i, f in enumerate(files):
    img = cv2.imread(os.path.join(folder, f), cv2.IMREAD_GRAYSCALE)
    if prev is not None:
        diff = cv2.absdiff(img, prev)
        print(diff.mean())
        if diff.mean() < thresh:
            dead.append(i)
    prev = img

with open(os.path.join(folder, "deadFrames.json"), "w") as f:
    json.dump(dead, f)
