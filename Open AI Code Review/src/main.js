"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Main = void 0;
const tl = require("azure-pipelines-task-lib/task");
const openai_1 = require("openai");
const chatgpt_1 = require("./chatgpt");
const repository_1 = require("./repository");
const pullrequest_1 = require("./pullrequest");
class Main {
    static _chatGpt;
    static _repository;
    static _pullRequest;
    static async Main() {
        if (tl.getVariable('Build.Reason') !== 'PullRequest') {
            tl.setResult(tl.TaskResult.Skipped, "This task must only be used when triggered by a Pull Request.");
            return;
        }
        if (!tl.getVariable('System.AccessToken')) {
            tl.setResult(tl.TaskResult.Failed, "'Allow Scripts to Access OAuth Token' must be enabled. See https://learn.microsoft.com/en-us/azure/devops/pipelines/build/options?view=azure-devops#allow-scripts-to-access-the-oauth-token for more information");
            return;
        }
        const apiKey = tl.getInput('api_key', true);
        const fileExtensions = tl.getInput('file_extensions', false);
        const filesToExclude = tl.getInput('file_excludes', false);
        const additionalPrompts = tl.getInput('additional_prompts', false)?.split(',');
        this._chatGpt = new chatgpt_1.ChatGPT(new openai_1.OpenAI({ apiKey: apiKey }), tl.getBoolInput('bugs', true), tl.getBoolInput('performance', true), tl.getBoolInput('best_practices', true), additionalPrompts);
        this._repository = new repository_1.Repository();
        this._pullRequest = new pullrequest_1.PullRequest();
        await this._pullRequest.DeleteComments();
        let filesToReview = await this._repository.GetChangedFiles(fileExtensions, filesToExclude);
        tl.setProgress(0, 'Performing Code Review');
        const max = tl.getInput('ai_model_MaxTokens');
        const temp = tl.getInput('ai_model_Temp');
        const topP = tl.getInput('ai_model_TopP');
        console.info(`Simulation parameters: MaxTokens: ${max} - Temperature: ${temp} - TopP: ${topP}`);
        console.info(`------------------------------------------------------------------------------`);
        for (let index = 0; index < filesToReview.length; index++) {
            const fileToReview = filesToReview[index];
            let diff = await this._repository.GetDiff(fileToReview);
            let review = await this._chatGpt.PerformCodeReview(diff, fileToReview);
            if (review.indexOf('NO_COMMENT') < 0) {
                // console.info(`Resposta do GPT: ${review}`);
                const reviews = review.split('$$$');
                // console.info(`Splits do GPT: ${reviews}`);
                reviews.forEach(async (reviewSplit) => {
                    if (reviewSplit.length > 0)
                        await this._pullRequest.AddComment(fileToReview, reviewSplit);
                });
            }
            console.info(`Completed review of file ${fileToReview}`);
            tl.setProgress((fileToReview.length / 100) * index, 'Performing Code Review');
        }
        tl.setResult(tl.TaskResult.Succeeded, "Pull Request reviewed.");
    }
}
exports.Main = Main;
Main.Main();
