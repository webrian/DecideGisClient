Ext.namespace("Ext.ux");

Ext.ux.MainGisToolbar = Ext.extend(Ext.Toolbar, {

    initComponent: function(){

        var navHandler = function(direction){
        // This routine could contain business logic required to manage the navigation steps.
        // It would call setActiveItem as needed, manage navigation button state, handle any
        // branching logic that might be required, handle alternate actions like cancellation
        // or finalization, etc.  A complete wizard implementation could get pretty
        // sophisticated depending on the complexity required, and should probably be
        // done as a subclass of CardLayout in a real-world implementation.
        };

        var selectAction=new GeoExt.Action({
            iconCls: "select-button",
            iconAlign:'top',
            map:this.viewport.map,
            toggleGroup:"tools",
            allowDepress:false,
            scale:'medium',
            text:Ext.ux.ts.tr('Select'),
            tooltip:Ext.ux.ts.tr('Select Features'),
            control:new OpenLayers.Control.SelectByBox({
                eventListeners:{
                    "select":this.selectFeaturesByBox,
                    scope:this
                }
            })
        });

        var freehandSelectAction=new GeoExt.Action({
            iconCls: "select-freehand-button",
            iconAlign:'top',
            map:this.viewport.map,
            toggleGroup:"tools",
            allowDepress:false,
            scale: 'medium',
            text: Ext.ux.ts.tr('Freehand Select'),
            tooltip: Ext.ux.ts.tr("Select features freehand"),
            control: new OpenLayers.Control.DrawFeature(this.viewport.freehandSelectionLayer, OpenLayers.Handler.Polygon, {
                displayInLayerSwitcher: false,
                eventListeners:{
                    activate: function(event){
                        var ls = this.viewport.layerStore2;
                        // Filter the layer store, if not the OpenLayers.Handler.Polygon
                        // appears as a selected layer
                        ls.filterBy(function(record, id){
                            return record.data.layer.displayInLayerSwitcher;
                        });

                    },
                    featureadded: this.selectFeaturesFreehand,
                    scope: this
                }
            }),
            scope:this
        });

        // Unselect selection of current layer
        var unselectAction = new Ext.Action({
            iconCls: "unselect-button",
            iconAlign:'top',
            scale:'medium',
            text:Ext.ux.ts.tr('Unselect'),
            tooltip:Ext.ux.ts.tr('Unselect all features'),
            handler: this.unselectFeatures,
            scope: this
        });


        var zoomSelection = new Ext.Action({
            iconCls: "zoom-selection-button",
            iconAlign:'top',
            scale:'medium',
            text: Ext.ux.ts.tr('Zoom Selection'),
            tooltip: Ext.ux.ts.tr('Zoom to selected features'),
            handler:function(){
                if(this.selectionBounds){
                    this.map.zoomToExtent(this.selectionBounds);
                }
            },
            scope:this.viewport
        });


        var items = [{
            handler: function(evt){

                var subsetPanel = new Ext.ux.SubsetPanel({
                    viewport: this
                });

                var printPanel = new Ext.ux.PrintPanel({
                    anchor:'100% 100%',
                    id: 'card-0',
                    printProvider: this.printProvider,
                    printExtent: this.printExtent
                });

                var printWindow = new Ext.ux.PrintWindow({
                    height: 350,
                    printProvider: this.printProvider,
                    printExtent: this.printExtent,
                    width: 400,
                    viewport: this.viewport
                }).show();

            /*
                var w = new Ext.Window({
                    activeItem: 0,
                    bbar: [
                    {
                        disabled: true,

                        handler: function(event){
                            var l = Ext.getCmp('print-wizard-window').getLayout();
                            var nbrItems = parseInt(l.container.items.length);
                            var nextItem = parseInt(l.activeItem.id.split('card-')[1]) - 1;
                            if(nextItem > 0 && nextItem < (nbrItems-1)){
                                l.setActiveItem(nextItem);
                                Ext.getCmp('move-prev').enable();
                                Ext.getCmp('move-next').enable();
                            }
                            if(nextItem == 0){
                                l.setActiveItem(nextItem);
                                Ext.getCmp('move-prev').disable();
                                Ext.getCmp('move-next').enable();
                            }
                        },
                        icon: '/img/go-previous.png',
                        iconAlign: 'top',
                        id: 'move-prev',
                        scale: 'medium',
                        text: 'Back',
                        width: 50
                    },{
                        handler: function(event){
                            var l = Ext.getCmp('print-wizard-window').getLayout();
                            var nbrItems = parseInt(l.container.items.length);
                            var nextItem = parseInt(l.activeItem.id.split('card-')[1]) + 1;
                            if(nextItem < (nbrItems-1)){
                                l.setActiveItem(nextItem);
                                Ext.getCmp('move-prev').enable();
                                Ext.getCmp('move-next').enable();
                            }
                            if(nextItem == (nbrItems-1)){
                                l.setActiveItem(nextItem);
                                Ext.getCmp('move-prev').enable();
                                Ext.getCmp('move-next').disable();
                            }
                        },
                        icon: '/img/go-next.png',
                        iconAlign: 'top',
                        id: 'move-next',
                        scale: 'medium',
                        text: 'Next',
                        width: 50
                    },'->', {
                        handler: function(){
                            this.printExtent.layer.setVisibility(false);
                            // Remove all pages
                            if(this.printExtent.pages.length > 0) {
                                for(var i = 0; i < this.printExtent.pages.length; i++){
                                    this.printExtent.removePage(this.printExtent.pages[i]);
                                }
                            }
                            w.close();
                        },
                        icon: '/img/quit.png',
                        iconAlign: 'top',
                        scale: 'medium',
                        scope: this,
                        text: Ext.ux.ts.tr("Quit"),
                        width: 50
                    },{
                        disabled: true,
                        handler: function(){
                            if(this.printExtent.pages.length > 0){
                                //this.printExtent.print(this.viewport.map);
                                var cloneMap = new OpenLayers.Map({
                                    allOverlays: false,
                                    displayProjection: new OpenLayers.Projection("EPSG:4326"),
                                    maxExtent: new OpenLayers.Bounds(-20037508.340000, -20037508.340000, 20037508.340000, 20037508.340000),
                                    projection: new OpenLayers.Projection("EPSG:900913"),
                                    // Set fixed resolutions from zoom level 6 to 12 (in standard OL levels)
                                    resolutions: [156543.0339,78271.51695,39135.75848,19567.87924,9783.939619,4891.969809,2445.9849046875,1222.99245234375,611.496226171875,305.7481130859375,152.87405654296876,76.43702827148438,38.21851413574219],
                                    units: "m"
                                });
                                var hillshade = new OpenLayers.Layer.TMS(
                                    "Hillshade", "/tms/", {
                                        isBaseLayer: true,
                                        displayInLayerSwitcher: false,
                                        layername: "topo",
                                        type: "png",
                                        // set if different than the bottom left of map.maxExtent
                                        tileOrigin: new OpenLayers.LonLat(-20037508.340000, -20037508.340000)
                                    });
                                hillshade.id = "hillshade";
                                var overlay = new OpenLayers.Layer.TMS(
                                    "Hillshade", "http://localhost:8080/geoserver/gwc/service/tms/", {
                                        isBaseLayer: false,
                                        displayInLayerSwitcher: false,
                                        layername: "census2005:pop_married_pct@EPSG:900913@png",
                                        type: "png",
                                        // set if different than the bottom left of map.maxExtent
                                        tileOrigin: new OpenLayers.LonLat(-20037508.340000, -20037508.340000)
                                    });
                                cloneMap.addLayers([hillshade, overlay]);
                                console.log(cloneMap);
                                this.printProvider.print(cloneMap, this.printExtent.pages);
                            } else {
                                Ext.Msg.show({
                                    title:'Missing Print Frame',
                                    msg: 'Please add first a print frame to the map.',
                                    buttons: Ext.Msg.OK,
                                    icon: Ext.MessageBox.WARNING
                                });
                            }
                        },
                        icon: "/img/print.png",
                        iconAlign: "top",
                        id: 'print-button',
                        text: Ext.ux.ts.tr("Print"),
                        scale: 'medium',
                        scope: this,
                        width: 50,
                        xtype: 'button'
                    }],
                    closable: false,
                    layout: 'card',
                    id: 'print-wizard-window',
                    items: [{
                        id: 'card-0',
                        items: [{
                            bodyStyle: {
                                padding: "5px"
                            },
                            flex: .7,
                            items: [{
                                anchor: '100%',
                                fieldLabel: Ext.ux.ts.tr("Select province"),
                                store: ['prov', 'provi2'],
                                xtype: 'combo'
                            },{
                                anchor: '100%',
                                fieldLabel: Ext.ux.ts.tr("Select distrct"),
                                store: ['dist1', 'dist2'],
                                xtype: 'combo'
                            }],
                            labelStyle: {
                                margin: '5px'
                            },
                            title: Ext.ux.ts.tr("Select province") + ":",
                            xtype: 'form'
                        },{
                            flex: .3,
                            items: [{
                                flex: .5,
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
                                scope: this,
                                icon: '/img/layer-add.png',
                                iconAlign: 'top',
                                scale: 'large',
                                text: "Add map frame",
                                xtype: 'button'
                            },{
                                flex: .5,
                                handler: function(){
                                    this.printExtent.layer.setVisibility(false);
                                    // Remove all pages
                                    if(this.printExtent.pages.length > 0) {
                                        for(var i = 0; i < this.printExtent.pages.length; i++){
                                            this.printExtent.removePage(this.printExtent.pages[i]);
                                        }
                                    }
                                },
                                icon: '/img/layer-delete.png',
                                iconAlign: 'top',
                                scale: 'large',
                                scope: this,
                                
                                text: "Remove frame",
                                xtype: 'button'
                            }],
                            layout: 'hbox',
                            layoutConfig: {
                                align: 'stretch'
                            },
                            
                            title: Ext.ux.ts.tr("or set custom extent") + ":",
                            xtype: 'panel'
                        }],
                        layout: 'vbox',
                        layoutConfig: {
                            align: 'stretch'
                        },
                        
                        xtype: 'container'
                    },{
                        cm: new Ext.grid.ColumnModel([{
                            id: "title",
                            header: "Title",
                            dataIndex: "title",
                            sortable: false
                        }]),
                        hideHeaders: true,
                        id: 'card-1',
                        selModel: new Ext.grid.RowSelectionModel({
                            singleSelect: true
                        }),
                        store: this.viewport.layerStore2,
                        title: Ext.ux.ts.tr("Select background layer"),
                        viewConfig: {
                            forceFit: true
                        },
                        xtype: 'grid'
                    },{
                        cm: new Ext.grid.ColumnModel([{
                            id: "title",
                            header: "Title",
                            dataIndex: "title",
                            sortable: false
                        }]),
                        hideHeaders: true,
                        id: 'card-2',
                        selModel: new Ext.grid.RowSelectionModel({
                            singleSelect: true
                        }),
                        store: this.viewport.layerStore2,
                        title: Ext.ux.ts.tr("Select overlay"),
                        viewConfig: {
                            forceFit: true
                        },
                        xtype: 'grid'
                    },{
                        bodyStyle: {
                            padding: "5px"
                        },
                        id: 'card-3',
                        items: [{
                            anchor: '100%',
                            fieldLabel: Ext.ux.ts.tr("Title"),
                            xtype: 'textfield'
                        },{
                            anchor: '100%',
                            fieldLabel: Ext.ux.ts.tr('Subtitle'),
                            name: 'mapSubtitle',
                            //allowBlank:false,
                            plugins: new GeoExt.plugins.PrintProviderField({
                                printProvider: this.printProvider
                            }),
                            xtype: 'textfield'
                        }],
                        listeners: {
                            activate: function(comp){
                                Ext.getCmp('print-button').enable();
                            }
                        },
                        title: Ext.ux.ts.tr("Add additional information") + ":",
                        xtype: 'form'
                    }],
                    height: 350,
                    title: Ext.ux.ts.tr('Map printing wizard'),
                    width: 400
                }).show();
                */
            },
            iconCls: 'print-button',
            iconAlign: 'top',
            scale: 'medium',
            scope: this,
            text: Ext.ux.ts.tr("Print"),
            width: 50
        },{
            handler: function(event){

                // Get the selected layer
                var g = this.viewport.layerGrid;
                var selected = g.getSelectedLayer();
                if(!selected){
                    return null;
                }

                var attributeSelectionPanel;

                var selectButton = new Ext.Button({
                    handler: function(){
                        this.unselectFeatures();
                        attributeSelectionPanel.selectFeaturesByAttributes(attributeSelectionPanel.logicalOperator, attributeSelectionPanel.findByType("ux_attributeselectionfield"));
                    },
                    scope: this,
                    text: Ext.ux.ts.tr('Select')
                });

                attributeSelectionPanel = new Ext.ux.AttributeSelectionPanel({
                    border: false,
                    //frame: false,
                    layerRecord: selected,
                    selectButton: selectButton,
                    viewport: this.viewport
                });

                var w = new Ext.Window({

                    bbar: ['->', {
                        handler: function(){
                            w.close();
                        },
                        text: Ext.ux.ts.tr('Close'),
                        xtype: 'button'
                    }, selectButton],
                    layout: 'fit',
                    items: [attributeSelectionPanel],

                    height: 200,
                    title: Ext.ux.ts.tr('Select by attributes'),
                    width: 600
                }).show();
            },
            //icon: '/lib/DecideGisClient/resources/img/query-builder2.png',
            iconCls: 'query-builder-button',
            iconAlign: 'top',
            scope: this,
            text: Ext.ux.ts.tr("Query Builder"),
            tooltip: Ext.ux.ts.tr("Query Builder")
        },{
            handler: function(event){

                //var selectionGridPanel = this.viewport.selectionGridPanel;

                var g = this.viewport.layerGrid;
                var selected = g.getSelectedLayer();
                if(!selected){
                    return null;
                }
                var s = selected.data.featureStore

                // Create the columns from the featureStore
                var columns = new Array();
                for(var i = 0; i < s.fields.keys.length; i++){
                    columns.push({
                        'header': s.fields.keys[i],
                        'dataIndex': s.fields.keys[i]
                    })
                }

                var w = new Ext.Window({
                    bbar: ['->',{
                        handler: function(button, event){
                            w.close();
                        },
                        text: Ext.ux.ts.tr("Close"),
                        xtype: 'button'
                    }],
                    height: 400,
                    items: [{
                        bbar: new Ext.PagingToolbar({
                            store: s,       // grid and PagingToolbar using same store
                            displayInfo: true,
                            pageSize: 25,
                            prependButtons: true,
                            paramNames: {
                                start: 'offset',
                                limit: 'limit'
                            }
                        }),
                        border: false,
                        columns: columns,
                        frame: false,
                        store: s,
                        viewConfig: {
                            forceFit: true
                        },
                        xtype: 'grid'
                    }],
                    layout: 'fit',
                    tbar: [{
                        handler: function(){
                            // Clone the base parameters
                            var p = Ext.apply({}, s.baseParams);
                            // Remove the limit and offset parameter
                            delete p['limit'];
                            delete p['offset'];
                            Ext.apply(p, {
                                format: 'xls'
                            });
                            var url = "/" + Ext.ux.currentLanguage + "/gis/layer?" + Ext.urlEncode(p);
                            window.location.href = url;
                        },
                        icon: '/img/download_table.png',
                        iconAlign: 'top',
                        text: Ext.ux.ts.tr("Save as Table"),
                        scale: 'medium',
                        scope: this,
                        xtype: 'button'
                    }],
                    width: 600
                }).show();
            },
            iconCls: 'attribute-table-button',
            iconAlign: 'top',
            scope: this,
            text: Ext.ux.ts.tr("Attribute Table"),
            tooltip: Ext.ux.ts.tr("Show Attribute Table")
        },{
            handler: function(){
                var selected = this.viewport.layerGrid.getSelectedLayer();
                // Clone the base parameters
                var p = Ext.apply({}, selected.data.featureStore.baseParams);
                // Remove the limit and offset parameter
                delete p['limit'];
                delete p['offset'];
                Ext.apply(p, {
                    format: 'shp',
                    no_geom: 'false'
                });
                var url = "/" + Ext.ux.currentLanguage + "/gis/layer?" + Ext.urlEncode(p);
                console.log(url);
            //window.location.href = url;
            },
            iconCls: "download-button",
            iconAlign: 'top',
            scope: this,
            tooltip: Ext.ux.ts.tr("Download selected features"),
            text: Ext.ux.ts.tr('Download')
        },'-',
        selectAction, freehandSelectAction, unselectAction, zoomSelection]

        var config = {
            defaults: {
                scale: 'medium',
                xtype: 'button'
            },
            items: items
        }

        Ext.apply(this, config);

        //call the superclass constructor
        Ext.ux.MainGisToolbar.superclass.initComponent.call(this);
    },

    selectFeaturesByBox:function(event){
        var bbox=event.response;
        if(bbox instanceof OpenLayers.Bounds){
            this.viewport.selectionBounds=bbox.clone();
        }
        //this.viewport.mapSelection.selectByBox(bbox);

        var g = this.viewport.layerGrid;
        var selected = g.getSelectedLayer();
        if(!selected){
            return null;
        }

        var ms = new Ext.ux.MapSelection({
            map: this.viewport.map,
            layer: selected.data.layer
        });

        var layer = ms.selectByBox(bbox);

        this.viewport.layerStore2.add([new GeoExt.data.LayerRecord({
            layer: layer,
            opacity: 100,
            title: 'Selected Features'
        })
        ]);

        // Filter base and vector layers
        this.viewport.layerStore2.filterBy(function(record, id){
            return record.data.layer.displayInLayerSwitcher;
        }, this);

        this.viewport.map.setLayerZIndex(layer, this.viewport.map.layers.length);

        selected.data.featureStore.selectByBox(bbox);

    },


    selectFeaturesFreehand:function(event){

        var f=event.feature;
        if(f.geometry instanceof OpenLayers.Geometry){
            this.viewport.selectionBounds=f.geometry.bounds.clone();
        }

        var g = this.viewport.layerGrid;
        var selected = g.getSelectedLayer();
        if(!selected){
            this.viewport.freehandSelectionLayer.removeFeatures([f]);
            return null;
        }

        var ms = new Ext.ux.MapSelection({
            map: this.viewport.map,
            layer: selected.data.layer
        });

        var layer = ms.selectFreehand(f.geometry);

        this.viewport.layerStore2.add([new GeoExt.data.LayerRecord({
            layer: layer,
            opacity: 100,
            title: 'Selected Features'
        })
        ]);

        // Filter base and vector layers
        this.viewport.layerStore2.filterBy(function(record, id){
            return record.data.layer.displayInLayerSwitcher;
        }, this);

        this.viewport.map.setLayerZIndex(layer, this.viewport.map.layers.length);

        selected.data.featureStore.selectFreehand(f.geometry, []);


        /*
        this.viewport.mapSelection.selectFreehand(f.geometry);
        this.viewport.selectionStore.selectFreehand(f.geometry,this.viewport.currentFields);
        this.viewport.selectionGridPanel.reconfigure(this.viewport.selectionStore,this.viewport.getColumnModelFromFields(this.viewport.currentFields,true));
     */
        this.viewport.freehandSelectionLayer.removeFeatures([f]);

    },

    unselectFeatures: function(event){
        this.viewport.selectionBounds=null;
        // Clear the filter
        var layerStore = this.viewport.layerStore2;
        layerStore.clearFilter(true);
        // Loop through all layers and remove all selection layers
        layerStore.each(function(record){
            if(record.data.layer.name == 'selection'){
                this.remove(record);
            }
            if(record.data.featureStore){
                var store = record.data.featureStore;
                var params = store.baseParams;
                store.baseParams = null;
                store.baseParams = {
                    attrs: params.attrs,
                    dataset: params.dataset,
                    format: params.format,
                    layer: params.layer,
                    limit: params.limit
                };
                store.load();
            }
        }, layerStore);
        // Refilter the layerstore
        layerStore.filterBy(function(record, id){
            return record.data.layer.displayInLayerSwitcher;
        }, this);

    }
});

Ext.reg('ux_maingistoolbar', Ext.ux.MainGisToolbar);