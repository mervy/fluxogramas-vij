(function () {
  'use strict';

  var CHAVE_RASCUNHO = 'fluxogramas-vij:rascunho';
  var CHAVE_EDICAO = 'fluxogramas-vij:modo-edicao';
  var LIMITE_HISTORICO = 50;

  // Links das leis citadas nos campos "artigo" (texto compilado no Planalto).
  var LEIS = [
    { padrao: /\bECA\b/, nome: 'ECA — Lei nº 8.069/1990', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8069.htm' },
    { padrao: /\bCC\b|C[óo]digo Civil/, nome: 'Código Civil — Lei nº 10.406/2002', url: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm' },
    { padrao: /13\.509/, nome: 'Lei nº 13.509/2017', url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13509.htm' }
  ];
  var TIPOS = { acao: 'Etapa', decisao: 'Decisão', prazo: 'Prazo', fim: 'Fim' };

  var $ = function (id) { return document.getElementById(id); };
  var selProcesso = $('sel-processo');
  var selFundamento = $('sel-fundamento');
  var selResponsavel = $('filtro-responsavel');
  var inputTexto = $('filtro-texto');
  var checkPrazo = $('filtro-prazo');
  var divDiagrama = $('diagrama');
  var painel = $('painel');
  var listaEtapas = $('lista-etapas');
  var infoFluxo = $('info-fluxo');
  var avisoRascunho = $('aviso-rascunho');
  var btnDesfazer = $('btn-desfazer');
  var btnOrientacao = $('btn-orientacao');
  var btnEdicao = $('btn-edicao');
  var dlgEtapa = $('dlg-etapa');
  var dlgProcesso = $('dlg-processo');
  var dlgFundamento = $('dlg-fundamento');

  // "original" é o que está gravado em data/bundle.js; "dados" é o estado em edição.
  var original = normalizar(clonar(window.FLUXOGRAMAS || {}));
  var dados = clonar(original);
  var historico = [];
  var estado = { processo: null, fluxo: null };
  var fluxoAtual = null;
  var orientacao = 'LR';
  var renderSeq = 0;
  var editando = false;
  var handleArquivo = null;
  var etapaEmEdicao = null;
  var posicaoNova = null;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: { htmlLabels: true, curve: 'basis', padding: 12 }
  });

  // ---------- utilidades ----------

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clonar(o) { return JSON.parse(JSON.stringify(o)); }

  function normalizar(d) {
    d.catalogo = Array.isArray(d.catalogo) ? d.catalogo : [];
    d.fluxos = d.fluxos && typeof d.fluxos === 'object' ? d.fluxos : {};
    d.catalogo.forEach(function (p) { p.fundamentos = p.fundamentos || []; });
    Object.keys(d.fluxos).forEach(function (k) {
      var f = d.fluxos[k];
      f.etapas = f.etapas || [];
      f.ligacoes = f.ligacoes || [];
    });
    return d;
  }

  function slug(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
  }

  function idUnico(base, existentes) {
    var id = base, n = 2;
    while (existentes.indexOf(id) !== -1) id = base + '-' + (n++);
    return id;
  }

  function lerStorage(chave) {
    try { return window.localStorage.getItem(chave); } catch (e) { return null; }
  }
  function gravarStorage(chave, valor) {
    try {
      if (valor == null) window.localStorage.removeItem(chave);
      else window.localStorage.setItem(chave, valor);
    } catch (e) { /* armazenamento indisponível: segue sem rascunho */ }
  }

  var toastTimer = null;
  function avisar(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 5000);
  }

  function linkLei(artigo) {
    for (var i = 0; i < LEIS.length; i++) {
      if (LEIS[i].padrao.test(artigo || '')) return LEIS[i];
    }
    return null;
  }

  function artigoHtml(artigo, classe) {
    var lei = linkLei(artigo);
    if (!lei) return '<span class="' + classe + '">' + esc(artigo) + '</span>';
    return '<a class="' + classe + ' link-lei" href="' + lei.url + '" target="_blank" rel="noopener" title="Abrir ' +
      esc(lei.nome) + ' no Planalto">' + esc(artigo) + ' ↗</a>';
  }

  // ---------- modelo ----------

  // Ligações efetivas: as explícitas + a implícita "segue para a próxima da lista"
  // para etapas sem ligação de saída (exceto tipo "fim" ou marcadas com "encerra").
  function arestas(fluxo) {
    var etapas = fluxo.etapas, ids = {};
    etapas.forEach(function (e) { ids[e.id] = true; });
    var res = [];
    etapas.forEach(function (e, i) {
      var exp = fluxo.ligacoes.filter(function (l) { return l.de === e.id && ids[l.para]; });
      if (exp.length) res = res.concat(exp);
      else if (!e.encerra && e.tipo !== 'fim' && i + 1 < etapas.length) {
        res.push({ de: e.id, para: etapas[i + 1].id, implicita: true });
      }
    });
    return res;
  }

  function acharEtapa(id) {
    return fluxoAtual.etapas.filter(function (e) { return e.id === id; })[0];
  }

  function processoAtual() {
    return dados.catalogo.filter(function (p) { return p.id === estado.processo; })[0] || null;
  }

  function estaAlterado() {
    return JSON.stringify(dados) !== JSON.stringify(original);
  }

  // Toda alteração passa por aqui: guarda o histórico, o rascunho e redesenha.
  function alterar(fn) {
    historico.push(JSON.stringify(dados));
    if (historico.length > LIMITE_HISTORICO) historico.shift();
    fn();
    salvarRascunho();
    atualizarTudo();
  }

  function desfazer() {
    if (!historico.length) return;
    dados = JSON.parse(historico.pop());
    salvarRascunho();
    atualizarTudo();
    avisar('Alteração desfeita.');
  }

  function salvarRascunho() {
    if (estaAlterado()) {
      gravarStorage(CHAVE_RASCUNHO, JSON.stringify({ dados: dados, alterado_em: new Date().toISOString() }));
    } else {
      gravarStorage(CHAVE_RASCUNHO, null);
    }
  }

  function carregarRascunho() {
    var bruto = lerStorage(CHAVE_RASCUNHO);
    if (!bruto) return;
    try {
      var r = JSON.parse(bruto);
      if (r && r.dados && Array.isArray(r.dados.catalogo)) dados = normalizar(r.dados);
    } catch (e) { gravarStorage(CHAVE_RASCUNHO, null); }
  }

  // ---------- seletores e filtros ----------

  function opcao(valor, texto) {
    var o = document.createElement('option');
    o.value = valor;
    o.textContent = texto;
    return o;
  }

  function atualizarTudo() {
    var procs = dados.catalogo;
    if (!processoAtual()) estado.processo = procs.length ? procs[0].id : null;
    var proc = processoAtual();

    selProcesso.innerHTML = '';
    procs.forEach(function (p) { selProcesso.appendChild(opcao(p.id, p.nome)); });
    if (!procs.length) selProcesso.appendChild(opcao('', '— nenhum processo cadastrado —'));
    selProcesso.value = estado.processo || '';

    var funds = proc ? proc.fundamentos : [];
    var existe = funds.some(function (f) { return f.fluxo === estado.fluxo; });
    if (!existe) estado.fluxo = funds.length ? funds[0].fluxo : null;
    selFundamento.innerHTML = '';
    funds.forEach(function (f) { selFundamento.appendChild(opcao(f.fluxo, f.nome)); });
    if (!funds.length) selFundamento.appendChild(opcao('', '— nenhum fundamento —'));
    selFundamento.value = estado.fluxo || '';

    fluxoAtual = estado.fluxo ? dados.fluxos[estado.fluxo] || null : null;

    popularResponsaveis();
    atualizarStatus();
    render();
  }

  function popularResponsaveis() {
    var doFluxo = [], todos = [];
    Object.keys(dados.fluxos).forEach(function (k) {
      dados.fluxos[k].etapas.forEach(function (e) {
        if (e.responsavel && todos.indexOf(e.responsavel) === -1) todos.push(e.responsavel);
        if (dados.fluxos[k] === fluxoAtual && e.responsavel && doFluxo.indexOf(e.responsavel) === -1) doFluxo.push(e.responsavel);
      });
    });
    doFluxo.sort();
    todos.sort();
    var atual = selResponsavel.value;
    selResponsavel.innerHTML = '<option value="">Todos os responsáveis</option>';
    doFluxo.forEach(function (v) { selResponsavel.appendChild(opcao(v, v)); });
    selResponsavel.value = doFluxo.indexOf(atual) !== -1 ? atual : '';

    var dl = $('lista-responsaveis');
    dl.innerHTML = '';
    todos.forEach(function (v) { dl.appendChild(opcao(v, v)); });
  }

  function filtroAtivo() {
    return !!(inputTexto.value.trim() || selResponsavel.value || checkPrazo.checked);
  }

  function combina(e) {
    var texto = inputTexto.value.trim().toLowerCase();
    if (selResponsavel.value && e.responsavel !== selResponsavel.value) return false;
    if (checkPrazo.checked && !e.prazo) return false;
    if (texto) {
      var hay = [e.titulo, e.artigo, e.responsavel, e.obs, e.prazo].join(' ').toLowerCase();
      if (hay.indexOf(texto) === -1) return false;
    }
    return true;
  }

  function atualizarStatus() {
    avisoRascunho.hidden = !estaAlterado();
    btnDesfazer.disabled = !historico.length;
  }

  // ---------- diagrama ----------

  function montarMermaid() {
    var etapas = fluxoAtual.etapas;
    var linhas = ['flowchart ' + orientacao, 'classDef apagado opacity:0.25'];
    var mapa = {}, apagados = [];
    var ativo = filtroAtivo();
    etapas.forEach(function (e, i) {
      var nid = 'n' + i;
      mapa[e.id] = nid;
      var label = esc(e.titulo);
      if (e.artigo) label += '<br/>' + esc(e.artigo);
      if (e.prazo) label += '<br/>Prazo: ' + esc(e.prazo);
      var forma;
      switch (e.tipo) {
        case 'decisao': forma = '{"' + label + '"}'; break;
        case 'prazo': forma = '("' + label + '")'; break;
        case 'fim': forma = '(["' + label + '"])'; break;
        default: forma = '["' + label + '"]';
      }
      linhas.push(nid + forma);
      if (ativo && !combina(e)) apagados.push(nid);
    });
    arestas(fluxoAtual).forEach(function (l) {
      var rot = l.rotulo ? '|' + esc(l.rotulo) + '|' : '';
      linhas.push(mapa[l.de] + ' -->' + rot + ' ' + mapa[l.para]);
    });
    if (apagados.length) linhas.push('class ' + apagados.join(',') + ' apagado');
    etapas.forEach(function (e, i) {
      linhas.push('click n' + i + ' call cliqueEtapa("' + e.id + '")');
    });
    return linhas.join('\n');
  }

  function render() {
    renderInfo();
    renderLista();
    var seq = ++renderSeq;
    if (!fluxoAtual) {
      divDiagrama.innerHTML = '<div class="msg-vazio">Nenhum fluxo selecionado.' +
        (editando ? ' Crie um processo ou fundamento nos botões “+ Novo” acima.' : '') + '</div>';
      return;
    }
    if (!fluxoAtual.etapas.length) {
      divDiagrama.innerHTML = '<div class="msg-vazio">Este fluxo ainda não tem etapas. ' +
        (editando ? 'Clique em “+ Nova etapa”, abaixo.' : 'Clique em “✎ Editar fluxos” para começar.') + '</div>';
      return;
    }
    mermaid.render('grafico-fluxo-' + seq, montarMermaid()).then(function (res) {
      if (seq !== renderSeq) return;
      divDiagrama.innerHTML = res.svg;
      if (typeof res.bindFunctions === 'function') {
        try { res.bindFunctions(divDiagrama); } catch (e) { /* interatividade opcional */ }
      }
    }).catch(function (err) {
      if (seq !== renderSeq) return;
      divDiagrama.innerHTML = '<div class="msg-erro">Não foi possível desenhar o fluxograma: ' +
        esc(err && err.message ? err.message : err) + '</div>';
    });
  }

  function renderInfo() {
    if (!fluxoAtual) { infoFluxo.innerHTML = ''; return; }
    var partes = [];
    if (fluxoAtual.base_legal && fluxoAtual.base_legal.length) {
      partes.push('<strong>Base legal:</strong> ' + fluxoAtual.base_legal.map(function (b) {
        return artigoHtml(b, 'base');
      }).join(' · '));
    }
    if (fluxoAtual.revisado_por || fluxoAtual.revisado_em) {
      var data = fluxoAtual.revisado_em ? fluxoAtual.revisado_em.split('-').reverse().join('/') : '';
      partes.push('<strong>Revisado</strong>' + (fluxoAtual.revisado_por ? ' por ' + esc(fluxoAtual.revisado_por) : '') +
        (data ? ' em ' + esc(data) : ''));
    } else {
      partes.push('<span class="nao-revisado">Ainda não revisado pela equipe da Vara</span>');
    }
    infoFluxo.innerHTML = partes.join(' &nbsp;|&nbsp; ');
  }

  window.cliqueEtapa = function (id) {
    var e = acharEtapa(id);
    if (e) mostrarPainel(e);
  };

  function descreverSaidas(e) {
    var saidas = arestas(fluxoAtual).filter(function (l) { return l.de === e.id; });
    if (!saidas.length) return 'encerra o fluxo';
    return saidas.map(function (l) {
      var alvo = acharEtapa(l.para);
      return (l.rotulo ? l.rotulo + ' → ' : '→ ') + (alvo ? alvo.titulo : l.para);
    }).join(' · ');
  }

  function mostrarPainel(e) {
    painel.hidden = false;
    painel.innerHTML =
      '<h3>' + esc(e.titulo) + '</h3>' +
      '<dl>' +
      '<dt>Tipo</dt><dd>' + esc(TIPOS[e.tipo] || e.tipo || '—') + '</dd>' +
      '<dt>Artigo</dt><dd>' + (e.artigo ? artigoHtml(e.artigo, '') : '—') + '</dd>' +
      '<dt>Prazo</dt><dd>' + esc(e.prazo || '—') + '</dd>' +
      '<dt>Responsável</dt><dd>' + esc(e.responsavel || '—') + '</dd>' +
      '<dt>Observações</dt><dd>' + esc(e.obs || '—') + '</dd>' +
      '<dt>Depois</dt><dd>' + esc(descreverSaidas(e)) + '</dd>' +
      '</dl>' +
      '<div class="painel-botoes">' +
      (editando ? '<button type="button" class="primario" id="editar-painel">✎ Editar</button>' : '') +
      '<button type="button" id="fechar-painel">Fechar</button></div>';
    $('fechar-painel').addEventListener('click', function () { painel.hidden = true; });
    if (editando) {
      $('editar-painel').addEventListener('click', function () {
        painel.hidden = true;
        abrirEdicaoEtapa(e, null);
      });
    }
  }

  // ---------- cards ----------

  function renderLista() {
    listaEtapas.innerHTML = '';
    if (!fluxoAtual) return;
    var ativo = filtroAtivo();
    var etapas = fluxoAtual.etapas;
    var visiveis = etapas.filter(combina);
    $('dica-lista').textContent = ativo
      ? 'Limpe os filtros para mudar a ordem das etapas.'
      : 'Arraste pela alça ⠿ (ou use ↑ ↓) para mudar a ordem. Uma etapa sem ligação definida segue para a próxima da lista.';
    if (!visiveis.length) {
      listaEtapas.innerHTML = '<li class="vazio">' +
        (etapas.length ? 'Nenhuma etapa encontrada com esses filtros.' : 'Nenhuma etapa cadastrada.') + '</li>';
      return;
    }
    visiveis.forEach(function (e) {
      var i = etapas.indexOf(e);
      var li = document.createElement('li');
      li.className = 'item-etapa';
      li.dataset.id = e.id;
      li.innerHTML =
        '<div class="card-topo">' +
          '<span class="alca so-edicao" title="Arraste para mover" aria-hidden="true">⠿</span>' +
          '<span class="num">' + (i + 1) + '</span>' +
          '<button type="button" class="titulo-etapa">' + esc(e.titulo) + '</button>' +
          '<span class="tipo tipo-' + esc(e.tipo) + '">' + esc(TIPOS[e.tipo] || e.tipo) + '</span>' +
          '<span class="card-acoes so-edicao">' +
            '<button type="button" data-acao="subir" title="Mover para cima"' + (ativo || i === 0 ? ' disabled' : '') + '>↑</button>' +
            '<button type="button" data-acao="descer" title="Mover para baixo"' + (ativo || i === etapas.length - 1 ? ' disabled' : '') + '>↓</button>' +
            '<button type="button" data-acao="inserir" title="Inserir etapa depois desta">＋</button>' +
            '<button type="button" data-acao="editar" title="Editar">✎</button>' +
            '<button type="button" data-acao="excluir" title="Excluir" class="perigo">🗑</button>' +
          '</span>' +
        '</div>' +
        '<div class="meta-etapa">' +
          (e.artigo ? artigoHtml(e.artigo, 'tag') : '') +
          (e.prazo ? '<span class="tag prazo">Prazo: ' + esc(e.prazo) + '</span>' : '') +
          (e.responsavel ? '<span class="tag resp">' + esc(e.responsavel) + '</span>' : '') +
        '</div>' +
        '<div class="segue">' + esc(descreverSaidas(e)) + '</div>';
      li.querySelector('.titulo-etapa').addEventListener('click', function () { mostrarPainel(e); });
      li.querySelector('.card-acoes').addEventListener('click', function (ev) {
        var b = ev.target.closest('button');
        if (!b || b.disabled) return;
        var acao = b.dataset.acao;
        if (acao === 'subir') moverEtapa(i, i - 1);
        else if (acao === 'descer') moverEtapa(i, i + 1);
        else if (acao === 'inserir') abrirEdicaoEtapa(null, i + 1);
        else if (acao === 'editar') abrirEdicaoEtapa(e, null);
        else if (acao === 'excluir') excluirEtapa(e);
      });
      li.querySelector('.alca').addEventListener('pointerdown', function (ev) { iniciarArraste(ev, li); });
      listaEtapas.appendChild(li);
    });
  }

  function moverEtapa(de, para) {
    alterar(function () {
      var e = fluxoAtual.etapas.splice(de, 1)[0];
      fluxoAtual.etapas.splice(para, 0, e);
    });
  }

  function reordenar(ids) {
    var atual = fluxoAtual.etapas.map(function (e) { return e.id; }).join('|');
    if (atual === ids.join('|')) return;
    alterar(function () {
      fluxoAtual.etapas = ids.map(acharEtapa);
    });
  }

  // Arrastar com eventos de ponteiro: funciona com mouse e toque, sem biblioteca.
  function iniciarArraste(ev, li) {
    if (ev.button !== 0) return;
    if (filtroAtivo()) { avisar('Limpe os filtros para mudar a ordem das etapas.'); return; }
    ev.preventDefault();
    var r = li.getBoundingClientRect();
    var deslocY = ev.clientY - r.top;
    var ph = document.createElement('li');
    ph.className = 'placeholder';
    ph.style.height = r.height + 'px';
    listaEtapas.insertBefore(ph, li.nextSibling);
    li.classList.add('arrastando');
    li.style.width = r.width + 'px';
    li.style.left = r.left + 'px';
    li.style.top = r.top + 'px';

    function mover(e) {
      li.style.top = (e.clientY - deslocY) + 'px';
      var outros = Array.prototype.slice.call(listaEtapas.children).filter(function (x) {
        return x !== li && x !== ph;
      });
      var alvo = null;
      for (var k = 0; k < outros.length; k++) {
        var rr = outros[k].getBoundingClientRect();
        if (e.clientY < rr.top + rr.height / 2) { alvo = outros[k]; break; }
      }
      listaEtapas.insertBefore(ph, alvo);
      if (e.clientY < 60) window.scrollBy(0, -12);
      else if (e.clientY > window.innerHeight - 60) window.scrollBy(0, 12);
    }
    function soltar() {
      document.removeEventListener('pointermove', mover);
      document.removeEventListener('pointerup', soltar);
      document.removeEventListener('pointercancel', soltar);
      li.classList.remove('arrastando');
      li.style.width = li.style.left = li.style.top = '';
      listaEtapas.replaceChild(li, ph);
      var ids = Array.prototype.map.call(listaEtapas.children, function (x) { return x.dataset.id; });
      reordenar(ids);
    }
    document.addEventListener('pointermove', mover);
    document.addEventListener('pointerup', soltar);
    document.addEventListener('pointercancel', soltar);
  }

  function excluirEtapa(e) {
    if (!window.confirm('Excluir a etapa “' + e.titulo + '”?')) return;
    alterar(function () {
      var saidas = arestas(fluxoAtual).filter(function (l) { return l.de === e.id; });
      var destino = saidas.length === 1 ? saidas[0].para : null;
      var novas = [];
      fluxoAtual.ligacoes.forEach(function (l) {
        if (l.de === e.id) return;
        if (l.para === e.id) {
          // Quem apontava para a etapa excluída passa a apontar para a seguinte dela.
          if (!destino || destino === l.de) return;
          l = { de: l.de, para: destino, rotulo: l.rotulo };
          if (!l.rotulo) delete l.rotulo;
        }
        novas.push(l);
      });
      fluxoAtual.ligacoes = novas;
      fluxoAtual.etapas = fluxoAtual.etapas.filter(function (x) { return x !== e; });
    });
    painel.hidden = true;
    avisar('Etapa excluída. Use “Desfazer” se foi engano.');
  }

  // ---------- diálogos ----------

  function abrirDialogo(dlg, aoConfirmar) {
    dlg.returnValue = '';
    dlg.onclose = function () {
      dlg.onclose = null;
      if (dlg.returnValue === 'ok') aoConfirmar(dlg.querySelector('form').elements);
    };
    dlg.showModal();
  }

  function linhaLigacao(atualId, para, rotulo) {
    var div = document.createElement('div');
    div.className = 'ligacao-linha';
    var sel = document.createElement('select');
    sel.className = 'lig-para';
    sel.appendChild(opcao('', '— escolha a etapa —'));
    fluxoAtual.etapas.forEach(function (x) {
      if (x.id !== atualId) sel.appendChild(opcao(x.id, x.titulo));
    });
    sel.value = para || '';
    var inp = document.createElement('input');
    inp.className = 'lig-rotulo';
    inp.placeholder = 'rótulo (ex.: sim)';
    inp.value = rotulo || '';
    var rem = document.createElement('button');
    rem.type = 'button';
    rem.textContent = '✕';
    rem.title = 'Remover ligação';
    rem.addEventListener('click', function () { div.parentNode.removeChild(div); });
    div.appendChild(sel);
    div.appendChild(inp);
    div.appendChild(rem);
    return div;
  }

  function montarLigacoesEdit(atualId, saidas) {
    var box = $('ligacoes-edit');
    box.innerHTML = '';
    var linhas = document.createElement('div');
    linhas.className = 'lig-linhas';
    (saidas.length ? saidas : [{}, {}]).forEach(function (l) {
      linhas.appendChild(linhaLigacao(atualId, l.para, l.rotulo));
    });
    var add = document.createElement('button');
    add.type = 'button';
    add.textContent = '+ Ligação';
    add.addEventListener('click', function () { linhas.appendChild(linhaLigacao(atualId)); });
    box.appendChild(linhas);
    box.appendChild(add);
  }

  function atualizarModoLigacoes() {
    var f = dlgEtapa.querySelector('form').elements;
    $('ligacoes-edit').hidden = f.segue.value !== 'ligacoes';
  }

  function abrirEdicaoEtapa(e, posicao) {
    if (!fluxoAtual) return;
    etapaEmEdicao = e ? e.id : null;
    posicaoNova = posicao;
    var f = dlgEtapa.querySelector('form').elements;
    $('dlg-etapa-titulo').textContent = e ? 'Editar etapa' : 'Nova etapa';
    f.titulo.value = e ? e.titulo || '' : '';
    f.tipo.value = e ? e.tipo || 'acao' : 'acao';
    f.artigo.value = e ? e.artigo || '' : '';
    f.prazo.value = e ? e.prazo || '' : '';
    f.responsavel.value = e ? e.responsavel || '' : '';
    f.obs.value = e ? e.obs || '' : '';
    var saidas = e ? fluxoAtual.ligacoes.filter(function (l) { return l.de === e.id; }) : [];
    f.segue.value = saidas.length ? 'ligacoes' : (e && (e.encerra || e.tipo === 'fim') ? 'fim' : 'proxima');
    montarLigacoesEdit(etapaEmEdicao, saidas);
    atualizarModoLigacoes();
    var chegam = e ? arestas(fluxoAtual).filter(function (l) { return l.para === e.id; }).map(function (l) {
      var o = acharEtapa(l.de);
      return (o ? o.titulo : l.de) + (l.rotulo ? ' (' + l.rotulo + ')' : '');
    }) : [];
    $('chegam').textContent = chegam.length ? 'Chegam aqui: ' + chegam.join(' · ') : '';
    abrirDialogo(dlgEtapa, salvarEtapa);
  }

  function salvarEtapa(f) {
    var titulo = f.titulo.value.trim();
    if (!titulo) return;
    var modo = f.segue.value;
    var ligs = Array.prototype.map.call($('ligacoes-edit').querySelectorAll('.ligacao-linha'), function (d) {
      return { para: d.querySelector('.lig-para').value, rotulo: d.querySelector('.lig-rotulo').value.trim() };
    }).filter(function (l) { return l.para; });

    alterar(function () {
      var e = etapaEmEdicao ? acharEtapa(etapaEmEdicao) : null;
      if (!e) {
        e = { id: idUnico(slug(titulo), fluxoAtual.etapas.map(function (x) { return x.id; })) };
        var pos = posicaoNova == null ? fluxoAtual.etapas.length : posicaoNova;
        fluxoAtual.etapas.splice(pos, 0, e);
      }
      e.titulo = titulo;
      e.tipo = f.tipo.value;
      e.artigo = f.artigo.value.trim();
      e.prazo = f.prazo.value.trim() || null;
      e.responsavel = f.responsavel.value.trim();
      e.obs = f.obs.value.trim();
      delete e.encerra;
      if (modo === 'fim' && e.tipo !== 'fim') e.encerra = true;
      fluxoAtual.ligacoes = fluxoAtual.ligacoes.filter(function (l) { return l.de !== e.id; });
      if (modo === 'ligacoes') {
        ligs.forEach(function (l) {
          var nova = { de: e.id, para: l.para };
          if (l.rotulo) nova.rotulo = l.rotulo;
          fluxoAtual.ligacoes.push(nova);
        });
      }
    });
    painel.hidden = true;
  }

  // ---------- catálogo: processos e fundamentos ----------

  function idsFluxos() { return Object.keys(dados.fluxos); }

  function novoFluxo(id, processo, fundamento) {
    return {
      id: id, processo: processo, fundamento: fundamento, base_legal: [],
      etapas: [], ligacoes: [], fontes: [], revisado_por: '', revisado_em: ''
    };
  }

  function novoProcesso() {
    var f = dlgProcesso.querySelector('form').elements;
    $('dlg-processo-titulo').textContent = 'Novo processo';
    $('campo-primeiro-fundamento').hidden = false;
    f.nome.value = '';
    f.fundamento.value = 'Rito geral';
    abrirDialogo(dlgProcesso, function (f) {
      var nome = f.nome.value.trim();
      var fund = f.fundamento.value.trim() || 'Rito geral';
      if (!nome) return;
      alterar(function () {
        var pid = idUnico(slug(nome), dados.catalogo.map(function (p) { return p.id; }));
        var fid = idUnico(pid + '-' + slug(fund), idsFluxos());
        dados.catalogo.push({ id: pid, nome: nome, fundamentos: [{ id: slug(fund), nome: fund, fluxo: fid }] });
        dados.fluxos[fid] = novoFluxo(fid, nome, fund);
        estado.processo = pid;
        estado.fluxo = fid;
      });
      avisar('Processo criado. Agora adicione as etapas.');
    });
  }

  function editarProcesso() {
    var proc = processoAtual();
    if (!proc) return;
    var f = dlgProcesso.querySelector('form').elements;
    $('dlg-processo-titulo').textContent = 'Renomear processo';
    $('campo-primeiro-fundamento').hidden = true;
    f.nome.value = proc.nome;
    abrirDialogo(dlgProcesso, function (f) {
      var nome = f.nome.value.trim();
      if (!nome || nome === proc.nome) return;
      alterar(function () {
        var p = processoAtual();
        p.nome = nome;
        p.fundamentos.forEach(function (fu) {
          if (dados.fluxos[fu.fluxo]) dados.fluxos[fu.fluxo].processo = nome;
        });
      });
    });
  }

  function excluirProcesso() {
    var proc = processoAtual();
    if (!proc) return;
    if (!window.confirm('Excluir o processo “' + proc.nome + '” e todos os seus ' +
      proc.fundamentos.length + ' fundamento(s)?')) return;
    alterar(function () {
      var p = processoAtual();
      p.fundamentos.forEach(function (fu) { delete dados.fluxos[fu.fluxo]; });
      dados.catalogo = dados.catalogo.filter(function (x) { return x !== p; });
      estado.processo = null;
      estado.fluxo = null;
    });
    avisar('Processo excluído. Use “Desfazer” se foi engano.');
  }

  function abrirFundamento(existente) {
    var proc = processoAtual();
    if (!proc) { avisar('Crie um processo primeiro.'); return; }
    var fluxo = existente ? fluxoAtual : null;
    var fundItem = existente ? proc.fundamentos.filter(function (x) { return x.fluxo === estado.fluxo; })[0] : null;
    if (existente && !fundItem) return;
    var f = dlgFundamento.querySelector('form').elements;
    $('dlg-fundamento-titulo').textContent = existente ? 'Editar fundamento' : 'Novo fundamento em “' + proc.nome + '”';
    $('campo-copiar').hidden = existente || !fluxoAtual || !fluxoAtual.etapas.length;
    f.nome.value = fundItem ? fundItem.nome : '';
    f.base_legal.value = fluxo && fluxo.base_legal ? fluxo.base_legal.join('\n') : '';
    f.revisado_por.value = fluxo ? fluxo.revisado_por || '' : '';
    f.revisado_em.value = fluxo ? fluxo.revisado_em || '' : '';
    f.copiar.checked = true;
    abrirDialogo(dlgFundamento, function (f) {
      var nome = f.nome.value.trim();
      if (!nome) return;
      var base = f.base_legal.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      alterar(function () {
        var p = processoAtual();
        var alvo;
        if (existente) {
          alvo = dados.fluxos[estado.fluxo];
          p.fundamentos.forEach(function (x) { if (x.fluxo === estado.fluxo) x.nome = nome; });
        } else {
          var fid = idUnico(p.id + '-' + slug(nome), idsFluxos());
          alvo = novoFluxo(fid, p.nome, nome);
          if (!$('campo-copiar').hidden && f.copiar.checked && fluxoAtual) {
            alvo.etapas = clonar(fluxoAtual.etapas);
            alvo.ligacoes = clonar(fluxoAtual.ligacoes);
            alvo.fontes = clonar(fluxoAtual.fontes || []);
          }
          dados.fluxos[fid] = alvo;
          p.fundamentos.push({ id: idUnico(slug(nome), p.fundamentos.map(function (x) { return x.id; })), nome: nome, fluxo: fid });
          estado.fluxo = fid;
        }
        alvo.fundamento = nome;
        alvo.base_legal = base;
        alvo.revisado_por = f.revisado_por.value.trim();
        alvo.revisado_em = f.revisado_em.value;
      });
    });
  }

  function excluirFundamento() {
    var proc = processoAtual();
    var fu = proc && proc.fundamentos.filter(function (x) { return x.fluxo === estado.fluxo; })[0];
    if (!fu) return;
    if (!window.confirm('Excluir o fundamento “' + fu.nome + '” e o seu fluxograma?')) return;
    alterar(function () {
      var p = processoAtual();
      p.fundamentos = p.fundamentos.filter(function (x) { return x.fluxo !== fu.fluxo; });
      delete dados.fluxos[fu.fluxo];
      estado.fluxo = null;
    });
    avisar('Fundamento excluído. Use “Desfazer” se foi engano.');
  }

  // ---------- arquivo de dados (data/bundle.js) ----------

  function textoBundle() {
    return '// Dados dos fluxogramas — carregado antes de app.js.\n' +
      '// Gerado e regravado pela própria página (modo de edição > "Salvar no arquivo").\n' +
      '// Pode ser editado à mão, desde que o trecho depois do sinal de igual continue\n' +
      '// sendo JSON válido. Uma etapa sem ligação de saída segue para a próxima da lista.\n' +
      'window.FLUXOGRAMAS = ' + JSON.stringify(dados, null, 2) + ';\n';
  }

  function lerBundle(texto) {
    var ini = texto.indexOf('{', Math.max(0, texto.indexOf('=')));
    var fim = texto.lastIndexOf('}');
    if (ini === -1 || fim < ini) throw new Error('o arquivo não contém dados de fluxogramas');
    var d = JSON.parse(texto.slice(ini, fim + 1));
    if (!Array.isArray(d.catalogo) || !d.fluxos) throw new Error('faltam "catalogo" ou "fluxos"');
    return normalizar(d);
  }

  function baixar(texto) {
    var blob = new Blob([texto], { type: 'text/javascript' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bundle.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // O "handle" do arquivo escolhido fica no IndexedDB para não perguntar de novo.
  function banco() {
    return new Promise(function (ok, erro) {
      var r = window.indexedDB.open('fluxogramas-vij', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('arquivos'); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { erro(r.error); };
    });
  }
  function guardarHandle(h) {
    banco().then(function (db) {
      db.transaction('arquivos', 'readwrite').objectStore('arquivos').put(h, 'bundle');
    }).catch(function () {});
  }
  function carregarHandle() {
    if (!window.indexedDB) return;
    banco().then(function (db) {
      var r = db.transaction('arquivos').objectStore('arquivos').get('bundle');
      r.onsuccess = function () { if (r.result) handleArquivo = r.result; };
    }).catch(function () {});
  }

  function permissao(h) {
    if (!h || !h.queryPermission) return Promise.resolve(h);
    return h.queryPermission({ mode: 'readwrite' }).then(function (s) {
      if (s === 'granted') return h;
      return h.requestPermission({ mode: 'readwrite' }).then(function (s2) { return s2 === 'granted' ? h : null; });
    });
  }

  function salvarNoArquivo() {
    var texto = textoBundle();
    if (!window.showSaveFilePicker) {
      baixar(texto);
      marcarSalvo();
      avisar('Arquivo bundle.js baixado. Copie-o para a pasta data/ do projeto, substituindo o anterior.');
      return;
    }
    permissao(handleArquivo).then(function (h) {
      return h || window.showSaveFilePicker({
        suggestedName: 'bundle.js',
        types: [{ description: 'Dados dos fluxogramas', accept: { 'text/javascript': ['.js'] } }]
      });
    }).then(function (h) {
      handleArquivo = h;
      guardarHandle(h);
      return h.createWritable().then(function (w) {
        return w.write(texto).then(function () { return w.close(); });
      });
    }).then(function () {
      marcarSalvo();
      avisar('Dados gravados em ' + handleArquivo.name + '.');
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return;
      handleArquivo = null;
      baixar(texto);
      avisar('Não foi possível gravar direto no arquivo (' + (err && err.message ? err.message : err) +
        '). Uma cópia de bundle.js foi baixada.');
    });
  }

  function marcarSalvo() {
    original = clonar(dados);
    gravarStorage(CHAVE_RASCUNHO, null);
    atualizarStatus();
  }

  function abrirArquivo(file) {
    var r = new FileReader();
    r.onload = function () {
      var d;
      try { d = lerBundle(String(r.result)); } catch (e) {
        avisar('Arquivo inválido: ' + e.message + '.');
        return;
      }
      if (!window.confirm('Substituir os fluxos que estão na tela pelos do arquivo “' + file.name + '”?')) return;
      alterar(function () { dados = d; });
      avisar('Arquivo carregado. Clique em “Salvar no arquivo” para gravá-lo em data/bundle.js.');
    };
    r.readAsText(file, 'utf-8');
  }

  function descartar() {
    if (!window.confirm('Descartar todas as alterações não gravadas e voltar ao conteúdo do arquivo de dados?')) return;
    dados = clonar(original);
    historico = [];
    gravarStorage(CHAVE_RASCUNHO, null);
    painel.hidden = true;
    atualizarTudo();
  }

  // ---------- modo de edição e ações gerais ----------

  function definirEdicao(on) {
    editando = on;
    document.body.classList.toggle('editando', on);
    btnEdicao.setAttribute('aria-pressed', on ? 'true' : 'false');
    btnEdicao.textContent = on ? '✓ Concluir edição' : '✎ Editar fluxos';
    gravarStorage(CHAVE_EDICAO, on ? '1' : null);
    painel.hidden = true;
    render();
  }

  function exportarSvg() {
    var svg = divDiagrama.querySelector('svg');
    if (!svg) return;
    var clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    var data = new XMLSerializer().serializeToString(clone);
    var blob = new Blob([data], { type: 'image/svg+xml' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (fluxoAtual && fluxoAtual.id || 'fluxograma') + '.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function atualizarBtnOrientacao() {
    btnOrientacao.textContent = orientacao === 'LR' ? 'Ver em vertical' : 'Ver em horizontal';
  }

  selProcesso.addEventListener('change', function () {
    estado.processo = selProcesso.value;
    estado.fluxo = null;
    painel.hidden = true;
    atualizarTudo();
  });
  selFundamento.addEventListener('change', function () {
    estado.fluxo = selFundamento.value;
    painel.hidden = true;
    atualizarTudo();
  });
  inputTexto.addEventListener('input', render);
  selResponsavel.addEventListener('change', render);
  checkPrazo.addEventListener('change', render);
  $('limpar-filtros').addEventListener('click', function () {
    inputTexto.value = '';
    selResponsavel.value = '';
    checkPrazo.checked = false;
    render();
  });
  $('btn-imprimir').addEventListener('click', function () { window.print(); });
  $('btn-svg').addEventListener('click', exportarSvg);
  btnOrientacao.addEventListener('click', function () {
    orientacao = orientacao === 'LR' ? 'TD' : 'LR';
    atualizarBtnOrientacao();
    render();
  });
  btnEdicao.addEventListener('click', function () { definirEdicao(!editando); });

  btnDesfazer.addEventListener('click', desfazer);
  $('btn-salvar').addEventListener('click', salvarNoArquivo);
  $('btn-abrir').addEventListener('click', function () { $('input-arquivo').click(); });
  $('input-arquivo').addEventListener('change', function () {
    if (this.files && this.files[0]) abrirArquivo(this.files[0]);
    this.value = '';
  });
  $('btn-descartar').addEventListener('click', descartar);
  avisoRascunho.addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.acao === 'salvar') salvarNoArquivo();
    else if (b.dataset.acao === 'descartar') descartar();
  });

  $('btn-nova-etapa').addEventListener('click', function () { abrirEdicaoEtapa(null, null); });
  $('btn-novo-processo').addEventListener('click', novoProcesso);
  $('btn-editar-processo').addEventListener('click', editarProcesso);
  $('btn-excluir-processo').addEventListener('click', excluirProcesso);
  $('btn-novo-fundamento').addEventListener('click', function () { abrirFundamento(false); });
  $('btn-editar-fundamento').addEventListener('click', function () { abrirFundamento(true); });
  $('btn-excluir-fundamento').addEventListener('click', excluirFundamento);

  dlgEtapa.querySelector('form').addEventListener('change', function (ev) {
    var f = this.elements;
    if (ev.target.name === 'tipo' && f.tipo.value === 'fim' && f.segue.value === 'proxima') f.segue.value = 'fim';
    if (ev.target.name === 'segue' || ev.target.name === 'tipo') atualizarModoLigacoes();
  });

  document.addEventListener('keydown', function (ev) {
    if (!editando || !(ev.ctrlKey || ev.metaKey) || ev.key.toLowerCase() !== 'z' || ev.shiftKey) return;
    var t = ev.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || document.querySelector('dialog[open]')) return;
    ev.preventDefault();
    desfazer();
  });

  carregarRascunho();
  carregarHandle();
  atualizarBtnOrientacao();
  definirEdicao(lerStorage(CHAVE_EDICAO) === '1');
  atualizarTudo();
})();
