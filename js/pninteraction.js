// Copyright (c) Peter Kok, Sharkwing
// All rights reserved.
// See COPYRIGHT.txt for details.

/** Functionality for interaction (keyboard, mousewheel, drag&drop).
 */
pninteraction = {}

/** Adds an event listener.
 */
pninteraction.addEvent = function(element, eventName, callback) {
    if (typeof(element) == "string") {
        element = document.getElementById(element);
    }
    if (element == null) {
        return;
    }
    if (element.addEventListener) {
        if (eventName == 'mousewheel') {
            // Firefox
            element.addEventListener('DOMMouseScroll', callback, false);  
        }
        element.addEventListener(eventName, callback, false);
    }
    else if (element.attachEvent) {
        // Internet Explorer
        element.attachEvent("on" + eventName, callback);
    }
}

/** Removes an event listener.
 */
pninteraction.removeEvent = function(element, eventName, callback) {
    if (typeof(element) == "string") {
        element = document.getElementById(element);
    }
    if (element == null) {
        return;
    }
    if (element.removeEventListener) {
        if (eventName == 'mousewheel') {
            // Firefox
            element.removeEventListener('DOMMouseScroll', callback, false);  
        }
        element.removeEventListener(eventName, callback, false);
    }
    else if(element.detachEvent) {
        // Internet Explorer
        element.detachEvent("on" + eventName, callback);
    }
}

/** Object that keeps track of drag&drop events and their positions.
 */
dragDrop = {
	initialMouseX: undefined,
	initialMouseY: undefined,
	startX: undefined,
	startY: undefined,
	draggedObject: undefined,
	initElement: function (element) {
		if (typeof element == 'string')
			element = document.getElementById(element);
		element.onmousedown = dragDrop.startDragMouse;
	},
	startDragMouse: function (e) {
		dragDrop.startDrag(this);
		var evt = e || window.event;
		dragDrop.initialMouseX = evt.clientX;
		dragDrop.initialMouseY = evt.clientY;
		pninteraction.addEvent(document,'mousemove',dragDrop.dragMouse);
		pninteraction.addEvent(document,'mouseup',dragDrop.releaseElement);
		return false;
	},
	startDrag: function (obj) {
		if (dragDrop.draggedObject)
			dragDrop.releaseElement();
		dragDrop.startX = pnview.vpx;
		dragDrop.startY = pnview.vpy;
		dragDrop.draggedObject = obj;
	},
	dragMouse: function (e) {
		var evt = e || window.event;
		var dX = evt.clientX - dragDrop.initialMouseX;
		var dY = evt.clientY - dragDrop.initialMouseY;
		dragDrop.setPosition(dX,dY);
		return false;
	},
	setPosition: function (dx,dy) {
        pnview.vpx = dragDrop.startX - dx;
        pnview.vpy = dragDrop.startY - dy;
        pnview.draw(true);
	},
	releaseElement: function() {
		pninteraction.removeEvent(document,'mousemove',dragDrop.dragMouse);
		pninteraction.removeEvent(document,'mouseup',dragDrop.releaseElement);
		dragDrop.draggedObject = null;
	}
}
pninteraction.dragDrop = dragDrop;

/** Keyboard input handler.
 */
pninteraction.STEP = 20;
pninteraction.processKeyboardInput = function(event) {
    switch(event.keyCode) {
        case 38: // Up
            pnview.vpy -= pninteraction.STEP;
            pnview.draw(true);
            break;
        case 40: // Down
            pnview.vpy += pninteraction.STEP;
            pnview.draw(true);
            break;
        case 37: // Left
            pnview.vpx -= pninteraction.STEP;
            pnview.draw(true);
            break;
        case 39: // Right
            pnview.vpx += pninteraction.STEP;
            pnview.draw(true);
            break;
        case 107: // +
            pninteraction.changelevel(1, 0.5*pnview.canvas.width, 0.5*pnview.canvas.height);
            break;
        case 109: // -
            pninteraction.changelevel(-1, 0.5*pnview.canvas.width, 0.5*pnview.canvas.height);
            break;
    }
};

/** Mouse wheel handler.
 */
pninteraction.onmousewheel = function(e) {
    // Browser compatibility stuff
    e = e ? e : window.event;
    var wheelData = e.detail ? e.detail * -1 : e.wheelDelta / 40;
    
    // In/decrement zoom level
    var increment = wheelData < 0 ? -1 : 1;
    pninteraction.changelevel(increment, e.clientX, e.clientY);
}

/** Changes level by increment, centering on specified canvas coordinates.
 */
pninteraction.changelevel = function(increment, centerX, centerY) {
    
    // Viewport origin in space
    var originX = pnview.vpx;
    var originY = pnview.vpy;
    var level = pnview.level;
    
    // Check level bounds
    if (level + increment < 0 || level + increment >= scene.scene.zoomlevels.length) {
        return;
    }
    
    // Position of mouse pointer in canvas
    var canvasX = centerX - pnview.canvas.offsetLeft;
    var canvasY = centerY - pnview.canvas.offsetTop;
    
    // Position of mouse pointer in space
    var spaceX = canvasX + originX;
    var spaceY = canvasY + originY;
    
    var scale = Math.pow(2, increment);
    
    // New position of mouse pointer in space
    var newSpaceX = spaceX * scale;
    var newSpaceY = spaceY * scale;
    
    // New viewport origin in space
    pnview.vpx = Math.floor(newSpaceX - canvasX);
    pnview.vpy = Math.floor(newSpaceY - canvasY);
    pnview.prevLevel = level;
    pnview.level += increment;
    
    pnview.draw(true);
}
