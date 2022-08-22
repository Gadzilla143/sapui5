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
], function (Controller, Filter, FilterOperator, MessagePopover, MessageItem, Message, coreLibrary, Dialog, Button, Text, mobileLibrary) {
  "use strict";

  // shortcut for sap.ui.core.MessageType
  var MessageType = coreLibrary.MessageType;

  // shortcut for sap.m.DialogType
  var DialogType = mobileLibrary.DialogType;

  // shortcut for sap.m.ButtonType
  var ButtonType = mobileLibrary.ButtonType;

  return Controller.extend("sap.ui.demo.walkthrough.controller.Base", {

    createFilter: function (field, value, filterType = FilterOperator.Contains) {
      return new Filter(field, filterType, value)
    },

    removeSelectedItems: function (data, selectedItems) {
      var selectedIds = selectedItems.map(item => item.getBindingContext().getProperty('ID'));
      selectedIds.forEach(id => {
        data.forEach((row, i) => {
          if (row.ID === id) {
            data.splice(i,1);
          }
        })
      })
    },

    createDeleteModal: function ({dialogText, onDelete, onCancel}) {
      this.oDefaultDialog = new Dialog({
        title: "Deleting",
        content: new Text({ text: dialogText }),
        type: DialogType.Message,
        beginButton: new Button({
          type: ButtonType.Emphasized,
          text: "OK",
          press: function () {
            onDelete && onDelete();
            this.oDefaultDialog.close();
          }.bind(this)
        }),
        endButton: new Button({
          text: "Close",
          press: function () {
            onCancel && onCancel();
            this.oDefaultDialog.close();
          }.bind(this)
        })
      });
      this.getView().addDependent(this.oDefaultDialog);
      this.oDefaultDialog.open();
    },

    i18: function (type, strArr) {
      var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
      return oResourceBundle.getText(type, strArr);
    },

    //error handling stuff

    createMessagePopover: function () {
      this.oMP = new MessagePopover({
        items: {
          path:"message>/",
          template: new MessageItem(
            {
              title: "{message>message}",
              groupName: {parts: [{path: 'message>controlIds'}],},
              activeTitle: {parts: [{path: 'message>controlIds'}], formatter: this.isPositionable},
              type: "{message>type}",
              description: "{message>message}"
            })
        },
        groupItems: true
      });

      this.getView().byId("messagePopoverBtn").addDependent(this.oMP);
    },

    isPositionable : function (sControlId) {
      return sControlId ? true : true;
    },

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

    hideErrorButton: function () {
      this._MessageManager.removeAllMessages();
      var oButton = this.getView().byId("messagePopoverBtn");
      oButton.setVisible(false);
    },

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
