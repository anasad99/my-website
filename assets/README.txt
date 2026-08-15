This folder needs 25 image files. It ships empty because the build environment
is firewalled off from Figma's servers — your browser and your terminal are not.

TWO WAYS TO FILL IT
-------------------

1. Open get-assets.html (in the folder above this one) in any browser and press
   the button. Everything downloads; move the files in here.

2. Or from a terminal, in the folder above this one:

       bash download-assets.sh

Both fetch the same 25 files.

WHEN THE LINKS EXPIRE
---------------------
Figma's export URLs die around 22 August 2026. After that, export the layers
from Figma by hand. download-assets.sh lists every filename the site expects,
grouped by page. Names must match exactly.
