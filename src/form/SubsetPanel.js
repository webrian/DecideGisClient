/**
 * DECIDE GIS
 * Copyright (C) 2011 Adrian Weber
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

Ext.ux.SubsetPanel = Ext.extend(Ext.form.FormPanel, {
    /** @lends Ext.ux.SubsetPanel# */

    attributeStore: null,

    comboBox: null,

    value: 0,

    viewport: null,

    /**
     * @constructs
     * @augments Ext.Panel
     * @param {Object} config
     */
    constructor: function(config) {
        console.warn("@deprecated");
        config = config || {};

        this.viewport = config.viewport;
        this.attributeStore = this.viewport.attributeStore;

        this.comboBox = new Ext.form.ComboBox({
            displayField: 'pcne',
            editable: false,
            fieldLabel: 'Show',
            labelWidth: 120,
            mode: 'local',
            typeAhead: true,
            triggerAction: 'all',
            lazyRender: true,
            value: 0,
            valueField: 'pid',
            store: new Ext.data.ArrayStore({
                id: 0,
                fields: [
                'pid',
                'pcne'
                ],
                data: [[0, 'all provinces'],[1,'Vientiane Capital'],[2,'Phongsaly'],
                [3,'Luangnamtha'],[4,'Oudomxay'],[5,'Bokeo'],[6,'Luangprabang'],
                [7,'Huaphanh'],[8,'Xayabury'],[9,'Xiengkhuang'],[10,'Vientiane'],
                [11,'Borikhamxay'],[12,'Khammuane'],[13,'Savannakhet'],
                [14,'Saravane'],[15,'Sekong'],[16,'Champasak'],[17,'Attapeu']]
            }),
            width: 200,
            xtype: 'combo'
        });

        var attrConfig = {
            bodyStyle: 'padding:5px 5px 0',
            buttonAlign: 'left',
            buttons: [{
                handler: function(){
                    // Loop all layers and look for atlas layers
                    for(var i=0; i < this.viewport.layers.length; i++){
                        var layer = this.viewport.layers[i];
                        // Atlas layer ids are in the form "atlas.wms_style" whereas wms_style
                        // can be a single wms style or a comma separated list of several
                        // styles.
                        // Split the layer id split at '.'
                        var l = this.viewport.layers[i].id.split('.');
                        // Check if the first part of the layer id has the atlas prefix and
                        // check also if the layer is visible
                        if(l[0] == this.viewport.ATLAS_PREFIX) {
                            var filters = [];
                            // GeoServer requires and CQL filter for every layer,
                            // see also this site:
                            // http://jira.codehaus.org/browse/GEOS-3343
                            for(var j = 0; j < layer.params.LAYERS.split(',').length; j++){
                                // CQL filter string
                                var filter;
                                // comboBox value 0 means that all provinces
                                // should be shown, then an empty cql query is
                                // built.
                                if( this.comboBox.getValue() > 0) {
                                    filter = '(pc=' + this.comboBox.getValue() + ')';
                                    filters.push(filter);
                                    // Filters are a semi-colon separated list
                                    layer.params.CQL_FILTER = filters.join(';');
                                } else {
                                    layer.params.CQL_FILTER = '';
                                }
                                
                            }
                            // Redraw the layer if it's visible
                            if(layer.visibility){
                                layer.redraw();
                            }
                        }
                    }
                },
                scope: this,
                text: 'Apply'
            }],
            frame: true,
            items: [
            this.comboBox
            ],
            title: 'Province subset'
        }

        Ext.apply(attrConfig,config);

        Ext.ux.SubsetPanel.superclass.constructor.call(this, attrConfig);

    }

});

Ext.reg('ux_subsetpanel', Ext.ux.SubsetPanel);