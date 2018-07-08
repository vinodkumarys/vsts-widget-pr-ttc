import WidgetHelpers = require("TFS/Dashboards/WidgetHelpers");
import WidgetContracts = require("TFS/Dashboards/WidgetContracts");

class WidgetConfiguration implements WidgetContracts.IWidgetConfiguration {

    private $durationDropdown: JQuery<HTMLElement>;

    constructor() {
        this.$durationDropdown = $('#duration-dropdown');
    }

    load(widgetSettings: WidgetContracts.WidgetSettings, widgetConfigurationContext: WidgetContracts.IWidgetConfigurationContext): IPromise<WidgetContracts.WidgetStatus> {
        const settings = JSON.parse(widgetSettings.customSettings.data);
        if (settings && settings.duration) {
            this.$durationDropdown.val(settings.duration);
        }

        this.$durationDropdown.on('change', () => {
            const eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
            const eventArgs = WidgetHelpers.WidgetEvent.Args(this.getNewSettings());
            widgetConfigurationContext.notify(eventName, eventArgs);
        });

        return WidgetHelpers.WidgetStatusHelper.Success();
    }

    onSave(): IPromise<WidgetContracts.SaveStatus> {
        return WidgetHelpers.WidgetConfigurationSave.Valid(this.getNewSettings());
    }

    private getNewSettings() {
        const customSettings = {
            data: JSON.stringify({
                duration: this.$durationDropdown.val()
            })
        };

        return customSettings;
    }
}

export const createWidgetConfiguration = (): WidgetContracts.IWidgetConfiguration => {
    WidgetHelpers.IncludeWidgetConfigurationStyles();
    return new WidgetConfiguration();
}