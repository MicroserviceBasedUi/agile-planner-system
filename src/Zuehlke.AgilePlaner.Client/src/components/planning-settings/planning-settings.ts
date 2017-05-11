import { Sprint, Release, Story } from '../shared';
import { bindable, inject } from "aurelia-framework";
import { HttpClient, json } from 'aurelia-fetch-client';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(HttpClient, EventAggregator)
export class PlanningSettings {

    public availableSprints: Array<Sprint> = [];
    private startSprintId: string;
    private endSprintId: string;

    constructor(private http: HttpClient, private hub: EventAggregator) {

        const self = this;
        this.http.fetch('http://localhost:8000/api/backlog/sprints')
            .then(response => <Promise<Array<Sprint>>>response.json())
            .then(sprints => {
                self.availableSprints = sprints;
                self.startSprintId = sprints[0].name;
                self.endSprintId = sprints[3].name;
            });
    }

    set selectedStartSprint(value) {
        this.startSprintId = value;
        this.hub.publish('ReleaseScopeChanged', {})
    }

    get selectedStartSprint() {
        return this.startSprintId;
    }

    set selectedEndSprint(value) {
        this.endSprintId = value;
    }

    get selectedEndSprint() {
        return this.endSprintId;
    }
}
