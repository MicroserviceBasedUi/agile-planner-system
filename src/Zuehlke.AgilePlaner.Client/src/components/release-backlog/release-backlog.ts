import { bindable, inject } from "aurelia-framework";
import { HttpClient } from 'aurelia-fetch-client';
import { EventAggregator } from 'aurelia-event-aggregator';
import { ReleaseVelocityChanged } from '../../events/releaseVelocityChanged';

@inject(HttpClient, EventAggregator, 'backlogApiRoot')
export class ReleaseBacklog {
    pbis: Array<Issue>;

    private minStoryPoints: number = 5;
    private meanStoryPoints: number = 18;
    private maxStoryPoints: number;

    constructor(private http: HttpClient, private evenAggregator: EventAggregator, backlogApiRoot: string) {
        this.http.configure(config => {
            config
                .useStandardConfiguration()
                .withBaseUrl(backlogApiRoot);
        });
        this.evenAggregator.subscribe(ReleaseVelocityChanged, this.eventReceived);
    }

    eventReceived(event: ReleaseVelocityChanged): void {

    }

    async moveUp(pbi: Issue): Promise<void> {
        const index = this.pbis.findIndex(item => pbi.id === item.id);

        if (index === 0) return;

        // POST it to the backend
        const before = this.pbis[index - 1];
        console.log(`PBI ${pbi.id} moved up before PBI ${before.id}`);
    }

    async created(): Promise<void> {
        this.pbis = await (await this.http.fetch('backlog/remaining')).json();

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
    };
}

interface Issue {
    id: string;
    summary: string;
    storyPoints?: number;
    color: string;
}
