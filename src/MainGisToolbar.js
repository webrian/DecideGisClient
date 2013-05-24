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
            text: Ext.ux.ts.tr('Select'),
            tooltip: Ext.ux.ts.tr('Select features'),
            control: new OpenLayers.Control.SelectByBox({
                eventListeners:{
                    "select": this.selectFeaturesByBox,
                    scope: this
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
            text: Ext.ux.ts.tr("Freehand Select"),
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
                var printWindow = new Ext.ux.PrintWindow({
                    height: 350,
                    printProvider: this.printProvider,
                    printExtent: this.printExtent,
                    width: 400,
                    viewport: this.viewport
                }).show();
            },
            iconCls: 'print-button',
            iconAlign: 'top',
            scale: 'medium',
            scope: this,
            text: Ext.ux.ts.tr("Print"),
            tooltip: Ext.ux.ts.tr("Print"),
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
                    iconCls: 'select-button',
                    iconAlign: 'top',
                    scope: this,
                    scale: 'medium',
                    text: Ext.ux.ts.tr('Select')
                });

                attributeSelectionPanel = new Ext.ux.AttributeSelectionPanel({
                    border: false,
                    frame: false,
                    layerRecord: selected,
                    selectButton: selectButton,
                    viewport: this.viewport
                });

                var w = new Ext.Window({

                    bbar: ['->', selectButton, {
                        handler: function(){
                            w.close();
                        },
                        iconCls: 'quit-button',
                        iconAlign: 'top',
                        scale: 'medium',
                        text: Ext.ux.ts.tr('Close'),
                        width: 50,
                        xtype: 'button'
                    }],
                    layout: 'fit',
                    items: [attributeSelectionPanel],

                    height: 200,
                    title: Ext.ux.ts.tr('Select by attributes'),
                    width: 600
                }).show();
            },
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
                var s = selected.data.featureStore;
                var attributeStore = selected.data.attributeStore;
                // Load the feature store in the moment the attribute table is
                // opened.
                s.load();

                // Create the columns from the featureStore
                var columns = new Array();
                for(var i = 0; i < s.fields.keys.length; i++){
                    var attributeIndex = attributeStore.find("name", s.fields.keys[i]);
                    var header = attributeStore.getAt(attributeIndex).get("label");

                    columns.push({
                        dataIndex: s.fields.keys[i],
                        header: header,
                        sortable: true
                    });
                }

                var gridView = new Ext.grid.GridView({
                    afterRenderUI: function() {

                        var grid = this.grid;

                        this.initElements();

                        // get mousedowns early
                        Ext.fly(this.innerHd).on('click', this.handleHdDown, this);

                        this.mainHd.on({
                            scope    : this,
                            mouseover: this.handleHdOver,
                            mouseout : this.handleHdOut,
                            mousemove: this.handleHdMove
                        });

                        this.scroller.on('scroll', this.syncScroll,  this);

                        if (grid.enableColumnResize !== false) {
                            this.splitZone = new Ext.grid.GridView.SplitDragZone(grid, this.mainHd.dom);
                        }

                        if (grid.enableColumnMove) {
                            this.columnDrag = new Ext.grid.GridView.ColumnDragZone(grid, this.innerHd);
                            this.columnDrop = new Ext.grid.HeaderDropZone(grid, this.mainHd.dom);
                        }

                        if (grid.enableHdMenu !== false) {
                            this.hmenu = new Ext.menu.Menu({
                                id: grid.id + '-hctx'
                            });
                            this.hmenu.add({
                                iconCls: 'histogram',
                                itemId: 'hist',
                                text: this.histogramText
                            },{
                                itemId:'asc',
                                text: this.sortAscText,
                                cls: 'xg-hmenu-sort-asc'
                            },{
                                itemId:'desc',
                                text: this.sortDescText,
                                cls: 'xg-hmenu-sort-desc'
                            }
                            );

                            if (grid.enableColumnHide !== false) {
                                this.colMenu = new Ext.menu.Menu({
                                    id:grid.id + '-hcols-menu'
                                });
                                this.colMenu.on({
                                    scope     : this,
                                    beforeshow: this.beforeColMenuShow,
                                    itemclick : this.handleHdMenuClick
                                });
                                this.hmenu.add('-', {
                                    itemId:'columns',
                                    hideOnClick: false,
                                    text: this.columnsText,
                                    menu: this.colMenu,
                                    iconCls: 'x-cols-icon'
                                });
                            }

                            this.hmenu.on('itemclick', this.handleHdMenuClick, this);
                        }

                        if (grid.trackMouseOver) {
                            this.mainBody.on({
                                scope    : this,
                                mouseover: this.onRowOver,
                                mouseout : this.onRowOut
                            });
                        }

                        if (grid.enableDragDrop || grid.enableDrag) {
                            this.dragZone = new Ext.grid.GridDragZone(grid, {
                                ddGroup : grid.ddGroup || 'GridDD'
                            });
                        }

                        this.updateHeaderSortState();
                    },
                    forceFit: true,
                    handleHdMenuClick : function(item) {
                        var store = this.ds,
                        dataIndex = this.cm.getDataIndex(this.hdCtxIndex);

                        switch (item.getItemId()) {
                            case 'asc':
                                store.sort(dataIndex, 'ASC');
                                break;
                            case 'desc':
                                store.sort(dataIndex, 'DESC');
                                break;
                            case 'hist':
                                this.showHistogram(dataIndex);
                                break;
                            default:
                                this.handleHdMenuClickDefault(item);
                        }
                        return true;
                    },
                    histogramText: Ext.ux.ts.tr("Show histogram"),
                    showHistogram: function(dataIndex){
                        // Clone the base parameters
                        var p = Ext.apply({}, s.baseParams);
                        // Remove the limit and offset parameter
                        delete p['limit'];
                        delete p['offset'];
                        Ext.apply(p, {
                            format: 'hist',
                            attrs: dataIndex,
                            height: 316,
                            width: 586
                        });
                        attributeIndex = attributeStore.find("name", dataIndex);
                        var short_label = attributeStore.getAt(attributeIndex).get("label");

                        var loadingMask = new Ext.LoadMask(document.body, {
                            msg: Ext.ux.ts.tr("Loading...")
                        });
                        loadingMask.show();
                        
                        Ext.Ajax.request({
                            callback: function(options, success, response){
                                loadingMask.hide();
                            },
                            failure: function(response, options){
                                Ext.Msg.alert(Ext.ux.ts.tr("Error"), response.responseText);
                            },
                            success: function(response){

                                var r = Ext.decode(response.responseText);

                                if(r.success){
                                    var histWindow = new Ext.Window({
                                        bbar: ['->',{
                                            handler: function(button, event){
                                                window.location.href = r.msg + "?" + Ext.urlEncode({
                                                    forcedownload: true
                                                })
                                            },
                                            iconAlign: 'top',
                                            iconCls: 'download-image-button',
                                            scale: 'medium',
                                            text: Ext.ux.ts.tr("Save as Image"),
                                            xtype: 'button'
                                        },{
                                            handler: function(button, event){
                                                histWindow.close();
                                            },
                                            iconCls: 'quit-button',
                                            iconAlign: 'top',
                                            scale: 'medium',
                                            text: Ext.ux.ts.tr("Close"),
                                            width: 50,
                                            xtype: 'button'
                                        }],
                                        bodyCfg: {
                                            children: [{
                                                tag: 'img',
                                                src: r.msg,
                                                alt: "Histogram"
                                            }],
                                            tag: 'div'
                                        },
                                        height: 400,
                                        title: short_label,
                                        width: 600
                                    }).show();
                                } else {
                                    Ext.Msg.show({
                                        buttons: Ext.Msg.OK,
                                        icon: Ext.Msg.ERROR,
                                        msg: r.msg,
                                        title: Ext.ux.ts.tr("Error")
                                    });
                                }
                            },
                            url: "/" + Ext.ux.currentLanguage + "/gis/layer?" + Ext.urlEncode(p)
                        });
                    }
                });

                var w = new Ext.Window({
                    bbar: ['->',{
                        handler: function(){

                            var loadingMask = new Ext.LoadMask(document.body, {
                                msg: Ext.ux.ts.tr("Loading...")
                            });
                            loadingMask.show();

                            // Clone the base parameters
                            var p = Ext.apply({}, s.baseParams);
                            // Remove the limit and offset parameter
                            delete p['limit'];
                            delete p['offset'];
                            Ext.apply(p, {
                                format: 'xls'
                            });
                            Ext.Ajax.request({
                                callback: function(options, success, response){
                                    loadingMask.hide();
                                },
                                failure: function(response, options){
                                    Ext.Msg.alert("Error", response.responseText);
                                },
                                method: 'GET',
                                params: p,
                                success: function(response, options){
                                    var r = Ext.decode(response.responseText);
                                    if(r.success){
                                        window.location.href = r.msg;
                                    }
                                },
                                url: "/" + Ext.ux.currentLanguage + "/gis/layer"
                            });
                        },
                        iconCls: 'download-table-button',
                        iconAlign: 'top',
                        text: Ext.ux.ts.tr("Save as table"),
                        scale: 'medium',
                        scope: this,
                        xtype: 'button'
                    },{
                        handler: function(button, event){
                            w.close();
                        },
                        iconCls: 'quit-button',
                        iconAlign: 'top',
                        scale: 'medium',
                        text: Ext.ux.ts.tr("Close"),
                        width: 50,
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
                        loadMask: {
                            msg: Ext.ux.ts.tr("Loading...")
                        },
                        store: s,
                        view: gridView,
                        xtype: 'grid'
                    }],
                    layout: 'fit',
                    title: selected.data.layer.name,
                    width: 600
                }).show();
            },
            iconCls: 'attribute-table-button',
            iconAlign: 'top',
            scope: this,
            text: Ext.ux.ts.tr("Attribute Table"),
            tooltip: Ext.ux.ts.tr("Attribute Table")
        },{
            handler: function(){
                var selected = this.viewport.layerGrid.getSelectedLayer();
                if(!selected){
                    return null;
                }
                // Clone the base parameters
                var p = Ext.apply({}, selected.data.featureStore.baseParams);
                // Remove the limit and offset parameter
                delete p['limit'];
                delete p['offset'];

                var loadingMask = new Ext.LoadMask(document.body, {
                    msg: Ext.ux.ts.tr("Loading...")
                });
                loadingMask.show();

                Ext.apply(p, {
                    format: 'shp',
                    no_geom: 'false'
                });
                Ext.Ajax.request({
                    callback: function(options, success, response){
                        loadingMask.hide();
                    },
                    failure: function(response, options){
                        Ext.Msg.alert("Error", response.responseText);
                    },
                    method: 'GET',
                    params: p,
                    success: function(response, options){
                        var r = Ext.decode(response.responseText);
                        if(r.success){
                            window.location.href = r.msg;
                        }
                    },
                    url: "/" + Ext.ux.currentLanguage + "/gis/layer"
                });
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

        // Clear first an existing selection
        this.unselectFeatures(event);

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

        var lr = new GeoExt.data.LayerRecord({
            attributeStore: null,
            attrs: [],
            featureStore: null,
            id: 'selection',
            layer: layer,
            opacity: 100,
            title: 'selection',
            zIndex: layer.getZIndex()
        });

        this.viewport.layerStore2.add([lr]);

        // Filter base and vector layers
        this.viewport.layerStore2.filterBy(function(record, id){
            return record.data.layer.displayInLayerSwitcher;
        }, this);

        this.viewport.map.setLayerZIndex(layer, this.viewport.map.layers.length);

        selected.data.featureStore.selectByBox(bbox);

    },


    selectFeaturesFreehand:function(event){

        // Clear first an existing selection
        this.unselectFeatures(event);

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
        // Get the layerStore and clear the filter
        var layerStore = this.viewport.layerStore2;
        layerStore.clearFilter(false);
        // Loop through all layers and remove all selection layers
        layerStore.each(function(record){
            // Check if the layer's name is 'selection'
            if(record.data.layer.name == 'selection'){
                this.remove(record);
            }
            // Restore all layer's featureStores, but do not reload the featureStore.
            // The featureStore is reloaded when the attribute table is opened.
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
            }
        }, layerStore);
        // Refilter the layerstore
        layerStore.filterBy(function(record, id){
            return record.data.layer.displayInLayerSwitcher;
        }, this);

    }
});

Ext.reg('ux_maingistoolbar', Ext.ux.MainGisToolbar);