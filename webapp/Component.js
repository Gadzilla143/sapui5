/**
 * @module Component
 */
sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "sap/ui/Device"
], function (UIComponent, JSONModel, Device) {
  "use strict";

  return UIComponent.extend("sap.ui.demo.walkthrough.Component", {

    metadata: {
      interfaces: ["sap.ui.core.IAsyncContentCreation"],
      manifest: "json"
    },
    /**
     * Initialize global model
     * @public
     */
    init: function () {
      UIComponent.prototype.init.apply(this, arguments);

      var oDeviceModel = new JSONModel(Device);
      oDeviceModel.setDefaultBindingMode("OneWay");

      this.setModel(oDeviceModel, "device");

      this.getRouter().initialize();
    },

    /**
     * Set css style for current device
     * @public
     * @returns {string} css class
     */

    getContentDensityClass : function () {
      if (!this._sContentDensityClass) {
        if (!Device.support.touch) {
          this._sContentDensityClass = "sapUiSizeCompact";
        } else {
          this._sContentDensityClass = "sapUiSizeCozy";
        }
      }
      return this._sContentDensityClass;
    }
  });

});
