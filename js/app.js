(function () {
  const T = window.TERMO;
  const $ = (s) => document.querySelector(s);
  const LS_PERFIL = 'ti.perfil', LS_RASCUNHO = 'ti.rascunho';
  const ler = (k, pad) => { try { return JSON.parse(localStorage.getItem(k)) || pad; } catch (e) { return pad; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* armazenamento indisponível */ } };

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2800);
  }
  const isoHoje = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Campo de assinatura ----------
  class Pad {
    constructor(canvas) {
      this.c = canvas; canvas.width = 940; canvas.height = 320;
      this.g = canvas.getContext('2d');
      this.g.lineWidth = 6; this.g.lineCap = 'round'; this.g.lineJoin = 'round'; this.g.strokeStyle = '#000';
      this.vazio = true; this.desenhando = false;
      const pos = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height]; };
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); this.desenhando = true; this.ult = pos(e); this.ponto(this.ult); });
      canvas.addEventListener('pointermove', (e) => {
        if (!this.desenhando) return; e.preventDefault();
        const p = pos(e); this.g.beginPath(); this.g.moveTo(this.ult[0], this.ult[1]); this.g.lineTo(p[0], p[1]); this.g.stroke(); this.ult = p; this.vazio = false;
      });
      const fim = () => { this.desenhando = false; };
      canvas.addEventListener('pointerup', fim); canvas.addEventListener('pointercancel', fim);
    }
    ponto(p) { this.g.beginPath(); this.g.arc(p[0], p[1], 3, 0, 7); this.g.fill(); this.vazio = false; }
    limpar() { this.g.clearRect(0, 0, this.c.width, this.c.height); this.vazio = true; }
    png() { return this.vazio ? null : this.c.toDataURL('image/png'); }
    carregar(url) {
      const im = new Image();
      im.onload = () => { this.limpar(); this.g.drawImage(im, 0, 0, this.c.width, this.c.height); this.vazio = false; };
      im.src = url;
    }
  }
  const padAft = new Pad($('#padAft')), padEmp = new Pad($('#padEmp'));

  // ---------- Meus dados (perfil) ----------
  const perfilForm = $('#perfilForm');
  let perfil = ler(LS_PERFIL, {});
  function aplicarPerfil() {
    ['aftNome', 'aftCif', 'unidade1', 'unidade2', 'localData', 'protocolo'].forEach((k) => { perfilForm.elements[k].value = perfil[k] || ''; });
    if (perfil.rubrica) { padAft.carregar(perfil.rubrica); $('#aftRubricaInfo').textContent = 'Rubrica salva neste aparelho.'; }
    $('#perfilBox').open = !perfil.aftNome;
  }
  function salvarPerfil() {
    ['aftNome', 'aftCif', 'unidade1', 'unidade2', 'localData', 'protocolo'].forEach((k) => { perfil[k] = perfilForm.elements[k].value.trim(); });
    gravar(LS_PERFIL, perfil);
  }
  perfilForm.addEventListener('submit', (e) => { e.preventDefault(); salvarPerfil(); toast('Dados salvos neste aparelho'); $('#perfilBox').open = false; });
  $('#aftLimpar').onclick = () => padAft.limpar();
  $('#aftSalvar').onclick = () => {
    perfil.rubrica = padAft.png(); salvarPerfil();
    $('#aftRubricaInfo').textContent = perfil.rubrica ? 'Rubrica salva neste aparelho.' : 'Sem rubrica.';
    toast(perfil.rubrica ? 'Rubrica salva' : 'Rubrica removida');
  };

  // ---------- Termo ----------
  const termoForm = $('#termoForm');
  let objetos = [];
  const CAMPOS = ['tipoTermo', 'numero', 'empregador', 'cnpj', 'cnae', 'endereco', 'municipio', 'uf', 'cep', 'fantasia', 'data', 'aut', 'codDownload'];
  const MASCARAS = { cnpj: T.fmtCnpj, cep: T.fmtCep, cnae: T.fmtCnae, numero: T.fmtNumero };

  function salvarRascunho() {
    const r = { objetos };
    CAMPOS.forEach((k) => { r[k] = termoForm.elements[k].value; });
    gravar(LS_RASCUNHO, r);
  }
  termoForm.elements.tipoTermo.addEventListener('change', () => {
    const ok = tiposAtuais(); objetos.forEach((o) => { if (!ok.includes(o.tipo)) o.tipo = ok[0]; });
    renderObjetos(); salvarRascunho();
  });
  termoForm.addEventListener('input', (e) => {
    const f = MASCARAS[e.target.name];
    if (f) e.target.value = f(e.target.value);
    if (e.target.name === 'uf') e.target.value = e.target.value.toUpperCase();
    salvarRascunho();
  });

  const tiposAtuais = () => T.textos(termoForm.elements.tipoTermo.value).tipos;
  function renderObjetos() {
    const box = $('#listaObjetos'); box.innerHTML = '';
    objetos.forEach((o, i) => {
      const div = document.createElement('div'); div.className = 'objeto';
      div.innerHTML =
        '<header><span>Objeto ' + (i + 1) + '</span>' + (objetos.length > 1 ? '<button type="button" class="sec perigo">Remover</button>' : '') + '</header>' +
        '<div class="duas"><label>Tipo<select data-k="tipo">' + tiposAtuais().map((t) => '<option' + (t === o.tipo ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label>' +
        '<label>Paralisação<select data-k="paralisacao"><option' + (o.paralisacao === 'TOTAL' ? ' selected' : '') + '>TOTAL</option><option' + (o.paralisacao === 'PARCIAL' ? ' selected' : '') + '>PARCIAL</option></select></label></div>' +
        '<label>Descrição<textarea rows="3" data-k="descricao" placeholder="Ex.: Batedeira industrial, fabricante ..., modelo ..., localizada no setor ... do estabelecimento.">' + esc(o.descricao) + '</textarea></label>';
      div.addEventListener('input', (e) => { if (e.target.dataset.k) { o[e.target.dataset.k] = e.target.value; salvarRascunho(); } });
      const rm = div.querySelector('button');
      if (rm) rm.onclick = () => { objetos.splice(i, 1); renderObjetos(); salvarRascunho(); };
      box.appendChild(div);
    });
  }
  const novoObjeto = () => ({ tipo: tiposAtuais()[0], paralisacao: 'TOTAL', descricao: '' });
  $('#addObjeto').onclick = () => { objetos.push(novoObjeto()); renderObjetos(); salvarRascunho(); };

  function carregarRascunho() {
    const r = ler(LS_RASCUNHO, {});
    CAMPOS.forEach((k) => { termoForm.elements[k].value = r[k] || ''; });
    if (!termoForm.elements.tipoTermo.value) termoForm.elements.tipoTermo.value = 'interdicao';
    if (!termoForm.elements.data.value) termoForm.elements.data.value = isoHoje();
    objetos = (r.objetos && r.objetos.length) ? r.objetos : [novoObjeto()];
    renderObjetos();
  }
  $('#limparTudo').onclick = () => {
    if (!confirm('Apagar os dados do termo atual e começar outro? (Seus dados de AFT são mantidos.)')) return;
    try { localStorage.removeItem(LS_RASCUNHO); } catch (e) { /* nada */ }
    carregarRascunho(); toast('Formulário limpo');
  };

  function dadosTermo() {
    const v = (k) => termoForm.elements[k].value.trim();
    return {
      unidade1: perfil.unidade1 || '', unidade2: perfil.unidade2 || '', protocolo: perfil.protocolo || '',
      localData: perfil.localData || '', aftNome: perfil.aftNome || '', aftCif: perfil.aftCif || '', aftRubrica: perfil.rubrica || null,
      tipoTermo: v('tipoTermo') || 'interdicao', numero: v('numero'), empregador: v('empregador'), cnpj: v('cnpj'), cnae: v('cnae'), endereco: v('endereco'),
      municipio: v('municipio'), uf: v('uf'), cep: v('cep'), fantasia: v('fantasia'),
      data: T.isoParaBR(v('data')) || T.hojeBR(), aut: v('aut'), codDownload: v('codDownload'),
      objetos: objetos.map((o) => ({ tipo: o.tipo, paralisacao: o.paralisacao, descricao: (o.descricao || '').trim() })),
    };
  }

  // ---------- Etapas ----------
  function mostrar(n) {
    $('#etapa1').hidden = n !== 1; $('#etapa2').hidden = n !== 2; window.scrollTo(0, 0);
  }

  function previa(d) {
    const tx = T.textos(d.tipoTermo, d.objetos.length);
    const objs = d.objetos.map((o, i) =>
      '<div class="obj">OBJETO: ' + (d.objetos.length > 1 ? (i + 1) + ' - ' : '') + esc(o.tipo) + ' - Paralisação: ' + esc(o.paralisacao) + '</div><p>' + esc(o.descricao) + '</p>').join('');
    $('#previa').innerHTML =
      '<div class="inst"><img src="assets/brasao.png" alt=""><div><b>Ministério do Trabalho e Emprego</b><b style="font-size:11px">Secretaria de Inspeção do Trabalho</b>' +
      '<span style="font-size:11px">' + esc(d.unidade1) + '<br>' + esc(d.unidade2) + '</span></div></div>' +
      '<div class="tit">' + esc(tx.nome) + ' Nº ' + esc(T.fmtNumero(d.numero) || '______________') + '</div>' +
      '<p class="campo"><b>EMPREGADOR:</b> ' + esc(d.empregador) + '<br><b>CNPJ:</b> ' + esc(d.cnpj) + ' &nbsp; <b>CNAE:</b> ' + esc(d.cnae) +
      '<br><b>Endereço:</b> ' + esc(d.endereco) + '<br><b>Município:</b> ' + esc(d.municipio) + ' &nbsp; <b>UF:</b> ' + esc(d.uf) + ' &nbsp; <b>CEP:</b> ' + esc(d.cep) +
      '<br><b>Nome de Fantasia:</b> ' + esc(d.fantasia) + '</p>' +
      '<p>' + esc(tx.fundamento) + '</p>' + objs + T.paragrafos(d).map((p) => '<p>' + esc(p) + '</p>').join('') +
      '<div class="ass">' + esc((d.localData ? d.localData + ', ' : '') + d.data) + '.<br><br>' + esc(d.aftNome) + '<br>Auditor-Fiscal do Trabalho<br>CIF ' + esc(d.aftCif) + '</div>' +
      '<div class="caixa">' + esc(tx.aviso) + '</div>';
  }

  $('#gerar').onclick = () => {
    salvarPerfil(); salvarRascunho();
    const d = dadosTermo(), faltas = [];
    if (!d.empregador) faltas.push('Empregador');
    if (!d.aftNome || !d.aftCif) faltas.push('Meus dados (nome e CIF)');
    if (d.objetos.some((o) => !o.descricao)) faltas.push('Descrição de cada objeto');
    if (faltas.length) { toast('Falta preencher: ' + faltas.join(', ')); if (!d.aftNome || !d.aftCif) $('#perfilBox').open = true; return; }
    previa(d);
    const rf = $('#reciboForm'); if (!rf.elements.recebiEm.value) rf.elements.recebiEm.value = isoHoje();
    $('#resultado').hidden = true;
    mostrar(2);
  };
  $('#voltar').onclick = () => mostrar(1);
  $('#empLimpar').onclick = () => padEmp.limpar();
  $('#reciboForm').elements.empCpf.addEventListener('input', (e) => { e.target.value = T.fmtCpf(e.target.value); });

  // ---------- PDF ----------
  let pdfBlob = null, pdfNome = '', pdfUrl = null;
  $('#gerarPdf').onclick = async () => {
    const assinatura = padEmp.png();
    if (!assinatura && !confirm('O empregador ainda não assinou. Gerar o PDF com a linha em branco para assinatura no papel?')) return;
    const btn = $('#gerarPdf'); btn.disabled = true; btn.textContent = 'Gerando...';
    try {
      const rf = $('#reciboForm').elements, d = dadosTermo();
      Object.assign(d, {
        recebiEm: T.isoParaBR(rf.recebiEm.value), empNome: rf.empNome.value.trim(), empIdent: rf.empIdent.value.trim(),
        empCpf: rf.empCpf.value.trim(), empFuncao: rf.empFuncao.value.trim(), empAssinatura: assinatura,
      });
      pdfBlob = await window.gerarPDF(d);
      pdfNome = (d.tipoTermo === 'embargo' ? 'Termo_Embargo_' : 'Termo_Interdicao_') + (T.dig(d.numero) || d.data.replace(/\//g, '-')) + '.pdf';
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      pdfUrl = URL.createObjectURL(pdfBlob);
      $('#resNome').textContent = pdfNome + ' (' + Math.round(pdfBlob.size / 1024) + ' KB)';
      $('#resultado').hidden = false;
      $('#resultado').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      console.error(e); toast('Não foi possível gerar o PDF: ' + e.message);
    } finally { btn.disabled = false; btn.textContent = 'Gerar PDF'; }
  };
  $('#baixar').onclick = () => { const a = document.createElement('a'); a.href = pdfUrl; a.download = pdfNome; document.body.appendChild(a); a.click(); a.remove(); };
  $('#abrir').onclick = () => window.open(pdfUrl, '_blank');
  $('#compartilhar').onclick = async () => {
    const file = new File([pdfBlob], pdfNome, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: pdfNome }); } catch (e) { /* usuário cancelou */ }
    } else { toast('Este navegador não compartilha arquivos: use Baixar.'); }
  };

  // ---------- APK Android: salvar/compartilhar/abrir pelo sistema ----------
  if (window.Android && window.Android.salvar) {
    const nativo = (modo) => {
      if (!pdfBlob) return;
      const r = new FileReader();
      r.onload = () => {
        const res = window.Android.salvar(String(r.result).split(',')[1], pdfNome, modo);
        if (res !== 'ok') toast('Erro: ' + res);
        else if (modo === 0) toast('PDF salvo em Downloads/Termos');
      };
      r.readAsDataURL(pdfBlob);
    };
    $('#baixar').onclick = () => nativo(0);
    $('#compartilhar').onclick = () => nativo(1);
    $('#abrir').onclick = () => nativo(2);
  }

  // ---------- Início ----------
  aplicarPerfil(); carregarRascunho();
  if (!window.Android && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
