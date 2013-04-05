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

Ext.ux.PrintPanel = Ext.extend(Ext.FormPanel, {
    /** @lends Ext.ux.PrintPanel# */

    printProvider: null,

    printExtent: null,

    layoutsComboBox: null,

    /**
     * @constructs
     * @param {Object} config
     */
    constructor: function(config){
        config = config || {};

        this.printProvider = config.printProvider ? config.printProvider : null;
        this.printExtent = config.printExtent ? config.printExtent : null;

        this.layoutsComboBox = new Ext.form.ComboBox({
            fieldLabel: Ext.ux.ts.tr('Layout'),
            mode: 'local',
            typeAhead: true,
            triggerAction: 'all',
            valueField: 'value',
            displayField: 'name',
            forceSelection: true,
            selectOnFocus: true,
            store: this.printProvider.layouts,
            plugins: new GeoExt.plugins.PrintProviderField({
                printProvider: this.printProvider
            }),
            width: '80%'
        });

        var printPanelConfig = {
            buttonAlign: 'left',
            //standardSubmit: true,
            //method: 'GET',
            //labelWidth: 120, // label settings here cascade unless overridden
            //url: '/geoserver/pdf/print.pdf',
            //frame: true,
            bodyStyle: 'padding:5px 5px 0',
            //width: 350,
            defaults: {
              width: '80%'
            },
            defaultType: 'textfield',
            items: [
            this.layoutsComboBox, {
                fieldLabel: Ext.ux.ts.tr('Subtitle'),
                name: 'mapSubtitle',
                //allowBlank:false,
                plugins: new GeoExt.plugins.PrintProviderField({
                    printProvider: this.printProvider
                })
            },{
                fieldLabel: Ext.ux.ts.tr('Description'),
                name: 'comment',
                plugins: new GeoExt.plugins.PrintProviderField({
                    printProvider: this.printProvider
                })
            }
            ],
            buttons: [{
                text: Ext.ux.ts.tr('Add map frame'),
                handler: function(){
                    // Remove first all pages before adding a new one
                    if(this.printExtent.pages.length > 0) {
                        for(var i = 0; i < this.printExtent.pages.length; i++){
                            this.printExtent.removePage(this.printExtent.pages[i]);
                        }
                    }
                    this.printExtent.layer.setVisibility(true);
                    this.printExtent.addPage();
                },
                scope: this
            },{
                text: Ext.ux.ts.tr('Remove map frame'),
                handler: function(){
                    this.printExtent.layer.setVisibility(false);
                    // Remove all pages
                    if(this.printExtent.pages.length > 0) {
                        for(var i = 0; i < this.printExtent.pages.length; i++){
                            this.printExtent.removePage(this.printExtent.pages[i]);
                        }
                    }
                },
                scope: this
            },{
                text: Ext.ux.ts.tr('Save Map'),
                handler: function(){
                    if(this.printExtent.pages.length > 0){
                        this.printExtent.print();
                    } else {
                        Ext.Msg.show({
                            title:'Missing Print Frame',
                            msg: 'Please add first a print frame to the map.',
                            buttons: Ext.Msg.OK,
                            icon: Ext.MessageBox.WARNING
                        });
                    }
                //this.printExtent.removePage();
                },
                scope: this
            }]


        }

        Ext.apply(printPanelConfig,config);

        // Call our superclass constructor to complete construction process.
        Ext.ux.PrintPanel.superclass.constructor.call(this, printPanelConfig);
    }


});

Ext.reg('ux_printpanel', Ext.ux.PrintPanel);