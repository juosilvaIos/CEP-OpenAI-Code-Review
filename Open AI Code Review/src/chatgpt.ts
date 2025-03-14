import tl = require('azure-pipelines-task-lib/task');
import { encode } from 'gpt-tokenizer';
import OpenAI from "openai";

export class ChatGPT {
    private readonly systemMessage: string = '';

    constructor(private _openAi: OpenAI, checkForBugs: boolean = false, checkForPerformance: boolean = false, checkForBestPractices: boolean = false, additionalPrompts: string[] = []) {
        this.systemMessage =
            `${additionalPrompts.length > 0 ? additionalPrompts.map(str => `- ${str}`).join('\n') : null}
        ${checkForBugs ? '- Se existem bugs, destaque-os.' : null}
        ${checkForPerformance ? '- Se houver grandes problemas de desempenho, destaque-os.' : null}
        ${checkForBestPractices ? '- Forneça detalhes sobre o uso omitido das melhores práticas.' : null} `
    }

    public async PerformCodeReview(diff: string, fileName: string): Promise<string> {

        let model = tl.getInput('ai_model', true) as | (string & {})
            | 'gpt-4o-mini'
            | 'o3-mini'
            | 'o1-mini'
            | 'gpt-4o'
            | 'gpt-3.5-turbo'
            | 'gpt-4-turbo'
            | 'gpt-4'
            | 'o1';

        let maxTokens = parseInt(tl.getInput('ai_model_MaxTokens', true) as string)
        let temperature = parseFloat(tl.getInput('ai_model_Temp', true) as string)
        let topP = parseFloat(tl.getInput('ai_model_TopP', true) as string)

        if (!this.doesMessageExceedTokenLimit(diff + this.systemMessage, maxTokens)) {
            maxTokens = maxTokens - (this.systemMessage).length
            let openAi
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
            } else {
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
                return response[0].message.content!;
            }
        }

        tl.warning(`Unable to process diff for file ${fileName} as it exceeds token limits.`)
        return '';
    }

    private doesMessageExceedTokenLimit(message: string, tokenLimit: number): boolean {
        let tokens = encode(message);
        return tokens.length > tokenLimit;
    }

}