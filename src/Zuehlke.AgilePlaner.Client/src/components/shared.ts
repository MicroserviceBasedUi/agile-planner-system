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
