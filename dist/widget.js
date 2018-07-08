define(["require", "exports", "TFS/Dashboards/WidgetHelpers", "TFS/VersionControl/GitRestClient", "TFS/VersionControl/Contracts"], function (require, exports, WidgetHelpers, GitRestClient, Contracts) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Widget = /** @class */ (function () {
        function Widget() {
            this.gitRestClient = GitRestClient.getClient();
            this.webContext = VSS.getWebContext();
            this.$title = $('.title');
            this.$number = $('.big-count');
            this.$footer = $('.footer');
        }
        Widget.prototype.preload = function (widgetSettings) {
            return WidgetHelpers.WidgetStatusHelper.Success();
        };
        Widget.prototype.load = function (widgetSettings) {
            var _this = this;
            this.$title.text(widgetSettings.name);
            var startDate = new Date(), settings = JSON.parse(widgetSettings.customSettings.data);
            var daysToConsider = settings && !isNaN(settings.duration) ? parseInt(settings.duration) : 30;
            var repository = settings && settings.repository ? settings.repository.trim() : '';
            startDate.setDate(startDate.getDate() - daysToConsider);
            var searchCriteria = {
                creatorId: '',
                includeLinks: false,
                repositoryId: '',
                reviewerId: '',
                sourceRefName: '',
                sourceRepositoryId: '',
                targetRefName: '',
                status: Contracts.PullRequestStatus.Completed
            };
            return (repository.length > 0
                ? this.gitRestClient.getPullRequests(repository, searchCriteria, this.webContext.project.id, 0)
                : this.gitRestClient.getPullRequestsByProject(this.webContext.project.id, searchCriteria, 0))
                .then(function (pullRequests) {
                _this.processResponse(pullRequests, startDate);
                return WidgetHelpers.WidgetStatusHelper.Success();
            }, function (error) {
                return WidgetHelpers.WidgetStatusHelper.Failure(error);
            });
        };
        Widget.prototype.reload = function (newWidgetSettings) {
            return this.load(newWidgetSettings);
        };
        Widget.prototype.processResponse = function (pullRequests, startDate) {
            var i, sum = 0;
            for (var _i = 0, pullRequests_1 = pullRequests; _i < pullRequests_1.length; _i++) {
                var request = pullRequests_1[_i];
                if (request.creationDate < startDate)
                    continue;
                sum += request.closedDate.getTime() - request.creationDate.getTime();
            }
            var labels = this.getTimeSpanDisplayLabels(sum / pullRequests.length);
            this.$number.text(labels[0]);
            this.$footer.text(labels[1]);
        };
        Widget.prototype.getTimeSpanDisplayLabels = function (time) {
            if (!time || time <= 0)
                return ['N/A', ''];
            var ms = time / 1000, shortLabel = '';
            var seconds = Math.floor(ms % 60);
            ms = ms / 60;
            var minutes = Math.floor(ms % 60);
            ms = ms / 60;
            var hours = Math.floor(ms % 24);
            var days = Math.floor(ms / 24);
            if (days > 0) {
                shortLabel += days + 'd';
            }
            else if (hours > 0) {
                shortLabel += hours + 'h';
            }
            else if (minutes > 0) {
                shortLabel += minutes + 'm';
            }
            else if (seconds > 0) {
                shortLabel += seconds + 's';
            }
            var longLabel = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
            return [shortLabel.trim(), longLabel];
        };
        return Widget;
    }());
    exports.createWidget = function () {
        WidgetHelpers.IncludeWidgetStyles();
        return new Widget();
    };
});
