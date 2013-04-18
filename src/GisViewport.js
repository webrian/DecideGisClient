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

/**
 * @namespace ExtJS user extension
 */
Ext.ns('Ext.ux');

Ext.ux.GisViewport = Ext.extend(Ext.Panel, {
    /** @lends Ext.ux.GisViewport# */

    /**
     * Constant prefix to identify and differentiate atlas layers from other
     * overlay layers.
     * @type String
     */
    ATLAS_PREFIX: "atlas",

    /**
     * Full extent of Laos in Popular Visualisation CRS / Mercator Projection
     * coordinates.
     * It's a fake full extent bounding box 0,0,180,90 just to let OL properly
     * run.
     * @type OpenLayers.Bounds
     */
    fullExtent: Ext.ux.fullExtent,

    /**
     * The centroid of the bounding box of Laos. Used for the inital map view and
     * the zoom to max extent.
     * @type OpenLayers.LonLat
     */
    centroid: Ext.ux.centroid,

    /**
     * This layer contains the features from a identify request.
     * @type OpenLayers.Layer.Vector
     */
    identifyLayer: null,
    identifyStore: null,
    identifyGridPanel: null,
    identifyWindow: null,

    layout: 'border',

    /**
     * Bounding box of the current selection as OpenLayers.Bounds object
     * @type OpenLayers.Bounds
     */
    selectionBounds: null,

    /**
     * Stores the id, short label and label information of all Decide variable.
     * It serves also as Lookup table.
     * @type Ext.data.Store
     */
    attributeStore: null,

    /**
     * Helper layer to create the freehand selection
     * @type OpenLayers.Layer.Vector
     */
    freehandSelectionLayer: null,

    /**
     * Helper layer that is used while capturing new features
     * @type OpenLayers.Layer.Vector
     */
    captureLayer: null,

    /**
     * Overlay WMS layer
     * @type OpenLayers.Layer.WMS
     */
    overlayLayer: null,

    /**
     * @type String[]
     */
    overlayLayerNames: ['decide:lao-river','lao-admin','lao-labels', 'decide:lao-roads'],

    /**
     * @type Ext.tree.AsyncTreeNode
     */
    overlayFolderNode: null,

    /**
     * This array contains general fields that are always included in selection
     * queries and or identify queries.
     * @type String[]
     */
    basicInfoFields: new Array("vpdid","vcne","dcne","pcne"),

    /**
     * This array contains the current fields that have to be queried.
     * @type String
     */
    currentFields: null,

    /**
     * @type Ext.data.JsonStore
     */
    layerMetadataStore: null,

    /**
     * @type String
     */
    //wms_baseurl: "/wms/index",
    wms_baseurl: Ext.ux.GeoServerUrl + "/wms",

    /**
     * @type Integer
     */
    pageSize: 25,

    printExtent: null,
    printLayer: new OpenLayers.Layer.Vector('Print Extent',{
        displayInLayerSwitcher: false,
        visibility: false
    }),
    printProvider: null,
    printWaitMessageBox: null,

    layers: [],
    layerStore: null,

    /**
     * @type OpenLayers.Map
     */
    map: null,

    /**
     * @type GeoExt.MapPanel
     */
    mapPanel: null,

    mapSelection: null,
    
    selectionGridPanel: null,

    /**
     * @type Ext.ux.GisToolbar
     */
    gistoolbar: null,

    /**
     * @type Ext.tree.TreeNode
     */
    rootNode: null,

    /**
     * The main GIS viewport class
     * @constructs
     * @augments Ext.Viewport
     * @param {Object} config
     */
    constructor: function(config) {
        config = config || {};

        /**
         * @private
         *
         */
        Ext.Ajax.on('beforerequest', this.showSpinner, this);
        Ext.Ajax.on('requestcomplete', this.hideSpinner, this);
        Ext.Ajax.on('requestexception', this.hideSpinner, this);

        this.currentFields = this.basicInfoFields.slice();
        this.map = this.createMap();

        this.layers2 = this.createLayers();
        this.layerStore2 = new GeoExt.data.LayerStore({
            fields: [
            // A store that holds the attributes and types
            'attributeStore',
            // List of attributes
            'attrs',
            // The store that holds the features and their attribute values
            'featureStore',
            // Opacity of the layer
            'opacity',
            // The zIndex field is used to order the layers correctly
            'zIndex'
            ],
            initDir: GeoExt.data.LayerStore.STORE_TO_MAP,
            layers: this.layers2,
            map: this.map
        });

        /**
         * Add an event to set the correct zIndex for a layer after it is added
         * to the map.
         */
        this.map.events.register('addlayer', this, function(event){
            this.layerStore2.each(function(record){
                record.data.zIndex = record.data.layer.getZIndex();
            });
            this.layerStore2.sort('zIndex', 'DESC');
        });

        this.layerStore2.filterBy(function(record, id){
            return record.data.layer.displayInLayerSwitcher;
        }, this);

        // Choose an array store since the data model is very simple and it is a
        // little bit lighter than to transfer a JSON with the same content
        this.attributeStore = new Ext.data.JsonStore({
            autoDestroy: false,
            fields: ["id", "short_label", "label"],
            idIndex: 0,
            proxy : new Ext.data.HttpProxy({
                method: 'GET',
                url: '/variables/list'
            }),
            storeId: 'variableStore-id'
        });

        // The layer panel
        var layerPanel = new Ext.tree.TreePanel({
            autoScroll: true,
            title: Ext.ux.ts.tr('Layers'),
            frame: true,
            /*root: new GeoExt.tree.LayerContainer({
                text: 'Map Layers',
                layerStore: this.layerStore,
                // leaf: false,
                expanded: true
            }),*/
            listeners: {
                'click': function(node, event){

                    var layerid = node.layer.id;

                    var dataset = "census2005";

                    var legendPanel = new GeoExt.LegendPanel({
                        autoScroll: true,
                        defaults: {
                            imageFormat: 'image/png',
                            baseParams: {
                                LEGEND_OPTIONS: 'forceLabels:on'
                            }
                        },
                        frame: false,
                        layerStore: this.layerStore
                    });

                    var window = new Ext.Window({
                        items: [legendPanel],
                        title: Ext.ux.ts.tr("Legend")
                    }).show();

                }
            },
            loader: new Ext.tree.TreeLoader({
                applyLoader: false
            }),
            root: this.rootNode,
            rootVisible: false
        });

        

        var legendPanel = new GeoExt.LegendPanel({
            autoScroll: true,
            defaults: {
                imageFormat: 'image/png',
                baseParams: {
                    LEGEND_OPTIONS: 'forceLabels:on'
                }
            },
            frame: true,
            layerStore: this.layerStore,
            title: Ext.ux.ts.tr('Legend')
        });

        this.layerTreePanel = new Ext.tree.TreePanel({
            autoScroll: true,
            border: false,
            flex: .5,
            frame: false,
            listeners: {
                dblclick: this.addLayerToStore,
                scope: this
            },
            // auto create TreeLoader
            loader: {
                dataUrl: "/gis/layertree",
                listeners: {
                    'beforeload': function(treeloader, node){
                    //treeloader.baseParams.dataset = datasetCombo.getValue();
                    }
                },
                requestMethod: 'GET'
            },
            root: {
                expanded: true,
                nodeType: 'async',
                text: Ext.ux.ts.tr('Lao DECIDE Info')
            },
            rootVisible: false,
            title: Ext.ux.ts.tr("Catalog")
        });

        var opacitySlider = new Ext.slider.SingleSlider({
            increment: 5,
            listeners: {
                'change': function(slider, newValue, thumb){
                    var g = this.layerGrid;
                    var selected = g.getSelectionModel().getSelected();
                    if(!selected){
                        return null;
                    }
                    var l = selected.data.layer;
                    l.setOpacity(newValue/100);
                },
                scope: this
            },
            minValue: 0,
            maxValue: 100,
            plugins: new Ext.slider.Tip({
                getText: function(thumb){
                    return String.format(Ext.ux.ts.tr('Opacity') + ' {0}%', thumb.value);
                }
            }),
            value: 75,
            width: 150
        });

        this.layerGrid = new Ext.grid.EditorGridPanel({
            tbar: [{
                style: {
                    'margin-left': '5px',
                    'margin-right': '5px'
                },
                text: Ext.ux.ts.tr("Layer opacity") + ":",
                xtype: 'label'
            }, opacitySlider],
            border: false,
            cm: new Ext.grid.ColumnModel([{
                xtype: 'actioncolumn',
                width: 20,
                items: [{
                    getClass: function(v, metadata, r, rowIndex, colIndex, store){
                        if(r.data.layer.layername){
                            var layername = r.data.layer.layername.split("@")[0];
                            if(layername){
                                var split = layername.split(":");
                                return split[0];
                            }
                        }
                        return '';
                    },
                    scope: this
                }]
            },{
                id: "title",
                header: "Title",
                dataIndex: "title",
                sortable: false
            },{
                xtype: 'actioncolumn',
                width: 40,
                items: [{
                    icon: '/img/move-up-16.png',
                    tooltip: Ext.ux.ts.tr("Raise Layer"),
                    handler: function(grid, rowIndex, colIndex) {
                        // Raise the layer up in the layer store and on the map
                        if(rowIndex > 0){
                            var record = this.layerStore2.getAt(rowIndex);
                            this.map.raiseLayer(record.data.layer, 1);
                            // Reset the zIndex for each layer record
                            this.layerStore2.each(function(record){
                                record.data.zIndex = record.data.layer.getZIndex();
                            });
                            // Resort the layer store
                            this.layerStore2.sort('zIndex', 'DESC');
                        }
                    },
                    scope: this
                },{
                    icon: '/img/move-down-16.png',
                    tooltip: Ext.ux.ts.tr("Lower Layer"),
                    handler: function(grid, rowIndex, colIndex) {
                        var count = this.layerStore2.getCount();
                        if((rowIndex+1) < count){
                            var record = this.layerStore2.getAt(rowIndex);
                            // Lower the layer
                            this.map.raiseLayer(record.data.layer, -1);
                            // Reset the zIndex for each layer record
                            this.layerStore2.each(function(record){
                                record.data.zIndex = record.data.layer.getZIndex();
                            });
                            // Resort the layer store
                            this.layerStore2.sort('zIndex', 'DESC');
                        }
                    },
                    scope: this
                },{
                    icon: '/img/layer-delete-16.png',                // Use a URL in the icon config
                    tooltip: Ext.ux.ts.tr('Remove Layer'),
                    handler: function(grid, rowIndex, colIndex) {
                        var rec = this.layerStore2.getAt(rowIndex);
                        this.layerStore2.remove(rec);
                    },
                    scope: this
                },{
                    icon: '/img/legend-16.png',
                    tooltip: Ext.ux.ts.tr("Show Legend"),
                    handler: function(grid, rowIndex, colIndex){

                        var loadingMask = new Ext.LoadMask(this.layerGrid.body, {
                            msg: Ext.ux.ts.tr("Loading...")
                        });
                        loadingMask.show();

                        var rec = this.layerStore2.getAt(rowIndex);

                        var layername = rec.data.layer.layername.split("@")[0];

                        var split = layername.split(":");
                        var ds = split[0];
                        var ln = split[1];

                        Ext.Ajax.request({
                            method: 'GET',
                            params: {
                                layer: ln,
                                dataset: ds
                            },
                            success: function(response){
                                var r = Ext.decode(response.responseText);

                                var t = new Ext.Template([
                                    '<img src="{src}" width="{width}" height="{height}">'
                                    ]);

                                // Legend container width
                                var lc_height = r.legend.height > 150 ? r.legend.height : 150;
                                var lc_width = r.legend.width > 150 ? r.legend.width : 150

                                // Hide the loading mask before opening the
                                // legend window

                                var w = new Ext.Window({
                                    autoScroll: true,
                                    // Add a bottom bar with a close button
                                    bbar: ['->',{
                                        handler: function(button){
                                            w.close();
                                        },
                                        text: Ext.ux.ts.tr("Close")
                                    }],
                                    layout: 'hbox',
                                    items:[{
                                        html: r.text,
                                        width: 220,
                                        xtype: 'container'
                                    },{
                                        data: r.legend,
                                        height: lc_height,
                                        width: lc_width,
                                        tpl: t,
                                        xtype: 'container'
                                    }],
                                    height: (lc_height + 100),
                                    title: rec.data.title,
                                    width: (lc_width + 240)
                                }).show();

                                loadingMask.hide();

                            },
                            url: '/gis/abstract'
                        });
                    },
                    scope: this
                }]
            }]),
            enableDragDrop: true,
            flex: .5,
            frame: false,
            hideHeaders: true,
            listeners: {
                'afteredit': function(event){
                    event.record.data.layer.setOpacity(event.record.data.opacity/100);
                },
                'render': function(event){
                    // Apply the filter after rendering to hide all layers that
                    // should not be displayed
                    this.layerStore2.filterBy(function(record, id){
                        return record.data.layer.displayInLayerSwitcher;
                    }, this);
                },
                'rowclick': function(grid, rowIndex, event){
                    var selected = grid.getSelectionModel().getSelected();
                    if(!selected){
                        return null;
                    }
                    opacitySlider.setValue(selected.data.layer.opacity*100);
                },
                scope: this
            },
            selModel: new Ext.grid.RowSelectionModel({
                singleSelect: true
            }),
            store: this.layerStore2,
            title: Ext.ux.ts.tr("Selected Layers"),
            viewConfig: {
                autoFill: true,
                forceFit: true
            }
        });

        this.layerGrid.getSelectedLayer = function(){
            var selected = this.getSelectionModel().getSelected();
            if(!selected){
                Ext.Msg.alert("No layer selected", "Select a layer from the layer list.");
                return null;
            }
            return selected;
        }

        // The left container for layer panel, legend panel etc.
        var westPanel = new Ext.Panel({
            collapsible: true,
            region: "west",
            //title: "Side Pane",
            width: 320,
            split: true,
            //collapsible: true,
            //hideCollapseTool: true,
            layout: "vbox",
            layoutConfig: {
                align: 'stretch'
            },
            //items: [attributeSelectPanel,layerPanel,legendPanel]
            items: [this.layerGrid, this.layerTreePanel]
        });

        // Instantiate a new print provider. The global printCapabilities variable
        // is requested in the main html (main.mako template).
        this.printProvider = new GeoExt.data.PrintProvider({
            capabilities: printCapabilities
        });

        // Add custom parameters to the print provider that are sent in the
        // request JSON object to the server and used in the config.yaml page
        // definition file located in $GEOSERVER_DATA/printing
        // WMS layer and style is used to create the legend and the layer name
        // is used as legend title.
        // Open the wait messagebox before printing.
        this.printProvider.on('beforeprint',function(printProvider,map,pages,options){

            this.printWaitMessageBox = Ext.Msg.wait("Please wait ...", "Saving Progress");


        },this);

        // If printing was successful, close the this.waitMessageBox dialog.
        this.printProvider.on('print',function(printProvider,url){
            this.printWaitMessageBox.getDialog().close();
        },this);

        // Raise an alert and return the server error if a print exception is thrown.
        this.printProvider.on('printexception',function(printProvider,response){
            Ext.Msg.show({
                title:'Saving Error',
                msg: 'Your current map layout could not be generated. The server reports:<br><br>' + response.responseText,
                buttons: Ext.Msg.OK,
                icon: Ext.MessageBox.ERROR
            });
        });

        this.printExtent = new GeoExt.plugins.PrintExtent({
            printProvider: this.printProvider,
            layer: this.printLayer
        });

        this.gistoolbar = new Ext.ux.NavigationToolbar({
            layergrid: this.layerGrid,
            layers: this.layerStore2.layers,
            viewport: this
        });

        this.mapPanel = new GeoExt.MapPanel({
            layers: this.layerStore2,
            map: this.map,
            plugins: [ this.printExtent ],
            region: "center",
            tbar: this.gistoolbar
        });

        /*
        this.identifyStore = new GeoExt.data.FeatureStore({
            layer: this.identifyLayer,
            features: this.identifyLayer.features,
            fields: this.currentFields,
            autoLoad: true
        });
        */

        /**
         *
         *
        this.mapSelection = new Ext.ux.MapSelection({
            map: this.map
        });
         */

        var gisViewportConfig = {
            layout: 'border',
            //items: [mainCenterPanel, westPanel]
            items:[{
                border: false,
                frame: false,
                items: [this.mapPanel, westPanel],
                layout: 'border',
                region: 'center',
                xtype: 'panel'
            }],
            tbar: new Ext.ux.MainGisToolbar({
                viewport: this,
                printExtent: this.printExtent,
                printProvider: this.printProvider
            })
        }

        Ext.apply(gisViewportConfig,config);

        Ext.ux.GisViewport.superclass.constructor.call(this, gisViewportConfig);

        // Set the centroid and zoom level 0 as initial map view
        this.map.setCenter(this.centroid,0,true,true);
    },

    /**
     * @deprecated
     * Creates a column model for use in a grid based on the parameter fields.
     * Parameter fields needs to be an array with the fields that will be shown
     * in the grid.
     * @param {Array(string)} fields
     * @param {boolean} reset
     * @return void
     * @type void
     */
    getColumnModelFromFields: function(fields, reset) {
        console.warn("@deprecated");
        if(reset) {
            this.resetCurrentFields();
        }
        var columns = new Array();

        //var nbr = atlasLayerStore.findExact('id',fields[i]);
        //var record = atlasLayerStore.getAt(nbr);
        //record.get('label');

        for (var i = 0; i < fields.length; i++) {
            var r = this.attributeStore.getById(fields[i]);
            var h;
            if(r) {
                h = r.get('short_label')
            } else {
                h = fields[i]
            }

            columns[i] = new Ext.grid.Column({
                header: h,
                dataIndex: fields[i]
            });
        }

        return new Ext.grid.ColumnModel({
            defaultSortable: false,
            columns: columns
        });
    },

    /**
     * @deprecated
     * @param {OpenLayers.Layer} layer
     * @returns void
     * @type void
     */
    setActiveLayer: function(layer){
        console.warn("@deprecated");
        // Loop over all layers
        for(var i = 0; i < this.layers.length; i++) {
            var l = this.layers[i];
            // Test if it's an atlas layer
            //if(l.id.split(".")[0] == this.ATLAS_PREFIX) {
            if(l.id == layer.id) {
                layer.setVisibility(true);
            }
            else {
                layer.setVisibility(false);
            }
        //}
        }
    },

    /**
     * Select features by attribute conditions. Basically it's similar to the
     * feature selection by bounding box. Create a selection style with rules,
     * reinstantiate the selection layer as OpenLayers.Layer.WMS.Post layer
     * and request the mapfish api to send the attribute values.
     * @param {OpenLayer.Layer} layer
     * @param {OpenLayers.Filter.Logical} logicalOperator
     * @param {Ext.data.Store} attributeSelectionStore
     */
    selectFeaturesByAttributes: function(record, logicalOperator, attributeSelectionStore){

        var ms = new Ext.ux.MapSelection({
            map: this.map,
            layer: record.data.layer
        });

        var layer = ms.selectByAttributes(logicalOperator, attributeSelectionStore);

        /*
        var fields = this.selectionStore.selectByAttributes(logicalOperator, attributeSelectionStore, this.currentFields);

        this.selectionGridPanel.reconfigure(
            this.selectionStore,this.getColumnModelFromFields(fields, true));

        // Set the selection bounds to the full extent, since we don't know
        // where the features are and it is probable that the features are
        // distributed all over the country.
        this.selectionBounds = this.fullExtent;
         */

        this.layerStore2.add([new GeoExt.data.LayerRecord({
            layer: layer,
            opacity: 100,
            title: 'Selected Features'
        })
        ]);

        // Filter base and vector layers
        this.layerStore2.filterBy(function(record, id){
            return record.data.layer.displayInLayerSwitcher;
        }, this);

        this.map.setLayerZIndex(layer, this.map.layers.length);

        var currentFields = []
        //record.data.attribute
        record.data.featureStore.selectByAttributes(logicalOperator, attributeSelectionStore, []);

    },

    /**
     * @return {OpenLayers.Layer[]}
     */
    createLayers: function(){
        var layers = [];

        // Create and add the draw feature aka freehand selection layer.
        this.freehandSelectionLayer = new OpenLayers.Layer.Vector("Freehand selection Layer",{
            displayInLayerSwitcher: false
        });
        layers.push(this.freehandSelectionLayer);
        layers.push(this.printLayer);
        
        return layers;
    },

    /**
     * @return {OpenLayers.Map}
     * @type {OpenLayers.Map}
     */
    createMap: function() {

        var hillshade = new OpenLayers.Layer.TMS(
            "Hillshade", "/tms/", {
                isBaseLayer: true,
                displayInLayerSwitcher: false,
                layername: "topo",
                type: "png",
                // set if different than the bottom left of map.maxExtent
                tileOrigin: new OpenLayers.LonLat(-20037508.340000, -20037508.340000),
                zoomOffset: 6
            })
        hillshade.id = "hillshade";

        return new OpenLayers.Map({
            allOverlays: false,
            controls: [
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.PanZoomBar(),
            new OpenLayers.Control.ScaleLine()
            ],
            displayProjection: new OpenLayers.Projection("EPSG:4326"),
            layers: [hillshade],
            maxExtent: this.fullExtent,
            projection: new OpenLayers.Projection("EPSG:900913"),
            // Set fixed resolutions from zoom level 6 to 12 (in standard OL levels)
            resolutions: [2445.9849046875,1222.99245234375,611.496226171875,305.7481130859375,152.87405654296876,76.43702827148438,38.21851413574219],
            units: "m"
        });
    },

    /**
     * @deprecated
     * Reset the variable current fields, that holds at any time the currently
     * selected variables.
     * This method is called each time the current layer changes.
     * @return void
     */
    resetCurrentFields: function() {
        console.warn("@deprecated");
        // Loop over all layers
        for(var i = 0; i < this.layers.length; i++) {
            // Atlas layer ids are in the form "atlas.wms_style" whereas wms_style
            // can be a single wms style or a comma separated list of several
            // styles.
            // Split the layer id split at '.'
            var l = this.layers[i].id.split('.');
            // Check if the first part of the layer id has the atlas prefix and
            // check also if the layer is visible
            if(l[0] == this.ATLAS_PREFIX && this.layers[i].getVisibility()) {
                // Copy the standard basic info fields
                this.currentFields = this.basicInfoFields.slice();
                // Since wms_style can be a single wms style or a comma separated
                // list of several styles, it is necessary to split also the
                // second part of the layer id.
                var styles = l[1].split(',');
                // Loop all styles and add it to the current fields
                for(var f = 0; f < styles.length; f++) {
                    this.currentFields.push(styles[f]);
                }
            }
        }
    },

    /**
     * @deprecated
     */
    toggleOverlayVisibility: function() {
        console.warn("@deprecated: GisViewport.toggleOverlayVisibility");

        this.overlayLayerNames = [];
        this.overlayFolderNode.eachChild(this.iterate,this);

        this.resetWmsLayer(this.overlayLayerNames);
    },

    /**
     * @deprecated
     * Iterate through a node and store checked and enabled layer to the
     * wmsLayersArray.
     * @param {Ext.tree.TreeNode} node
     */
    iterate: function(node){
        console.warn("@deprecated")
        if(node.childNodes.length > 0){
            for(var i = 0; i < node.childNodes.length; i++){
                //for(var i = node.childNodes.length-1; i >=0; i--){
                this.iterate(node.childNodes[i]);
            }
        } else {
            if(node.attributes.checked && !node.disabled){
                this.overlayLayerNames.unshift(node.id);
            }
        }
    },

    /**
     * @deprecated
     * Reset the main WMS layer of the map with a new layer array. If the layer
     * array is empty i.e. the user turn off all the overlay layers, the layer
     * has to be removed without replacing it.
     * @param {String[]} layers
     */
    resetWmsLayer: function(layers){
        console.warn("@deprecated GisViewport.resetWmsLayer")
        // Remove the current overlay layer in any case
        if(this.map.getLayer(this.overlayLayer.id)){
            this.map.removeLayer(this.overlayLayer);
        }
        // Check if there are layers requested
        if(layers.length > 0) {
            // Create a new temporary layer
            var tmpLayer = new OpenLayers.Layer.WMS(
                'overlaylayer',
                this.wms_baseurl,
                {
                    format: 'image/png',
                    layers: layers,
                    tiled: true,
                    transparent: true
                },{
                    displayInLayerSwitcher: false,
                    isBaseLayer: false,
                    sphericalMercator: true
                });
            // Add the temporary layer to the map
            this.map.addLayer(tmpLayer);
            // Assign the temporary layer to the overlayLayer class variable
            this.overlayLayer = tmpLayer;
        }
    },

    /**
     * Show a wait cursor when the mouse is over the map.
     */
    showSpinner: function(connection, opts) {
        this.map.div.style.cursor = 'wait';
    },

    /**
     * Reset the cursor to "normal".
     */
    hideSpinner: function(connection, response, opts) {
        this.map.div.style.cursor = '';
    },

    addLayerToStore: function(node){

        if(!node.leaf){
            return null;
        }

        var layerTreeLoadingMask = new Ext.LoadMask(this.layerTreePanel.body, {
            msg: Ext.ux.ts.tr("Loading...")
        });
        layerTreeLoadingMask.show();
        var layerGridLoadingMask = new Ext.LoadMask(this.layerGrid.body, {
            msg: Ext.ux.ts.tr("Loading...")
        });
        layerGridLoadingMask.show();

        var layer = new OpenLayers.Layer.TMS(
            node.attributes.text, node.attributes.tms_url, {
                isBaseLayer: false,
                displayInLayerSwitcher: true,
                layername: node.attributes.tms_layer + "@EPSG:900913@png",
                maxExtent: [-20037508.340000, -20037508.340000, 20037508.340000, 20037508.340000],
                opacity: 0.75,
                sphericalMercator: true,
                type: "png",
                // set if different than the bottom left of map.maxExtent
                tileOrigin: new OpenLayers.LonLat(-20037508.340000, -20037508.340000),
                zoomOffset: 6
            });
        layer.id = node.attributes.id;

        // A store that holds all layer records
        var featureStore;

        // A store that holds the attributes
        var attributeStore = new Ext.data.JsonStore({
            autoLoad: false,
            fields: ['name', 'label', 'type']
        });

        var split = node.attributes.tms_layer.split(':');
        var dataset = split[0];
        var layername = split[1];

        Ext.Ajax.request({
            method: 'GET',
            params: {
                dataset: dataset,
                layer: layername
            },
            success: function(r){

                var response = Ext.decode(r.responseText);

                attributeStore.loadData(response.fields);

                var attrs = new Array();
                for(var i = 0; i < response.fields.length; i++){
                    attrs.push(response.fields[i].name);
                }

                featureStore = new Ext.ux.data.SelectionStore({
                    baseParams: {
                        dataset: dataset,
                        layer: layername,
                        attrs: attrs.join(","),
                        limit: 25,
                        format: 'ext'
                    },
                    fields: response.fields,
                    root: 'data',
                    proxy: new Ext.data.HttpProxy({
                        method: 'GET',
                        url: '/gis/layer'
                    }),
                    totalProperty: 'totalResults'
                });

                featureStore.load({
                    callback: function(response){

                        // Add the new layer and data store to the layerstore
                        var lr = new GeoExt.data.LayerRecord({
                            attributeStore: attributeStore,
                            attrs: attrs,
                            featureStore: featureStore,
                            layer: layer,
                            opacity: 75,
                            title: node.attributes.text,
                            zIndex: layer.getZIndex()
                        });

                        //this.map.addLayer(layer);
                        this.layerStore2.add([lr]);

                        // Filter base and vector layers
                        this.layerStore2.filterBy(function(record, id){
                            return record.data.layer.displayInLayerSwitcher;
                        }, this);

                        // Select this layer immediately after adding it to the
                        // layer store. Thus we can be sure, that there is always
                        // a layer selected.
                        this.layerGrid.getSelectionModel().selectRecords([lr]);

                        layerGridLoadingMask.hide();
                        layerTreeLoadingMask.hide();

                    },
                    scope: this
                });
            },
            scope: this,
            url: '/gis/describefeaturetype'
        });
    }

});

Ext.reg('ux_gisviewport', Ext.ux.GisViewport);