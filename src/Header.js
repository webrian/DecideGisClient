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

Ext.ux.HeaderPanel = Ext.extend(Ext.Panel, {

    /**
         * @constructs
         * @param {Object} config
         */
    //html: "some thml text",

    contentEl: 'header-div',


    constructor: function(config){
        config = config || {};

        var li = Ext.get(config.li);
        var listElements = li.query('ul');
        for(var i = 0; i < listElements.length; i++){
            var ul = new Ext.Element(listElements[i]);
        }

        var customConfig = {
            bbar: {
                buttonAlign: 'center',
                items: [{
                    text: 'Home'
                },{
                    text: 'About'
                },{
                    text: 'DECIDE Toolbox',
                    flex: 1,
                    menu: {
                        id: 'mainMenu',
                        style: {
                            overflow: 'visible'     // For the Combo popup
                        },
                        defaultAlign: 'tr-bl?',
                        items: [{
                            text: 'Map Viewer'
                        }, {
                            text: 'DECIDE GIS'
                        }, {
                            text: 'Sta Table'
                        }, {
                            text: 'METADATA'
                        }]
                    }
                },{
                    menu: {
                        id: 'mainMenu',
                        style: {
                            overflow: 'visible'     // For the Combo popup
                        },
                        items: [{
                            text: 'User Manuals'
                        }, {
                            text: 'Atlas - Lao PDR'
                        }, {
                            text: 'Publications'
                        }, {
                            text: 'Smartphone App'
                        }]
                    },
                    text: 'Applications & Download'
                },{
                    text: 'Tutorials & Training'
                },{
                    text: 'Partners'
                },{
                    style: {
                        color: 'red',
                        'font-weight': 'bold',
                        'background-color': 'white'
                    },
                    text: 'Contact'
                }]
            }
        }

        Ext.apply(customConfig, config);

        // Call our superclass constructor to complete construction process.
        Ext.ux.HeaderPanel.superclass.constructor.call(this, customConfig);
    }

});