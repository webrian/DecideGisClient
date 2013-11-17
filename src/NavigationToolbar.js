Ext.ns('Ext.ux');
Ext.ux.NavigationToolbar=Ext.extend(Ext.Toolbar,{
    viewport:null,

    identifyAction:null,

    selectAction:null,

    freehandSelectAction:null,

    downloadAction:null,

    layerOpacitySlider:null,
    
    constructor:function(config){
        config=config||{};

        this.viewport = config.viewport;
        this.layergrid = config.layergrid;
        var me = this;

        var actions=[];
        var ctrl=new OpenLayers.Control.NavigationHistory();
        this.viewport.map.addControl(ctrl);
        actions.push(new GeoExt.Action({
            control:ctrl.previous,
            disabled:true,
            iconAlign: 'top',
            iconCls: 'last-zoom-button',
            tooltip:Ext.ux.ts.tr('Go to previous view'),
            scale:'medium'
        }));
        actions.push(new GeoExt.Action({
            control:ctrl.next,
            disabled:true,
            iconAlign:'top',
            iconCls:'next-zoom-button',
            scale:'medium',
            tooltip:Ext.ux.ts.tr('Go to next view')
        }));
        actions.push(new GeoExt.Action({
            allowDepress:false,
            control:new OpenLayers.Control.Navigation(),
            iconAlign:'top',
            iconCls: "move-map-button",
            map:this.viewport.map,
            pressed:true,
            scale:'medium',
            toggleGroup:"tools",
            tooltip:Ext.ux.ts.tr('Move Map')
        }));
        actions.push(new GeoExt.Action({
            allowDepress:false,
            control:new OpenLayers.Control.ZoomBox({
                out:false
            }),
            iconAlign:'top',
            iconCls: "zoom-in-button",
            map:this.viewport.map,
            scale:'medium',
            scope:this,
            toggleGroup:"tools",
            tooltip:Ext.ux.ts.tr('Zoom in')
        }));
        actions.push(new GeoExt.Action({
            allowDepress:false,
            control:new OpenLayers.Control.ZoomBox({
                out: true
            }),
            iconAlign: 'top',
            iconCls: "zoom-out-button",
            map: this.viewport.map,
            scale: 'medium',
            scope: this,
            toggleGroup: "tools",
            tooltip: Ext.ux.ts.tr('Zoom out')
        }));
        actions.push(new Ext.Action({
            handler:function(){
                this.viewport.map.setCenter(this.viewport.centroid,0);
            },
            iconAlign:'top',
            iconCls: "full-extent-button",
            scale:'medium',
            scope:this,
            tooltip:Ext.ux.ts.tr('Zoom to full extent')
        }));


        // GetFeatureInfo control using the MapFish protocol
        var getFeatureInfo = new OpenLayers.Control({
            handler: new OpenLayers.Handler.Click(this, {
                'click': me.onGetFeatureInfoClick
            }),
            map: this.viewport.map
        });
        // Add it to the map
        this.viewport.map.addControl(getFeatureInfo);

        // The identify action that works using the MapFish protocol
        this.identifyAction=new GeoExt.Action({
            activateOnEnable: true,
            deactivateOnDisable: true,
            iconAlign: 'top',
            iconCls: "identify-button",
            map: this.viewport.map,
            toggleGroup: "tools",
            allowDepress: false,
            scale: 'medium',
            tooltip: Ext.ux.ts.tr('Identify'),
            control: getFeatureInfo
        });
        actions.push(this.identifyAction);

        actions.push('->');
        var villageSearchStore=new Ext.data.JsonStore({
            url:'/gis/search',
            idProperty:'fid',
            root: 'data',
            fields:['fid', 'display_name','class','lon','lat']
        });
        actions.push(new Ext.form.Label({
            style:{
                padding:'2px',
                'right-margin':'2px'
            },
            text: Ext.ux.ts.tr('Zoom to village') + ":"
        }));
        actions.push(new Ext.form.ComboBox({
            store: villageSearchStore,
            displayField: 'display_name',
            typeAhead: false,
            mode: 'remote',
            queryParam: 'q',
            hideTrigger: true,
            selectOnFocus: true,
            width: 250,
            listeners:{
                'select':function(combo,record,index){
                    var lonLat = new OpenLayers.LonLat(record.data.lon,record.data.lat);
                    this.viewport.map.setCenter(lonLat, 6);
                },
                scope:this
            }
        }));
        var navigationToolbarConfig={
            enableOverflow: true,
            items: actions
        }
        Ext.apply(navigationToolbarConfig,config);
        Ext.ux.NavigationToolbar.superclass.constructor.call(this, navigationToolbarConfig);
    },
    
    onGetFeatureInfoClick: function(event){
        var lonLat = this.viewport.map.getLonLatFromViewPortPx(event.xy);

        var g = this.viewport.layerGrid;
        var selected = g.getSelectedLayer();
        if(!selected){
            return null;
        }

        // The attribute store for the currently selected layer
        //var store = selected.data.featureStore;
        // Get the attributes of this layer
        //var keys = store.fields.keys;
        var attrs = selected.data.attrs;

        // Split the layer name to get dataset and layername
        var layername = selected.data.layer.layername.split("@")[0];
        var split = layername.split(":");
        var ds = split[0];
        var ln = split[1];

        // Get the pixel size to determine the tolerance in the mapfish request
        // which depends on the zoom level
        var pixelSize = this.viewport.map.getGeodesicPixelSize(event.xy).w;
        var tolerance = (pixelSize * 1000) * 5;

        // Request the mapfish protocol
        Ext.Ajax.request({
            method: 'GET',
            params: {
                attrs: attrs.join(","),
                dataset: ds,
                epsg: 900913,
                lat: lonLat.lat,
                layer: ln,
                lon: lonLat.lon,
                limit: 10,
                no_geom: false,
                // Add a tolerance value to hit also point features
                tolerance: tolerance
            },
            scope: this,
            success: function(r){
                var response = Ext.decode(r.responseText);
                this.onIdentifyRequestSuccess(response, attrs);
            },
            url: '/gis/layer'
        });
    },

    onIdentifyRequestSuccess: function(geojsonResponse, keys){

        var viewport = this.viewport;
        var layerstore = this.viewport.layerStore2;

        var geojson = new OpenLayers.Format.GeoJSON();

        var vectors = geojson.read(geojsonResponse);
        if(vectors.length == 0){
            Ext.Msg.alert("Not Found", "No Feature found");
            return null;
        }

        //var vector = vectors[0];

        var identifyLayer = new OpenLayers.Layer.Vector("Identiy Layer", {
            displayInLayerSwitcher: false
        });
        identifyLayer.addFeatures(vectors);


        var lr = new GeoExt.data.LayerRecord({
            layer: identifyLayer
        });

        layerstore.add([lr]);

        viewport.map.setLayerZIndex(identifyLayer, viewport.map.layers.length);

        // Filter base and vector layers
        layerstore.filterBy(function(record, id){
            return record.data.layer.displayInLayerSwitcher;
        }, this);

        // Get the column fields and headers from the vector itself
        var fields = new Array();
        var columns = new Array();
        for(var a in vectors[0].attributes){
            fields.push(a);
            columns.push({
                header: a,
                dataIndex: a
            });
        }

        var data = new Array();
        for(var i = 0; i < vectors.length; i++){
            data.push(vectors[i].attributes);
        }

        var identifyWindow = new Ext.Window({
            bbar: ['->', {
                handler: function(button){
                    identifyWindow.close();
                    identifyWindow = null;
                },
                iconCls: 'quit-button',
                iconAlign: 'top',
                scale: 'medium',
                tooltip: Ext.ux.ts.tr("Close"),
                xtype: 'button'
            }],
            layout: 'fit',
            height: 200,
            items: [{
                border: false,
                columns: columns,
                frame: false,
                store: {
                    autoLoad: true,
                    fields: fields,
                    data: data,
                    xtype: 'jsonstore'
                },
                viewConfig: {
                    forceFit: true
                },
                xtype: 'grid'
            }],
            listeners: {
                close: function(panel){
                    layerstore.remove(lr);
                    viewport.map.removeLayer(identifyLayer);
                }
            },
            width: 600
        }).show();
    }

});