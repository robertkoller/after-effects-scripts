import cv2
import os
import json
import sys

folder = sys.argv[1]
thresh = 0.37

files = sorted([f for f in os.listdir(folder) if f.lower().endswith(".png")])

prev = None
dead = []

diff_analysis_path = os.path.join(folder, "diff_analysis.json")
dead_frames_path = os.path.join(folder, "deadFrames.json")

with open(diff_analysis_path, "w") as out:
    out.write("[\n")
    first = True

    for i, filename in enumerate(files):
        frame_path = os.path.join(folder, filename)

        img = cv2.imread(frame_path, cv2.IMREAD_GRAYSCALE)

        entry = {
            "frame": i,
            "filename": filename,
            "diff_mean": None,
            "is_dead": False
        }

        if img is None:
            entry["error"] = "failed_to_load"
            prev = None

        elif prev is not None:
            if img.shape != prev.shape:
                entry["error"] = "dimension_mismatch"
                prev = img
            else:
                diff = cv2.absdiff(img, prev)
                mean_diff = float(diff.mean())
                entry["diff_mean"] = mean_diff
                entry["is_dead"] = mean_diff < thresh

                if entry["is_dead"]:
                    dead.append(i)

                prev = img
        else:
            prev = img

        if not first:
            out.write(",\n")
        json.dump(entry, out)
        first = False

    out.write("\n]")

with open(dead_frames_path, "w") as f:
    json.dump(dead, f)
