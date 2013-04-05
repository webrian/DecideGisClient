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

Ext.ns('Ext.ux');

Ext.ux.MapSelection = Ext.extend(Ext.util.Observable, {
    /** @lends Ext.ux.MapSelection# */

    /**
     * A reference to the map. Has to be defined with the
     * config options.
     * @type {OpenLayers.Map}
     */
    map: null,

    layer: null,

    /**
     * This class provides methods to select features based on a spatial extent
     * or based on attribute conditions and to show these on the map as well as
     * in a {@link Ext.ux.data.SelectionStore}.
     * @constructs
     * @augments Ext.util.Observable
     * @param {Object} config Configuration object. Additional to the config
     * option from {Ext.data.Store}, the <i>map</i> config option is required.
     */
    constructor: function(config){
        this.map = config.map;
        this.layer = config.layer;
        // Call our superclass constructor to complete construction process.
        Ext.ux.MapSelection.superclass.constructor.call(this, config);
    },

    /**
     * @public
     * Select features based on a bounding box.
     * @param {OpenLayers.Bounds} bbox Features intersecting this bounding
     * box are selected
     * @returns {OpenLayers.Layer.WMS.POST} A WMS layer with selected features
     */
    selectByBox: function(bbox){
        return this.createLayer(this.createSelectByBoxStyle(bbox));
    },

    /**
     * @param {OpenLayers.Geometry.Polygon} polygon
     * @returns void
     */
    selectFreehand: function(polygon) {
        return this.createLayer(this.createSelectFreehandStyle(polygon));
    },

    /**
     * Select features based on attribute conditions.
     * @param {OpenLayers.Layer} layer The current layer with a selection, if
     * there is any.
     * @param {Ext.data.Store} store Store that holds the attribute selections
     * @returns {OpenLayers.Layer.WMS.POST} A WMS layer with selected features
     */
    selectByAttributes: function(ops, store) {
        return this.createLayer(this.createSelectByAttributesStyle(ops, store));
    },

    /**
     * @private
     * @returns {OpenLayers.Layer.WMS.POST} A WMS layer with selected features
     */
    createLayer: function(style){
        var sld_format = new OpenLayers.Format.SLD();
        var sld_body = sld_format.write(style);

        // Remove first the existing selection
        /*if(this.layer) {
            this.map.removeLayer(this.layer);
            this.layer = null;
        }*/

        // Create a new layer
        var layer = new OpenLayers.Layer.WMS(
            "selection",
            Ext.ux.GeoServerUrl + "/wms",
            {
                dataset: 'census2005',
                sld_body: sld_body,
                transparent: true,
                format: "image/png",
                srs: "EPSG:900913"
            }, {
                isBaseLayer: false,
                displayInLayerSwitcher: false,
                visibility: true,
                sphericalMercator: true
            });

        //this.map.addLayer(this.layer);

        // Bring the identify layer to the front
        //this.map.setLayerZIndex(this.layer, this.map.layers.length);

        return layer
    },

    /**
     * @private
     * Creates a new style with a spatial bounding box filter to handle spatial
     * mouse selections.
     * @param {OpenLayers.Bounds} boundingBox
     * @returns {OpenLayers.Style} A style that highlights all features within
     * the select bounding box
     */
    createSelectByBoxStyle: function(boundingBox) {

        // The spatial filter, it is important to
        // set the property correctly
        var filter = new OpenLayers.Filter.Spatial({
            type: OpenLayers.Filter.Spatial.BBOX,
            value: boundingBox,
            property: 'wkb_geometry'
        });

        return this.createSelectStyle(filter);

    },

    /**
     * @private
     * @param {OpenLayers.Geometry.Polygon} polygon
     * @returns {OpenLayers.Style} A style that highlights all features that
     * intersects the input polygon
     */
    createSelectFreehandStyle: function(polygon) {
        // The spatial filter, it is important to
        // set the property correctly
        var filter = new OpenLayers.Filter.Spatial({
            type: OpenLayers.Filter.Spatial.INTERSECTS,
            value: polygon,
            property: 'wkb_geometry'
        });

        return this.createSelectStyle(filter);

    },

    /**
     * @private
     * Creates a new style to select features based on attribute conditions.
     * @param {Ext.data.Store} store Store that holds the attribute conditions
     * @param {int} ops Logical operator
     * @returns {OpenLayers.Style} A style that highlights features passing the
     * attribute conditions
     */
    createSelectByAttributesStyle: function(ops, store) {
        var compareFilters = new Array();
        store.each(function(record){
            var data = record.data;
            compareFilters.push(this.getComparisonFilter(data.operator,data.attribute,data.value));
        },this);

        var filter;
        if(compareFilters.length == 1) {
            filter = compareFilters[0];
        } else {
            filter = new OpenLayers.Filter.Logical({
                type: ops,
                filters: compareFilters
            });
        }

        return this.createSelectStyle(filter);
    },

    /**
     * @private
     * @param {OpenLayers.Filter}
     * @returns {OpenLayers.Style}
     */
    createSelectStyle: function(filter) {
        var selectRule = new OpenLayers.Rule({
            name: "Selection",
            title: "Selection",
            filter: filter,
            symbolizer: {
                "Polygon": {
                    fill: true,
                    fillColor: "#00ffff",
                    stroke: false
                }
            }
        });

        var layername = this.layer.layername.split("@")[0];

        // Create a new style
        var style = new OpenLayers.Style({
            fill: false
        },{
            namedLayers: [{
                name: layername,
                userStyles:[
                new OpenLayers.Style({
                    fill: false,
                    stroke: false
                }, {
                    rules: [ selectRule ],
                    title: "Selected features",
                    defaultStyle: {
                        fill: false,
                        stroke: false
                    }
                })
                ]
            }]
        });

        return style;
    },

    /**
     * @private
     * Creates a new filter based on the attribute, expression and value
     * @param {String} exp The comparison expression
     * @param {String} attr The attribute id
     * @param {String} value The value to compare
     * @returns {OpenLayers.Filter} A new filter
     */
    getComparisonFilter: function(exp, attr, value){
        switch(exp) {
            case "eq":
                return new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: attr,
                    value: value
                });
                break;
            case "ne":
                return new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
                    property: attr,
                    value: value
                });
                break;
            case "lt":
                return new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LESS_THAN,
                    property: attr,
                    value: value
                });
                break;
            case "lte":
                return new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO,
                    property: attr,
                    value: value
                });
                break;
            case "gt":
                return new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.GREATER_THAN,
                    property: attr,
                    value: value
                });
                break;
            case "gte":
                return new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
                    property: attr,
                    value: value
                });
                break;
            case "like":
            case "ilike":
                return new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LIKE,
                    property: attr,
                    value: value
                });
                break;
        }
    },

    unselect: function(){
        if(this.layer) {
            this.map.removeLayer(this.layer);
            this.layer = null;
        }
    }

});