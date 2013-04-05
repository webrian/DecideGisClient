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

Ext.ux.RssGridPanel = Ext.extend(Ext.grid.GridPanel, {

    store: null,

    constructor: function(config){
        config = config || {};

        this.store = new Ext.data.XmlStore({
            autoLoad: true,
            autoDestroy: true,
            idPath: 'guid',
            fields: ['author', 'title', 'description', {
                name: 'pubDate',
                mapping: 'pubDate',
                type: 'date'
            }, 'link'],
            record: 'item',
            sortInfo: {
                field: 'pubDate',
                direction: 'DESC'
            },
            proxy: new Ext.data.HttpProxy({
                method: 'GET',
                url: config.url
            })
        });

        var c = {
            autoScroll: true,
            colModel: new Ext.grid.ColumnModel({
                defaults: {
                    sortable: false
                },
                columns: [{
                    css: "font-weight: bold;",
                    dataIndex: 'title',
                    header: 'Topic'
                },/*{
                    header: 'Published',
                    dataIndex: 'pubDate',
                    format: 'jS M Y',
                    sortable: true,
                    width: 30,
                    xtype: 'datecolumn'
                },*/{
                    dataIndex: 'link',
                    header: 'Direct Link',
                    renderer: function(value, metaData, record, rowIndex, colIndex, store) {
                        return "<a href=\"" + value + "\">" + value + "</a>";
                    }
                }]
            }),
            hideHeaders: true,
            region: 'center',
            store: this.store,
            viewConfig: {
                forceFit: true,
                enableRowBody:true,
                showPreview:true,
                getRowClass : function(record, rowIndex, p, store){
                    if(this.showPreview){
                        p.body = '<div style="font: 13px arial,tahoma,helvetica,sans-serif;">' + record.data.description +'</div>';
                        return 'x-grid3-row-expanded';
                    }
                    return 'x-grid3-row-collapsed';
                }
            },
            sm: new Ext.grid.RowSelectionModel({
                singleSelect:true
            })
        }

        Ext.apply(c, config);

        // Call our superclass constructor to complete construction process.
        Ext.ux.RssGridPanel.superclass.constructor.call(this, c);
    }

});

Ext.reg('ux_rssgrid', Ext.ux.RssGridPanel);