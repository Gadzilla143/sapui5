/**
 * @module InvoiceList
 */

sap.ui.define([
  "./Base.controller",
  "sap/ui/model/json/JSONModel",
], function (BaseController, JSONModel) {
  "use strict";

  return BaseController.extend("sap.ui.demo.walkthrough.controller.InvoiceList", {

    /**
     * Initialize InvoiceList page (set initial model)
     */

    onInit: function () {
      this.search = this.byId("slProductName");
      this.statuses = this.byId("slStatus");
      this.supplier = this.byId("slSupplier");

      this._data = this.model("invoice").getData();
      var oViewModel = new JSONModel({
        currency: "EUR",
        selected: false,
      });
      this.getView().setModel(oViewModel, "view");

      this.byId('invoiceList').setModel(this.model("invoice"));

      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.attachRouteMatched(this._onObjectMatched, this);
    },

    /**
     * Handle invoice table selection
     */

    onSelection: function() {
      var table = this.byId("invoiceList");
      var selectedItems = table.getSelectedItems();

      this.getView().getModel("view").setProperty('/selected', !!selectedItems.length );
    },

    /**
     * Switch data on urlChange
     * @param {object} changeUrlEvent
     */

    _onObjectMatched: function () {
      if (!this._data) {
        return;
      }
      this.byId('invoiceList').setModel(this.model("invoice"));
    },

    /**
     * Change table data depends on filters
     */

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

    /**
     * Handle delete invoice button click
     */

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

      this.createDeleteModal({
        dialogText,
        view: this.getView()
      });
    },

    /**
     * Handle delete modal event
     */

    onDialogDelete: function () {
      this.deleteItems();
      this.onDialogClose();
    },

    /**
     * Delete selected invoices
     */

    deleteItems: function() {
      var table = this.byId("invoiceList");
      var selectedItems = table.getSelectedItems();
      var dataDiff = this.removeSelectedItems(this._data.Invoices, selectedItems);
      this.model("invoice").setProperty("/Invoices", dataDiff);
    },

    /**
     * Create new invoice
     */

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

    /**
     * Handle invoice click
     * @param {object} event
     */

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
