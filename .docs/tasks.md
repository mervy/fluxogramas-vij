# Tarefas — Fluxogramas VIJ

Ver [plan.md](plan.md).

## Fase 0 — Definições
- [ ] Levantar fluxos já existentes no trabalho (documentos, planilhas, anotações)
- [ ] Definir onde a página roda (intranet / internet / local)
- [ ] Listar tipos de processo e fundamentos do primeiro ciclo
- [ ] `git init` + `.gitignore`

## Fase 1 — Estrutura
- [ ] `index.html` com seletores (processo → fundamento) e área do diagrama
- [ ] `data/catalogo.json`
- [ ] `assets/app.js`: carregar catálogo, popular seletores em cascata
- [ ] Converter JSON do fluxo → texto Mermaid e renderizar
- [ ] Decidir `fetch` + servidor local vs. `bundle.js` (compatível com `file://`)
- [ ] Validação do JSON (etapas referenciadas em `ligacoes` existem)

## Fase 2 — Fluxo DPF
- [ ] `data/dpf/rito-geral.json` (ECA arts. 155–163)
- [ ] Variações por hipótese do art. 1.638 CC (I a V e parágrafo único)
- [ ] Conferir redação vigente dos artigos citados
- [ ] Registrar fontes em cada arquivo

## Fase 3 — Interface
- [ ] Painel de detalhes ao clicar na etapa (artigo, prazo, responsável, obs.)
- [ ] Legenda das formas/cores
- [ ] CSS de impressão (A4, sem seletores)
- [ ] Exportar SVG
- [ ] Layout responsivo (celular) e tema claro/escuro
- [ ] Link direto por fluxo (`?processo=dpf&fundamento=art1638-ii`)

## Fase 4 — Validação
- [ ] Revisão jurídica com a equipe da Vara
- [ ] Preencher `revisado_por` / `revisado_em` nos JSON
- [ ] Aviso na página: material de apoio, não substitui a lei

## Fase 5 — Expansão
- [ ] Adoção
- [ ] Guarda / tutela
- [ ] Medidas protetivas / acolhimento
- [ ] Apuração de ato infracional

## Fase 6 — Publicação
- [ ] Escolher hospedagem e publicar
- [ ] Instruções de como adicionar/editar um fluxo (para não programadores)
