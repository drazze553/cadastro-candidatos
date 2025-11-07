🧑‍💻 Cadastro de Candidatos

Este repositório contém um pequeno aplicativo front-end para cadastro, listagem, edição e exclusão de candidatos, desenvolvido como parte de um teste técnico.
O foco foi demonstrar domínio de **linguagens** e **automação de processos**, com integração a webhooks **n8n** que se comunicam diretamente com uma planilha do **Google Planilhas**.

📁 Estrutura do projeto

Arquivos principais:

- `index.html` — Estrutura base da interface.
Contém o formulário de cadastro, a tabela dinâmica de resultados, o campo de busca e o modal para edição de registros.
- `cadastro_candidatos_app.css` — Estilos e layout responsivo.
Usa um tema escuro com tons suaves e transparências, inspirado em interfaces modernas de dashboards.
- `cadastro_candidatos_app.js` — Lógica principal do app.
Implementa toda a parte de CRUD via Fetch API, integração com os webhooks do n8n, manipulação da tabela, busca em tempo real e exportação CSV.

⚙️ Integração com o n8n + Google Planilhas

O projeto foi conectado a quatro webhooks distintos configurados no n8n, cada um responsável por uma operação:

| Operação              | Método | Descrição                              |
| --------------------- | ------ | -------------------------------------- |
| `listar-candidatos`   | `GET`  | Retorna todos os registros da planilha |
| `cadastro-candidatos` | `POST` | Cria um novo registro                  |
| `editar-candidato`    | `POST` | Atualiza um registro existente         |
| `deletar-candidato`   | `POST` | Remove um registro da planilha         |

Esses webhooks se conectam ao nó Google Planilhas dentro do **n8n**, utilizando as operações nativas de:

- Append Row (para criar)
- Read (para listar)
- Update Row (para editar)
- Delete Rows (para excluir)

Toda a comunicação é feita em JSON via fetch(), com tratamento básico de erros e feedback visual no front-end.

🧠 Lógica do Front-end

O JavaScript foi escrito de forma modular e legível, sem uso de frameworks.
Alguns pontos de destaque:

Carregamento inicial:
Ao abrir o app, é feita uma requisição GET ao webhook listar-candidatos, que retorna todos os dados da planilha.
Os registros são normalizados e renderizados dinamicamente na tabela HTML.

Cadastro de novos candidatos:
O formulário coleta os dados e envia um POST para o webhook de criação.
Após o envio, a lista é recarregada automaticamente.

Edição de registros:
Ao clicar em “Editar”, o app abre um modal centralizado com os dados pré-preenchidos.
As alterações são enviadas via POST para o webhook de atualização.

Exclusão:
Cada registro possui um botão “Excluir” que envia o ID do candidato para o webhook responsável por deletar a linha na planilha.

Busca e exportação:
A busca é feita em tempo real, filtrando por nome, e-mail ou área.
A exportação gera um arquivo .csv direto no navegador.

🧩 Tecnologias utilizadas

- `HTML5` – Estrutura semântica, acessível e limpa.
- `CSS3` – Layout responsivo com grid, flexbox e tema escuro personalizado.
- `JavaScript` (Vanilla) – Manipulação de DOM, eventos e requisições HTTP via fetch().
- `n8n` – Orquestração de fluxos e automação.
- `Google Planilhas` – Armazenamento de dados em nuvem.

Observações de segurança:
Este projeto é um teste prático; por opção, algumas opções de segurança não foram tratadas pois o projeto é apenas para exibição.

Criado por: Adriel Santos Oliveira 
adriel.oliveira553@outlook.com
