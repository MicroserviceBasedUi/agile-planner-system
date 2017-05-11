import { Sprint, Release, Story, ReleaseScope, Issue } from '../shared';
import { bindable, inject } from "aurelia-framework";
import { HttpClient, json } from 'aurelia-fetch-client';
import { EventAggregator } from 'aurelia-event-aggregator';
import * as moment from 'moment';
import { ReleaseVelocityChanged } from '../../events/releaseVelocityChanged';

@inject(HttpClient, EventAggregator)
export class PlanningSettings {

    public availableSprints: Array<Sprint> = [];
    private endSprintId: string;
    private startDate: Date = new Date(2017, 0, 1);
    private sprintLength: number = 2;

    constructor(private http: HttpClient, private hub: EventAggregator) {

        const self = this;
        Promise.all([this.loadSprints(), this.loadRemainingStories()])
            .then(values => {
                self.prepareComponent(values[0], values[1]);
            });
    }

    set selectedEndSprint(value) {
        this.endSprintId = value;

        this.publishScope();
    }

    set sprintLengthNumber(value) {
        this.sprintLength = value;
    }

    get sprintLengthNumber () {
        return this.sprintLength;
    }

    get selectedEndSprint() {
        return this.endSprintId;
    }

    set startDateString(value) {
        if (value != undefined) {
            this.startDate = moment(value, 'YYYY-MM-DD').toDate();
        }
    }

    get startDateString() {
        return moment(this.startDate).format('YYYY-MM-DD');
    }

    private loadSprints() : Promise<Array<Sprint>> {
        return this.http.fetch('http://localhost:8000/api/backlog/sprints')
            .then(response => <Promise<Array<Sprint>>>response.json())
    }

    private loadRemainingStories() : Promise<Array<Issue>> {
        return this.http.fetch('http://localhost:8000/api/backlog/remaining')
            .then(response => <Promise<Array<Issue>>>response.json())
    }

    private prepareComponent(sprints: Array<Sprint>, remaining: Array<Issue>) {
        this.availableSprints = sprints;
        this.selectedEndSprint = sprints[0].name;
    }

    private publishScope(): void {
        if (this.endSprintId != undefined) {

            const settings: ReleaseScope = {
                sprints: this.availableSprints,
                startSprint: this.availableSprints[0],
                endSprint: null
            };

            this.availableSprints.forEach(sprint => {

                if(sprint.name == this.endSprintId) {
                    settings.endSprint = sprint;
                }
            });

            this.hub.publish('ReleaseScopeChanged', settings);
            let data: ReleaseVelocityChanged = {minStoryPoints: 5, meanStoryPoints: 15, maxStoryPoints: 25};
            this.hub.publish('ReleaseVelocityChanged', data);
        }
    }
}
