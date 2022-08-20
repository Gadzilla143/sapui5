sap.ui.define([
  "./Base.controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/library",
  "sap/m/Text"
], function (BaseController, JSONModel, Filter, Dialog, Button, mobileLibrary, Text) {
  "use strict";

  // shortcut for sap.m.ButtonType
  var ButtonType = mobileLibrary.ButtonType;

  // shortcut for sap.m.DialogType
  var DialogType = mobileLibrary.DialogType;

  return BaseController.extend("sap.ui.demo.walkthrough.controller.InvoiceList", {
    onInit: function () {
      this.oDefaultDialog = null;
      this.search = this.byId("slProductName");
      this.statuses = this.byId("slStatus");
      this.supplier = this.byId("slSupplier");

      this._data = this.getOwnerComponent().getModel("invoice").oData;
      var oViewModel = new JSONModel({
        currency: "EUR",
        selected: false,
      });
      this.getView().setModel(oViewModel, "view");

      this.byId('invoiceList').setModel(this.getOwnerComponent().getModel("invoice"));

      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.attachRouteMatched(this._onObjectMatched, this);
    },

    onSelection: function() {
      var table = this.byId("invoiceList");
      var selectedItems = table.getSelectedItems();

      this.getView().getModel("view").setProperty('/selected', !!selectedItems.length );
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
        filters.push(this.createFilter("ProductName", search));
      }
      if (statuses) {
        statuses.forEach(status => {
          filters.push(this.createFilter("Status", status.getText()));
        })
      }
      if (supplier) {
        filters.push(this.createFilter("ShipperName", supplier));
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
      this.removeSelectedItems(this._data.Invoices, selectedItems);
      this.getOwnerComponent().getModel("invoice").setProperty("/Invoices", this._data.Invoices);
      table.removeSelections(true);
    },

    onCreate: function () {
      var ID = (new Date()).toISOString();
      this._data.Invoices.push({
        "ID": ID,
        "ProductName": "",
        "Quantity": 0,
        "ExtendedPrice": 0,
        "ShipperName": "",
        "ShippedDate": (new Date()).toISOString().substr(0,19),
        "Status": "New"
      });
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("detail", {
        objectId: ID,
        mode: "create",
      });
    },

    onPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("detail", {
        objectId: oItem.getBindingContext().getProperty("ID"),
        mode: "view",
      });
    }
  });

});
