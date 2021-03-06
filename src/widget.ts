import WidgetHelpers = require("TFS/Dashboards/WidgetHelpers");
import GitRestClient = require("TFS/VersionControl/GitRestClient");
import Contracts = require("TFS/VersionControl/Contracts");
import WidgetContracts = require("TFS/Dashboards/WidgetContracts");

class Widget implements WidgetContracts.IConfigurableWidget {

    private gitRestClient: GitRestClient.GitHttpClient4;
    private webContext: WebContext;

    private $title: JQuery<HTMLElement>;
    private $number: JQuery<HTMLElement>;
    private $footer: JQuery<HTMLElement>;

    constructor() {
        this.gitRestClient = GitRestClient.getClient();
        this.webContext = VSS.getWebContext();
        this.$title = $('.title');
        this.$number = $('.big-count');
        this.$footer = $('.footer');
    }

    preload(widgetSettings: WidgetContracts.WidgetSettings): IPromise<WidgetContracts.WidgetStatus> {
        return WidgetHelpers.WidgetStatusHelper.Success();
    }

    load(widgetSettings: WidgetContracts.WidgetSettings): IPromise<WidgetContracts.WidgetStatus> {

        this.$title.text(widgetSettings.name);

        const defaultDurationDays = 30
        const defaultPageSize = 1000;
        const defaultMaxPullRequestsToQuery = 500;
        const MaxPullRequestsToQueryLimit = 5000;

        const startDate = new Date(), settings = JSON.parse(widgetSettings.customSettings.data);
        const daysToConsider = settings && !isNaN(settings.duration) ? parseInt(settings.duration) : defaultDurationDays;
        const repository = settings && settings.repository ? settings.repository.trim() : '';

        // we need to cap the number of items we pull from the API
        const maxPullRequestsToQuery = settings && settings.maxPullRequestsToQuery
            && !isNaN(settings.maxPullRequestsToQuery) 
            && parseInt(settings.maxPullRequestsToQuery) > 0
            ? Math.min(parseInt(settings.maxPullRequestsToQuery), MaxPullRequestsToQueryLimit) : defaultMaxPullRequestsToQuery;
        
        // the API seems to return only max 1000 items 
        const pageSize = Math.min(maxPullRequestsToQuery, defaultPageSize);

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

        return (this.getPullRequests(startDate, this.webContext.project.id, repository, maxPullRequestsToQuery, pageSize, searchCriteria))
            .then((pullRequests: Contracts.GitPullRequest[]): IPromise<WidgetContracts.WidgetStatus> => {
                this.processPullRequests(pullRequests);
                return WidgetHelpers.WidgetStatusHelper.Success();
            }, error => {
                return WidgetHelpers.WidgetStatusHelper.Failure(error);
            });
    }

    reload(newWidgetSettings: WidgetContracts.WidgetSettings): IPromise<WidgetContracts.WidgetStatus> {
        return this.load(newWidgetSettings);
    }

    private getPullRequests(startDate: Date, projectId: string, repository: string, maxPullRequestsToQuery: number,
        pageSize: number, searchCriteria: Contracts.GitPullRequestSearchCriteria): Promise<Contracts.GitPullRequest[]> {
        let skip = 0, pullRequests = new Array<Contracts.GitPullRequest>();
        const client = this.gitRestClient;

        return new Promise((resolve, reject) => {
            const fetch = () => {
                console.log(`Fetching: Repo: [${repository || 'N/A'}] Project: [${projectId}] Skip: [${skip}] PageSize: [${pageSize}] `);

                (repository.length > 0
                    ? client.getPullRequests(repository, searchCriteria, projectId, 0, skip, pageSize)
                    : client.getPullRequestsByProject(projectId, searchCriteria, 0, skip, pageSize))
                .then(prs => {
                    if(prs.length > 0) {
                        console.log(`Fetched: Count: ${prs.length} From: ${prs[0].creationDate} To: ${prs[prs.length - 1].creationDate}`);
                    }
                    skip += prs.length;

                    // check if oldest PR creation date is still newer/after the start date
                    if (prs.length >= pageSize && prs[prs.length - 1].creationDate > startDate && skip < maxPullRequestsToQuery) {
                        pullRequests = pullRequests.concat(prs);
                        fetch();
                    } else {
                        pullRequests = pullRequests.concat(prs.filter(pr => pr.creationDate >= startDate));
                        resolve(pullRequests);
                    }
                }, err => reject(err));
            };

            fetch();
        });
    }

    private processPullRequests(pullRequests: Contracts.GitPullRequest[]) {
        let sum: number = 0;
        for (let request of pullRequests) {
            sum += request.closedDate.getTime() - request.creationDate.getTime();
        }

        const labels = this.getTimeSpanDisplayLabels(sum / pullRequests.length);
        this.$number.text(labels[0]);
        this.$footer.text(labels[1]);
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

