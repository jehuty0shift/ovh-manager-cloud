class LogsRolesService {
    constructor ($q, $translate, CloudPoll, ControllerHelper, LogsOptionsService, LogsRolesConstant, OvhApiDbaas, ServiceHelper) {
        this.$q = $q;
        this.$translate = $translate;
        this.ServiceHelper = ServiceHelper;
        this.ControllerHelper = ControllerHelper;
        this.LogsOptionsService = LogsOptionsService;
        this.LogsRolesConstant = LogsRolesConstant;
        this.CloudPoll = CloudPoll;
        this.OperationApiService = OvhApiDbaas.Logs().Operation().Lexi();
        this.RolesApiService = OvhApiDbaas.Logs().Role().Lexi();
        this.RolesAapiService = OvhApiDbaas.Logs().Role().Aapi();
        this.AccountingAapiService = OvhApiDbaas.Logs().Accounting().Aapi();
        this.newRole = {
            description: "",
            name: "",
            optionId: null
        };
    }

    getNewRole () {
        return this.newRole;
    }

    getQuota (serviceName) {
        return this.AccountingAapiService.me({ serviceName }).$promise
            .then(me => {
                const quota = {
                    max: me.total.maxNbRole,
                    configured: me.total.curNbRole,
                    currentUsage: me.total.curNbRole * 100 / me.total.maxNbRole
                };
                return quota;
            }).catch(this.ServiceHelper.errorHandler("logs_roles_quota_get_error"));
    }

    getRoles (serviceName) {
        return this.RolesApiService.query({ serviceName }).$promise
            .then(roles => {
                const promises = roles.map(roleId => this.getRoleDetails(serviceName, roleId));
                return this.$q.all(promises);
            }).catch(this.ServiceHelper.errorHandler("logs_roles_get_error"));
    }

    getRoleDetails (serviceName, roleId) {
        return this.RolesAapiService.get({ serviceName, roleId }).$promise;
    }

    getSubscribedOptions (serviceName) {
        return this.LogsOptionsService.getSubscribedOptionsByType(serviceName, this.LogsRolesConstant.optionType);
    }

    addRole (serviceName, object) {
        return this.RolesApiService.create({ serviceName }, object).$promise
            .then(operation => this._handleSuccess(serviceName, operation.data, "logs_role_add_success"))
            .catch(this.ServiceHelper.errorHandler("logs_role_add_error"));
    }

    updateRole (serviceName, object) {
        return this.RolesAapiService.update({ serviceName }, object).$promise
            .then(operation => this._handleSuccess(serviceName, operation.data, "logs_role_update_success"))
            .catch(this.ServiceHelper.errorHandler("logs_role_update_error"));
    }

    deleteRole (serviceName, roleId) {
        return this.RolesApiService.remove({ serviceName, roleId }).$promise
            .then(operation => {
                this._resetAllCache();
                return this._handleSuccess(serviceName, operation, "logs_role_delete_success");
            })
            .catch(this.ServiceHelper.errorHandler("logs_role_delete_error"));
    }

    deleteModal (role) {
        return this.ControllerHelper.modal.showDeleteModal({
            titleText: this.$translate.instant("logs_role_modal_delete_title"),
            text: this.$translate.instant("logs_role_modal_delete_question", { name: role.name })
        });
    }

    _handleSuccess (serviceName, operation, successMessage) {
        this.poller = this._pollOperation(serviceName, operation);
        return this.poller.$promise
            .then(this.ServiceHelper.successHandler(successMessage));
    }

    _killPoller () {
        if (this.poller) {
            this.poller.kill();
        }
    }

    _pollOperation (serviceName, operation) {
        this._killPoller();
        return this.CloudPoll.poll({
            item: operation,
            pollFunction: opn => this.OperationApiService.get({ serviceName, operationId: opn.operationId }).$promise,
            stopCondition: opn => opn.state === this.LogsRolesConstant.FAILURE || opn.state === this.LogsRolesConstant.SUCCESS
        });
    }

    _resetAllCache () {
        this.RolesApiService.resetAllCache();
        this.RolesAapiService.resetAllCache();
        this.AccountingAapiService.resetAllCache();
    }
}

angular.module("managerApp").service("LogsRolesService", LogsRolesService);