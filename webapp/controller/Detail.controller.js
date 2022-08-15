sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "sap/m/MessageToast",
  "sap/ui/model/json/JSONModel",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/library",
  "sap/m/Text"
], function (Controller, History, MessageToast, JSONModel, Dialog, Button, mobileLibrary, Text) {
  "use strict";

  // shortcut for sap.m.ButtonType
  var ButtonType = mobileLibrary.ButtonType;

  // shortcut for sap.m.DialogType
  var DialogType = mobileLibrary.DialogType;

  return Controller.extend("sap.ui.demo.walkthrough.controller.Detail", {

    onInit: function () {
      var oViewModel = new JSONModel({
        currency: "EUR"
      });
      this.getView().setModel(oViewModel, "view");

      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onObjectMatched, this);
    },

    _onObjectMatched: function (oEvent) {
      this.sObjectId = oEvent.getParameter("arguments").objectId;
      this.data = this.getOwnerComponent().getModel("invoice").oData.Invoices.filter(item => item.ID === this.sObjectId)[0];
      var jModel = new sap.ui.model.json.JSONModel();
      jModel.setData(this.data);

      this.getView().setModel(jModel, "data");
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
            this.deleteItem()
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
      this.getOwnerComponent().setModel(jModel, "invoice")
      this.onNavBack();
    },

    onNavBack: function () {
      var oHistory = History.getInstance();
      var sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("overview", {}, true);
      }
    },
    i18: function (type, strArr) {
      var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
      return oResourceBundle.getText(type, strArr);
    }
  });
});
