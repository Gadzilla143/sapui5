sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "../model/formatter",
  "sap/ui/model/Filter",
  "../utils/filters"
], function (Controller, JSONModel, formatter, Filter, FilterUtils) {
  "use strict";

  return Controller.extend("sap.ui.demo.walkthrough.controller.InvoiceList", {

    formatter: formatter,

    onInit: function () {
      this.search = this.byId("slProductName");
      this.statuses = this.byId("slStatus");
      this.supplier = this.byId("slSupplier");
      var oViewModel = new JSONModel({
        currency: "EUR"
      });
      this.getView().setModel(oViewModel, "view");
    },

    onFilterChange: function () {
      var oList = this.byId("invoiceList");
      var oBinding = oList.getBinding("items");
      var filters = [];
      var search = this.search.getValue();
      var statuses = this.statuses.getSelectedItems();
      var supplier = this.supplier.getValue();

      if (search) {
        filters.push(FilterUtils.createFilter("ProductName", search));
      }
      if (statuses) {
        statuses.forEach(status => {
          filters.push(FilterUtils.createFilter("Status", status.getKey()));
        })
      }
      if (supplier) {
        filters.push(FilterUtils.createFilter("ShipperName", supplier));
      }

      oBinding.filter(filters);
    },

    onPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("detail", {
        invoicePath: window.encodeURIComponent(oItem.getBindingContext("invoice").getPath().substr(1))
      });
    }
  });

});
