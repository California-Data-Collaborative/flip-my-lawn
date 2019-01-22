"use strict";

var source_of_truth = {
  turf_area: '',
  home_address: '',
  pet: '',
  map_is_clickable: true,
  area_is_custom: false,
  data_available: false,
  initialized: false,
  ventura: false
};
new Vue({
  el: '#app',
  data: source_of_truth,
  watch: {
    home_address: function home_address() {
      if (this.home_address == 'No data for this yard...') {
        document.getElementById('savings_explorer_anchor').scrollIntoView({
          behavior: 'smooth',
          block: "start"
        });
      }
    }
  },
  computed: {
    turf_area_for_display: function turf_area_for_display() {
      if (this.turf_area == '') {
        return '';
      }

      if (this.turf_area == 'No turf area data') {
        return 'No turf area data';
      }

      return "".concat(Math.round(this.turf_area).toLocaleString(), " sqft");
    },
    water_savings: function water_savings() {
      var turf_usage = this.turf_area * 1 * this.pet * .62 / 20;
      var ca_plants_usage = this.turf_area * .3 * this.pet * .62 / 20;
      var waterSavings = turf_usage - ca_plants_usage;
      return waterSavings;
    },
    water_savings_for_display: function water_savings_for_display() {
      return "".concat(Math.round(this.water_savings / 1000).toLocaleString());
    },
    carbon_savings: function carbon_savings() {
      var carbonSavings = this.water_savings * 0.0021196;
      return carbonSavings;
    },
    carbon_savings_for_display: function carbon_savings_for_display() {
      return Math.round(this.carbon_savings).toLocaleString();
    },
    trees_grown_for_display: function trees_grown_for_display() {
      var treesGrown = this.carbon_savings * 0.01169444992;
      return treesGrown.toPrecision(2).toLocaleString();
    },
    dollar_savings_for_display: function dollar_savings_for_display() {
      var turf_maintenance = 240 * (47.81 / 10890) * this.turf_area; // https://www.lawnstarter.com/CA | https://lawn-care.promatcher.com/cost/los-angeles-ca-lawn-care-costs-prices.aspx

      var native_maintenance = turf_maintenance * .68; // https://www.smgov.net/uploadedFiles/Departments/OSE/Categories/Landscape/garden-garden-2013.pdf

      var maintenance_savings = turf_maintenance - native_maintenance;
      var dollarSavings = this.water_savings * 20 * 0.00695187165 + maintenance_savings - (3 - this.$options.rebate) * this.turf_area; // 10 ccf for 52 from water rate survey

      return "".concat((Math.round(dollarSavings / 100) * 100).toLocaleString());
    }
  },
  // static props
  rebate: 1,
  // setup functions
  beforeCreate: function beforeCreate() {
    window.onbeforeunload = function () {
      window.scrollTo(0, 0);
    };
  },
  mounted: function mounted() {
    var _this = this;

    document.onreadystatechange = function () {
      if (document.readyState == "complete") {
        initializeAddressSearch(_this);
        initializeMap(_this);
        initializeDrawTool(_this);
      }
    };
  }
});