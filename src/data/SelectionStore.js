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

Ext.ns('Ext.ux.data');

Ext.ux.data.SelectionStore = Ext.extend(Ext.data.JsonStore, {
    /** @lends Ext.ux.data.SelectionStore# */

    downloadAction: null,

    /**
     * @constructs
     * @augments GeoExt.data.FeatureStore
     * @param {Object} config
     */
    constructor: function(config){
        config = config || {};

        this.downloadAction = config.downloadAction;

        var selectionStoreConfig = {
            paramNames: {
                dir: 'dir',
                limit: 'limit',
                sort: 'order_by',
                start: 'offset'
            }
        /*proxy : new Ext.data.HttpProxy({
                method: 'GET',
                url: '/gis/villages'
            })*/
        //reader: new GeoExt.ux.data.UxFeatureReader()
        }

        Ext.apply(selectionStoreConfig, config);

        // Call our superclass constructor to complete construction process.
        Ext.ux.data.SelectionStore.superclass.constructor.call(this, selectionStoreConfig);
    },

    /**
     * Select features by attribute conditions.
     * @param {OpenLayers.Filter.Logical} logicalOperator
     * @param {Ext.data.Store} attributeStore Store with attributes to query and
     * the corresponding conditions.
     * @param {String[]} fields Current fields that need to queried and returned
     * additionally from the database
     * @returns {String[]} Current fields and queried fields
     */
    selectByAttributes: function(logicalOperator, attributeStore, fields){

        var additionalParams = this.createSelectByAttributesParams(logicalOperator, attributeStore, fields).map;

        /*var selectedFields = requestParams.attrs.split(',');

        // Instantiate a new reader with the corresponding fields
        this.reader = new GeoExt.ux.data.UxFeatureReader({},selectedFields);

        // Set a new object for the base parameters. Any other parameter
        // from another request is deleted
        this.baseParams = requestParams;

        this.load({
            scope: this
        });


        // Enable the download action
        this.downloadAction.enable();
        */

        Ext.apply(this.baseParams, additionalParams);

        this.load({
            scope: this
        });

    },

    /**
     * Select the current fields from features within a certain bounding box
     * and store them. There is no need to request the geometry data thus we can
     * save some band width.
     * @param {OpenLayers.Bounds} bbox Features within this bounding box are
     * selected.
     * @param {String[]} fields Current fields to request from the server and to
     * store
     */
    selectByBox: function(bbox) {

        //this.reader = new GeoExt.ux.data.UxFeatureReader({}, fields);

        // Set a new object for the base parameters. Any other parameter
        // from another request is deleted
        var additionalParams = {
            //attrs: fields.join(','),
            bbox: bbox.toBBOX(),
            epsg: '900913',
            limit: 25,
            no_geom: true,
            offset: 0
        };

        Ext.apply(this.baseParams, additionalParams);

        this.load({
            scope: this
        });

    // Enable the download action
    //this.downloadAction.enable();
    },

    /**
     *
     * @param {OpenLayers.Geometry.Polygon}
     * @param {String[]}
     */
    selectFreehand: function(polygon, fields) {

        //this.reader = new GeoExt.ux.data.UxFeatureReader({},fields);

        var formatter = new OpenLayers.Format.GeoJSON();

        // Set a new object for the base parameters. Any other parameter
        // from another request is deleted
        var additionalParams = {
            geometry: formatter.write(polygon),
            epsg: '900913',
            limit: 25,
            no_geom: true,
            offset: 0
        };

        Ext.apply(this.baseParams, additionalParams);

        this.load();
        
        // Enable the download action
        //this.downloadAction.enable();
    },

    /**
     * Unselect all features from the store.
     */
    unselect: function() {
        this.removeAll(false);
        // Disable the download action
        this.downloadAction.disable();
    },

    /**
     * @private
     * @param {Ext.data.Store} attributeStore Store with attributes and conditions
     * @param {String[]} fields Current fields
     * @returns {Ext.util.MixedCollection} Collection of parameters
     */
    createSelectByAttributesParams: function(ops, attributeStore, fields){

        var params = new Ext.util.MixedCollection();
        var queryable = new Array();
        var attrs = new Array();

        attributeStore.each(function(record){
            var data = record.data;
            var key = data.attribute + "__" + data.operator;

            if(params.containsKey(key)) {
                params.replace(key, params.get(key) + "," + data.value);
            } else {
                params.add(key,data.value);
                queryable.push(data.attribute);
            }
        });

        // Add the queryable fields and the no_geom attribute
        params.add("queryable",queryable.join(','));
        params.add("no_geom",true);

        // Logical operator
        switch (ops) {
            case OpenLayers.Filter.Logical.AND:
                params.add("logical_op","and");
                break;
            case OpenLayers.Filter.Logical.OR:
                params.add("logical_op","or");
                break;
            case OpenLayers.Filter.Logical.NOT:
                params.add("logical_op","not");
                break;
            default:
                params.add("logical_op","or");
                break;
        }

        // Create an array with all current fields and the queried fields
        for(var i = 0; i < fields.length; i++) {
            var fieldIsQueryable = false;
            for(var j = 0; j < queryable.length; j++) {
                if(fields[i] == queryable[j]) {
                    fieldIsQueryable = true;
                }
            }
            if(!fieldIsQueryable){
                attrs.push(fields[i]);    
            }
        }

        for(var h = 0; h < queryable.length; h++) {
            attrs.push(queryable[h]);
        }

        //params.add("attrs", attrs.join(','));

        // Feature limit due to performance reasons
        params.add("offset",0);
        params.add("limit",25);

        return params;
    }

});