Copyright (c) Peter Kok, Sharkwing
All rights reserved.
See COPYRIGHT.txt for details.


*** P^N Viewer ***
P^N-Viewer is a tiled multi-photo zoom viewer using the javascript html5 canvas. Multiple zoom levels can be specified to explore a composition of multiple photos.

Code available at http://code.google.com/p/pn-viewer/


* Requirements *
The tile generator requires Python with the Python Imaging Library (PIL). The result can be viewed in any browser with javascript support.


* Suggested workflow *

- Collect the photographs you want to put in the scene. For creating panoramas I can recommend Hugin: http://hugin.sourceforge.net

For multi-image compositions:

  - Look at the example_scene.js and (manually) modify it to your own scene (your_scene.js). To determine the position of photos in the scene, you can for example use Photoshop with semi-transparent layers to drag them into the correct positions.

  - Call generate_tiles.py with your_scene.js as the argument. This will generate the tiles according to the specifications in the scene, and your_scene.html, which has the scene pre-set to view the result.

For a single image:

  - Optionally modify single_image_template.js to your requirements (canvas width and height can be set here). The zoomlevels can be explicitly specified (as in example_scene.js) or they will be automatically generated.

  - Call generate_tiles.py with the image file name as first argument and the template scene as the second (the latter is not required if you use single_image_template.js). This will generate the tiles and an html file.

- To be able to view the scene online, upload the files listed below. The original images and the generator are not required to view the scene. Of course you can embed the canvas in your own html page.
  your_scene.html
  your_scene.js
  your_tiles (folder)
  js (folder)