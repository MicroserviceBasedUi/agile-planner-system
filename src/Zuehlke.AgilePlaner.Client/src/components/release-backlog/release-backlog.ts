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
        this.pbis = (await response.json()).issues;
    };
}


export interface StatusCategory {
    self: string;
    id: number;
    key: string;
    colorName: string;
    name: string;
}

export interface Status {
    self: string;
    description: string;
    iconUrl: string;
    name: string;
    id: string;
    statusCategory: StatusCategory;
}

export interface Fields {
    summary: string;
    customfield_10006: string[];
    status: Status;
    customfield_10004: number;
}

export interface Issue {
    expand: string;
    id: string;
    self: string;
    key: string;
    fields: Fields;
}

export interface RootObject {
    expand: string;
    startAt: number;
    maxResults: number;
    total: number;
    issues: Issue[];
}



