# Copyright (c) Peter Kok, Sharkwing
# All rights reserved.
# See COPYRIGHT.txt for details.

from PIL import Image
import sys
import json
import os

def main(args):
    
    # Load scene
    base_folder = os.getcwd()
    scene_relpath = args[1]
    scene_folder, scene_filename = os.path.split(scene_relpath)
    scene_path = os.path.join(base_folder, scene_relpath)
    data_string = ''
    for line in open(scene_path).readlines():
        data_string += line
    # Ignore the 'scene = ' assignment, which is not valid JSON:
    data_string = data_string[8:]
    scene = json.loads(data_string)["scene"]
    
    # Set global variables
    tileWidth = scene["tilewidth"]
    tileHeight = scene["tileheight"]
    print "Tile size:", (tileWidth, tileHeight)
    
    # Tile folder
    tile_folder = scene["tilefolder"]
    tile_path = os.path.join(base_folder, tile_folder)
    if not os.path.exists(tile_path):
        os.mkdir(tile_path)
    print "Tile folder:", tile_path
    
    # Process images
    image_index = 0
    for image in scene["images"]:
        im = Image.open(image["path"])
        width, height = im.size
        
        im2SceneScaleX = image["w"] / width
        im2SceneScaleY = image["h"] / height
        
        # Loop through zoom levels
        zoom_index = 0
        for zoomlevel in scene["zoomlevels"]:
            
            image_indices = zoomlevel["images"]
            if image_index in image_indices:
                # Calculate scale
                zoomlevelScale = zoomlevel["scale"]
                wholeScaleX = im2SceneScaleX * zoomlevelScale
                wholeScaleY = im2SceneScaleY * zoomlevelScale
                
                # Only resize (and tile) for downscaling
                if wholeScaleX <= 1 and wholeScaleY <= 1:
                    # Resize
                    newSize = (int(wholeScaleX * width),
                               int(wholeScaleY * height))
                    imResized = im.resize(newSize, Image.BICUBIC)
                    
                    # Calculate part of image in last tiles
                    lastBitX = int((1.0*newSize[0]/tileWidth - int(newSize[0]/tileWidth)) * tileWidth)
                    lastBitY = int((1.0*newSize[1]/tileHeight - int(newSize[1]/tileHeight)) * tileHeight)
                    
                    # Create and write tiles
                    wi = int(newSize[0] / tileWidth) + 1
                    hi = int(newSize[1] / tileHeight) + 1
                    print "Image %s, zoomlevel %s: %s pixels, %s x %s tiles" % (image_index, zoom_index, newSize, wi, hi)
                    for yi in range(hi):
                        for xi in range(wi):
                            # Set up crop box
                            cropBox = [xi * tileWidth,
                                       yi * tileHeight,
                                       xi * tileWidth,
                                       yi * tileHeight]
                            if xi == wi - 1:
                                cropBox[2] += lastBitX
                            else:
                                cropBox[2] += tileWidth
                            if yi == hi - 1:
                                cropBox[3] += lastBitY
                            else:
                                cropBox[3] += tileHeight
                            
                            # Crop and save
                            imCropped = imResized.crop(cropBox)
                            filename = "tile_%s_%s_%s_%s.jpg" % (image_index, zoom_index, xi, yi)
                            path = os.path.join(tile_path, filename)
                            if not os.path.exists(path):
                                imCropped.save(path)
            
            zoom_index += 1
        image_index += 1
    
    # Process html template
    file = open("template.html", 'r')
    data = file.read()
    file.close()
    data = data.replace("#scene_file#", scene_relpath)
    title, ext = os.path.splitext(scene_filename)
    path = os.path.join(base_folder, scene_folder, title + ".html")
    if not os.path.exists(path):
        file = open(path, 'w')
        file.write(data)
        file.close()
        print "Written html to", path
    else:
        print "Html already exists:", path
    
if __name__ == "__main__":
    main(sys.argv)
