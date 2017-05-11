import { bindable, inject } from "aurelia-framework";
import { TaskQueue } from "aurelia-task-queue";
import $ from "jquery";
import { chart, Options, SeriesOptions, AxisOptions } from 'highcharts';
import 'highcharts';
import { HttpClient, json } from 'aurelia-fetch-client';
import { Sprint, Release, Story, ReleaseScope, DefaultBurndownChartOptions } from '../shared';
import { EventAggregator } from 'aurelia-event-aggregator';

interface SprintData {
    sprint: string;
    startDate: number;
    completeDate: number;
    minimumVelocity: number;
    averageVelocity: number;
    maximumVelocity: number;
}

interface ChartData {
    sprints: Array<SprintData>;
}

@inject(Element, TaskQueue, HttpClient, EventAggregator)
export class ReleaseBurnup {
    constructor(private element: Element, private taskQueue: TaskQueue, private http: HttpClient, private hub: EventAggregator) {
        this.hub.subscribe('ReleaseScopeChanged', data => this.onReleaseScopeChanged(data));
    }

    private onReleaseScopeChanged(scope: ReleaseScope): void {
        const self = this;

        const data = ReleaseBurnup.GetChartData(scope);
        const options = ReleaseBurnup.createChartOptions(data, scope, DefaultBurndownChartOptions);

        $(this.element).find('.burnup-container').highcharts(options);
    }

    private static GetChartData(scope: ReleaseScope): ChartData {
        let minVelocity: number = 0;
        let maxVelocity: number = 0;
        let avgVelocity: number = 0;

        const velocities: Array<number> = [];
        const sprintData: Array<SprintData> = [];

        const now = Date.now();
        const completedSprints = scope.sprints.filter(s => Date.parse(s.completedAt) < now)

        for (let i = 0; i < completedSprints.length; i++) {
            let velocity: number = 0;
            scope.sprints[i].stories.forEach(s => velocity += s.storyPoints);

            avgVelocity += velocity;

            if (i == 0) {
                minVelocity = velocity;
            }

            if (velocity < minVelocity) {
                minVelocity = velocity;
            }

            if (velocity > maxVelocity) {
                maxVelocity = velocity;
            }
        }

        avgVelocity = Math.round(avgVelocity / completedSprints.length);

        scope.sprints
            .filter(sprint => sprint.startedAt >= scope.startSprint.startedAt)
            .forEach(sprint => {
            const startDate = Date.parse(sprint.startedAt);
            const completeDate = Date.parse(sprint.completedAt);

            let minVel = minVelocity;
            let avgVel = avgVelocity;
            let maxVel = maxVelocity;

            if (Date.parse(sprint.completedAt) < now) {
                let velocity: number = 0;
                sprint.stories.forEach(s => velocity += s.storyPoints);

                minVel = velocity;
                avgVel = velocity;
                maxVel = velocity;
            }

            sprintData.push(
                {
                    sprint: sprint.name,
                    startDate: startDate,
                    completeDate: completeDate,
                    minimumVelocity: minVel,
                    averageVelocity: avgVel,
                    maximumVelocity: maxVel
                }
            )
        });

        let data: ChartData = {
            sprints: sprintData
        };

        return data;
    }

    private static createChartOptions(data: ChartData, scope: ReleaseScope, settings: Options): Options {
        const minLine: Array<any> = [];
        const avgLine: Array<any> = [];
        const maxLine: Array<any> = [];

        let minSp: number = 0;
        let avgSp: number = 0;
        let maxSp: number = 0;
        let currentSprintStart: number = 0;

        minLine.push([data.sprints[0].startDate, 0]);
        avgLine.push([data.sprints[0].startDate, 0]);
        maxLine.push([data.sprints[0].startDate, 0]);

        data.sprints.forEach(s => {
            minSp += s.minimumVelocity;
            const min = [s.completeDate, minSp];
            minLine.push(min);

            avgSp += s.averageVelocity;
            const avg = [s.completeDate, avgSp];
            avgLine.push(avg);

            maxSp += s.maximumVelocity;
            const max = [s.completeDate, maxSp];
            maxLine.push(max);

            if (s.startDate < Date.now()) {
                currentSprintStart = s.startDate;
            }
        });

        settings.series = [];
        settings.series.push(<SeriesOptions>{
            name: 'Minimum',
            data: minLine,
            zoneAxis: 'x',
            zones: [
                {
                    value: currentSprintStart,
                    color: '#929a9f'
                },
                {
                    dashStyle: 'dot',
                    color: '#7fcc7f'
                }
            ]
        });

        settings.series.push(<SeriesOptions>{
            name: 'Average',
            data: avgLine,
            zoneAxis: 'x',
            zones: [
                {
                    value: currentSprintStart,
                    color: '#929a9f'
                },
                {
                    color: '#69caf9'
                }
            ]
        });

        settings.series.push(<SeriesOptions>{
            name: 'Maximum',
            data: maxLine,
            zoneAxis: 'x',
            zones: [
                {
                    value: currentSprintStart,
                    color: '#929a9f'
                },
                {
                    dashStyle: 'dot',
                    color: '#f9c769'
                }
            ]
        });

        (<AxisOptions>settings.xAxis).plotLines = [];
        (<AxisOptions>settings.xAxis).plotLines.push({
                    label: scope.endSprint.name,
                    color: 'red', // Color value
                    dashStyle: 'longdash', // Style of the plot line. Default to solid
                    value: Date.parse(scope.endSprint.completedAt), // Value of where the line will appear
                    width: 2 // Width of the line
                });

        return settings;
    };
}
