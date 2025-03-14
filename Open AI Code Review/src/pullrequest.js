"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PullRequest = void 0;
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const https_1 = require("https");
const node_fetch_1 = __importDefault(require("node-fetch"));
class PullRequest {
    _httpsAgent;
    _collectionUri = tl.getVariable('System.TeamFoundationCollectionUri');
    _teamProjectId = tl.getVariable('System.TeamProjectId');
    _repositoryName = tl.getVariable('Build.Repository.Name');
    _pullRequestId = tl.getVariable('System.PullRequest.PullRequestId');
    constructor() {
        this._httpsAgent = new https_1.Agent({
            rejectUnauthorized: false
        });
    }
    async AddComment(fileName, comment) {
        console.info(`>==> Comment added to ${fileName}`);
        if (!fileName.startsWith('/')) {
            fileName = `/${fileName}`;
        }
        let body = {
            comments: [
                {
                    content: comment,
                    commentType: 2
                }
            ],
            status: 1,
            threadContext: {
                filePath: fileName,
            },
            pullRequestThreadContext: {
                changeTrackingId: 1,
                iterationContext: {
                    firstComparingIteration: 1,
                    secondComparingIteration: 2
                }
            }
        };
        let endpoint = `${this._collectionUri}${this._teamProjectId}/_apis/git/repositories/${this._repositoryName}/pullRequests/${this._pullRequestId}/threads?api-version=7.0`;
        var response = await (0, node_fetch_1.default)(endpoint, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tl.getVariable('SYSTEM.ACCESSTOKEN')}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            agent: this._httpsAgent
        });
        if (response.ok == false) {
            if (response.status == 401) {
                tl.setResult(tl.TaskResult.Failed, "The Build Service must have 'Contribute to pull requests' access to the repository. See https://stackoverflow.com/a/57985733 for more information");
            }
            tl.warning(response.statusText);
        }
        return response.ok;
    }
    async DeleteComment(thread, comment) {
        let removeCommentUrl = `${this._collectionUri}${this._teamProjectId}/_apis/git/repositories/${this._repositoryName}/pullRequests/${this._pullRequestId}/threads/${thread.id}/comments/${comment.id}?api-version=5.1`;
        let response = await (0, node_fetch_1.default)(removeCommentUrl, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tl.getVariable('System.AccessToken')}`, 'Content-Type': 'application/json' },
            agent: this._httpsAgent
        });
        if (response.ok == false) {
            tl.warning(`Failed to delete comment from url ${removeCommentUrl} the response was ${response.statusText}`);
        }
        return response.ok;
    }
    async DeleteComments() {
        let collectionName = this._collectionUri.replace('https://', '').replace('http://', '').split('/')[1];
        let buildServiceName = `${tl.getVariable('SYSTEM.TEAMPROJECT')} Build Service (${collectionName})`;
        let threads = await this.GetThreads();
        for (let thread of threads) {
            let comments = await this.GetComments(thread);
            for (let comment of comments.value.filter((comment) => comment.author.displayName === buildServiceName)) {
                await this.DeleteComment(thread, comment);
            }
        }
    }
    async GetThreads() {
        let threadsEndpoint = `${this._collectionUri}${this._teamProjectId}/_apis/git/repositories/${this._repositoryName}/pullRequests/${this._pullRequestId}/threads?api-version=5.1`;
        let threadsResponse = await (0, node_fetch_1.default)(threadsEndpoint, {
            headers: { 'Authorization': `Bearer ${tl.getVariable('System.AccessToken')}`, 'Content-Type': 'application/json' },
            agent: this._httpsAgent
        });
        if (threadsResponse.ok == false) {
            tl.warning(`Failed to retrieve threads from url ${threadsEndpoint} the response was ${threadsResponse.statusText}`);
        }
        let threads = await threadsResponse.json();
        return threads.value.filter((thread) => thread.threadContext !== null);
    }
    async GetComments(thread) {
        let commentsEndpoint = `${this._collectionUri}${this._teamProjectId}/_apis/git/repositories/${this._repositoryName}/pullRequests/${this._pullRequestId}/threads/${thread.id}/comments?api-version=5.1`;
        let commentsResponse = await (0, node_fetch_1.default)(commentsEndpoint, {
            headers: { 'Authorization': `Bearer ${tl.getVariable('System.AccessToken')}`, 'Content-Type': 'application/json' },
            agent: this._httpsAgent
        });
        if (commentsResponse.ok == false) {
            tl.warning(`Failed to retrieve comments from url ${commentsEndpoint} the response was ${commentsResponse.statusText}`);
        }
        return await commentsResponse.json();
    }
}
exports.PullRequest = PullRequest;
