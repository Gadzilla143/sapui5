sap.ui.define([
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
], function (Filter, FilterOperator) {
  "use strict";
  return {
    createFilter: function (field, value, filterType = FilterOperator.Contains) {
      return new Filter(field, filterType, value)
    }
  };
});
