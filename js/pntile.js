// Copyright (c) Peter Kok, Sharkwing
// All rights reserved.
// See COPYRIGHT.txt for details.

/** The pntile object holds a reference to one Image corresponding to
 *  one tile. The download of the Image is only started when required.
 *  On completing the download, the image is drawn at the specified
 *  rect, which is received from pnimage.
 */
function pntile(context, src) {
    
    // Image and reference to tile for use in image.onload event handler
    this.image = new Image();
    this.image.pntile = this;
    
    // For drawing
    this.context = context;
    this.src = src;
    this.rect = [];
    
    // State flags
    this.isSrcSet = false;
    this.isLoaded = false;
    
    this.setRect = function(rect) {
        // Sets rect and loads/draws
        this.rect = rect;
        if (this.isLoaded) {
            this.draw();
            return;
        }
        if (!this.isSrcSet) {
            this.startLoading();
            return;
        }
        // Otherwise, we can only wait until the image finishes loading
        //TODO: set up time-out & retry?
    }
    
    /** Sets the image src, which starts the download.
     */
    this.startLoading = function() {
        this.image.src = this.src;
        this.isSrcSet = true;
    }
    
    /** Event handler of the tile's image that executes when 
        the image has been loaded. (Note the reference to pntile)
        If this was the last active tile to be loaded, redraw
        everything without clearing, or just draw this tile.
     */
    this.image.onload = function() {
        // "this" will be an instance of the IMAGE
        // in this function!!!
        this.pntile.isLoaded = true;
        if (pnview.activeTilesLoaded()) {
            pnview.draw(false);
        }
        else {
            this.pntile.draw();
        }
    }
    
    /** Draws the image with the previously specified context and rect.
     */
    this.draw = function() {
        this.context.drawImage(this.image, this.rect[0], this.rect[1], this.rect[2], this.rect[3]);
    }    
}