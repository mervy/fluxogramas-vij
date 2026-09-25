# Plano — Fluxogramas processuais da Vara da Infância e Juventude

## Objetivo

Página web que exibe o fluxograma das etapas de um processo judicial da Vara da
Infância e Juventude a partir de duas escolhas do usuário:

1. **Tipo de processo** (ex.: Destituição do Poder Familiar — DPF);
2. **Fundamento legal / hipótese** (ex.: art. 1.638 CC, inciso II — abandono).

O fluxograma aparece na hora; cada etapa é clicável e mostra artigo, prazo,
responsável e observações.

## Decisões

| Tema | Decisão | Motivo |
|---|---|---|
| Formato | Página web estática (sem backend, sem banco) | Abre em qualquer navegador, hospeda em intranet/GitHub Pages/pasta compartilhada |
| Diagrama | **Mermaid.js** (CDN jsDelivr) | Fluxo descrito em texto; editável por quem não programa |
| Dados | 1 arquivo **JSON** por processo/fundamento | Separa conteúdo de apresentação; novo fluxo = novo arquivo |
| Interface | HTML + CSS + JavaScript puro | Sem build, sem framework; escopo pequeno |
| Exportação | Imprimir/PDF pelo navegador + exportar SVG | Uso em audiência, anexos, treinamento |
| Privacidade | Só fluxos genéricos, **nenhum dado de partes** | LGPD e sigilo do ECA (art. 143) |

## Arquitetura

```
fluxogramas/
├── index.html            # seletores + área do diagrama + painel de detalhes
├── assets/
│   ├── style.css
│   └── app.js            # carrega catálogo, JSON do fluxo, gera Mermaid
├── data/
│   ├── catalogo.json     # lista processos → fundamentos → arquivo do fluxo
│   └── dpf/
│       ├── rito-geral.json
│       ├── art1638-abandono.json
│       └── ...
└── .docs/                # plano e tarefas
```

Obs.: `fetch()` de JSON não funciona abrindo via `file://` em alguns navegadores.
Alternativas: servir com servidor local simples, ou gerar um `data/bundle.js`
com todos os fluxos embutidos (decidir na Fase 1).

## Modelo de dados (rascunho)

```json
{
  "id": "dpf-art1638-ii",
  "processo": "Destituição do Poder Familiar",
  "fundamento": "Art. 1.638, II, CC — abandono",
  "base_legal": ["ECA arts. 155–163", "CC art. 1.638", "ECA arts. 22 e 24"],
  "etapas": [
    { "id": "inicial", "titulo": "Petição inicial", "tipo": "acao",
      "artigo": "ECA art. 155/156", "prazo": null, "responsavel": "MP ou interessado",
      "obs": "" },
    { "id": "liminar", "titulo": "Suspensão liminar do poder familiar?", "tipo": "decisao",
      "artigo": "ECA art. 157" }
  ],
  "ligacoes": [
    { "de": "inicial", "para": "liminar" },
    { "de": "liminar", "para": "citacao", "rotulo": "sim / não" }
  ],
  "fontes": ["Lei 8.069/1990", "Lei 10.406/2002"],
  "revisado_por": "", "revisado_em": ""
}
```

Tipos de etapa → forma no Mermaid: `acao` (retângulo), `decisao` (losango),
`prazo` (arredondado), `fim` (círculo).

## Primeiro fluxo: rito da DPF (ECA arts. 155–163) — a validar

1. Petição inicial (MP ou quem tenha legítimo interesse) — art. 155/156
2. Suspensão liminar ou incidental do poder familiar — art. 157
3. Estudo social/perícia por equipe interprofissional — art. 157, §1º / art. 161, §1º
4. Citação — prazo de 10 dias para resposta — art. 158
5. Sem resposta → vista ao MP (5 dias) → decisão — art. 161
6. Com resposta → vista ao MP → audiência de instrução e julgamento — art. 162
7. Oitiva dos pais, se identificados e localizados — art. 161, §4º
8. Sentença — procedimento em até 120 dias — art. 163
9. Averbação à margem do registro de nascimento — art. 163, parágrafo único
10. Recursos — arts. 198 e 199-A a 199-E (prazo de 10 dias)

> ⚠️ Conteúdo jurídico preliminar, montado a partir da lei. Deve ser conferido
> com a prática da Vara e com a redação vigente dos artigos antes do uso.

## Fases

1. **Estrutura** — esqueleto da página, catálogo, carregamento do JSON, render Mermaid.
2. **Fluxo DPF** — rito geral + variações por hipótese do art. 1.638 CC.
3. **Interface** — painel de detalhes, legenda, impressão, exportar SVG, responsivo.
4. **Validação** — revisão jurídica com servidores/magistrado da Vara.
5. **Expansão** — adoção, guarda, tutela, medidas protetivas, ato infracional.
6. **Publicação** — intranet / GitHub Pages / pasta compartilhada.

## Pendências (respostas do usuário)

- Já existem fluxos do trabalho escritos (documento, planilha, papel)? Se sim,
  transcrever em vez de montar do zero.
- Onde vai rodar: intranet do tribunal, internet pública ou só local?
