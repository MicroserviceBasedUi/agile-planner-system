import { bindable, inject, lazy } from "aurelia-framework";
import { HttpClient } from 'aurelia-fetch-client';

// polyfill fetch client conditionally
const fetchPolyfill = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

export class ReleaseBacklog {
    pbis: Array<Issue>;
    http: HttpClient;

    constructor( @lazy(HttpClient) private getHttpClient: () => HttpClient) {
    }

    async created(): Promise<void> {
        // ensure fetch is polyfilled before we create the http client
        await fetchPolyfill;
        const http = this.http = this.getHttpClient();

        http.configure(config => {
            config
                .useStandardConfiguration()
                .withBaseUrl('http://localhost:8000/api/');
        });

        let response = await this.http.fetch('backlog/remaining');
        this.pbis = this.sortIssue((await response.json()).issues);
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
