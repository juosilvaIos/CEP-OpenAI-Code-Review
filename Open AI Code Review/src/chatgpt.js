"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGPT = void 0;
const tl = require("azure-pipelines-task-lib/task");
const gpt_tokenizer_1 = require("gpt-tokenizer");
class ChatGPT {
    _openAi;
    systemMessage = '';
    constructor(_openAi, checkForBugs = false, checkForPerformance = false, checkForBestPractices = false, additionalPrompts = []) {
        this._openAi = _openAi;
        this.systemMessage =
            `${additionalPrompts.length > 0 ? additionalPrompts.map(str => `- ${str}`).join('\n') : null}
        ${checkForBugs ? '- Se existem bugs, destaque-os.' : null}
        ${checkForPerformance ? '- Se houver grandes problemas de desempenho, destaque-os.' : null}
        ${checkForBestPractices ? '- Forneça detalhes sobre o uso omitido das melhores práticas.' : null} `;
    }
    async PerformCodeReview(diff, fileName) {
        let model = tl.getInput('ai_model', true);
        let maxTokens = parseInt(tl.getInput('ai_model_MaxTokens', true));
        let temperature = parseFloat(tl.getInput('ai_model_Temp', true));
        let topP = parseFloat(tl.getInput('ai_model_TopP', true));
        if (!this.doesMessageExceedTokenLimit(diff + this.systemMessage, maxTokens)) {
            maxTokens = maxTokens - (this.systemMessage).length;
            let openAi;
            if (model == 'o1' || model == 'o1-mini' || model == 'o3-mini') {
                openAi = await this._openAi.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content: this.systemMessage
                        },
                        {
                            role: 'user',
                            content: diff
                        }
                    ], model: model /*esses modelos não trabalham com temperatura e top_p*/
                });
            }
            else {
                openAi = await this._openAi.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content: this.systemMessage
                        },
                        {
                            role: 'user',
                            content: diff
                        }
                    ], model: model, temperature: temperature, top_p: topP
                });
            }
            let response = openAi.choices;
            console.info(`Usage of GPT: prompt_tokens: ${openAi.usage?.prompt_tokens}; completion_tokens: ${openAi.usage?.completion_tokens}; total_tokens: ${openAi.usage?.total_tokens}`);
            if (response.length > 0) {
                // console.info(`Resposta do GPT: ${response[0].message.content!}`);
                return response[0].message.content;
            }
        }
        tl.warning(`Unable to process diff for file ${fileName} as it exceeds token limits.`);
        return '';
    }
    doesMessageExceedTokenLimit(message, tokenLimit) {
        let tokens = (0, gpt_tokenizer_1.encode)(message);
        return tokens.length > tokenLimit;
    }
}
exports.ChatGPT = ChatGPT;
