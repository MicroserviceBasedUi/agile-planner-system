import { Sprint, Release, Story, ReleaseScope, Issue, Velocity } from '../shared';
import { bindable, inject } from "aurelia-framework";
import { HttpClient, json } from 'aurelia-fetch-client';
import { EventAggregator } from 'aurelia-event-aggregator';
import * as moment from 'moment';
import { ReleaseVelocityChanged } from '../../events/releaseVelocityChanged';
import { VelocityEnginge } from './velocity-engine';

@inject(HttpClient, EventAggregator, VelocityEnginge)
export class PlanningSettings {

    public availableSprints: Array<Sprint> = [];
    private originalSprints: Array<Sprint> = [];
    private endSprintId: string;
    private startDate: Date = new Date(2017, 0, 1);
    private sprintLength: number = 2;

    private velocity: Velocity;

    private isInitialized = false;

    constructor(private http: HttpClient, private hub: EventAggregator, private velocityEnginge: VelocityEnginge) {
        Promise.all([this.loadSprints(), this.loadRemainingStories()])
            .then(values => {
                this.prepareComponent(values[0], values[1]);
            });
    }

    set selectedEndSprint(value) {
        if (!this.isInitialized) {
            return;
        }

        this.endSprintId = value;
        this.publishScope();
    }

    set sprintLengthNumber(value) {
        this.sprintLength = value;
    }

    get sprintLengthNumber() {
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

    private loadSprints(): Promise<Array<Sprint>> {
        return this.http.fetch('http://localhost:8000/api/backlog/sprints')
            .then(response => <Promise<Array<Sprint>>>response.json())
    }

    private loadRemainingStories(): Promise<Array<Issue>> {
        return this.http.fetch('http://localhost:8000/api/backlog/remaining')
            .then(response => <Promise<Array<Issue>>>response.json())
    }

    private prepareComponent(sprints: Array<Sprint>, remaining: Array<Issue>) {
        this.originalSprints = sprints;

        const completedSprints = this.originalSprints.filter(s => Date.parse(s.completedAt) < Date.now());
        this.velocity = this.velocityEnginge.CalculateVelocity(completedSprints);

        this.availableSprints = PlanningSettings.CalculateAvailableSprints(
            sprints,
            remaining,
            this.startDate,
            this.sprintLength,
            this.velocity.min);

        this.selectedEndSprint = this.availableSprints[0].name;

        this.isInitialized = true;
    }

    private static CalculateAvailableSprints(sprints: Array<Sprint>, remaining: Array<Issue>, startDate: Date, sprintLength: number, minVelocity: number) : Array<Sprint> {
        const today = moment();
        let remainingStoryPoints = 0;
        remaining.forEach(i => remainingStoryPoints += i.storyPoints);

        const remainingSprintAmount = Math.ceil(remainingStoryPoints / minVelocity);
        const completedSprintAmount = Math.floor(today.diff(moment(startDate), 'week') / sprintLength);

        const availableSprints: Array<Sprint> = [];
        for(let i = 0; i < completedSprintAmount + remainingSprintAmount; i++) {
            const startedAt = moment(startDate).add('weeks', sprintLength * i);
            const completedAt = startedAt.add('weeks', sprintLength);
            let stories: Array<Story> = [];

            if(i < sprints.length) {
                stories = sprints[i].stories;
            }

            const sprint: Sprint = {
                name: `Sprint ${i + 1}`,
                startedAt: startedAt.toString(),
                completedAt: completedAt.toString(),
                stories: stories
            }

            availableSprints.push(sprint);
        }

        return availableSprints;
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
