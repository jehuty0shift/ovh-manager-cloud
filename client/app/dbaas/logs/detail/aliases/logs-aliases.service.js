class LogsAliasesService {
    constructor ($q, $translate, OvhApiDbaas, ServiceHelper, CloudPoll,
                 LogsOptionsService, LogStreamsConstants, LogAliasConstants, UrlHelper, CloudMessage) {
        this.$q = $q;
        this.$translate = $translate;
        this.ServiceHelper = ServiceHelper;
        this.AliasApiService = OvhApiDbaas.Logs().Alias().Lexi();
        this.AliasAapiService = OvhApiDbaas.Logs().Alias().Aapi();
        this.AccountingAapiService = OvhApiDbaas.Logs().Accounting().Aapi();
        this.OperationApiService = OvhApiDbaas.Logs().Operation().Lexi();
        this.CloudPoll = CloudPoll;
        this.LogsOptionsService = LogsOptionsService;
        this.LogStreamsConstants = LogStreamsConstants;
        this.LogAliasConstants = LogAliasConstants;
        this.UrlHelper = UrlHelper;
        this.CloudMessage = CloudMessage;
    }

    /**
     * returns array of aliases with details
     *
     * @param {any} serviceName
     * @returns promise which will be resolve to array of aliases. Each alias will have all details populated.
     * @memberof LogsAliasesService
     */
    getAliases (serviceName) {
        return this.getAliasesDetails(serviceName)
            .catch(this.ServiceHelper.errorHandler("logs_aliases_get_error"));
    }

    /**
     * gets details for each alias in array
     *
     * @param {any} serviceName
     * @returns promise which will be resolve to an array of alias objects
     * @memberof LogsAliasesService
     */
    getAliasesDetails (serviceName) {
        return this.getAliasesIds(serviceName)
            .then(aliases => {
                const promises = aliases.map(aliasId => this.getAapiAlias(serviceName, aliasId));
                return this.$q.all(promises);
            });
    }

    /**
     * returns array of aliases id's of logged in user
     *
     * @param {any} serviceName
     * @returns promise which will be resolve to array of aliases id's
     * @memberof LogsAliasesService
     */
    getAliasesIds (serviceName) {
        return this.AliasApiService.query({ serviceName }).$promise;
    }

    /**
     * returns details of an alias
     *
     * @param {any} serviceName
     * @param {any} aliasId
     * @returns promise which will be resolve to alias object
     * @memberof LogsAliasesService
     */
    getAlias (serviceName, aliasId) {
        return this.AliasApiService.get({ serviceName, aliasId })
            .$promise.catch(this.ServiceHelper.errorHandler("logs_alias_get_error"));
    }

    /**
     * returns details of an alias
     *
     * @param {any} serviceName
     * @param {any} aliasId
     * @returns promise which will be resolve to alias object
     * @memberof LogsAliasesService
     */
    getAapiAlias (serviceName, aliasId) {
        return this.AliasAapiService.get({ serviceName, aliasId })
            .$promise.catch(this.ServiceHelper.errorHandler("logs_alias_get_error"));
    }

    /**
     * returns objecy containing total number of aliases and total number of aliases used
     *
     * @param {any} serviceName
     * @returns quota object containing V (total number aliases) and configured (number of aliases used)
     * @memberof LogsAliasesService
     */
    getQuota (serviceName) {
        return this.AccountingAapiService.me({ serviceName }).$promise
            .then(me => ({
                max: me.total.maxNbAlias,
                configured: me.total.curNbAlias
            })
            ).catch(this.ServiceHelper.errorHandler("logs_alias_quota_get_error"));
    }

    /**
     * delete alias
     *
     * @param {any} serviceName
     * @param {any} alias, alias object to be deleted
     * @returns promise which will be resolve to operation object
     * @memberof LogsAliasesService
     */
    deleteAlias (serviceName, alias) {
        return this.AliasApiService.delete({ serviceName, aliasId: alias.aliasId }, alias)
            .$promise
            .then(operation => {
                this._resetAllCache();
                return this._handleOperation(serviceName, operation, "logs_aliases_delete_success");
            })
            .catch(this.ServiceHelper.errorHandler("logs_aliases_delete_error"));
    }

    /**
     * create new alias
     *
     * @param {any} serviceName
     * @param {any} alias, alias object to be created
     * @returns promise which will be resolve to operation object
     * @memberof LogsAliasesService
     */
    createAlias (serviceName, alias) {
        return this.AliasApiService.create({ serviceName }, alias)
            .$promise
            .then(operation => {
                this._resetAllCache();
                return this._handleOperation(serviceName, operation, "logs_aliases_create_success");
            })
            .catch(this.ServiceHelper.errorHandler("logs_aliases_create_error"));
    }

    /**
     * update alias
     *
     * @param {any} serviceName
     * @param {any} alias, alias object to be updated
     * @returns promise which will be resolve to operation object
     * @memberof LogsAliasesService
     */
    updateAlias (serviceName, alias) {
        return this.AliasApiService.update({ serviceName, aliasId: alias.aliasId }, alias)
            .$promise
            .then(operation => {
                this._resetAllCache();
                return this._handleOperation(serviceName, operation, "logs_aliases_update_success");
            })
            .catch(this.ServiceHelper.errorHandler("logs_aliases_update_error"));
    }

    /**
     * creates new alias with default values
     *
     * @returns alias object with default values
     * @memberof LogsAliasesService
     */
    getNewAlias () {
        return {
            data: {
                description: null,
                suffix: null
            },
            loading: false
        };
    }

    getSubscribedOptions (serviceName) {
        return this.LogsOptionsService.getSubscribedOptionsByType(serviceName, this.LogAliasConstants.ALIAS_OPTION_REFERENCE);
    }

    getElasticSearchUrl (alias) {
        const url = this.UrlHelper.findUrl(alias, this.LogAliasConstants.ELASTICSEARCH_API_URL);
        if (!url) {
            this.CloudMessage.error(this.$translate.instant("logs_aliases_get_elasticsearch_url_error", { alias: alias.info.name }));
        }
        return url;
    }

    /**
     * handles success and failure state for create, delete and update streams.
     * Repetedly polls for operation untill it returns SUCCESS or FAILURE.
     *
     * @param {any} serviceName
     * @param {any} operation, operation to poll
     * @param {any} successMessage, message to show on UI
     * @returns promise which will be resolved to operation object
     * @memberof LogsAliasesService
     */
    _handleOperation (serviceName, operation, successMessage) {
        this.poller = this._pollOperation(serviceName, operation);
        return this.poller.$promise
            .then(result => {
                if (result[0].item.state === this.LogStreamsConstants.SUCCESS) {
                    this.CloudMessage.success(this.$translate.instant(successMessage));
                } else {
                    this.CloudMessage.error(this.$translate.instant("logs_operation_failed", { operation_id: result[0].item.operationId }));
                }
                return result;
            });
    }

    _killPoller () {
        if (this.poller) {
            this.poller.kill();
        }
    }

    _resetAllCache () {
        this.AccountingAapiService.resetAllCache();
        this.AliasAapiService.resetAllCache();
    }

    _pollOperation (serviceName, operation) {
        this._killPoller();
        const poller = this.CloudPoll.poll({
            item: operation,
            pollFunction: opn => this.OperationApiService.get({ serviceName, operationId: opn.operationId }).$promise,
            stopCondition: opn => opn.state === this.LogStreamsConstants.FAILURE || opn.state === this.LogStreamsConstants.SUCCESS
        });
        return poller;
    }
}

angular.module("managerApp").service("LogsAliasesService", LogsAliasesService);