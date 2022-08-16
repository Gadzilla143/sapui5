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

  // shortcut for sap.m.ButtonType
  var ButtonType = mobileLibrary.ButtonType;

  // shortcut for sap.m.DialogType
  var DialogType = mobileLibrary.DialogType;

  // shortcut for sap.ui.core.MessageType
  var MessageType = coreLibrary.MessageType;

  return Controller.extend("sap.ui.demo.walkthrough.controller.Detail", {

    onInit: function () {
      var oViewModel = new JSONModel({
        currency: "EUR"
      });
      this.getView().setModel(oViewModel, "view");

      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onObjectMatched, this);

      // MessageBox
      this._MessageManager = Core.getMessageManager();
      this._MessageManager.registerObject(this.getView().byId("formContainer"), true);
      this.getView().setModel(this._MessageManager.getMessageModel(), "message");
      this.createMessagePopover();
    },

    _onObjectMatched: function (oEvent) {
      var state = this.getOwnerComponent().getModel("state");
      this.getView().setModel(state, "state");
      this.hideErrorButton();
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
      var state = new JSONModel({
        edit: !this.getView().getModel("state").oData.edit
      });
      this.getView().setModel(state, "state");
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
      this.deleteItem();
      var data = this.getOwnerComponent().getModel("invoice").oData;
      var jModel = new sap.ui.model.json.JSONModel();
      jModel.setData({Invoices: data.Invoices.concat(this.data)});
      this.getOwnerComponent().setModel(jModel, "invoice");
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
