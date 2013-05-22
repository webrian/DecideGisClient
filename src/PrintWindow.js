Ext.namespace("Ext.ux");

Ext.ux.PrintWindow = Ext.extend(Ext.Window, {

    backgroundLayer: null,

    overlayLayer: null,

    printMap: null,

    initComponent: function(){

        // Textfield to add the map title
        var titleTextfield = new Ext.form.TextField({
            allowBlank: false,
            anchor: '100%',
            fieldLabel: Ext.ux.ts.tr("Title"),
            listeners: {
                invalid: function(field, msg) {
                    printButton.disable();
                },
                valid: function(field) {
                    if(subtitleTextField.isValid()){
                        printButton.enable();
                    }
                }
            },
            name: 'mapTitle',
            plugins: new GeoExt.plugins.PrintProviderField({
                printProvider: this.printProvider
            })
        });

        // Textfield to add the map subtitle
        var subtitleTextField = new Ext.form.TextField({
            allowBlank: false,
            anchor: '100%',
            fieldLabel: Ext.ux.ts.tr('Subtitle'),
            listeners: {
                invalid: function(field, msg) {
                    printButton.disable();
                },
                valid: function(field) {
                    if(titleTextfield.isValid()){
                        printButton.enable();
                    }
                }
            },
            name: 'mapSubtitle',
            plugins: new GeoExt.plugins.PrintProviderField({
                printProvider: this.printProvider
            }),
            xtype: 'textfield'
        });

        var printButton = new Ext.Button({
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

                    printMap.addLayers([hillshade]);

                    // If a background layer is selected, add it to the printMap
                    // and add the custom parameters to the print provider
                    if(this.backgroundLayer){
                        printMap.addLayers([this.backgroundLayer]);
                        // This is the layer title e.g. "Percent of village population" etc.
                        this.printProvider.customParams.layerTitle = this.backgroundLayer.name;

                        var layername = this.backgroundLayer.layername.split("@")[0];
                        this.printProvider.customParams.layerName = layername;

                        // Add source and attribution
                        this.printProvider.customParams.layerSource = "Source missing";
                        if(this.backgroundLayer.attribution) {
                            this.printProvider.customParams.layerCopyright = this.backgroundLayer.attribution;
                        }

                    }

                    // If an overlay layer is selectd, add it to the printMap
                    // and add the custom parameters to the print provider
                    if(this.overlayLayer){
                        printMap.addLayers([this.overlayLayer]);
                        // The layer title
                        this.printProvider.customParams.overlayTitle = this.overlayLayer.name;
                        // Get the wms layer name
                        this.printProvider.customParams.overlayName = this.overlayLayer.layername.split("@")[0];
                        this.printProvider.customParams.overlaySource = "Source missing";
                        if(this.overlayLayer.attribution) {
                            this.printProvider.customParams.overlayCopyright = this.overlayLayer.attribution;
                        }

                    }

                    // Add the general disclaimer
                    this.printProvider.customParams.disclaimer = Ext.ux.ts.tr("Boundaries, colours and denominations on this map are not authoritative.");


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
            text: Ext.ux.ts.tr("Print"),
            scale: 'medium',
            scope: this,
            width: 50
        });

        var quitButton = new Ext.Button({
            handler: function(){
                this.printExtent.layer.setVisibility(false);
                // Remove all pages
                if(this.printExtent.pages.length > 0) {
                    for(var i = 0; i < this.printExtent.pages.length; i++){
                        this.printExtent.removePage(this.printExtent.pages[i]);
                    }
                }
                this.printProvider.customParams = {}
                this.close();
            },
            iconAlign: 'top',
            iconCls: 'quit-button',
            scale: 'medium',
            scope: this,
            text: Ext.ux.ts.tr("Close"),
            width: 50
        });

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
            disabled: true,
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
        },'->', printButton, quitButton];
        var items = [{
            id: 'card-0',
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
            buttons: [{
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
                    // Enable the next and print button, if title and subtitle
                    // fields are valid
                    Ext.getCmp('move-next').enable();
                    if(titleTextfield.isValid() && subtitleTextField.isValid()){
                        printButton.enable();
                    }
                },
                scope: this,
                iconAlign: 'top',
                iconCls: 'add-frame-button',
                scale: 'medium',
                text: Ext.ux.ts.tr("Add map frame"),
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
                    // Disable the next and print button
                    Ext.getCmp('move-next').disable();
                    printButton.disable();
                },
                iconAlign: 'top',
                iconCls: 'remove-frame-button',
                scale: 'medium',
                scope: this,

                text: Ext.ux.ts.tr("Remove map frame"),
                xtype: 'button'
            }],
            padding: '5px',
            title: Ext.ux.ts.tr("Set layout and map frame"),
            xtype: 'form'
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
            items: [ titleTextfield, subtitleTextField],
            title: Ext.ux.ts.tr("Add additional information") + ":",
            xtype: 'form'
        }];
        
        
        var config = {
            activeItem: 0,
            bbar: bbar,
            closable: false,
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