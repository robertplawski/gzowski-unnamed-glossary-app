# load pages into txt
python load-pdf.py split assets/focus-4.pdf --output-dir assets/split --pages 16,17,32,33,48,49,64,65,80,81,96,97,112,113,128,129
# read pages
python load-pdf.py read-pages assets/split 16,17,32,33,48,49,64,65,80,81,96,97,112,113,128,129
