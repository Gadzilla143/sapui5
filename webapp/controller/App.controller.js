/**
 * @module App
 */
sap.ui.define([
  "./Base.controller",
], function (BaseController) {
  "use strict";
  return BaseController.extend("sap.ui.demo.walkthrough.controller.App", {
    /**
     * Add content css class
     * @public
     */
    onInit: function () {
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
    }
  });

});
