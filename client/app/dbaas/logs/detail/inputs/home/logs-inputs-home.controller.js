class LogsInputsHomeCtrl {
    constructor ($state, $stateParams, $translate, CloudMessage, ControllerHelper, LogsInputsConstant, LogsInputsService) {
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.serviceName = this.$stateParams.serviceName;
        this.$translate = $translate;
        this.CloudMessage = CloudMessage;
        this.ControllerHelper = ControllerHelper;
        this.LogsInputsConstant = LogsInputsConstant;
        this.LogsInputsService = LogsInputsService;
        this._initLoaders();
    }

    $onInit () {
        this._runLoaders();
    }

    /**
     * Deletes the input
     *
     * @param {any} input - the input object
     * @memberof LogsInputsCtrl
     */
    _delete (input) {
        this.delete = this.ControllerHelper.request.getHashLoader({
            loaderFunction: () =>
                this.LogsInputsService.deleteInput(this.serviceName, input)
        });
        this.delete.load().then(() => this._runLoaders());
    }

    /**
     * initializes the inputs and the quota
     *
     * @memberof LogsInputsCtrl
     */
    _initLoaders () {
        this.inputs = this.ControllerHelper.request.getArrayLoader({
            loaderFunction: () => this.LogsInputsService.getInputs(this.serviceName)
        });
        this.quota = this.ControllerHelper.request.getHashLoader({
            loaderFunction: () => this.LogsInputsService.getQuota(this.serviceName)
        });
    }

    /**
     * Updates the list of inputs with the latest information of the input
     *
     * @param {any} inputId
     * @returns promise which will be resolve with the reloaded input
     * @memberof LogsInputsCtrl
     */
    _reloadInputDetail (inputId) {
        this.inputReload = this.ControllerHelper.request.getHashLoader({
            loaderFunction: () => this.LogsInputsService.getInputDetail(this.serviceName, inputId)
        });

        return this.inputReload.load()
            .then(input => {
                this.inputs.data.forEach((inputItem, inputIndex) => {
                    if (inputItem.info.inputId === input.info.inputId) {
                        this.inputs.data[inputIndex] = input;
                    }
                });
                return input;
            });
    }

    /**
     * Runs all the loaders to fetch data from APIs
     *
     * @memberof LogsInputsCtrl
     */
    _runLoaders () {
        this.inputs.load();
        this.quota.load();
    }

    /**
     * Sets the state of the input to Processing
     *
     * @param {any} input
     * @memberof LogsInputsCtrl
     */
    _setInputToProcessing (input) {
        input.info.status = this.LogsInputsConstant.status.PROCESSING;
        this.LogsInputsService.transformInput(input);
    }

    /**
     * Opens the info pop-up for the input
     *
     * @param {any} input - the input for which info is to be displayed
     * @memberof LogsInputsCtrl
     */
    info (input) {
        this.CloudMessage.flushChildMessage();
        this.ControllerHelper.modal.showModal({
            modalConfig: {
                templateUrl: "app/dbaas/logs/detail/inputs/home/info/logs-inputs-home-info.html",
                controller: "LogsInputsHomeInfoModalCtrl",
                controllerAs: "ctrl",
                resolve: {
                    currentInput: () => input
                }
            }
        });
    }

    /**
     * Shows the confirmation modal box for input deletion confirmation
     * and deletes the input if the user confirms the deletion
     *
     * @param {any} input - the input object
     * @memberof LogsInputsCtrl
     */
    showDeleteConfirm (input) {
        this.CloudMessage.flushChildMessage();
        return this.ControllerHelper.modal.showDeleteModal({
            titleText: this.$translate.instant("inputs_delete"),
            text: this.$translate.instant("inputs_delete_message", { input: input.info.title })
        }).then(() => this._delete(input));
    }

    /**
     * Restarts the input
     *
     * @param {any} input - the input to be restarted
     * @memberof LogsInputsCtrl
     */
    restartInput (input) {
        this.CloudMessage.flushChildMessage();
        this.CloudMessage.info(this.$translate.instant("inputs_restarting", { inputTitle: input.info.title }));
        this._setInputToProcessing(input);
        this.processInput = this.ControllerHelper.request.getHashLoader({
            loaderFunction: () => this.LogsInputsService.restartInput(this.serviceName, input)
        });
        this.processInput.load()
            .then(() => this._reloadInputDetail(input.info.inputId),
                  () => this._reloadInputDetail(input.info.inputId));
    }

    /**
     * navigates to the standard output page
     *
     * @param {any} input - the input for which standard output is to be displayed
     * @memberof LogsInputsCtrl
     */
    standardOutput (input) {
        this.CloudMessage.flushChildMessage();
        this.$state.go("dbaas.logs.detail.inputs.console", {
            serviceName: this.serviceName,
            inputId: input.info.inputId
        });
    }

    /**
     * Starts the input
     *
     * @param {any} input - the input to be started
     * @memberof LogsInputsCtrl
     */
    startInput (input) {
        this.CloudMessage.flushChildMessage();
        this.CloudMessage.info(this.$translate.instant("inputs_starting", { inputTitle: input.info.title }));
        this._setInputToProcessing(input);
        this.processInput = this.ControllerHelper.request.getHashLoader({
            loaderFunction: () => this.LogsInputsService.startInput(this.serviceName, input)
        });
        this.processInput.load()
            .then(() => this._reloadInputDetail(input.info.inputId),
                  () => this._reloadInputDetail(input.info.inputId));
    }

    /**
     * Stops the input
     *
     * @param {any} input - the input to be stopped
     * @memberof LogsInputsCtrl
     */
    stopInput (input) {
        this.CloudMessage.flushChildMessage();
        this.CloudMessage.info(this.$translate.instant("inputs_stopping", { inputTitle: input.info.title }));
        this._setInputToProcessing(input);
        this.processInput = this.ControllerHelper.request.getHashLoader({
            loaderFunction: () => this.LogsInputsService.stopInput(this.serviceName, input)
        });
        this.processInput.load()
            .then(() => this._reloadInputDetail(input.info.inputId),
                  () => this._reloadInputDetail(input.info.inputId));
    }
}

angular.module("managerApp").controller("LogsInputsHomeCtrl", LogsInputsHomeCtrl);
