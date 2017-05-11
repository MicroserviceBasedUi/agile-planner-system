import { bindable, inject } from "aurelia-framework";
import { HttpClient } from 'aurelia-fetch-client';

@inject(HttpClient, 'backlogApiRoot')
export class ReleaseBacklog {
    pbis: Array<Issue>;

    constructor(private http: HttpClient, backlogApiRoot: string) {
        this.http.configure(config => {
            config
                .useStandardConfiguration()
                .withBaseUrl(backlogApiRoot);
        });
    }

    async created(): Promise<void> {
        let response = await (await this.http.fetch('backlog/remaining')).json();
        this.pbis = this.sortIssue(response.issues);
    };

    sortIssue(issues: Array<Issue>): Array<Issue> {
        return issues.sort((a, b) => {
            if (a.key < b.key) {
                return -1;
            }
            if (a.key > b.key) {
                return 1;
            }

            return 0;
        });
    }
}


interface StatusCategory {
    self: string;
    id: number;
    key: string;
    colorName: string;
    name: string;
}

interface Status {
    self: string;
    description: string;
    iconUrl: string;
    name: string;
    id: string;
    statusCategory: StatusCategory;
}

interface Fields {
    summary: string;
    customfield_10006: string[];
    status: Status;
    customfield_10004: number;
}

interface Issue {
    expand: string;
    id: string;
    self: string;
    key: string;
    fields: Fields;
}

interface RootObject {
    expand: string;
    startAt: number;
    maxResults: number;
    total: number;
    issues: Issue[];
}
