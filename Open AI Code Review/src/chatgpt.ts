import tl = require('azure-pipelines-task-lib/task');
import { encode } from 'gpt-tokenizer';
import OpenAI from "openai";

export class ChatGPT {
    private readonly systemMessage: string = '';

    constructor(private _openAi: OpenAI, checkForBugs: boolean = false, checkForPerformance: boolean = false, checkForBestPractices: boolean = false, additionalPrompts: string[] = []) {
        this.systemMessage = `Your task is to act as a code reviewer of a Pull Request:
        - Use bullet points if you have multiple comments.
        ${checkForBugs ? '- If there are any bugs, highlight them.' : null}
        ${checkForPerformance ? '- If there are major performance problems, highlight them.' : null}
        ${checkForBestPractices ? '- Provide details on missed use of best-practices.' : null}
        ${additionalPrompts.length > 0 ? additionalPrompts.map(str => `- ${str}`).join('\n') : null}
        - Do not highlight minor issues and nitpicks.
        - Only provide instructions for improvements 
        - If you have no instructions respond with NO_COMMENT only, otherwise provide your instructions.
    
        You are provided with the code changes (diffs) in a unidiff format.
        
        The response should be in markdown format.`
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
        let temperature = parseFloat(tl.getInput('ai_model_Temp', true)  as string)
        let topP = parseFloat(tl.getInput('ai_model_TopP', true)  as string)

        if (!this.doesMessageExceedTokenLimit(diff + this.systemMessage, maxTokens)) {
            let openAi = await this._openAi.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: this.systemMessage
                    },
                    {
                        role: 'user',
                        content: diff
                    }
                ], model: model, max_tokens: maxTokens, temperature: temperature, top_p: topP
            });

            let response = openAi.choices;
            console.info("Tudo do retorno: ");
            console.info(openAi);
            console.info("Somente o choices: ");
            console.info(response);
            
            if (response.length > 0) {
            
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