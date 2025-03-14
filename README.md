# Extensão DevOps de revisão de código usando a Open AI

## Créditos ao criador da Extensão
Essa extensão é uma adaptação da versão original criada por Aidan Cole publicada no [Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=AidanCole.oaicr) e disponibilizada no [repositório Git](https://github.com/a1dancole/OpenAI-Code-Review)

## Potencialize suas revisões de código com a Open AI

Bem-vindo à Extensão DevOps 'Open AI Code Review' – seu novo aliado na construção de software! Esta extensão integra perfeitamente os poderosos modelos de linguagem da Open AI ao seu pipeline do Azure DevOps, transformando revisões de código em um processo inteligente e potencialmente eficiente.

### Comece agora!

Melhore seu fluxo de trabalho de desenvolvimento com a 'Open AI Code Review'. Comece a receber insights inteligentes e acionáveis ​​sobre suas alterações de código. Instale a extensão e experimente o que pode ser o futuro das revisões de código!

## Por que escolher a Open AI Code Review?

- **Revisões de código automatizadas:** Diga adeus às inspeções manuais de código! Deixe a Open AI analisar suas alterações de código, detectando bugs, problemas de desempenho e sugerindo melhores práticas.
- **Instalação sem esforço:** Uma instalação simples com apenas um clique a partir do [Azure DevOps Marketplace]([https://marketplace.visualstudio.com/azuredevops](https://marketplace.visualstudio.com/items?itemName=JulioOSilva.JulioSilva)) coloca-a em funcionamento instantaneamente.
- **Insights com tecnologia de IA:** Aproveite os últimos avanços em processamento de linguagem natural para receber comentários perspicazes sobre seus pull requests.
- **Revisões mais rápidas:** Reduza o tempo gasto em revisões de código. Deixe a Open AI cuidar da rotina, permitindo que sua equipe se concentre em trabalho impactante.
- **Configurável e personalizável:** Adapte a extensão às suas necessidades com configurações personalizáveis. Especifique o modelo Open AI, defina exclusões de arquivo e muito mais.

## Pré-requisitos

- [Conta da Azure DevOps](https://dev.azure.com/)
- [Chave API da Open AI](https://platform.openai.com/docs/overview)

## Começando

1. Instale a extensão DevOps do Open AI Code Review do [Azure DevOps Marketplace]([https://marketplace.visualstudio.com/azuredevops](https://marketplace.visualstudio.com/items?itemName=JulioOSilva.JulioSilva)).
2. Adicione a tarefa de revisão de código Open AI ao seu pipeline:

   ```yaml
    trigger:
    tags:
      include:
      - Releases/*
    branches:
      include:
      - CodeReview_LongPromptInPortuguese

    resources:
    - repo: self

    pool:
      name: Jenkins Server

    stages:
    - stage: CR
      jobs:
      - job: Review
        displayName: Code Review
        steps:
          - checkout: self
            persistCredentials: true
          - task: OpenAICodeReviewCepedi@1
            inputs:
              api_key: $(OPENAI_API_KEY)
              ai_model: 'gpt-4o-mini'
              ai_model_MaxTokens: "128000"
              ai_model_Temp: "0.7"
              ai_model_TopP: "1"
              bugs: true
              performance: true
              best_practices: true
              file_extensions: '.cs,.csproj,.sln,.yml,.json,.config,.md,.tsx'
              file_excludes: '.scss,.Designer.cs,MeuDbContextModelSnapshot.cs,Tests.cs,Resources.cs'
              additional_prompts: >
                Contexto: Sua tarefa é atuar como revisor de código de Pull Request para um projeto react utilizando typescript.

                Objetivo: Identificar e comentar apenas sobre erros ou melhorias necessárias no código. Evitar comentários sobre partes do código que já estão corretas.

                Tecnologias: react, typescript.

                Critérios de Revisão:
                Nomenclatura de variáveis inadequada.
                Indentação inconsistente.
                Tratamento de erros inadequado.
                Violações de segurança (ex.: ausência de criptografia, senhas expostas).
                Erros de sintaxe (ex.: aspas duplas não fechadas).
                Duplicidade de código (sugira reutilização).
                Erros lógicos (ex.: variáveis não inicializadas).
                Funções ou métodos sem corpo.
                Lógica incorreta em funções e métodos.

                Diretrizes de Clean Code:
                Mantenha funções e métodos curtos e focados em uma única tarefa.
                Utilize nomes de variáveis e funções descritivos e significativos.
                Evite comentários desnecessários; o código deve ser autoexplicativo.
                Remova código morto ou não utilizado.
                Prefira composição sobre herança.

                Verificação de Clean Architecture:
                Certifique-se de que as camadas da arquitetura estão bem definidas e separadas.
                Verifique se as dependências entre os módulos seguem a direção correta (de fora para dentro).
                Garanta que as interfaces estão sendo utilizadas para abstrair implementações.
                Verifique se os casos de uso estão isolados e não dependem de detalhes de implementação.
                Certifique-se de que os testes unitários cobrem os casos de uso e as regras de negócio.

                Você recebe as alterações de código (diffs) em um formato unidiff

                Formato de Resposta: A resposta deve estar em formato markdown. Se tiver vários comentários, cada comentário, exceto NO_COMMENT deve obrigatoriamente, começar com '$$$ -'. Para cada correção, mostre o exemplo do código modificado sempre que possível. 
                Evite frases genéricas, seja incisivo e direto, com frases curtas, determine o que de fato deve ser feito e em qual linha do código. Responda somente em português brasileiro
                Evite comentários verbais, a menos que seja absolutamente necessário. 
                SUPER IMPORTANTE! para arquivo que não tenha algo relevante a ser corrigido, simplesmente escreva NO_COMMENT. Evite escrever que o pull request está pronto, se não há algo relevante a escrever, escreva apenas NO_COMMENT.`

   
3. Se você ainda não tiver a Build Validation configurada para sua ramificação, adicione-a [Build validation](https://learn.microsoft.com/en-us/azure/devops/repos/git/branch-policies?view=azure-devops&tabs=browser#build-validation) para sua política de branch para acionar a revisão de código quando um pull request for criado.
4. Outras informações de como ativar e usar a extensão nos Pull Requests, estão disponíveis neste [tutorial](https://dev.azure.com/CEPEDI-IOS/CEPEDI/_wiki/wikis/CEPEDI/1384/Configurando-a-revis%C3%A3o-de-c%C3%B3digos-com-a-IA-no-Azure-(codeReview))
5. Observações: a) os modelos 'o1', 'o1-mini' e 'o3-mini' não usam os parâmetros de temperatura e top_p, portanto, não deve-se tentar controlar a precisão dos mesmos usando tais modelos, estes não são considerados nas requições ao GPT.; b) o parâmetro max_tokens está sendo usando para simples validação em relação ao prompt e não em relação ao prompt + arquivo (para cada arquivo), este valor não é enviado ao GPT.


## Como trabalhar em modificações ou novas versões da extensão de revisão de código?
1. Para começar, clone o repositório do azure [Code Review Azure Extension](https://dev.azure.com/CEPEDI-IOS/Assistente%20de%20desenvolvimento/_git/Code%20Review%20Azure%20Extension);
2. Faça as devidas modificações e, antes de publicar a extensão ou nova versão da extensão, altere as versões no arquivos: 'package.json', 'task.json' e 'vss-extension.json'. Pode-se utilizar a mesma versão nos três arquivos;
3. Compile os arquivos: dentro do diretório 'Open AI Code Review/src', use o segunite comando no cmd 'tsc --build' (talvez somente 'tsc --build main.ts' seja suficiente - falta testar);
4. No diretório 'Open AI Code Review', use o seguinte comando para gerar a nova versão ou versão inicial da extensão: 'npx tfx-cli extension create'
5. Se a extensão já estiver instalada, esta DEVE ser desinstalada para que as modificações sejam persisitdas na nova instalação. Para desinstalar a extensão (use a conta azure@cepedi.org.br para fazer a desinstalação) atarvés das [configurações de extensões da organização](https://dev.azure.com/CEPEDI-IOS/_settings/extensions?tab=installed)
6. Para atualizar ou publicar uma extensão, você pode usar a sua conta do azure ou a conta azure@cepedi.org.br e fazer o upload da entensão no [Azure DevOps Marketplace](https://marketplace.visualstudio.com/manage/publishers). Espere alguns minutos até que a extensão seja validada e, após isso, clique nos três pontinhos e em 'view extension', copie o link e para instar com a conta azure@cepedi.org.br;
7. Para instar a extensão (use conta azure@cepedi.org.br) cole o link copiado no passo 6 e clique em instalar. Para conferir se a instalação ocorreu normalmente, pesquise se a extensão aparece nas [configurações de extensões da organização](https://dev.azure.com/CEPEDI-IOS/_settings/extensions?tab=installed)

## Perguntas frequentes

### Q: Quais configurações do agente de trabalho (agent job) são necessárias?

A: Certifique-se de que "Permitir que scripts acessem o token OAuth" esteja habilitado como parte do trabalho do agente. Siga a [documentação](https://learn.microsoft.com/en-us/azure/devops/pipelines/build/options?view=azure-devops#allow-scripts-to-access-the-oauth-token) para mais detalhes.

### Q: Quais permissões são necessárias para Build Administrators?

A: Build Administrators devem receber acesso "Contribuir para solicitações de pull". Verifique [esta resposta do Stack Overflow](https://stackoverflow.com/a/57985733) para obter orientação sobre como configurar permissões.

### Relatórios de bugs

Se você encontrar um bug ou comportamento inesperado, por favor, reporte-o ao time de IA do CEPEDI.

### Solicitações de recursos/ novas características e funcionalidades

Se você tiver ideias para novos recursos ou melhorias, por favor, solicite como tarefa ao time de IA.

## License

Este projeto está licenciado sob a [Licença MIT](LICENSE), seguindo as recomendações do criador da extensão.

Se você gostaria de contribuir para o desenvolvimento desta extensão, siga nossas diretrizes de contribuição.
