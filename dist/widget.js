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
            var defaultDurationDays = 30;
            var defaultPageSize = 1000;
            var defaultMaxPullRequestsToQuery = 500;
            var MaxPullRequestsToQueryLimit = 5000;
            var startDate = new Date(), settings = JSON.parse(widgetSettings.customSettings.data);
            var daysToConsider = settings && !isNaN(settings.duration) ? parseInt(settings.duration) : defaultDurationDays;
            var repository = settings && settings.repository ? settings.repository.trim() : '';
            // we need to cap the number of items we pull from the API
            var maxPullRequestsToQuery = settings && settings.maxPullRequestsToQuery
                && !isNaN(settings.maxPullRequestsToQuery)
                && parseInt(settings.maxPullRequestsToQuery) > 0
                ? Math.min(parseInt(settings.maxPullRequestsToQuery), MaxPullRequestsToQueryLimit) : defaultMaxPullRequestsToQuery;
            // the API seems to return only max 1000 items 
            var pageSize = Math.min(maxPullRequestsToQuery, defaultPageSize);
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
            return (this.getPullRequests(startDate, this.webContext.project.id, repository, maxPullRequestsToQuery, pageSize, searchCriteria))
                .then(function (pullRequests) {
                _this.processPullRequests(pullRequests);
                return WidgetHelpers.WidgetStatusHelper.Success();
            }, function (error) {
                return WidgetHelpers.WidgetStatusHelper.Failure(error);
            });
        };
        Widget.prototype.reload = function (newWidgetSettings) {
            return this.load(newWidgetSettings);
        };
        Widget.prototype.getPullRequests = function (startDate, projectId, repository, maxPullRequestsToQuery, pageSize, searchCriteria) {
            var skip = 0, pullRequests = new Array();
            var client = this.gitRestClient;
            return new Promise(function (resolve, reject) {
                var fetch = function () {
                    console.log("Fetching: Repo: [" + (repository || 'N/A') + "] Project: [" + projectId + "] Skip: [" + skip + "] PageSize: [" + pageSize + "] ");
                    (repository.length > 0
                        ? client.getPullRequests(repository, searchCriteria, projectId, 0, skip, pageSize)
                        : client.getPullRequestsByProject(projectId, searchCriteria, 0, skip, pageSize))
                        .then(function (prs) {
                        if (prs.length > 0) {
                            console.log("Fetched: Count: " + prs.length + " From: " + prs[0].creationDate + " To: " + prs[prs.length - 1].creationDate);
                        }
                        skip += prs.length;
                        // check if oldest PR creation date is still newer/after the start date
                        if (prs.length >= pageSize && prs[prs.length - 1].creationDate > startDate && skip < maxPullRequestsToQuery) {
                            pullRequests = pullRequests.concat(prs);
                            fetch();
                        }
                        else {
                            pullRequests = pullRequests.concat(prs.filter(function (pr) { return pr.creationDate >= startDate; }));
                            resolve(pullRequests);
                        }
                    }, function (err) { return reject(err); });
                };
                fetch();
            });
        };
        Widget.prototype.processPullRequests = function (pullRequests) {
            var sum = 0;
            for (var _i = 0, pullRequests_1 = pullRequests; _i < pullRequests_1.length; _i++) {
                var request = pullRequests_1[_i];
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
