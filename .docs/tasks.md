# Tarefas — Fluxogramas VIJ

Ver [plan.md](plan.md).

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
