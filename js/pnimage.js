// Copyright (c) Peter Kok, Sharkwing
// All rights reserved.
// See COPYRIGHT.txt for details.

/** Each instance of pnimage corresponds to one photograph and refers to
 *  the tile grids of all zoom levels of this photograph, which are constructed
 *  based on the zoomlevel specification in the scene. Further attributes
 *  include the image dimensions and its bounds in scene space (which are
 *  required for rendering).
 */
function pnimage(image) {
    // Array of 2D tile grids (indexed per zoom level)
    this.tiles = [];
    
    // Actual image size (image space):
    this.width = image.width
    this.height = image.height
    
    // Bounds in scene space:
    this.x = image.x;
    this.y = image.y;
    this.w = image.w;
    this.h = image.h;
    
    // Non-scale zoom index (for upscaling)
    this.nsi = -1;
    
    // Original-image-to-scene scale
    this.im2SceneScaleX = this.w / image.width;
    this.im2SceneScaleY = this.h / image.height;
    
    /** Initializes the tiles by creating the pntile grids for each zoom level.
     *  The tile images will not be downloaded yet.
     */
    this.initialize = function(context, image_index) {
        var row;
        var tile;
        var src;
        
        for (zoom_index in scene.scene.zoomlevels) {
            var zoomlevel = scene.scene.zoomlevels[zoom_index];
            var image_indices = zoomlevel.images;
            
            // Check whether the image is visible in this zoom level
            var contains = false;
            for (i in image_indices) {
                if (image_indices[i] == image_index) {
                    contains = true;
                }
            }
            
            if (contains) { //image_indices.indexOf(image_index) >= 0) {
                wholeScaleX = zoomlevel.scale * this.im2SceneScaleX;
                wholeScaleY = zoomlevel.scale * this.im2SceneScaleY;
                if (wholeScaleX <= 1.0 && wholeScaleY <= 1.0) {
                
                    // Calculate number of tiles at this zoom level
                    scaledW = Math.floor(wholeScaleX * this.width)
                    scaledH = Math.floor(wholeScaleY * this.height)
                    wi = Math.floor(scaledW / scene.scene.tilewidth) + 1
                    hi = Math.floor(scaledH / scene.scene.tileheight) + 1
                    
                    // Loop through the tile space to build the tile grid
                    grid = [];
                    for (yi=0; yi<hi; yi++) {
                        row = [];
                        for (xi=0; xi<wi; xi++) {
                            src = scene.scene.tilefolder + '/tile_' +
                            image_index + '_' + zoom_index + '_' +
                            xi + '_' + yi + '.jpg';
                            tile = new pntile(context, src);
                            row[xi] = tile;
                        }
                        grid[yi] = row;
                    }
                    this.tiles[zoom_index] = grid;
                }
                else {
                    // Set non-scale zoom index to the previous level that
                    // was still downscaling
                    if (this.nsi == -1) {
                        this.nsi = zoom_index - 1;
                    }
                }
            }
        }
    }
}