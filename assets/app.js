(function () {
  'use strict';

  var CAT = (window.FLUXOGRAMAS || {}).catalogo || [];
  var FLUXOS = (window.FLUXOGRAMAS || {}).fluxos || {};

  var selProcesso = document.getElementById('sel-processo');
  var selFundamento = document.getElementById('sel-fundamento');
  var selResponsavel = document.getElementById('filtro-responsavel');
  var inputTexto = document.getElementById('filtro-texto');
  var checkPrazo = document.getElementById('filtro-prazo');
  var btnLimpar = document.getElementById('limpar-filtros');
  var btnImprimir = document.getElementById('btn-imprimir');
  var btnSvg = document.getElementById('btn-svg');
  var btnOrientacao = document.getElementById('btn-orientacao');
  var divDiagrama = document.getElementById('diagrama');
  var painel = document.getElementById('painel');
  var listaEtapas = document.getElementById('lista-etapas');

  var fluxoAtual = null;
  var renderSeq = 0;
  var orientacao = 'LR';

  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: { htmlLabels: true, curve: 'basis', padding: 12 }
  });

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function popularProcessos() {
    selProcesso.innerHTML = '';
    CAT.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.nome;
      selProcesso.appendChild(o);
    });
    popularFundamentos();
  }

  function popularFundamentos() {
    var proc = CAT.filter(function (p) { return p.id === selProcesso.value; })[0] || CAT[0];
    selFundamento.innerHTML = '';
    (proc.fundamentos || []).forEach(function (f) {
      var o = document.createElement('option');
      o.value = f.fluxo;
      o.textContent = f.nome;
      selFundamento.appendChild(o);
    });
    carregarFluxo();
  }

  function carregarFluxo() {
    fluxoAtual = FLUXOS[selFundamento.value];
    popularResponsaveis();
    painel.hidden = true;
    render();
  }

  function popularResponsaveis() {
    var valores = [];
    (fluxoAtual.etapas || []).forEach(function (e) {
      if (e.responsavel && valores.indexOf(e.responsavel) === -1) valores.push(e.responsavel);
    });
    valores.sort();
    var atual = selResponsavel.value;
    selResponsavel.innerHTML = '<option value="">Todos os responsáveis</option>';
    valores.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      selResponsavel.appendChild(o);
    });
    if (atual && valores.indexOf(atual) !== -1) selResponsavel.value = atual;
  }

  function filtrar() {
    var texto = inputTexto.value.trim().toLowerCase();
    var resp = selResponsavel.value;
    var soPrazo = checkPrazo.checked;
    return (fluxoAtual.etapas || []).filter(function (e) {
      if (resp && e.responsavel !== resp) return false;
      if (soPrazo && !e.prazo) return false;
      if (texto) {
        var hay = [e.titulo, e.artigo, e.responsavel, e.obs].join(' ').toLowerCase();
        if (hay.indexOf(texto) === -1) return false;
      }
      return true;
    });
  }

  function montarMermaid(etapas) {
    var linhas = ['flowchart ' + orientacao];
    var mapa = {};
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
    });
    (fluxoAtual.ligacoes || []).forEach(function (l) {
      if (mapa[l.de] != null && mapa[l.para] != null) {
        var rot = l.rotulo ? '|' + esc(l.rotulo) + '|' : '';
        linhas.push(mapa[l.de] + ' -->' + rot + ' ' + mapa[l.para]);
      }
    });
    etapas.forEach(function (e, i) {
      linhas.push('click n' + i + ' call cliqueEtapa("' + fluxoAtual.id + '::' + e.id + '")');
    });
    return linhas.join('\n');
  }

  function render() {
    var etapas = filtrar();
    var code = montarMermaid(etapas);
    var id = 'grafico-fluxo-' + (++renderSeq);

    mermaid.render(id, code).then(function (res) {
      divDiagrama.innerHTML = res.svg;
      if (typeof res.bindFunctions === 'function') {
        try { res.bindFunctions(divDiagrama); } catch (e) { /* interatividade opcional */ }
      }
    }).catch(function (err) {
      divDiagrama.innerHTML = '<div class="msg-erro">Não foi possível desenhar o fluxograma: ' +
        esc(err && err.message ? err.message : err) + '</div>';
    });

    renderLista(etapas);
  }

  window.cliqueEtapa = function (chave) {
    var partes = String(chave).split('::');
    var e = (fluxoAtual.etapas || []).filter(function (x) { return x.id === partes[1]; })[0];
    if (e) mostrarPainel(e);
  };

  function mostrarPainel(e) {
    painel.hidden = false;
    painel.innerHTML =
      '<h3>' + esc(e.titulo) + '</h3>' +
      '<dl>' +
      '<dt>Artigo</dt><dd>' + esc(e.artigo || '—') + '</dd>' +
      '<dt>Prazo</dt><dd>' + esc(e.prazo || '—') + '</dd>' +
      '<dt>Responsável</dt><dd>' + esc(e.responsavel || '—') + '</dd>' +
      '<dt>Observações</dt><dd>' + esc(e.obs || '—') + '</dd>' +
      '</dl>' +
      '<button type="button" id="fechar-painel">Fechar</button>';
    document.getElementById('fechar-painel').addEventListener('click', function () {
      painel.hidden = true;
    });
  }

  function renderLista(etapas) {
    listaEtapas.innerHTML = '';
    if (!etapas.length) {
      listaEtapas.innerHTML = '<li class="vazio">Nenhuma etapa encontrada com esses filtros.</li>';
      return;
    }
    etapas.forEach(function (e) {
      var li = document.createElement('li');
      li.className = 'item-etapa';
      li.innerHTML =
        '<button type="button" class="titulo-etapa">' + esc(e.titulo) + '</button>' +
        '<div class="meta-etapa">' +
          (e.artigo ? '<span class="tag">' + esc(e.artigo) + '</span>' : '') +
          (e.prazo ? '<span class="tag prazo">Prazo: ' + esc(e.prazo) + '</span>' : '') +
          (e.responsavel ? '<span class="tag resp">' + esc(e.responsavel) + '</span>' : '') +
        '</div>';
      li.querySelector('.titulo-etapa').addEventListener('click', function () { mostrarPainel(e); });
      listaEtapas.appendChild(li);
    });
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
    a.download = (fluxoAtual.id || 'fluxograma') + '.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  selProcesso.addEventListener('change', popularFundamentos);
  selFundamento.addEventListener('change', carregarFluxo);
  inputTexto.addEventListener('input', render);
  selResponsavel.addEventListener('change', render);
  checkPrazo.addEventListener('change', render);
  btnLimpar.addEventListener('click', function () {
    inputTexto.value = '';
    selResponsavel.value = '';
    checkPrazo.checked = false;
    render();
  });
  btnImprimir.addEventListener('click', function () { window.print(); });
  btnSvg.addEventListener('click', exportarSvg);

  function atualizarBtnOrientacao() {
    btnOrientacao.textContent = orientacao === 'LR' ? 'Ver em vertical' : 'Ver em horizontal';
  }
  btnOrientacao.addEventListener('click', function () {
    orientacao = orientacao === 'LR' ? 'TD' : 'LR';
    atualizarBtnOrientacao();
    render();
  });

  popularProcessos();
  atualizarBtnOrientacao();
})();
