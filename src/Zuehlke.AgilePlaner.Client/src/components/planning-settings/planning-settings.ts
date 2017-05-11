import { Sprint, Release, Story, ReleaseScope, Velocity } from '../shared';
import { bindable, inject } from "aurelia-framework";
import { HttpClient, json } from 'aurelia-fetch-client';
import { EventAggregator } from 'aurelia-event-aggregator';
import { ReleaseVelocityChanged } from '../../events/releaseVelocityChanged';
import { VelocityEnginge } from './velocity-engine';

@inject(HttpClient, EventAggregator, VelocityEnginge)
export class PlanningSettings {

    public availableSprints: Array<Sprint> = [];
    private endSprintId: string;

    private velocity: Velocity;

    private isInitialized = false;

    constructor(private http: HttpClient, private hub: EventAggregator, private velocityEnginge: VelocityEnginge) {

        this.http.fetch('http://localhost:8000/api/backlog/sprints')
            .then(response => <Promise<Array<Sprint>>>response.json())
            .then(sprints => {
                this.availableSprints = sprints;
                this.selectedEndSprint = sprints[0].name;

                const completedSprints = this.availableSprints.filter(s => Date.parse(s.completedAt) < Date.now());
                this.velocity = this.velocityEnginge.CalculateVelocity(completedSprints);
                this.isInitialized = true;
            });
    }

    set selectedEndSprint(value) {
        if (!this.isInitialized) {
            return;
        }

        this.endSprintId = value;
        this.publishScope();
    }

    get selectedEndSprint() {
        return this.endSprintId;
    }

    private publishScope(): void {
        if (this.endSprintId !== undefined) {

            const settings: ReleaseScope = {
                sprints: this.availableSprints,
                startSprint: this.availableSprints[0],
                endSprint: null,
                velocity: this.velocity
            };

            this.availableSprints.forEach(sprint => {
                if (sprint.name === this.endSprintId) {
                    settings.endSprint = sprint;
                }
            });

            this.hub.publish('ReleaseScopeChanged', settings);
            let data: ReleaseVelocityChanged = { minStoryPoints: 5, meanStoryPoints: 15, maxStoryPoints: 25 };
            this.hub.publish('ReleaseVelocityChanged', data);
        }
    }
}
