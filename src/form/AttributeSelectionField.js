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

Ext.ux.AttributeSelectionField = Ext.extend(Ext.form.CompositeField, {
    /** @lends Ext.ux.AttributeSelectionField# */

    /**
     * The parent form panel
     * @type Ext.form.FormPanel
     */
    parentFormPanel: null,

    /**
     * The current chosen attribute for this field
     * @type String
     */
    attribute: 'vnpdeaa01',

    /**
     * The currently chosen comparison operator
     * @type String
     */
    operator: 'eq',

    /**
     * The currently set value
     * @type String
     */
    value: '',

    /**
     * A store that contains the current sample values for the currently selected
     * variable.
     * @type Ext.data.Store
     */
    valueStore: null,

    /**
     * Combobox that presents the current sample values for the selected variable.
     * This combobox must be editable in order to allow the user to enter other
     * values than the sample values.
     * @type Ext.form.ComboBox
     */
    valueCombobox: null,

    /**
     * @constructs
     * @augments Ext.form.CompositeField
     * @param {Object} config
     */
    constructor: function(config) {
        config = config || {};

        this.parentFormPanel = config.parentFormPanel;

        var attributeStore = config.attributeStore;

        this.i18n = config.i18n;

        // The store for the value combobox
        this.valueStore = new Ext.data.JsonStore({
            autoLoad: true,
            fields: [
            'display',
            'value'
            ],
            proxy : new Ext.data.HttpProxy({
                method: 'GET',
                url: '/gis/variables/sample'
            }),
            root: 'rows'
        });

        // Instantiate the dynamic value combobox
        this.valueCombobox = new Ext.form.ComboBox({
            allowBlank: false,
            displayField: 'display',
            listeners: {
                'change': {
                    fn: function(field, newValue, oldValue){
                        this.value = newValue;
                    },
                    scope: this
                }
            },
            mode: 'local',
            typeAhead: true,
            triggerAction: 'all',
            lazyRender:true,
            store: this.valueStore,
            valueField: 'value',
            flex: 2,
            xtype: 'combo'
        });

        var attrConfig = {
            items: [{
                // Do not allow a blank field
                allowBlank: false,
                displayField: 'label',
                editable: false,
                flex: 5,
                lazyRender:true,
                listeners: {
                    'change': {
                        fn: function(combo, newValue, oldValue) {
                            this.attribute = newValue;
                            this.valueStore.load({
                                params: {
                                    'attr': newValue,
                                    'lang': Ext.ux.currentLanguage
                                },
                                scope: this
                            });
                            this.valueCombobox.reset();
                        }
                    },
                    scope: this
                },
                mode: 'local',
                store: attributeStore,
                triggerAction: 'all',
                typeAhead: true,
                valueField: 'name',
                xtype: 'combo'
            },{
                xtype: 'combo',
                typeAhead: true,
                triggerAction: 'all',
                lazyRender:true,
                mode: 'local',
                //width: 120,
                flex: 1,
                store: new Ext.data.ArrayStore({
                    id: 0,
                    fields: [
                    'id',
                    'displayText'
                    ],
                    data: [["eq","="],["ne","&ne;"],["lt","&lt;"],["lte","&le;"],["gt","&gt;"],["gte","&ge;"],["like","like"],["ilike","like (case-insensitiv)" ]]
                }),
                value: this.operator,
                valueField: 'id',
                displayField: 'displayText',
                listeners: {
                    'change': {
                        fn: function(combo, newValue, oldValue) {
                            this.operator = newValue;
                        }
                    },
                    scope: this
                }
            },
            this.valueCombobox,
            {
                xtype: 'button',
                tooltip: 'Add condition',
                icon: '/img/action-add.png',
                handler: function(evt){
                    this.add({
                        attributeStore: this.attributeStore,
                        i18n: this.viewport.i18n,
                        parentFormPanel: this,
                        xtype: 'ux_attributeselectionfield'
                    });
                    this.doLayout();
                },
                scope: this.parentFormPanel
            },{
                xtype: 'button',
                tooltip: 'Remove condition',
                icon: '/img/action-remove.png',
                handler: function(evt){
                    // Get all attributeSelectionField siblings
                    var elements = this.parentFormPanel.findByType("ux_attributeselectionfield");
                    if(elements.length > 1){
                        // Remove this object
                        this.parentFormPanel.remove(this);
                        this.parentFormPanel.doLayout();
                    }

                    // Get all remaining attributeSelectionFields from the
                    // parent form and loop this array.
                    elements = this.parentFormPanel.findByType("ux_attributeselectionfield");
                    for(var i = 0; i < elements.length; i++) {
                        // Validate explicitly the remaining attributeSelectionField
                        // to make sure that the select button is correctly
                        // enabled or disabled.
                        elements[i].validate();
                    }
                },
                scope: this
            },{
                xtype: 'button',
                tooltip: 'Info',
                icon: '/img/help_icon.gif',
                handler: function(evt){
                    Ext.Msg.show({
                        title:'Info',
                        //msg: this.i18n.getString("admin_level"),
                        msg: "The <i>Value Combobox</i> provides:<br/>- Classes for categorized values e.g. <i>main type of toilet</i><br/>- Sample values for continuous values (quintile breaks) e.g. <i>percentage of literate population</i></li></ul><br/>Note: value 999 means no data.",
                        buttons: Ext.Msg.OK,
                        icon: Ext.MessageBox.QUESTION
                    });
                },
                scope: this
            }
            ],
            // Overwrite the default invalid class with an empty class. Thus it
            // is possible to prevent an ugly invalid styling for this
            // compositeField. The wrapped combobox fields are marked invalid.
            invalidClass: '',
            // Add listeners for the invalid and valid event. If this compositeField
            // is invalid i.e. one of the contained form fields is invalid,
            // disable the select button from the enclosing form panel. As soon
            // as all fields are valid again, the button is enabled.
            // It is supposed that the parent panel has only one button.
            listeners: {
                'invalid': {
                    fn: function(field, msg){
                        this.parentFormPanel.selectButton.disable();
                    }
                },
                'valid': {
                    fn: function(field){
                        // Get all attributeSelectionFields that are enclosed
                        // by the parent form panel including this object.
                        var fields = this.parentFormPanel.findByType('ux_attributeselectionfield');

                        // Loop all attributeSelectionFields
                        for(var i = 0; i < fields.length; i++) {
                            // Check if all siblings are valid. If only one
                            // attributeSelectionField is not valid, then disable
                            // the select button and abort the function
                            // immediately.
                            if(!fields[i].isValid(true)){
                                this.parentFormPanel.selectButton.disable();
                                return;
                            }
                        }

                        // Enable the select button only valid if all
                        // attributeSelectionFields are valid.
                        this.parentFormPanel.selectButton.enable();
                    }
                },
                scope: this
            }
        }

        Ext.apply(attrConfig,config);

        Ext.ux.AttributeSelectionField.superclass.constructor.call(this, attrConfig);
    }

});

Ext.reg('ux_attributeselectionfield', Ext.ux.AttributeSelectionField);