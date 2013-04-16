Ext.namespace("Ext.ux");

Ext.ux.PrintWindow = Ext.extend(Ext.Window, {

    backgroundLayer: null,

    overlayLayer: null,

    printMap: null,

    initComponent: function(){

        var bbar = [
        {
            disabled: true,

            handler: function(event){
                var l = this.getLayout();
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
            iconAlign: 'top',
            iconCls: 'go-previous-button',
            id: 'move-prev',
            scale: 'medium',
            scope: this,
            text: 'Back',
            width: 50
        },{
            handler: function(event){
                var l = this.getLayout();
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
            iconAlign: 'top',
            iconCls: 'go-next-button',
            id: 'move-next',
            scale: 'medium',
            scope: this,
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
                this.close();
            },
            iconAlign: 'top',
            iconCls: 'quit-button',
            scale: 'medium',
            scope: this,
            text: Ext.ux.ts.tr("Quit"),
            width: 50
        },{
            disabled: true,
            handler: function(){
                if(this.printExtent.pages.length > 0){
                    //this.printExtent.print(this.viewport.map);

                    var printMap = new OpenLayers.Map({
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
                    /*var overlay = new OpenLayers.Layer.TMS(
                        "Overlay", "http://localhost:8080/geoserver/gwc/service/tms/", {
                            isBaseLayer: false,
                            displayInLayerSwitcher: false,
                            layername: "census2005:pop_married_pct@EPSG:900913@png",
                            type: "png",
                            // set if different than the bottom left of map.maxExtent
                            tileOrigin: new OpenLayers.LonLat(-20037508.340000, -20037508.340000)
                        });
                    overlay.id = "overlay"*/
                    printMap.addLayers([hillshade]);

                    if(this.backgroundLayer){
                        printMap.addLayers([this.backgroundLayer]);
                    }

                    if(this.overlayLayer){
                        printMap.addLayers([this.overlayLayer]);
                    }

                    var layername = this.backgroundLayer.layername.split("@")[0]

                    // Get the current layer and get the required parameters

                    //var index = this.layerMetadataStore.find('wms_title', currentLayer.name);
                    //var r = this.layerMetadataStore.getAt(index);

                    // This is the legend title e.g. "Percent of village population" etc.
                    this.printProvider.customParams.legendTitle = this.backgroundLayer.name; //   r.get('wms_legend');

                    // WMS styles and layers are required for the WMS legend
                    this.printProvider.customParams.wmsstyle = "";
                    this.printProvider.customParams.wmslayer = layername;
                    this.printProvider.customParams.comment = "";

                    
                    this.printProvider.customParams.disclaimer = Ext.ux.ts.tr("Boundaries, colours and denominations on this map are not authoritative.");
                    this.printProvider.customParams.source = "this.backgroundLayer.source";
                    this.printProvider.customParams.copyright = "this.backgroundLayer.attribution";
                    
                    this.printProvider.print(printMap, this.printExtent.pages);
                } else {
                    Ext.Msg.show({
                        title:'Missing Print Frame',
                        msg: 'Please add first a print frame to the map.',
                        buttons: Ext.Msg.OK,
                        icon: Ext.MessageBox.WARNING
                    });
                }
            },
            iconAlign: "top",
            iconCls: "print-button",
            id: 'print-button',
            text: Ext.ux.ts.tr("Print"),
            scale: 'medium',
            scope: this,
            width: 50,
            xtype: 'button'
        }];
        var items = [{
            id: 'card-0',
            items: [{
                bodyStyle: {
                    padding: "5px"
                },
                flex: .7,
                items: [{
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
                    xtype: 'combo'
                }],
                /*
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
                */
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
                    iconAlign: 'top',
                    iconCls: 'add-frame-button',
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
                    iconAlign: 'top',
                    iconCls: 'remove-frame-button',
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
                listeners: {
                    'rowselect': function(selModel, rowIndex, record){
                        var l = record.data.layer.clone();
                        l.zoomOffset = 0;
                        this.backgroundLayer = l;
                    },
                    scope: this
                },
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
                listeners: {
                    'rowselect': function(selModel, rowIndex, record){
                        console.log("rowselect");
                        var l = record.data.layer.clone();
                        l.zoomOffset = 0;
                        this.overlayLayer = l;
                    },
                    scope: this
                },
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
            // This is the map title and subtitle that will be placed at the top of the map
            items: [{
                anchor: '100%',
                fieldLabel: Ext.ux.ts.tr("Title"),
                name: 'mapTitle',
                plugins: new GeoExt.plugins.PrintProviderField({
                    printProvider: this.printProvider
                }),
                xtype: 'textfield'
            },{
                anchor: '100%',
                fieldLabel: Ext.ux.ts.tr('Subtitle'),
                name: 'mapSubtitle',
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
        }];
        
        
        var config = {
            activeItem: 0,
            bbar: bbar,
            closable: false,
            id: 'print-wizard-window',
            items: items,
            layout: 'card',
            title: Ext.ux.ts.tr('Map printing wizard')
        }

        Ext.apply(this, config);

        //call the superclass constructor
        Ext.ux.PrintWindow.superclass.initComponent.call(this);
    }
});

Ext.reg('ux_printwindow', Ext.ux.PrintWindow);