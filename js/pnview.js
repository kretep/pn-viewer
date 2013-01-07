// Copyright (c) Peter Kok, Sharkwing
// All rights reserved.
// See COPYRIGHT.txt for details.

/** Main view object that contains references to all images, active tiles,
 *  scene viewport & zoomlevel and context handles for drawing.
 */
var pnview = {};

/** Starts the viewer:
 *  Gets canvas and context, sets up the event handlers,
 *  initializes the images and does a first draw.
 */
pnview.start = function() {
    pnview.canvas = document.getElementById('pnview');
    pnview.context2d = pnview.canvas.getContext('2d');
    
    // Current and previous zoom index
    pnview.level = scene.scene.level;
    pnview.prevLevel = -1;

    // Position of the canvas (viewport) in level-image space
    pnview.vpx = scene.scene.vpx;
    pnview.vpy = scene.scene.vpy;

    // List with pnimage instances
    pnview.images = [];

    // List with active tiles
    pnview.activeTiles = [];
    
    // Set up event handlers
    pninteraction.dragDrop.initElement(pnview.canvas);
    pninteraction.addEvent(pnview.canvas, 'mousewheel', pninteraction.onmousewheel);
    pninteraction.addEvent(window, 'keydown', pninteraction.processKeyboardInput);
    
    // Initialize the images
    for (image_index in scene.scene.images) {
        var image = scene.scene.images[image_index];
        var pnim = new pnimage(image);
        pnim.initialize(pnview.context2d, image_index);
        pnview.images[image_index] = pnim;
    }
    
    // Draw
    pnview.draw(true);
};
pninteraction.addEvent(window, 'load', pnview.start);

/** Draws all images at the current zoomlevel.
    If doClear == true, it will clear the canvas and active tiles.
    Otherwise, it acts as a refresh for the loaded tiles and should
    be called when pnview.activeTilesLoaded() returns true for the
    first time, so all tiles will be drawn in the correct order.
*/
pnview.draw = function(doClear) {
    if (doClear) {
        pnview.context2d.clearRect(0, 0, pnview.canvas.width, pnview.canvas.height);
        pnview.context2d.beginPath();
        pnview.activeTiles = [];
    }
    
    // Get the current zoomlevel & scale
    var zoomlevel = scene.scene.zoomlevels[pnview.level];
    
    // Draw the images
    pnview.context2d.shadowColor="none";
    var image_indices = zoomlevel.images;
    for (var i=0; i<image_indices.length; i++) {
        var image_index = image_indices[i];
        var pnim = pnview.images[image_index];
        pnview.drawPnim(pnim, zoomlevel.scale);
    }
    
    // Draw the rects
    //TODO: move rect drawing here
    
    //Draw the labels
    pnview.context2d.strokeStyle = "#FFFFFF";
    pnview.context2d.lineCap = "round";
    pnview.context2d.lineWidth = "1.5";
    pnview.context2d.fillStyle = "#FFFFFF";
    pnview.context2d.font = "15px Arial";
    pnview.context2d.shadowColor="black";
    pnview.context2d.shadowOffsetX=2;
    pnview.context2d.shadowOffsetY=2;
    pnview.context2d.shadowBlur=3;    
    var label_indices = zoomlevel.labels;
    for (var i=0; i<label_indices.length; i++) {
        var label_index = label_indices[i];
        var label = scene.scene.labels[label_index];
        var x = label.x * zoomlevel.scale - pnview.vpx;
        var y = label.y * zoomlevel.scale - pnview.vpy;
        var tx = (typeof label.tx != 'undefined') ? label.tx : 30;
        var ty = (typeof label.ty != 'undefined') ? label.ty : -10;
        pnview.context2d.moveTo(x, y);
        pnview.context2d.lineTo(x + tx, y + ty);
        pnview.context2d.fillText(label.text, x + tx + 4, y + ty + 2);
    }
    pnview.context2d.stroke();
    
};

/** Draws the visible tiles of the specified image.
*/
pnview.drawPnim = function(pnim, zoomlevelScale) {
    var stw = scene.scene.tilewidth;
    var sth = scene.scene.tileheight;
    var tile, x, y, w, h;
    var level = pnview.level; //TODO: rename level to zoomIndex?
    var tileWidth, tileHeight;
    
    // Calculate whole scale
    var wholeScaleX = zoomlevelScale * pnim.im2SceneScaleX;
    var wholeScaleY = zoomlevelScale * pnim.im2SceneScaleY;
    
    // Determine tile width and height
    if (wholeScaleX > 1.0 || wholeScaleY > 1.0) {
        // For positive zoom levels (zoomed in), show zoomed tiles of non-scaled level
        level = pnim.nsi; // Set level to non-scaled zoom index
        
        // Get the scale at the non-scaled zoom index, because we need to correct for it if != 1.0
        var nsZoomlevel = scene.scene.zoomlevels[level];
        nsiScaleX = nsZoomlevel.scale * pnim.im2SceneScaleX;
        nsiScaleY = nsZoomlevel.scale * pnim.im2SceneScaleY;
        tileWidth = stw * wholeScaleX / nsiScaleX;
        tileHeight = sth * wholeScaleY / nsiScaleY;
    }
    else {
        tileWidth = stw;
        tileHeight = sth;
    }
    
    // Level image bounds placed in scene in global level-image space
    var levImX = Math.floor(pnim.x * zoomlevelScale);
    var levImY = Math.floor(pnim.y * zoomlevelScale);
    var levImW = Math.floor(pnim.w * zoomlevelScale);
    var levImH = Math.floor(pnim.h * zoomlevelScale);
    
    // The viewport in the local level-image space
    var x1 = pnview.vpx - levImX;
    var y1 = pnview.vpy - levImY;
    var x2 = x1 + pnview.canvas.width;
    var y2 = y1 + pnview.canvas.height;
    
    // The viewport in image tile space
    var nx = pnim.tiles[level][0].length;
    var ny = pnim.tiles[level].length;
    var startXi = Math.max(Math.floor(x1 / tileWidth), 0);
    var startYi = Math.max(Math.floor(y1 / tileHeight), 0);
    var endXi = Math.min(Math.floor(x2 / tileWidth) + 1, nx);
    var endYi = Math.min(Math.floor(y2 / tileHeight) + 1, ny);
    
    var lastBitX = Math.floor((1.0*levImW/tileWidth - Math.floor(levImW/tileWidth)) * tileWidth);
    var lastBitY = Math.floor((1.0*levImH/tileHeight - Math.floor(levImH/tileHeight)) * tileHeight);
    
    // Draw the tiles within the bounds
    for (yi=startYi; yi<endYi; yi++) {
        for (xi=startXi; xi<endXi; xi++) {
        
            tile = pnim.tiles[level][yi][xi];
            x = xi*tileWidth - pnview.vpx + levImX;
            y = yi*tileHeight - pnview.vpy + levImY;
            w = tileWidth;
            h = tileHeight;
            
            if (xi == nx - 1) {
                w = lastBitX;
            }
            if (yi == ny - 1) {
                h = lastBitY;
            }
            tile.setRect([x, y, w, h]);
            pnview.activeTiles.push(tile);
            
            /* off-level rendering:
            if (scale != 1) {
                if (tile.isLoaded) {
                    tile.setRect([x, y, width, height]);
                }
                else {
                //TODO: cancel any load
                }
            }
            else {
                tile.setRect([x, y, width, height]);
            }*/
        }
    }
    
    pnview.context2d.strokeStyle="#FF0000";
    pnview.context2d.strokeRect(levImX - pnview.vpx, levImY - pnview.vpy, levImW, levImH);
};

/** Returns whether all active tiles have finished loading.
 */
pnview.activeTilesLoaded = function() {
    for (tile_index in pnview.activeTiles) {
        tile = pnview.activeTiles[tile_index];
        if (!tile.isLoaded) {
            return false;
        }
    }
    return true;
}
