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

OpenLayers.Control.IdentifyControl = OpenLayers.Class(OpenLayers.Control, {
    /** @lends OpenLayers.Control.IdentifyControl# */

    /**
     * The main GIS viewport
     * @type Ext.ux.GisViewport
     */
    viewport: null,

    /**
     * Creates a click handler and set up an Ajax request to the mapfish
     * server with the clicked position.
     * @class Implements a GIS identify control
     * @constructs
     * @param {Object} options An object containing constructor options. Required
     * is viewport.
     */
    initialize: function(options) {

        OpenLayers.Control.prototype.initialize.call(this, options);

        this.handler = new OpenLayers.Handler.Click(this,{
            'click': function(event){
                var position = event.xy;
                var popupLonLat = this.map.getLonLatFromViewPortPx(position);

                Ext.Ajax.request({
                    failure: function(response, options){
                        Ext.Msg.show({
                            title:'Identify Error',
                            msg: 'Please try again',
                            buttons: Ext.Msg.OK,
                            icon: Ext.MessageBox.ERROR
                        });
                    },
                    method: 'GET',
                    params: {
                        // Workaround as long as there is only one dataset
                        dataset: "census2005",
                        epsg: "900913",
                        attrs: this.viewport.currentFields.join(','),
                        no_geom: false,
                        limit: 1,
                        lat: popupLonLat.lat,
                        lon: popupLonLat.lon
                    },
                    scope: this.viewport,
                    success: function(response, options){
                        // Clear all features from the layer
                        this.identifyLayer.destroyFeatures();

                        // Reset the current fields because we want just the
                        // current shown layer queried.
                        this.resetCurrentFields();

                        // The new features are added automagically to the
                        // identifyLayer! Do NOT call .addFeatures(features)!
                        var formatter = new OpenLayers.Format.GeoJSON();
                        var features = formatter.read(response.responseText);

                        this.identifyStore = new GeoExt.data.FeatureStore({
                            layer: this.identifyLayer,
                            features: features,
                            fields: this.currentFields,
                            autoLoad: true
                        });

                        this.identifyGridPanel.reconfigure(this.identifyStore, this.getColumnModelFromFields(this.currentFields));
                        this.identifyWindow.show();
                    },
                    url: '/gis/villages'
                });
            }
        },{
            map: this.map
        })
    }
});