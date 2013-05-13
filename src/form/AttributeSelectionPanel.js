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

Ext.ux.AttributeSelectionPanel = Ext.extend(Ext.form.FormPanel, {
    /** @lends Ext.ux.AttributeSelectionPanel# */

    /**
     * A store with the Decide attribute's ids and labels
     */
    attributeStore: null,

    /**
     * Reference to the main viewport
     */
    viewport: null,

    layerRecord: null,

    selectButton: null,

    /**
     * The logical operator that connect the single comparisons
     * @type {OpenLayers.Filter.Logical}
     */
    logicalOperator: OpenLayers.Filter.Logical.OR,

    /**
     * @constructs
     * @augments Ext.Panel
     * @param {Object} config
     */
    constructor: function(config) {
        config = config || {};

        var me = this;

        this.viewport = config.viewport;
        this.layerRecord = config.layerRecord;
        if(config.layerRecord.data.attributeStore){
            this.attributeStore = config.layerRecord.data.attributeStore;
        }
        this.selectButton = config.selectButton;

        var attrConfig = {
            anchor: '100% 100%',
            autoScroll: true,
            defaults: {
                labelWidth: 0
            },
            
            hideLabel: true,
            hideLabels: true,
            labelWidth: 0,
            items: [{
                xtype: "compositefield",
                style: {
                    padding: '5px'
                },
                items: [
                {
                    xtype: 'label',
                    //text: 'Match'
                    text: Ext.ux.ts.tr('Match')
                },{
                    xtype: 'combo',
                    typeAhead: true,
                    triggerAction: 'all',
                    width: 120,
                    lazyRender:true,
                    mode: 'local',
                    store: new Ext.data.ArrayStore({
                        id: 0,
                        fields: [
                        'id',
                        'displayText'
                        ],
                        data: [
                        [OpenLayers.Filter.Logical.OR, Ext.ux.ts.tr('any')],
                        [OpenLayers.Filter.Logical.AND, Ext.ux.ts.tr('all')]
                        ]
                    }),
                    valueField: 'id',
                    value: this.logicalOperator,
                    displayField: 'displayText',
                    listeners: {
                        'change': {
                            fn: function(combo, newValue, oldValue) {
                                this.logicalOperator = newValue;
                            }
                        },
                        scope: this
                    }
                },{
                    xtype: 'label',
                    text: Ext.ux.ts.tr(' of the following:')
                }]
            },
            {
                attributeStore: this.attributeStore,
                parentFormPanel: this,
                xtype: "ux_attributeselectionfield"
            }]
        }

        Ext.apply(attrConfig,config);

        Ext.ux.AttributeSelectionPanel.superclass.constructor.call(this, attrConfig);
    },

    /**
     * Select features by attribute conditions. Basically it's similar to the
     * feature selection by bounding box. Create a selection style with rules,
     * reinstantiate the selection layer as OpenLayers.Layer.WMS.Post layer
     * and request the mapfish api to send the attribute values.
     * @private
     * @param {OpenLayers.Filter.Logical} ops
     * @param {Array(Ext.ux.AttributeSelectionField)} attributeSelectionFields
     */
    selectFeaturesByAttributes: function(ops, attributeSelectionFields){

        var attributeSelectionStore = new Ext.data.ArrayStore({
            fields: ['attribute', 'operator', 'value'],
            idIndex: 0
        });

        var AttributeRecord = Ext.data.Record.create([ 'attribute','operator','value' ]);

        // Loop all attributeSelectionFields
        for(var i = 0; i < attributeSelectionFields.length; i++) {
            attributeSelectionStore.add(new AttributeRecord({
                attribute: attributeSelectionFields[i].attribute,
                operator: attributeSelectionFields[i].operator,
                value: attributeSelectionFields[i].value
            }))
        }

        this.viewport.selectFeaturesByAttributes(this.layerRecord, ops, attributeSelectionStore);

    }

});

Ext.reg('ux_attributeselectionpanel', Ext.ux.AttributeSelectionPanel);