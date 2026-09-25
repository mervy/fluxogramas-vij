# Tarefas — Fluxogramas VIJ

Ver [plan.md](plan.md).

## Próximos passos (retomar daqui)

Situação em 25/09/2026: a página já permite editar tudo (processos,
fundamentos, etapas e ligações) e gravar em `data/bundle.js`. O conteúdo
jurídico continua preliminar.

0. **Salvar pelo GitHub Pages** (prioridade — relatado em 25/09/2026)
   - Problema: no Pages o site é só leitura. "Salvar no arquivo" grava o
     `bundle.js` no computador de quem edita, não no site; ao recarregar, o
     Pages entrega o `data/bundle.js` antigo e o rascunho fica só naquele
     navegador. A gravação permanente só funciona abrindo o `index.html` local.
   - Ideia: o botão "Salvar" faz um commit de `data/bundle.js` na branch `dev`
     pela API do GitHub (`PUT /repos/mervy/fluxogramas-vij/contents/data/bundle.js`,
     com o `sha` atual); o Pages republica em ~1 min para todos. Sem servidor.
   - Token fine-grained só com Contents: read/write neste repositório, colado
     uma vez na página e guardado só no navegador de quem edita (leitores não
     precisam). Tratar conflito (sha mudou), token inválido e aviso de
     "publicando…". Manter o salvar em arquivo local como alternativa.
   - [ ] Confirmar com o usuário se o sintoma foi esse (sumiu ao recarregar)
   - [ ] Implementar e testar
1. **Definições com a Vara**
   - [ ] Onde a página vai rodar: pasta compartilhada/local (`file://`) ou
     intranet. Em `http://` sem HTTPS o navegador não deixa gravar direto no
     arquivo; a página baixa uma cópia.
   - [ ] Quem edita e como a versão oficial é mantida (um responsável faz o
     commit do `data/bundle.js`?). Se várias pessoas precisarem editar ao
     mesmo tempo pela rede, avaliar um servidor simples.
   - [ ] Manter ou não nome e matrícula no rodapé (o repositório é público).
2. **Revisão do conteúdo atual**
   - [ ] DPF: conferir o ramo novo da suspensão (art. 157 → criança confiada
     a pessoa idônea) e a posição do estudo social, que o art. 157, §1º manda
     determinar junto com a citação.
   - [ ] Decisões com uma só saída ("Sentença", "Homologação da renúncia"):
     dar ramos ou trocar o tipo para "Etapa".
   - [ ] Preencher "revisado por / em" de cada fundamento depois da revisão.
3. **Conteúdo novo** (pela própria página: ✎ Editar fluxos)
   - [ ] DPF: um fundamento por hipótese do art. 1.638 CC (I a V e parágrafo
     único), começando como cópia do rito geral.
   - [ ] Adoção; guarda/tutela; medidas protetivas; apuração de ato
     infracional.
4. **Melhorias na página**
   - [ ] Link direto ao artigo na página do Planalto (verificar as âncoras).
   - [ ] Link direto por fluxo (`?processo=dpf&fundamento=...`).
   - [ ] Tema escuro.
   - [ ] Guardar no repositório o teste automatizado (Playwright) usado para
     validar a edição.
   - [ ] Guia curto, com imagens, para quem vai editar sem programar.

## Fase 0 — Definições
- [ ] Levantar fluxos já existentes no trabalho (documentos, planilhas, anotações)
- [ ] Definir onde a página roda (intranet / internet / local)
- [ ] Listar tipos de processo e fundamentos do primeiro ciclo
- [x] `git init` + `.gitignore`

## Fase 1 — Estrutura
- [x] `index.html` com seletores (processo → fundamento) e área do diagrama
- [x] Catálogo em `data/bundle.js`
- [x] `assets/app.js`: carregar catálogo, popular seletores em cascata
- [x] Converter JSON do fluxo → texto Mermaid e renderizar
- [x] Decidir `fetch` + servidor local vs. `bundle.js` (compatível com `file://`)
- [ ] Validação do JSON (etapas referenciadas em `ligacoes` existem)

## Fase 2 — Fluxo DPF
- [x] Rito geral da DPF (ECA arts. 155–163) em `data/bundle.js`
- [ ] Variações por hipótese do art. 1.638 CC (I a V e parágrafo único)
- [ ] Conferir redação vigente dos artigos citados
- [ ] Registrar fontes em cada arquivo

## Fase 3 — Interface
- [x] Painel de detalhes ao clicar na etapa (artigo, prazo, responsável, obs.)
- [x] Legenda das formas/cores
- [x] CSS de impressão (A4, sem seletores)
- [x] Exportar SVG
- [x] Layout responsivo (celular)
- [ ] Tema escuro
- [ ] Link direto por fluxo (`?processo=dpf&fundamento=art1638-ii`)

## Fase 3b — Edição na página
- [x] Modo de edição: criar/renomear/excluir processos e fundamentos
- [x] Cards das etapas: arrastar, ↑ ↓, inserir, editar e excluir
- [x] Ligações com rótulo (ramos das decisões) e "encerra aqui"
- [x] Desfazer, rascunho no navegador e aviso de alterações não gravadas
- [x] Salvar em `data/bundle.js` (Chrome/Edge) ou baixar cópia; abrir arquivo
- [x] Links das leis (Planalto) nos artigos e na legislação citada
- [ ] Link direto ao artigo (âncora na página do Planalto), se viável

## Fase 4 — Validação
- [ ] Revisão jurídica com a equipe da Vara
- [ ] Preencher `revisado_por` / `revisado_em` nos JSON
- [x] Aviso na página: material de apoio, não substitui a lei

## Fase 5 — Expansão
- [ ] Adoção
- [ ] Guarda / tutela
- [ ] Medidas protetivas / acolhimento
- [ ] Apuração de ato infracional

## Fase 6 — Publicação
- [ ] Escolher hospedagem e publicar
- [ ] Instruções de como adicionar/editar um fluxo (para não programadores)
