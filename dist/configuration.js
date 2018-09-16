define(["require", "exports", "TFS/Dashboards/WidgetHelpers"], function (require, exports, WidgetHelpers) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WidgetConfiguration = /** @class */ (function () {
        function WidgetConfiguration() {
            this.$durationDropdown = $('#duration-dropdown');
            this.$repositoryInput = $('#repository-input');
            this.$maxPullRequestsToQueryInput = $('#maxpullrequeststoquery-input');
        }
        WidgetConfiguration.prototype.load = function (widgetSettings, widgetConfigurationContext) {
            var _this = this;
            var settings = JSON.parse(widgetSettings.customSettings.data);
            if (settings) {
                if (settings.duration)
                    this.$durationDropdown.val(settings.duration);
                if (settings.repository)
                    this.$repositoryInput.val(settings.repository);
                if (settings.maxPullRequestsToQuery)
                    this.$maxPullRequestsToQueryInput.val(settings.maxPullRequestsToQuery);
            }
            var notifyChange = function () {
                var eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                var eventArgs = WidgetHelpers.WidgetEvent.Args(_this.getNewSettings());
                widgetConfigurationContext.notify(eventName, eventArgs);
            };
            this.$durationDropdown.on('change', notifyChange);
            this.$repositoryInput.on('change', notifyChange);
            this.$maxPullRequestsToQueryInput.on('change', notifyChange);
            return WidgetHelpers.WidgetStatusHelper.Success();
        };
        WidgetConfiguration.prototype.onSave = function () {
            return WidgetHelpers.WidgetConfigurationSave.Valid(this.getNewSettings());
        };
        WidgetConfiguration.prototype.getNewSettings = function () {
            var customSettings = {
                data: JSON.stringify({
                    duration: this.$durationDropdown.val(),
                    repository: this.$repositoryInput.val(),
                    maxPullRequestsToQuery: this.$maxPullRequestsToQueryInput.val(),
                })
            };
            return customSettings;
        };
        return WidgetConfiguration;
    }());
    exports.createWidgetConfiguration = function () {
        WidgetHelpers.IncludeWidgetConfigurationStyles();
        return new WidgetConfiguration();
    };
});
