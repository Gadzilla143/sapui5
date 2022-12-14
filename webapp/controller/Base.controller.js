/**
 * Provide basic methods for all controllers
 * @module Base
 */

sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  'sap/m/MessagePopover',
  'sap/m/MessageItem',
  'sap/ui/core/message/Message',
  'sap/ui/core/library',
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/Text",
  "sap/m/library",
  "sap/ui/core/Fragment",
  "sap/ui/model/json/JSONModel",
], function (Controller, Filter, FilterOperator, MessagePopover, MessageItem, Message, coreLibrary, Dialog, Button, Text, mobileLibrary, Fragment, JSONModel) {
  "use strict";

  var MessageType = coreLibrary.MessageType;

  return Controller.extend("sap.ui.demo.walkthrough.controller.Base", {

    /**
     * Create new filter object
     * @public
     * @param {string} fieldName
     * @param {(string|number)} filterValue
     * @param {string} filterType
     * @return {sap.ui.model.FilterOperator} New filter instance
     */
    createFilter: function (field, value, filterType = FilterOperator.Contains) {
      return new Filter(field, filterType, value)
    },

    /**
     * Get global model field
     * @public
     * @param {string} fieldName
     * @return {JSONModel} model value
     */
    model: function (field) {
      return this.getOwnerComponent().getModel(field)
    },

    /**
     * Diff between data and selected items
     * @public
     * @param {Object[]} initialItems
     * @param {Object[]} selectedItems
     * @return {Object[]} diff between initialItems and selectedItems
     */
    removeSelectedItems: function (data, selectedItems) {
      var selectedIds = structuredClone(selectedItems.map(item => item.getBindingContext().getProperty('ID')));
      var dataCopy = structuredClone(data);
      selectedIds.forEach(id => {
        dataCopy.forEach((row, i) => {
          if (row.ID === id) {
            dataCopy.splice(i,1);
          }
        })
      })
      return dataCopy
    },

    /**
     * Create delete modal
     * @public
     * @param {string} descModalText
     * @param {sap.ui.core.mvc.View} currentView
     */
    createDeleteModal: function ({ dialogText, view }) {
      if (!this.pDialog) {
        this.pDialog = this.loadFragment({
          name: "sap.ui.demo.walkthrough.fragments.DeleteModal",
        });
      }
      this.pDialog.then(function(oDialog) {
        view.setModel(new JSONModel({'text': dialogText}), 'modalMessage')
        view.addDependent(oDialog);
        oDialog.open();
      })
    },

    /**
     * Close delete Modal
     * @public
     */
    onDialogClose : function () {
      this.byId("deleteDialog").close();
    },

    /**
     * Access to i18n model
     * @public
     * @param {string} fieldName
     * @param {Array.<string>} additionalStrings
     * @return {string} i18n string
     */
    i18: function (type, strArr) {
      var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
      return oResourceBundle.getText(type, strArr);
    },

    /**
     * Create message popover
     * @public
     */
    createMessagePopover: function () {
      this.oMP = new MessagePopover({
        items: {
          path:"message>/",
          template: new MessageItem(
            {
              title: "{message>message}",
              groupName: {parts: [{path: 'message>controlIds'}],},
              activeTitle: {parts: [{path: 'message>controlIds'}], formatter: () => true},
              type: "{message>type}",
              description: "{message>message}"
            })
        },
        groupItems: true
      });

      this.getView().byId("messagePopoverBtn").addDependent(this.oMP);
    },

    /**
     * Handle required field
     * @public
     * @param {string} inputValue
     */
    handleRequiredField: function (oInput) {
      var sTarget = oInput.getBindingPath("value");
      var name = oInput.getName();

      if (!oInput.getValue()) {
        this._MessageManager.addMessages(
          new Message({
            message: this.i18('fieldRequired', [name]),
            type: MessageType.Error,
            target: sTarget,
            processor: this.getView().getModel()
          })
        );
      }
    },

    /**
     * Handle positive field
     * @public
     * @param {string} inputValue
     */
    handlePositiveField: function (oInput) {
      var sTarget = oInput.getBindingPath("value");
      var name = oInput.getName();

      if (oInput.getValue() < 0 || !oInput.getValue()) {
        this._MessageManager.addMessages(
          new Message({
            message: this.i18('fieldPositive', [name]),
            type: MessageType.Error,
            target: sTarget,
            processor: this.getView().getModel()
          })
        );
      }
    },

    /**
     * Hide error button when error list is empty
     * @public
     */
    hideErrorButton: function () {
      this._MessageManager.removeAllMessages();
      var oButton = this.getView().byId("messagePopoverBtn");
      oButton.setVisible(false);
    },

    /**
     * Handle input change and generate error list
     * @public
     */
    _generateInvalidUserInput: function () {
      var oButton = this.getView().byId("messagePopoverBtn");
      var oForm = this.getView().byId("formContainer").getItems()[0].getContent();
      var formInputs = oForm.filter(el => el.getMetadata().getName() === 'sap.m.Input');
      var table = this.getView().byId("consumerList");
      var tableInputs = table.getItems().map(el => el.mAggregations.cells[0].mAggregations.items[1])
      var inputs = formInputs.concat(tableInputs);

      oButton.setVisible(true);

      inputs.forEach(el => {
        if (el.getType() === 'Text') {
          this.handleRequiredField(el);
        }

        if (el.getType() === 'Number') {
          this.handlePositiveField(el);
        }
      })

      this.oMP.getBinding("items").attachChange(function(oEvent){
        this.oMP.navigateBack();
        oButton.setType('Negative');
        oButton.setIcon("sap-icon://error");
        oButton.setText(this.i18('errorText'));
      }.bind(this));

      setTimeout(function(){
        this.oMP.openBy(oButton);
      }.bind(this), 100);
    },
  });
});
