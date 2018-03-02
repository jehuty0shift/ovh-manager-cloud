angular.module("managerApp").run(($rootScope, $transitions, $state, OvhApiMe) => {

    $transitions.onSuccess({}, () => {
        OvhApiMe.Lexi().get().$promise
            .then(() => {
                $rootScope.managerPreloadHide += " manager-preload-hide";
            });
    });

});
