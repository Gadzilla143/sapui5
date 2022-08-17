sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "../utils/utils",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/library",
  "sap/m/Text"
], function (Controller, JSONModel, Filter, Utils, Dialog, Button, mobileLibrary, Text) {
  "use strict";

  // shortcut for sap.m.ButtonType
  var ButtonType = mobileLibrary.ButtonType;

  // shortcut for sap.m.DialogType
  var DialogType = mobileLibrary.DialogType;

  return Controller.extend("sap.ui.demo.walkthrough.controller.InvoiceList", {
    onInit: function () {
      this.oDefaultDialog = null;
      this.search = this.byId("slProductName");
      this.statuses = this.byId("slStatus");
      this.supplier = this.byId("slSupplier");

      this._data = this.getOwnerComponent().getModel("invoice").oData;
      var oViewModel = new JSONModel({
        currency: "EUR"
      });
      this.getView().setModel(oViewModel, "view");

      this.byId('invoiceList').setModel(this.getOwnerComponent().getModel("invoice"));

      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.attachRouteMatched(this._onObjectMatched, this);
    },

    onRefresh: function() {
      var jModel = new JSONModel();
      jModel.setData(this._data);
      this.getOwnerComponent().setModel(jModel, "invoice")
      this.byId('invoiceList').setModel(jModel);
    },

    _onObjectMatched: function () {
      if (!this._data) {
        return;
      }
      this._data = this.getOwnerComponent().getModel("invoice").oData;
      this.byId('invoiceList').setModel(this.getOwnerComponent().getModel("invoice"));
    },

    onFilterChange: function () {
      var oList = this.byId("invoiceList");
      var oBinding = oList.getBinding("items");
      var filters = [];
      var search = this.search.getValue();
      var statuses = this.statuses.getSelectedItems();
      var supplier = this.supplier.getValue();

      if (search) {
        filters.push(Utils.createFilter("ProductName", search));
      }
      if (statuses) {
        statuses.forEach(status => {
          filters.push(Utils.createFilter("Status", status.getText()));
        })
      }
      if (supplier) {
        filters.push(Utils.createFilter("ShipperName", supplier));
      }

      oBinding.filter(filters);
    },

    onDelete: function () {
      var table = this.byId("invoiceList");
      var selectedItems = table.getSelectedItems();
      var itemsNumber = selectedItems.length;
      if (!itemsNumber) {
        return;
      }
      var singleDeleteText = this.i18('invoiceOnDeleteSingle', [selectedItems[0].getBindingContext().getProperty('ProductName')])
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
            this.deleteItems()
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

    deleteItems: function() {
      var table = this.byId("invoiceList");
      var selectedItems = table.getSelectedItems();

      selectedItems.forEach(item => {
        this._data.Invoices.forEach((row, i) => {
          if (row.ID === item.getBindingContext().getProperty('ID') ) {
            this._data.Invoices.splice(i,1);
          }
        })
      })
      this.onRefresh()
    },

    onCreate: function () {
      var ID = (this._data.Invoices.length + 1).toString();
      this._data.Invoices.push({
        "ID": ID,
        "ProductName": "",
        "Quantity": 0,
        "ExtendedPrice": 0,
        "ShipperName": "",
        "ShippedDate": (new Date()).toISOString().substr(0,19),
        "Status": "New"
      });
      var state = new JSONModel({
        edit: true,
        new: true,
      });
      this.getOwnerComponent().setModel(state, "state");
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("detail", {
        objectId: ID
      });
      this.onRefresh();
    },

    onPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oRouter = this.getOwnerComponent().getRouter();
      var state = new JSONModel({
        edit: false
      });
      this.getOwnerComponent().setModel(state, "state");
      oRouter.navTo("detail", {
        objectId: oItem.getBindingContext().getProperty("ID")
      });
    },
    i18: function (type, strArr) {
      var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
      return oResourceBundle.getText(type, strArr);
    }
  });

});
