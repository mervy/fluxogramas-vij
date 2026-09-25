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
responsável e observações, com link para a lei no site do Planalto. Há filtros
(por texto, responsável e "só etapas com prazo"), que destacam as etapas no
diagrama, e botões para imprimir/exportar em SVG.

## Como editar os fluxos

Clique em **✎ Editar fluxos**:

- **Processos e fundamentos**: botões **+ Novo**, **✎** e **🗑** ao lado de cada
  seletor. Um fundamento novo pode começar como cópia das etapas do atual.
- **Etapas (cards)**: arraste pela alça **⠿** (ou use ↑ ↓) para mudar a ordem;
  **＋** insere uma etapa depois, **✎** edita e **🗑** exclui. **↶ Desfazer**
  (ou Ctrl+Z) volta a última alteração.
- **Ligações**: uma etapa sem ligação definida segue para a **próxima da
  lista**. Em decisões, escolha "Vai para etapas específicas" e dê um rótulo a
  cada ramo (ex.: sim / não). Também dá para marcar "Encerra aqui".

### Onde os dados ficam salvos

Os dados moram em `data/bundle.js`. Enquanto você edita, as alterações ficam
guardadas **neste navegador** (um aviso amarelo mostra que ainda não foram
gravadas). Para torná-las permanentes, clique em **💾 Salvar no arquivo**:

- **Chrome / Edge**: na primeira vez, escolha o arquivo `data/bundle.js` da
  pasta do projeto para substituí-lo; depois a página grava direto nele.
- **Outros navegadores**: o `bundle.js` é baixado; copie-o para `data/`.

Depois de gravar, faça o commit do `data/bundle.js` para a versão oficial ir
para o repositório. **📂 Abrir arquivo…** carrega um `bundle.js` recebido de
outra pessoa.

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
| Conteúdo | `data/bundle.js` (JSON dentro de um `.js`, para abrir via `file://`) |
| Interface | HTML + CSS + JavaScript puro (sem build, sem framework) |
| Edição | Na própria página; grava no arquivo pela File System Access API |

## Estrutura

```
fluxogramas-vij/
├── index.html            # seletores + diagrama + painel de detalhes
├── assets/
│   ├── style.css
│   ├── app.js            # seletores, edição, Mermaid e gravação dos dados
│   └── vendor/
│       └── mermaid.min.js
├── data/
│   └── bundle.js         # catálogo (processo → fundamento) e fluxos
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
