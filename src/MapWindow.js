Ext.namespace("Ext.ux");

Ext.ux.MapWindow = Ext.extend(Ext.Panel, {

    aboutPanel: null,

    aboutTemplate: null,

    layerStore: null,

    legendPanel: null,

    legendTemplate: null,

    legendWindow: null,

    map: null,

    mapPanel: null,

    layersTreePanel: null,

    syncMapPanel: null,

    initComponent: function(conf){
        var config = conf || {};

        var me = this;

        /**
         * @private
         */
        var fullExtent = new OpenLayers.Bounds(11172568.898617, 1590934.133530, 11915346.468155, 2536210.614042);

        /**
         * The OpenLayers map object
         * @public
         */
        this.map = new OpenLayers.Map({
            allOverlays: false,
            controls:[
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.PanZoomBar(),
            new OpenLayers.Control.ScaleLine()
            ],
            displayProjection: new OpenLayers.Projection("EPSG:4326"),
            //maxExtent: new OpenLayers.Bounds(11172568.898617, 1590934.133530, 11915346.468155, 2536210.614042),
            projection: new OpenLayers.Projection("EPSG:900913"),
            //numZoomLevels: 6,
            resolutions: [2445.9849046875, 1222.99245234375, 611.496226171875, 305.7481130859375, 152.87405654296876, 76.43702827148438 ],
            units: "m"
        });

        this.map.events.on({
            'changebaselayer': function(event){
                me.mapPanel.setTitle(event.layer.name);
            },
            'moveend': this.updateLocationCookie,
            scope: this
        });

        if(this.syncMapPanel){
            this.map.events.on({
                'moveend': this.onMoveEnd,
                scope: this
            })
        }

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

        this.layerStore = new GeoExt.data.LayerStore({
            autoLoad: false,
            initDir: GeoExt.data.LayerStore.STORE_TO_MAP,
            layers: [hillshade]
        });

        var toolbarItems = [];

        var datasetStore = new Ext.data.JsonStore({
            autoLoad: true,
            fields: ['id', 'name', 'url'],
            idProperty: 'id',
            root: 'datasets',
            proxy : new Ext.data.HttpProxy({
                method: 'GET',
                url: '/datasets/mapviewer'
            })
        });

        var datasetCombo = new Ext.form.ComboBox({
            displayField: 'name',
            editable: false,
            emptyText: Ext.ux.ts.tr("Select dataset"),
            forceSelection: true,
            listeners: {
                'select': function(combo, record, index){
                    var p = this.layersTreePanel;
                    var rootNode = p.getRootNode();

                    // Current value
                    var v = combo.getValue();
                    var r = combo.getStore().getAt(index);

                    rootNode.setText(r.get('name'));

                    Ext.Ajax.request({
                        url: '/mapviewer/layerstore',
                        method: 'GET',
                        params: {
                            dataset: combo.getValue()
                        },
                        scope: this,
                        success: function(response, options){
                            var r = Ext.decode(response.responseText);

                            var newLayers = new Array();
                            for(var i = 0; i < r.length; i++){
                                // Current layer definition
                                var l = r[i];
                                var newLayer = me.layerFromDefinition(l);
                                newLayers.push(newLayer);
                            }
                            // Add the new data layers to the store and the map
                            this.layerStore.loadData(newLayers);

                            rootNode.reload();
                        }
                    });

                    logoTemplate.overwrite(logoContainer.el, [combo.getValue()])
                },
                scope: this
            },
            mode: 'local',
            store: datasetStore,
            triggerAction: 'all',
            tpl:  '<tpl for="."><div class="x-combo-list-item">'
            + '<table><tbody><tr>'
            + '<td>'
            + '<div class="{id} x-icon-combo-icon"></div></td>'
            + '<td>{name}</td>'
            + '</tr></tbody></table>'
            + '</div></tpl>',
            typeAhead: false,
            valueField: 'id',
            xtype: 'combo'
        });

        toolbarItems.push({
            style: {
                'margin-right': '5px'
            },
            text: Ext.ux.ts.tr('Dataset') + ":",
            xtype: 'label'
        });
        toolbarItems.push(datasetCombo);


        // Navigation history - two "button" controls
        var ctrl = new OpenLayers.Control.NavigationHistory();
        this.map.addControl(ctrl);
                
        var navigationPreviousAction = new GeoExt.Action({
            icon: '/img/zoom-last.png',
            iconAlign: 'top',
            control: ctrl.previous,
            disabled: true,
            scale: 'medium',
            text: Ext.ux.ts.tr('Previous View'),
            tooltip:  Ext.ux.ts.tr('Go to previous view'),
            tooltipType: 'title'
        });
        toolbarItems.push(navigationPreviousAction);
                
        var navigationNextAction = new GeoExt.Action({
            icon: '/img/zoom-next.png',
            iconAlign: 'top',
            control: ctrl.next,
            disabled: true,
            scale: 'medium',
            text: Ext.ux.ts.tr('Next View'),
            tooltip: Ext.ux.ts.tr('Go to next view'),
            tooltipType: 'title'
        });
        toolbarItems.push(navigationNextAction);
                
        // Create the zoom out control and button
        var panAction = new Ext.Action({
            enableToggle: true,
            icon: '/img/pan1.png',
            iconAlign: 'top',
            scale: 'medium',
            text: Ext.ux.ts.tr('Move Map'),
            tooltip: Ext.ux.ts.tr('Move map by dragging'),
            tooltipType: 'title',
            toggleGroup: "toolbarToggleGroup"
        });
        toolbarItems.push(panAction);
                
        // Create zoom box control and button
        var zoomBox = new OpenLayers.Control.ZoomBox();
                
        var zoomBoxAction = new GeoExt.Action({
            control: zoomBox,
            enableToggle: true,
            icon: '/img/zoom-in1.png',
            iconAlign: 'top',
            map: this.map,
            scale: 'medium',
            text: Ext.ux.ts.tr('Zoom In'),
            toggleGroup: "toolbarToggleGroup",
            tooltip: Ext.ux.ts.tr('Zoom In'),
            tooltipType: 'title'
            
        });
        toolbarItems.push(zoomBoxAction);

        /**
                // Create the zoom in control and button
                var zoomInControl = new OpenLayers.Control.ZoomIn();
                
                var zoomInAction = new GeoExt.Action({
                    icon: 'img/zoom-in.png',
                    tooltip: Ext.ux.ts.tr('actionZoomIn'),
                    tooltipType: 'title',
                    control: zoomInControl,
                    map: map
                });
                toolbarItems.push(zoomInAction);*/
                
        // Create the zoom out control and button
        var zoomOutControl = new OpenLayers.Control.ZoomOut();
                
        var zoomOutAction = new GeoExt.Action({
            control: zoomOutControl,
            icon: '/img/zoom-out1.png',
            iconAlign: 'top',
            map: this.map,
            scale: 'medium',
            text: Ext.ux.ts.tr('Zoom Out'),
            tooltip: Ext.ux.ts.tr('Zoom Out'),
            tooltipType: 'title'
        });
        toolbarItems.push(zoomOutAction);
               
        var zoomToMaxExtent = new Ext.Action({
            handler: function(){
                this.map.zoomToExtent( fullExtent );
            },
            icon: '/img/zoom-extent1.png',
            iconAlign: 'top',
            scale: 'medium',
            scope: this,
            text: Ext.ux.ts.tr('Full Extent'),
            tooltip: Ext.ux.ts.tr('Zoom to full extent'),
            tooltipType: 'title'
        });
        toolbarItems.push(zoomToMaxExtent);

        if(this.changeView){
            toolbarItems.push(this.changeView);
        }

        toolbarItems.push({
            icon: '/img/help.png',
            iconAlign: 'top',
            scale: 'medium',
            style: {
                'margin-right': '10px'
            },
            text: Ext.ux.ts.tr('Help'),
            tooltip: Ext.ux.ts.tr('Help'),
            xtype: 'button'
        });

        toolbarItems.push('->');
        
        var logoTemplate = new Ext.Template("<div class=\"{0}-logo-24\"></div>");

        var logoContainer = new Ext.Container({
            data: [''],
            flex: 0.3,
            style: {
                'margin-left': '5px',
                'margin-right': '5px'
            },
            tpl: logoTemplate,
            xtype: 'container'
        });

        toolbarItems.push({
            layout: 'hbox',
            layoutConfig: {
                align: 'middle'
            },
            height: 26,
            items: [{
                flex: 0.7,
                html: Ext.ux.ts.tr("Data owner") + ":",
                style: {
                    'margin-left': '5px',
                    'margin-right': '5px'
                },
                xtype: 'container'
            },logoContainer],
            tpl: logoTemplate,
            width: 120,
            xtype: 'container'
        });

        // Create the map panel element
        this.mapPanel = new GeoExt.MapPanel({
            map: this.map,
            layers: this.layerStore,
            region: "center",
            title: "Map"
        });

        this.layersTreePanel = new Ext.tree.TreePanel({
            region: 'west',
            collapsible: true,
            width: 300,
            autoScroll: true,
            loader: {
                /**
                 * It is necessary to implement a custom createNode method,
                 * since we need to explicitly set layer and layerStore to each
                 * leaf node.
                 * This is necessary that the maps don't get messed up in the
                 * split mapview.
                 */
                createNode: function(node) {

                    // If this node is a leaf, search the corresponding layer
                    // and set the layerStore manually
                    if(node.leaf){
                        for(var i = 0; i < me.layerStore.map.layers.length; i++){
                            var l = me.layerStore.map.layers[i];
                            if(node.layer == l.name){
                                node.layer = l;
                                node.layerStore = me.layerStore;
                            }
                        }
                    }

                    return Ext.tree.TreeLoader.prototype.createNode.call(this, node);
                },
                dataUrl: "/mapviewer/layertree",
                listeners: {
                    'beforeload': function(treeloader, node){
                        treeloader.baseParams.dataset = datasetCombo.getValue();
                    }
                },
                requestMethod: 'GET'
            },
            listeners: {
                'click': {
                    fn: function(node, event) {

                        // Loading Mask
                        var loadingMask = new Ext.LoadMask(this.layersTreePanel.body, {
                            msg: Ext.ux.ts.tr("Loading...")
                        });
                        loadingMask.show();

                        if(node.layer && node.layer.id) {
                            var id = node.layer.id;
                            var l = (me.map.getLayersBy("id", id)[0]);
                            var d = datasetCombo.getValue();
                            // Basic request
                            Ext.Ajax.request({
                                failure: function(response){
                                    loadingMask.hide();
                                },
                                method: 'GET',
                                params: {
                                    layer: id,
                                    dataset: d
                                },
                                success: function(response){
                                    var r = Ext.decode(response.responseText);

                                    var t = new Ext.Template([
                                        '<h1>{title}</h1>',
                                        '<div>{text}</div>',
                                        '<div style=\"margin-top: 5px;\"><img src="{src}" width="{width}" height="{height}"></div>',
                                        '<div style=\"margin-top: 5px;\">' + Ext.ux.ts.tr("Data owner") + ':</div>',
                                        '<img src=\"/img/{owner}-logo-large.png\" width=\"90\" height=\"90\" style=\"margin-top: 5px;\"/>'
                                        ]);

                                    // Legend container width
                                    var lc_width = r.legend.width > 150 ? r.legend.width : 150

                                    // Hide the loading mask before opening the
                                    // legend window
                                    loadingMask.hide();

                                    if(this.legendWindow){
                                        this.legendWindow.close();
                                        delete this.legendWindow;
                                    }

                                    this.legendWindow = new Ext.Window({
                                        autoScroll: true,
                                        bbar: ['->', {
                                            handler: function(){
                                                this.legendWindow.close();
                                                delete this.legendWindow;
                                            },
                                            scope: this,
                                            text: Ext.ux.ts.tr("Close"),
                                            xtype: 'button'
                                        }],
                                        bodyStyle: {
                                            padding: '5px'
                                        },
                                        data: {
                                            height: r.legend.height,
                                            owner: datasetCombo.getValue(),
                                            src: r.legend.src,
                                            text: r.text,
                                            title: node.layer.name,
                                            width: r.legend.width
                                        },
                                        height: 300,
                                        title: Ext.ux.ts.tr("Legend"),
                                        tpl: t,
                                        width: (lc_width + 40)
                                    }).show();

                                },
                                scope: this,
                                url: '/mapviewer/abstract'
                            });
                        } else {
                            loadingMask.hide();
                        }
                    },
                    scope: this
                }
            },
            root: {
                expanded: true,
                nodeType: 'async',
                text: Ext.ux.ts.tr('Lao DECIDE Info MapViewer')
            }
        });



        var tbar = new Ext.Toolbar({
            enableOverflow: true,
            items: toolbarItems
        });

        var config = {
            layout: 'border',
            items: [
            this.mapPanel,
            this.layersTreePanel
            ],
            tbar: tbar
        }

        Ext.apply(this, config);

        //call the superclass constructor
        //Ext.ux.MapWindow.superclass.constructor.call(this, config);
        Ext.ux.MapWindow.superclass.initComponent.call(this, config);

    },

    /**
     * @public
     */
    zoomToMaxExtent: function() {
        var centroid = new OpenLayers.LonLat(11528173.2340775, 2050045.307021);
        this.map.setCenter(centroid,0,true,true);
    },

    getMap: function(){
        return this.map;
    },

    onMoveEnd: function() {
        var center = this.map.getCenter();
        var zoom = this.map.getZoom();
        if(this.syncMapPanel){
            this.syncMapPanel.updateMap(center, zoom);
        }
    },

    /**
     * Write the current map center to a cookie name _LOCATION_
     */
    updateLocationCookie: function() {
        var center = this.map.getCenter();
        var zoom = this.map.getZoom();
        Ext.util.Cookies.set('_LOCATION_', center.lon + "|" + center.lat + "|" + zoom, new Date().add(Date.DAY, 30));
    },

    setSyncMapPanel: function(mapPanel){
        this.syncMapPanel = mapPanel;
    },

    updateMap: function(lonLat, zoom){
        this.map.events.un({
            'moveend': this.onMoveEnd,
            scope: this
        });
        this.map.setCenter(lonLat, zoom, false, false);
        this.map.events.on({
            'moveend': this.onMoveEnd,
            scope: this
        });
    },

    layerFromDefinition: function(definition){

        var layer;

        switch(definition.type){
            case 'XYZ':
                layer = new OpenLayers.Layer.XYZ(definition.name,
                    definition.url,
                    definition.ol_options
                    );
                layer.id = definition.id;
                break;
            case 'TMS':
                layer = new OpenLayers.Layer.TMS(definition.name,
                    definition.url,
                    definition.options
                    );
                layer.id = definition.id
                break;
            case 'WMTS':

                var matrixIdentifier = 'SEA:900913';

                var matrixIds = [{
                    identifier: matrixIdentifier + ':0',
                    topLeftCorner: new OpenLayers.LonLat(10018754.167,3757214.0)
                },{
                    identifier: matrixIdentifier + ':1',
                    topLeftCorner: new OpenLayers.LonLat(10018754.167,3757214.0)
                },{
                    identifier: matrixIdentifier + ':2',
                    topLeftCorner: new OpenLayers.LonLat(10018754.167,3600671.0)
                },{
                    identifier: matrixIdentifier + ':3',
                    topLeftCorner: new OpenLayers.LonLat(10018754.167,3522400.0)
                },{
                    identifier: matrixIdentifier + ':4',
                    topLeftCorner: new OpenLayers.LonLat(10018754.167,3483264.0)
                },{
                    identifier: matrixIdentifier + ':5',
                    topLeftCorner: new OpenLayers.LonLat(10018754.167,3483264.0)
                },{
                    identifier: matrixIdentifier + ':6',
                    topLeftCorner: new OpenLayers.LonLat(10018754.167,3483264.0)
                }];

                var options = Ext.applyIf({
                    matrixIds: matrixIds,
                    matrixSet: matrixIdentifier,
                    tileOrigin: new OpenLayers.LonLat(10018754.167,3757214.0),
                    sphericalMercator: true
                }, definition.ol_options);

                // Background color relief
                // It is delivered through the WMS Tiling service from the Geowebcache
                /*var colorrelief = new OpenLayers.Layer.WMTS({
                    format: 'image/jpeg',
                    isBaseLayer: true,
                    layer: 'sea-colorrelief',

                    name: this.i18n.getString("layerEntryColorRelief"),

                    style: 'default',

                    url: 'http://www.decide.la/geoserver/gwc/service/wmts',
                    visibility: true
                });*/
                layer = new OpenLayers.Layer.WMTS(options);
                layer.id = definition.id;
               
                break;
        }

        return layer;
    }

});

Ext.reg('ux_mapwindow', Ext.ux.MapWindow);
