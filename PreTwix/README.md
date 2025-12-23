# PreTwix – After Effects Script

## Overview
PreTwix is an After Effects script that automatically detects and removes duplicate "dead frames" from videos before applying frame interpolation effects (like Twixtor). PreTwix is especially usefull for animated videos because those often have duplicated frames.

## Features
### Main Function
- **PreTwix Layer**: Fully automated workflow that renders frames, analyzes them for duplicates, and applies time remapping to remove dead frames
- **V Frame**: Optional reference frame that shows where interpolated frames end (useful for when you twixtor)
- **Clean Temp**: Automatically cleans up temporary files after processing

### Developer Tools
- **Render**: Manually render selected layer to PNG sequence
- **Analyze**: Run Python analysis on rendered frames to detect duplicates
- **Remap**: Apply time remapping based on analysis results
- **Clean Up Temp Files**: Manually clean temporary files and reset analysis data

### Cross-Platform Support
- Works on both **Windows** and **macOS**
- Automatically detects and uses compatible Python versions (3.9-3.11)
- Attempts multiple Python installation paths for maximum compatibility

---

## Requirements
- **Adobe After Effects** (any recent version)
- **Python 3.9, 3.10, or 3.11** (required for frame analysis)
  - Python 3.12+ is **not supported** by the analysis script
  - Download Python 3.11 from [python.org](https://www.python.org/downloads/)

### Python Installation Notes
**Windows:**
- The script will attempt to use the Python Launcher (`py -3.11`)
- Make sure to check "Add Python to PATH" during installation

**macOS:**
- Install via [python.org](https://www.python.org/downloads/) or Homebrew
- The script will try common installation locations automatically

---

## Installation
1. Download the .jsx script file and PreTwix_Files folder
2. Place both downloads in the same directory within your After Effects Scripts folder:

**macOS:**  
`/Applications/Adobe After Effects [version]/Scripts/ScriptUI Panels/`

**Windows:**  
`C:\Program Files\Adobe\Adobe After Effects [version]\Support Files\Scripts\ScriptUI Panels\`

3. Restart After Effects.
4. In After Effects navigate to Edit > Prefrences > Scripting and Expressions, and then 
check the box "Allow Scripts to Write Files and Access Network".

---

After PreTwix processing, you can apply frame interpolation tools like Twixtor to the resulting `_PRETWIX` layer for smoother results.

## Additional Notes
This is currently in the prototype stage, meaning its not extremely reliable. Its pretty good, however from time to time I am still getting one or two extra dead frames which shouldn't be in there. Further testing can probably help with this, especially manipulating the "thresh" variable in analyze_Frames. I also haven't added specific support for things like camera shake but still characters so this will probably fail at twixtoring there.

This takes a medium amount of time. I dont have the fastest computer and this can still do 2 seconds of footage in about 10 seconds which I think is pretty good, maybe around the time it takes to do it manually. With longer footage this will become even more useful.

There is currently a permissions issue if working in the Scripts UI folder but that will be fixed pretty soon.