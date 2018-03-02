angular.module("managerApp")
  .controller("CdaCtrl", function ($transitions, $state, CdaService) {
      "use strict";
      $transitions.onSuccess({}, function () {
          if ($state.includes("paas.cda")) {
              CdaService.initDetails($state.params.serviceName);
          }
      });
  });
