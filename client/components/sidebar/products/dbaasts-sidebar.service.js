class DBaasTsSidebar {
    constructor ($translate, OvhApiMe, SidebarMenu, DBaasTsConstants) {
        this.$translate = $translate;
        this.User = OvhApiMe;
        this.SidebarMenu = SidebarMenu;
        this.DBaasTsConstants = DBaasTsConstants;

        this.locale = null;
        this.type = "METRICS";

        this.User.v6().get().$promise
            .then(user => {
                this.locale = user.ovhSubsidiary;
            });
    }

    loadIntoSection (section, services) {
        _.forEach(services, project => {
            const menuItem = this.SidebarMenu.addMenuItem({
                id: project.serviceName,
                title: project.displayName || project.serviceName,
                icon: "ovh-font ovh-font-graph",
                allowSubItems: false,
                state: "dbaas.metrics.detail.dashboard",
                stateParams: {
                    serviceName: project.serviceName
                }
            }, section);
            this.addSearchKeys(menuItem);
        });
    }

    addSearchKeys (menuItem) {
        menuItem.addSearchKey("IOT");
        menuItem.addSearchKey("Metrics");
        menuItem.addSearchKey("Monitoring");
        menuItem.addSearchKey("Time Series");
        menuItem.addSearchKey("TimeSeries");
        menuItem.addSearchKey(this.$translate.instant("cloud_sidebar_actions_menu_dbaas_ts"));
    }

    addOrder () {
        return {
            title: this.$translate.instant("cloud_sidebar_actions_menu_dbaas_ts"),
            icon: "ovh-font ovh-font-graph",
            href: this.DBaasTsConstants.urls.order[this.locale],
            target: "_blank",
            external: true
        };
    }
}

angular.module("managerApp").service("DBaasTsSidebar", DBaasTsSidebar);
