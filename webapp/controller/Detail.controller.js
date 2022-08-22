sap.ui.define([
  "./Base.controller",
  "sap/ui/core/routing/History",
  "sap/m/MessageToast",
  "sap/ui/model/json/JSONModel",
  'sap/ui/core/Core',
], function (BaseController, History, MessageToast, JSONModel, Core) {
  "use strict";

  var NameToFieldType = {
    "Name": "ProductName",
    "Quantity": "Quantity",
    "Price": "ExtendedPrice",
    "Supplier": "ShipperName",
  }

  return BaseController.extend("sap.ui.demo.walkthrough.controller.Detail", {

    onInit: function () {
      var oViewModel = new JSONModel({
        currency: "EUR",
        selected: false,
      });
      this.getView().setModel(oViewModel, "view");
      this.Consumers = null;

      this.prevData = null;

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
      if (!this.data || this.data.ID !== this.sObjectId) {
        this.data = this.getOwnerComponent().getModel("invoice").oData.Invoices.filter(item => item.ID === this.sObjectId)[0];
      }
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

      var onDelete = () => {
        this.deleteItems();
      }

      this.createDeleteModal({
        dialogText,
        onDelete
      })
    },

    deleteItems: function () {
      var table = this.byId("consumerList");
      var selectedItems = table.getSelectedItems();

      var dataDiff = this.removeSelectedItems(this.data.Consumers, selectedItems);

      this.byId('consumerList').getModel().setProperty("/Consumers", dataDiff);
    },

    onDelete: function () {
      var dialogText = this.i18('invoiceOnDeleteSingle', [this.data.ProductName]);

      var onDelete = () => {
        this.deleteItem();
        this.onNavBack();
      };

      this.createDeleteModal({
        dialogText,
        onDelete
      });
    },

    switchEditMode: function () {
      if (!this.getView().getModel("state").getProperty('/edit')) {
        this.prevData = Object.assign({}, this.data);
        this.Consumers = structuredClone(this.byId("consumerList").getModel().oData.Consumers)
      } else {
        if (this.getView().getModel("state").oData.new) {
          this.deleteItem();
          this.onNavBack();
          return;
        }
      }
      this.switchEditModeUrl();
    },

    onCreateCustomer: function () {
      var ID = (new Date()).toISOString();
      this.data.Consumers.push({
        "ID": ID,
        "Name": "",
        "Date": new Date(),
        "Status": "New"
      })
      this.byId('consumerList').getModel().setProperty("/Consumers", this.data.Consumers);
      this.onInputChange();
    },

    switchEditModeUrl: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      var bEditMode = this.getView().getModel("state").oData.edit;
      oRouter.navTo("detail", {
        objectId: this.sObjectId,
        mode: bEditMode ? "view" : "edit",
      });
    },

    onInputChange: function () {
      this._MessageManager.removeAllMessages();
      this._generateInvalidUserInput();
      if (!this.getView().getModel("message").oData.length) {
        this.oMP.close();
        this.hideErrorButton();
      } else {
        this.oMP.open();
      }
    },

    deleteItem: function () {
      var selectedItemId = this.sObjectId;
      var items = this.getOwnerComponent().getModel("invoice").oData;
      var result = items.Invoices.filter(item => item.ID !== selectedItemId);
      this.getOwnerComponent().getModel("invoice").setProperty('/Invoices', result);
    },

    onSave: function () {
      if (this.getView().getModel("message").oData.length) {
        return;
      }
      this.prevData = null;
      this.switchEditMode();
      this.deleteItem();
      var { Invoices } = this.getOwnerComponent().getModel("invoice").oData;
      this.getOwnerComponent().getModel("invoice").setProperty('/Invoices', Invoices.concat(this.data));
    },

    onCancel: function () {
      this.switchEditMode();
      this.data = this.prevData;
      this.getView().setModel(new JSONModel(this.prevData), "data");
      this.data.Consumers = this.Consumers;
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
