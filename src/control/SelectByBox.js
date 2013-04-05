/**
 * DECIDE GIS
 * Copyright (C) 2010 Adrian Weber
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

OpenLayers.Control.SelectByBox = OpenLayers.Class(OpenLayers.Control, {
    /** @lends OpenLayers.Control.SelectByBox# */

    /**
     * Available event types
     * @static
     */
    EVENT_TYPES: ["select"],

    /**
     * Tolerance to add to mouse click to create a bounding box.
     */
    pixelTolerance: 2,

    defaultHandlerOptions: {
        'single': true,
        'double': false,
        'pixelTolerance': 0,
        'stopSingle': false,
        'stopDouble': false
    },

    /**
     * This class provides a map control that lets the user click and drag a box and returns
     * a valid bounding box in map coordinates. This bounding box can be used
     * to spatially select features.
     * @class Implements a GIS select by bounding box control
     * @constructs
     * @param {Object} options An object containing constructor options.
     */
    initialize: function(options) {

        // concatenate events specific to this control with those from the base
        this.EVENT_TYPES = OpenLayers.Control.SelectByBox.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.prototype.EVENT_TYPES
            );

        this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
        OpenLayers.Control.prototype.initialize.call(this, options);
        this.handler = new OpenLayers.Handler.Box(this, {
            'done': this.onDone
        }, this.handlerOptions );
    },

    /**
     * @private
     * Get the current postition and create a {OpenLayers.Bounds}
     * @param {OpenLayers.Bounds|OpenLayers.Pixel} position Bounding box or position
     * of control
     * @returns {OpenLayers.Bounds} Bounding box in map coordinates
     */
    onDone: function(position) {
        var minXY, maxXY;
        if (position instanceof OpenLayers.Bounds) {
            minXY = this.map.getLonLatFromPixel(
                new OpenLayers.Pixel(position.left, position.bottom));
            maxXY = this.map.getLonLatFromPixel(
                new OpenLayers.Pixel(position.right, position.top));

        } else {
            minXY = this.map.getLonLatFromPixel(
                new OpenLayers.Pixel( (position.x-this.pixelTolerance),
                    (position.y-this.pixelTolerance) ));
            maxXY = this.map.getLonLatFromPixel(
                new OpenLayers.Pixel( (position.x+this.pixelTolerance),
                    (position.y+this.pixelTolerance) ));
        }

        this.position = new OpenLayers.Bounds(
            minXY.lon, minXY.lat,
            maxXY.lon, maxXY.lat);

        this.events.triggerEvent("select", { response: this.position });
    }

});