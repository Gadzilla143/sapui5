sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "sap/m/MessageToast",
  "sap/ui/model/json/JSONModel",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/library",
  "sap/m/Text",
  'sap/ui/core/Core',
  'sap/m/MessagePopover',
  'sap/m/MessageItem',
  'sap/ui/core/message/Message',
  'sap/ui/core/library',
  'sap/ui/core/Element'
], function (Controller, History, MessageToast, JSONModel, Dialog, Button, mobileLibrary, Text, Core, MessagePopover, MessageItem, Message, coreLibrary, Element) {
  "use strict";

  var NameToFieldType = {
    "Name": "ProductName",
    "Quantity": "Quantity",
    "Price": "ExtendedPrice",
    "Supplier": "ShipperName",
  }

  // shortcut for sap.m.ButtonType
  var ButtonType = mobileLibrary.ButtonType;

  // shortcut for sap.m.DialogType
  var DialogType = mobileLibrary.DialogType;

  // shortcut for sap.ui.core.MessageType
  var MessageType = coreLibrary.MessageType;

  return Controller.extend("sap.ui.demo.walkthrough.controller.Detail", {

    onInit: function () {
      var oViewModel = new JSONModel({
        currency: "EUR",
        selected: false,
      });
      this.getView().setModel(oViewModel, "view");
      this.Consumers = null;

      this.prevData = {
        "ProductName": null,
        "Quantity": null,
        "ExtendedPrice": null,
        "ShipperName": null,
      }

      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onObjectMatched, this);

      // MessageBox
      this._MessageManager = Core.getMessageManager();
      this._MessageManager.registerObject(this.getView().byId("formContainer"), true);
      this.getView().setModel(this._MessageManager.getMessageModel(), "message");
      this.createMessagePopover();
    },

    _onObjectMatched: function (oEvent) {
      this.hideErrorButton();

      var oViewModel = new JSONModel({
        edit: oEvent.getParameter("arguments").mode !== "view",
        new: oEvent.getParameter("arguments").mode === "create"
      });
      this.getView().setModel(oViewModel, "state");
      this.sObjectId = oEvent.getParameter("arguments").objectId;
      this.data = this.getOwnerComponent().getModel("invoice").oData.Invoices.filter(item => item.ID === this.sObjectId)[0];
      var oConsumers = new JSONModel({
        "Consumers": this.data.Consumers
      });
      this.byId('consumerList').setModel(oConsumers);
      var jModel = new sap.ui.model.json.JSONModel();
      jModel.setData(this.data);

      this.getView().setModel(jModel, "data");
    },

    onSelection: function() {
      var table = this.byId("consumerList");
      var selectedItems = table.getSelectedItems();
      this.getView().getModel("view").setProperty('/selected', !!selectedItems.length );
    },

    onDeleteCustomer: function () {
      var table = this.byId("consumerList");
      var selectedItems = table.getSelectedItems();
      var itemsNumber = selectedItems.length;
      if (!itemsNumber) {
        return;
      }
      var singleDeleteText = this.i18('invoiceOnDeleteSingle', [selectedItems[0].getBindingContext().getProperty('Name')])
      var multiDeleteText = this.i18('invoiceOnDeleteMulti', [itemsNumber])
      var dialogText = itemsNumber === 1
        ? singleDeleteText
        : multiDeleteText
      this.oDefaultDialog = new Dialog({
        title: "Deleting",
        content: new Text({ text: dialogText }),
        type: DialogType.Message,
        beginButton: new Button({
          type: ButtonType.Emphasized,
          text: "OK",
          press: function () {
            this.deleteItems();
            this.oDefaultDialog.close();
          }.bind(this)
        }),
        endButton: new Button({
          text: "Close",
          press: function () {
            this.oDefaultDialog.close();
          }.bind(this)
        })
      });
      this.getView().addDependent(this.oDefaultDialog);
      this.oDefaultDialog.open();
    },

    deleteItems: function () {
      var table = this.byId("consumerList");
      var selectedItems = table.getSelectedItems();
      var selectedIds = selectedItems.map(item => item.getBindingContext().getProperty('ID'));

      selectedIds.forEach(id => {
        this.data.Consumers.forEach((row, i) => {
          if (row.ID === id) {
            this.data.Consumers.splice(i,1);
          }
        })
      })

      this.byId('consumerList').getModel().setProperty("/Consumers", this.data.Consumers);
    },

    onDelete: function () {
      var dialogText = this.i18('invoiceOnDeleteSingle', [this.data.ProductName]);
      this.oDefaultDialog = new Dialog({
        title: "Deleting",
        content: new Text({ text: dialogText }),
        type: DialogType.Message,
        beginButton: new Button({
          type: ButtonType.Emphasized,
          text: "OK",
          press: function () {
            this.deleteItem();
            this.onNavBack();
            this.oDefaultDialog.close();
          }.bind(this)
        }),
        endButton: new Button({
          text: "Close",
          press: function () {
            this.oDefaultDialog.close();
          }.bind(this)
        })
      });

      this.getView().addDependent(this.oDefaultDialog);
      this.oDefaultDialog.open();
    },

    switchEditMode: function () {
      if (!this.getView().getModel("state").oData.edit) {
        var oForm = this.getView().byId("formContainer").getItems()[0].getContent();
        var inputs = oForm.filter(el => el.getMetadata()._sUIDToken === 'input');
        inputs.forEach(el => {
          this.prevData[NameToFieldType[el.getName()]] = el.getValue()
        })
        this.Consumers = [...this.byId("consumerList").getModel().oData.Consumers];
      } else {
        if (this.getView().getModel("state").oData.new) {
          this.deleteItem();
          this.onNavBack();
          return;
        }
      }
      this.switchEditModeUrl();
    },

    switchEditModeUrl: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      var bEditMode = this.getView().getModel("state").oData.edit;
      oRouter.navTo("detail", {
        objectId: this.sObjectId,
        mode: bEditMode ? "view" : "edit",
      });
    },

    deleteItem: function () {
      var selectedItemId = this.sObjectId;
      var items = this.getOwnerComponent().getModel("invoice").oData;

      items.Invoices.forEach((row, i) => {
        if (row.ID === selectedItemId) {
          items.Invoices.splice(i,1);
        }
      })

      var jModel = new sap.ui.model.json.JSONModel();
      jModel.setData(items);
      this.getOwnerComponent().setModel(jModel, "invoice");
    },

    onSave: function () {
      this._MessageManager.removeAllMessages();
      this._generateInvalidUserInput();
      if (this.getView().getModel("message").oData.length) {
        return;
      }
      this.hideErrorButton();
      this.switchEditMode();
      this.deleteItem();
      var data = this.getOwnerComponent().getModel("invoice").oData;
      var jModel = new sap.ui.model.json.JSONModel();
      jModel.setData({Invoices: data.Invoices.concat(this.data)});
      this.getOwnerComponent().setModel(jModel, "invoice");
    },

    onCancel: function () {
      this.switchEditMode();
      var oForm = this.getView().byId("formContainer").getItems()[0].getContent();
      var inputs = oForm.filter(el => el.getMetadata()._sUIDToken === 'input');
      inputs.forEach(el => {
        el.setValue(this.prevData[NameToFieldType[el.getName()]])
      })
      this.data.Consumers = this.Consumers;
      this.hideErrorButton();
    },

    onNavBack: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("overview", {}, true);
    },

    i18: function (type, strArr) {
      var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
      return oResourceBundle.getText(type, strArr);
    },

    handleMessagePopoverPress: function (oEvent) {
      if (!this.oMP) {
        this.createMessagePopover();
      }
      this.oMP.toggle(oEvent.getSource());
    },

    createMessagePopover: function () {
      this.oMP = new MessagePopover({
        items: {
          path:"message>/",
          template: new MessageItem(
            {
              title: "{message>message}",
              subtitle: "{message>additionalText}",
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
            additionalText: oInput.getLabels()[0].getText(),
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
            additionalText: oInput.getLabels()[0].getText(),
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
      var inputs = oForm.filter(el => el.getMetadata()._sUIDToken === 'input');


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
