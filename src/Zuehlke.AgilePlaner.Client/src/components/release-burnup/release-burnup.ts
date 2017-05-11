import { bindable, inject } from "aurelia-framework";
import { TaskQueue } from "aurelia-task-queue";
import $ from "jquery";
import { chart, Options, SeriesOptions } from 'highcharts';
import 'highcharts';
import { HttpClient, json } from 'aurelia-fetch-client';

interface Release {
    name: string;
    releaseDate: string,
    startDate: string
}

interface Sprint {
    name: string;
    startedAt: string,
    completedAt: string,
    stories: Array<Story>
}

interface Story {
    name: string;
    storyPoints: number,
    status: string,
    priority: number;
}

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
    release: Release;
}

@inject(Element, TaskQueue, HttpClient)
export class ReleaseBurnup {
    constructor(private element: Element, private taskQueue: TaskQueue, private http: HttpClient) {

        const settings: Options = {

            chart: {
                type: 'line',
                // Edit chart spacing
                spacingBottom: 15,
                spacingTop: 10,
                spacingLeft: 10,
                marginLeft: 30,
                spacingRight: 10,

                // Explicitly tell the width and height of a chart
                width: 600,
                height: 400
            },
            title: {
                text: 'Release Burnup'
            },
            xAxis: {
                type: 'datetime',
                labels: {
                    format: '{value:%Y-%m-%d}'
                },
                plotLines: [{
                    color: 'red', // Color value
                    dashStyle: 'longdash', // Style of the plot line. Default to solid
                    value: Date.UTC(2017, 4, 8), // Value of where the line will appear
                    width: 2 // Width of the line
                }]
            },
            yAxis: {
                title: {
                    text: 'Story Points'
                },
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },

                    enableMouseTracking: false
                }
            },
            legend: {
                itemDistance: 80,
            },
            series: [{
                name: 'Minimum',
                data: [[Date.UTC(2017, 4, 1), 5], [Date.UTC(2017, 4, 10), 10], [Date.UTC(2017, 4, 20), 15]]
            },
            {
                name: 'Average',
                data: [[Date.UTC(2017, 4, 1), 10], [Date.UTC(2017, 4, 10), 20], [Date.UTC(2017, 4, 20), 30]]
            },
            {
                name: 'Maximum',
                data: [[Date.UTC(2017, 4, 1), 15], [Date.UTC(2017, 4, 10), 30], [Date.UTC(2017, 4, 20), 45]]
            }]
        };

        const self = this;
        //this.taskQueue.queueMicroTask(() => {
        Promise.all([
            self.GetReleases(),
            self.GetSprints(),
            self.GetPlannedStories()
        ])
            .then(values => ReleaseBurnup.GetChartData(values[0], values[1], values[2]))
            .then(data => ReleaseBurnup.createChartOptions(data, settings))
            .then(s => {
                console.log(s.series);
                $(this.element).find('.burnup-container').highcharts(s);
            });
        //});
    }

    private GetReleases(): Promise<Array<Release>> {
        return this.http.fetch('http://localhost:8000/api/backlog/plannedreleases')
            .then(response => <Promise<Array<Release>>>response.json())
    }

    private GetSprints(): Promise<Array<Sprint>> {
        return this.http.fetch('http://localhost:8000/api/backlog/sprints')
            .then(response => <Promise<Array<Sprint>>>response.json());
    }

    private GetPlannedStories(): Promise<Array<Story>> {
        return this.http.fetch('http://localhost:8000/api/backlog/plannedstories')
            .then(response => <Promise<Array<Story>>>response.json());
    }

    private static GetChartData(releases: Array<Release>, sprints: Array<Sprint>, stories: Array<Story>): Promise<ChartData> {
        let minVelocity: number = 0;
        let maxVelocity: number = 0;
        let avgVelocity: number = 0;

        const velocities: Array<number> = [];
        const sprintData: Array<SprintData> = [];

        const now = Date.now();
        const completedSprints = sprints.filter(s => Date.parse(s.completedAt) < now)

        for (let i = 0; i < completedSprints.length; i++) {
            let velocity: number = 0;
            sprints[i].stories.forEach(s => velocity += s.storyPoints);

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

        for (let i = 0; i < sprints.length; i++) {
            const sprint = sprints[i];

            const startDate = Date.parse(sprint.startedAt);
            console.log('start' + startDate);
            const completeDate = Date.parse(sprint.completedAt);
            console.log('complete' + completeDate);

            let minVel = minVelocity;
            let avgVel = avgVelocity;
            let maxVel = maxVelocity;

            if(Date.parse(sprints[i].completedAt) < now) {
                let velocity: number = 0;
                sprints[i].stories.forEach(s => velocity += s.storyPoints);

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
        }

        let data: ChartData = {
            release: releases[0],
            sprints: sprintData
        };

        console.log(data);
        return Promise.resolve<ChartData>(data);
    }

    private static createChartOptions(data: ChartData, settings: Options): Promise<Options> {
        const minLine: Array<any> = [];
        const avgLine: Array<any> = [];
        const maxLine: Array<any> = [];
        console.log(data);

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
        console.log(settings.series);

        // settings.xAxis.plotLines.push({
        //             color: 'red', // Color value
        //             dashStyle: 'longdash', // Style of the plot line. Default to solid
        //             value: data.Release[], // Value of where the line will appear
        //             width: 2 // Width of the line
        //         });

        return Promise.resolve<Options>(settings);
    };
}
