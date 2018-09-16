import WidgetHelpers = require("TFS/Dashboards/WidgetHelpers");
import WidgetContracts = require("TFS/Dashboards/WidgetContracts");

class WidgetConfiguration implements WidgetContracts.IWidgetConfiguration {

    private $durationDropdown: JQuery<HTMLElement>;
    private $repositoryInput: JQuery<HTMLElement>;
    private $maxPullRequestsToQueryInput: JQuery<HTMLElement>;

    constructor() {
        this.$durationDropdown = $('#duration-dropdown');
        this.$repositoryInput = $('#repository-input');
        this.$maxPullRequestsToQueryInput = $('#maxpullrequeststoquery-input');
    }

    load(widgetSettings: WidgetContracts.WidgetSettings, widgetConfigurationContext: WidgetContracts.IWidgetConfigurationContext): IPromise<WidgetContracts.WidgetStatus> {
        const settings = JSON.parse(widgetSettings.customSettings.data);
        if (settings) {
            if(settings.duration) this.$durationDropdown.val(settings.duration);
            if(settings.repository) this.$repositoryInput.val(settings.repository);
            if(settings.maxPullRequestsToQuery) this.$maxPullRequestsToQueryInput.val(settings.maxPullRequestsToQuery);
        }

        const notifyChange = () => {
            const eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
            const eventArgs = WidgetHelpers.WidgetEvent.Args(this.getNewSettings());
            widgetConfigurationContext.notify(eventName, eventArgs);
        };

        this.$durationDropdown.on('change', notifyChange);
        this.$repositoryInput.on('change', notifyChange);
        this.$maxPullRequestsToQueryInput.on('change', notifyChange);

        return WidgetHelpers.WidgetStatusHelper.Success();
    }

    onSave(): IPromise<WidgetContracts.SaveStatus> {
        return WidgetHelpers.WidgetConfigurationSave.Valid(this.getNewSettings());
    }

    private getNewSettings() {
        const customSettings = {
            data: JSON.stringify({
                duration: this.$durationDropdown.val(),
                repository: this.$repositoryInput.val(),
                maxPullRequestsToQuery: this.$maxPullRequestsToQueryInput.val(),
            })
        };

        return customSettings;
    }
}

export const createWidgetConfiguration = (): WidgetContracts.IWidgetConfiguration => {
    WidgetHelpers.IncludeWidgetConfigurationStyles();
    return new WidgetConfiguration();
}