# fluxogramas-vij

Fluxogramas dos ritos processuais da **Vara da Infância e Juventude** (VIJ).

## A ideia

Página web estática que exibe o fluxograma das etapas de um processo judicial
da VIJ a partir de duas escolhas do usuário:

1. **Tipo de processo** — Acolhimento Institucional, Destituição do Poder
   Familiar, Renúncia do Poder Familiar, entre outros;
2. **Fundamento legal / hipótese** — ex.: art. 1.638 do Código Civil
   (hipóteses de destituição do poder familiar).

O fluxograma é gerado na hora. Cada etapa é clicável e mostra artigo, prazo,
responsável e observações. Há filtros (por texto, responsável e "só etapas com
prazo") e botões para imprimir/exportar em SVG.

## Por que uma página estática?

- Abre em qualquer navegador (inclusive via `file://`), sem instalar nada.
- Hospedável na intranet, no GitHub Pages ou em pasta compartilhada.
- Sem dados de partes — só fluxos genéricos — em linha com a LGPD e o sigilo do
  ECA (art. 143).
- Imprime ou gera PDF pelo próprio navegador.

## Tecnologias

| Parte | Escolha |
|---|---|
| Diagrama | Mermaid.js (cópia local em `assets/vendor/`) |
| Conteúdo | Um arquivo JSON por tipo de processo/fundamento |
| Interface | HTML + CSS + JavaScript puro (sem build, sem framework) |

## Estrutura (planejada)

```
fluxogramas/
├── index.html            # seletores + diagrama + painel de detalhes
├── assets/
│   ├── style.css
│   ├── app.js            # carrega catálogo e JSON, gera o Mermaid
│   └── vendor/
│       └── mermaid.min.js
├── data/
│   ├── catalogo.json     # processo → fundamento → arquivo do fluxo
│   └── ...
└── .docs/                # plano e tarefas
```

## Como rodar

```bash
# opção 1: abrir o index.html direto no navegador
# opção 2: servidor local
python3 -m http.server
```

## Status

Em construção. O conteúdo jurídico é preliminar e deve ser revisado com a equipe
da Vara antes do uso — ver `.docs/plan.md` e `.docs/tasks.md`.
