/**
 * @module Detail
 */

sap.ui.define([
  "./Base.controller",
  "sap/ui/core/routing/History",
  "sap/m/MessageToast",
  "sap/ui/model/json/JSONModel",
  'sap/ui/core/Core',
], function (BaseController, History, MessageToast, JSONModel, Core) {
  "use strict";

  return BaseController.extend("sap.ui.demo.walkthrough.controller.Detail", {

    /**
     * Initialize Detail page (set initial model)
     * @private
     */
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

    /**
     * Switch data and viewMode on urlChange
     * @private
     * @param {object} changeUrlEvent
     */
    _onObjectMatched: function (oEvent) {
      this.hideErrorButton();

      var oStateModel = new JSONModel({
        edit: oEvent.getParameter("arguments").mode !== "view",
        new: oEvent.getParameter("arguments").mode === "create"
      });

      this.getView().setModel(oStateModel, "state");
      this.sObjectId = oEvent.getParameter("arguments").objectId;
      if (!this.data || this.data.ID !== this.sObjectId) {
        this.data = this.model("invoice").getData().Invoices.filter(item => item.ID === this.sObjectId)[0];
      }
      var oConsumers = new JSONModel({
        "Consumers": this.data.Consumers
      });
      this.byId('consumerList').setModel(oConsumers);
      var oModel = new JSONModel(this.data);

      this.getView().setModel(oModel, "data");
    },

    /**
     * Handle consumer table selection
     * @private
     */
    onSelection: function() {
      var table = this.byId("consumerList");
      var selectedItems = table.getSelectedItems();
      this.getView().getModel("view").setProperty('/selected', !!selectedItems.length );
    },

    /**
     * Handle delete consumer button click
     * @private
     */
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

      this.createDeleteModal({
        dialogText,
        view: this.getView()
      })
    },

    /**
     * Delete selected customers
     * @private
     */
    deleteItems: function () {
      var table = this.byId("consumerList");
      var selectedItems = table.getSelectedItems();

      var dataDiff = this.removeSelectedItems(this.data.Consumers, selectedItems);

      this.data.Consumers = dataDiff;
      this.byId('consumerList').getModel().setProperty("/Consumers", dataDiff);
    },

    /**
     * Handle delete invoice button click
     * @private
     */
    onDelete: function () {
      var dialogText = this.i18('invoiceOnDeleteSingle', [this.data.ProductName]);

      this.createDeleteModal({
        dialogText,
        view: this.getView()
      });
    },

    /**
     * Handle delete modal event
     * @private
     */
    onDialogDelete: function () {
      if (this.getView().getModel("state").getData().edit) {
        this.deleteItems();
      } else {
        this.deleteItem();
        this.onNavBack();
      }
      this.onDialogClose();
    },

    /**
     * Switch viewMode
     * @private
     */
    switchEditMode: function () {
      if (!this.getView().getModel("state").getProperty('/edit')) {
        this.prevData = Object.assign({}, this.data);
        this.Consumers = structuredClone(this.byId("consumerList").getModel().getData().Consumers)
      } else {
        if (this.getView().getModel("state").getData().new) {
          this.deleteItem();
          this.onNavBack();
          return;
        }
      }
      this.switchEditModeUrl();
    },

    /**
     * Create new Customer
     * @private
     */
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

    /**
     * Switch viewMode url
     * @private
     */
    switchEditModeUrl: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      var bEditMode = this.getView().getModel("state").getData().edit;
      oRouter.navTo("detail", {
        objectId: this.sObjectId,
        mode: bEditMode ? "view" : "edit",
      });
    },

    /**
     * Handle input change
     * @private
     */
    onInputChange: function () {
      this._MessageManager.removeAllMessages();
      this._generateInvalidUserInput();
      if (!this.getView().getModel("message").getData().length) {
        this.oMP.close();
        this.hideErrorButton();
      } else {
        this.oMP.open();
      }
    },

    /**
     * Delete current item
     * @private
     */
    deleteItem: function () {
      var selectedItemId = this.sObjectId;
      var items = this.model("invoice").getData();
      var result = items.Invoices.filter(item => item.ID !== selectedItemId);
      this.model("invoice").setProperty('/Invoices', result);
    },

    /**
     * Save current changes of the invoice
     * @private
     */
    onSave: function () {
      if (this.getView().getModel("message").getData().length) {
        return;
      }
      this.prevData = null;
      this.switchEditMode();
      this.deleteItem();
      var { Invoices } = this.model("invoice").getData();
      this.model("invoice").setProperty('/Invoices', Invoices.concat(this.data));
    },

    /**
     * Return back state of the invoice
     * @private
     */
    onCancel: function () {
      this.switchEditMode();
      this.data = this.prevData;
      this.getView().setModel(new JSONModel(this.prevData), "data");
      this.data.Consumers = this.Consumers;
    },

    /**
     * Navigation to the overview page
     * @private
     */
    onNavBack: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("overview", {}, true);
    },

    /**
     * Handle error popover click
     * @private
     */
    handleMessagePopoverPress: function (oEvent) {
      if (!this.oMP) {
        this.createMessagePopover();
      }
      this.oMP.toggle(oEvent.getSource());
    },
  });
});
