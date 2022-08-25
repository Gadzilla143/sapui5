/**
 * @module App
 */
sap.ui.define([
  "./Base.controller",
], function (BaseController) {
  "use strict";
  return BaseController.extend("sap.ui.demo.walkthrough.controller.App", {
    /**
     * Add global css class depend on device
     * @private
     */
    onInit: function () {
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
    }
  });

});
