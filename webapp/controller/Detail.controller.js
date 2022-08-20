sap.ui.define([
  "./Base.controller",
  "sap/ui/core/routing/History",
  "sap/m/MessageToast",
  "sap/ui/model/json/JSONModel",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/library",
  "sap/m/Text",
  'sap/ui/core/Core',
], function (BaseController, History, MessageToast, JSONModel, Dialog, Button, mobileLibrary, Text, Core) {
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

  return BaseController.extend("sap.ui.demo.walkthrough.controller.Detail", {

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

      var oStateModel = new JSONModel({
        edit: oEvent.getParameter("arguments").mode !== "view",
        new: oEvent.getParameter("arguments").mode === "create"
      });

      this.getView().setModel(oStateModel, "state");
      this.sObjectId = oEvent.getParameter("arguments").objectId;
      this.data = this.getOwnerComponent().getModel("invoice").oData.Invoices.filter(item => item.ID === this.sObjectId)[0];
      var oConsumers = new JSONModel({
        "Consumers": this.data.Consumers
      });
      this.byId('consumerList').setModel(oConsumers);
      var oModel = new JSONModel(this.data);

      this.getView().setModel(oModel, "data");
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

      this.removeSelectedItems(this.data.Consumers, selectedItems);

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
      var result = items.Invoices.filter(item => item.ID !== selectedItemId);
      this.getOwnerComponent().getModel("invoice").setProperty('/Invoices', result);
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
      var { Invoices } = this.getOwnerComponent().getModel("invoice").oData;
      this.getOwnerComponent().getModel("invoice").setProperty('/Invoices', Invoices.concat(this.data));
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

    handleMessagePopoverPress: function (oEvent) {
      if (!this.oMP) {
        this.createMessagePopover();
      }
      this.oMP.toggle(oEvent.getSource());
    },
  });
});
