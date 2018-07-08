define(["require", "exports", "TFS/Dashboards/WidgetHelpers"], function (require, exports, WidgetHelpers) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WidgetConfiguration = /** @class */ (function () {
        function WidgetConfiguration() {
            this.$durationDropdown = $('#duration-dropdown');
        }
        WidgetConfiguration.prototype.load = function (widgetSettings, widgetConfigurationContext) {
            var _this = this;
            var settings = JSON.parse(widgetSettings.customSettings.data);
            if (settings && settings.duration) {
                this.$durationDropdown.val(settings.duration);
            }
            this.$durationDropdown.on('change', function () {
                var eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                var eventArgs = WidgetHelpers.WidgetEvent.Args(_this.getNewSettings());
                widgetConfigurationContext.notify(eventName, eventArgs);
            });
            return WidgetHelpers.WidgetStatusHelper.Success();
        };
        WidgetConfiguration.prototype.onSave = function () {
            return WidgetHelpers.WidgetConfigurationSave.Valid(this.getNewSettings());
        };
        WidgetConfiguration.prototype.getNewSettings = function () {
            var customSettings = {
                data: JSON.stringify({
                    duration: this.$durationDropdown.val()
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
