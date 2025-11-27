source .venv/bin/activate

# load pages into txt
python load-pdf.py split assets/focus-1.pdf --output-dir assets/split/focus-1 --pages 21,33,45,57,69,81,93,105
# read pages
python load-pdf.py read-pages assets/split/focus-1 21,33,45,57,69,81,93,105
# test regex
python load-pdf.py test-regex assets/split/focus-1 21,33,45,57,69,81,93,105 -o assets/focus-1.json

# load pages into txt
python load-pdf.py split assets/focus-4.pdf --output-dir assets/split/focus-4 --pages 16,17,32,33,48,49,64,65,80,81,96,97,112,113,128,129
# read pages
python load-pdf.py read-pages assets/split/focus-4 16,17,32,33,48,49,64,65,80,81,96,97,112,113,128,129
# test regex
python load-pdf.py test-regex assets/split/focus-4 16,17,32,33,48,49,64,65,80,81,96,97,112,113,128,129 -o assets/focus-4.json

# load pages into txt
python load-pdf.py split assets/focus-3.pdf --output-dir assets/split/focus-3 --pages 15,16,29,43,57,71,85,99,113
# read pages
python load-pdf.py read-pages assets/split/focus-3 15,16,29,43,57,71,85,99,113
# test regex
python load-pdf.py test-regex assets/split/focus-3 15,16,29,43,57,71,85,99,113 -o assets/focus-3.json

# load pages into txt
python load-pdf.py split assets/focus-2.pdf --output-dir assets/split/focus-2 --pages 15,29,43,57,71,85,99,113
# read pages
python load-pdf.py read-pages assets/split/focus-2 15,29,43,57,71,85,99,113
# test regex
python load-pdf.py test-regex assets/split/focus-2 15,29,43,57,71,85,99,113 -o assets/focus-2.json
