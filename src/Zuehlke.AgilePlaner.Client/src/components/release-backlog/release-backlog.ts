import { bindable, inject } from "aurelia-framework";
import { HttpClient, json } from 'aurelia-fetch-client';
import { EventAggregator } from 'aurelia-event-aggregator';
import { ReleaseVelocityChanged } from '../../events/releaseVelocityChanged';
import { Issue } from '../shared';

@inject(HttpClient, EventAggregator, 'backlogApiRoot')
export class ReleaseBacklog {
    pbis: Array<Issue>;

    private minStoryPoints: number = 5;
    private meanStoryPoints: number = 18;
    private maxStoryPoints: number;
    private promisePbis: Promise<Array<Issue>>;

    constructor(private http: HttpClient, private evenAggregator: EventAggregator, backlogApiRoot: string) {
        this.http.configure(config => {
            config
                .useStandardConfiguration()
                .withBaseUrl(backlogApiRoot);
        });

        this.promisePbis = this.fetchPbis().then(fetchedPbis => this.pbis = fetchedPbis);

        this.evenAggregator.subscribe('ReleaseVelocityChanged', e => this.eventReceived(e));
    }

    eventReceived(event: ReleaseVelocityChanged): void {
        this.minStoryPoints = event.minStoryPoints;
        this.maxStoryPoints = event.maxStoryPoints;
        this.meanStoryPoints = event.meanStoryPoints;

        this.promisePbis.then(pbis => {
            this.calculateColors();
        });
    }

    calculateColors(){
        let spCount = 0;

        this.pbis.forEach(pbi => {
                spCount += pbi.storyPoints;
                if (spCount <= this.minStoryPoints) {
                    pbi.color = 'rgba(62, 199, 6, 0.29)';
                } else if (spCount <= this.meanStoryPoints) {
                    pbi.color = 'rgba(38, 38, 228, 0.52)';
                } else {
                    pbi.color = 'rgba(255, 0, 0, 0.25)';
                }
            });
    }

    async moveUp(pbi: Issue): Promise<void> {
        const index = this.pbis.findIndex(item => pbi.id === item.id);

        if (index === 0) return;

        // POST it to the backend
        const before = this.pbis[index - 1];
        await this.http.fetch(`backlog/issue/${pbi.id}/rank`, { method: 'PUT', body: json({ rankBeforeIssue: before.id }) });
        this.pbis = await this.fetchPbis();

        this.calculateColors();

        console.log(`PBI ${pbi.id} moved up before PBI ${before.id}`);
    }

    fetchPbis(): Promise<Array<Issue>> {
        return this.http.fetch('backlog/remaining').then(result => result.json());
    }
}


