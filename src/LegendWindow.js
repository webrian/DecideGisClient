Ext.namespace("Ext.ux");

Ext.ux.LegendWindow = Ext.extend(Ext.Window, {

    // Minimum width of this window
    minWidth: 200,

    initComponent: function(conf){

        // Legend container width
        var lc_width = this.options.legend.width > this.minWidth ? this.options.legend.width : this.minWidth;

        var data = {
            height: this.options.legend.height,
            attribution: this.attribution,
            src: this.options.legend.src,
            text: this.options.text,
            title: this.title,
            width: this.options.legend.width
        };

        var config = {
            autoScroll: true,
            bbar: ['->', {
                handler: function(){
                    this.close();
                },
                iconCls: 'quit-button',
                scale: 'medium',
                scope: this,
                tooltip: Ext.ux.ts.tr("Close"),
                xtype: 'button'
            }],
            bodyStyle: {
                padding: '5px'
            },
            data: data,
            height: 300,
            title: Ext.ux.ts.tr("Legend"),
            tpl: [
            '<h1>{title}</h1>',
            '<div>{text}</div>',
            '<div style=\"margin-top: 5px;\"><img src="{src}" width="{width}" height="{height}"></div>',
            '<div style=\"margin-top: 5px;\">{attribution}</div>'
            ],
            width: (lc_width + 40)
        } || {}

        Ext.apply(this, config);

        // Call the superclass constructor
        Ext.ux.LegendWindow.superclass.initComponent.call(this, config);
    }
    
});

Ext.reg('ux_legendwindow', Ext.ux.LegendWindow);