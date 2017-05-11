import { Options } from 'highcharts';

export interface Release {
    name: string;
    releaseDate: string,
    startDate: string
}

export interface Sprint {
    name: string;
    startedAt: string,
    completedAt: string,
    stories: Array<Story>
}

export interface Story {
    name: string;
    storyPoints: number,
    status: string,
    priority: number;
}

export interface ReleaseScope {
    sprints: Array<Sprint>
    startSprint: Sprint;
    endSprint: Sprint;
    velocity: Velocity;
}

export interface Velocity {
    min: number;
    max: number;
    average: number;
}

export interface Issue {
    id: string;
    summary: string;
    storyPoints?: number;
    color: string;
}

export const DefaultBurndownChartOptions: Options = {

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
