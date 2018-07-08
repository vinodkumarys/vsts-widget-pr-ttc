import WidgetHelpers = require("TFS/Dashboards/WidgetHelpers");
import GitRestClient = require("TFS/VersionControl/GitRestClient");
import Contracts = require("TFS/VersionControl/Contracts");
import WidgetContracts = require("TFS/Dashboards/WidgetContracts");

class Widget implements WidgetContracts.IConfigurableWidget {

    private gitRestClient: GitRestClient.GitHttpClient4;
    private webContext: WebContext;
    
    private $title: JQuery<HTMLElement>;
    private $number: JQuery<HTMLElement>;
    private $subtext: JQuery<HTMLElement>;

    constructor() {
        this.gitRestClient = GitRestClient.getClient();
        this.webContext = VSS.getWebContext();
        this.$title = $('h3.title');
        this.$number = $('div.big-count');
        this.$subtext = $('div.content');
    }

    preload(widgetSettings: WidgetContracts.WidgetSettings): IPromise<WidgetContracts.WidgetStatus> {
        return WidgetHelpers.WidgetStatusHelper.Success();
    }

    load(widgetSettings: WidgetContracts.WidgetSettings): IPromise<WidgetContracts.WidgetStatus> {

        this.$title.text(widgetSettings.name);

        const startDate = new Date(), settings = JSON.parse(widgetSettings.customSettings.data);
        const daysToConsider = settings && !isNaN(settings.duration) ? parseInt(settings.duration) : 30;
        startDate.setDate(startDate.getDate() - daysToConsider);

        const searchCriteria: Contracts.GitPullRequestSearchCriteria = {
            creatorId: '',
            includeLinks: false,
            repositoryId: '',
            reviewerId: '',
            sourceRefName: '',
            sourceRepositoryId: '',
            targetRefName: '',
            status: Contracts.PullRequestStatus.Completed
        };

        return this.gitRestClient.getPullRequestsByProject(this.webContext.project.id, searchCriteria, 0)
            .then((requests: Contracts.GitPullRequest[]): IPromise<WidgetContracts.WidgetStatus> => {
                if (requests && requests.length > 0) {

                    let i: number, sum: number = 0;
                    for (let request of requests) {
                        if (request.creationDate < startDate) continue;
                        sum += request.closedDate.getTime() - request.creationDate.getTime();
                    }

                    const labels = this.getTimeSpanDisplayLabels(sum / requests.length);
                    this.$number.text(labels[0]);
                    this.$subtext.text(labels[1]);
                }

                return WidgetHelpers.WidgetStatusHelper.Success();
            }, error => {
                return WidgetHelpers.WidgetStatusHelper.Failure(error);
            });
    }

    reload(newWidgetSettings: WidgetContracts.WidgetSettings): IPromise<WidgetContracts.WidgetStatus> {
        return this.load(newWidgetSettings);
    }

    private getTimeSpanDisplayLabels(time: number) {
        if (!time || time <= 0) return ['N/A', ''];

        let ms = time / 1000, shortLabel = '';

        const seconds = Math.floor(ms % 60);
        ms = ms / 60;
        const minutes = Math.floor(ms % 60);
        ms = ms / 60;
        const hours = Math.floor(ms % 24);
        const days = Math.floor(ms / 24);

        if (days > 0) {
            shortLabel += days + 'd';
        } else if (hours > 0) {
            shortLabel += hours + 'h';
        } else if (minutes > 0) {
            shortLabel += minutes + 'm';
        } else if (seconds > 0) {
            shortLabel += seconds + 's';
        }

        const longLabel = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
        return [shortLabel.trim(), longLabel]
    }
}

export const createWidget = (): WidgetContracts.IConfigurableWidget => {
    WidgetHelpers.IncludeWidgetStyles();
    return new Widget();
}

