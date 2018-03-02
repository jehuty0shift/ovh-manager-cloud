/**
 * Special rules for redirections
 */
angular.module("managerApp").run(function ($transitions, $state, $stateParams) {
    $transitions.onStart({}, (transition) => {
        const to = transition.to();
        if (to.redirectTo) {
            $state.go(to.redirectTo, params);
        }
    });

    $transitions.onStart({}, function (transition) {
        const state = transition.to();
        if (state && state.url === "/compute") {
            if ($state.includes("iaas.pci-project")) {
                if ($stateParams.createNewVm) {
                    $state.go("iaas.pci-project.compute.infrastructure", {
                        createNewVm: true
                    });
                } else {
                    $state.go("iaas.pci-project.compute.infrastructure");
                }
            }
        } else if (state && state.url === "/billing") {
            $state.go("iaas.pci-project.billing.consumption");
        }
    });
});
