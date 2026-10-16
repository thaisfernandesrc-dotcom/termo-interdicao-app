// Gera o PDF do Termo de Interdição reproduzindo o layout do modelo oficial (A4, medidas em pontos).
(function () {
  const T = window.TERMO;
  const MX = 78, MR = 566, W = MR - MX; // margens do modelo
  const BOTTOM = 792;                    // limite do texto (o rodapé fica em y=813)
  const BODY = 10.5;                     // Helvetica 10,5 ~ largura da Tahoma 10 do modelo
  const LH = 12;                         // entrelinha do modelo
  const CINZA_MARCA = 236;

  function fonte(doc, bold, size, italic) {
    const estilo = bold ? (italic ? 'bolditalic' : 'bold') : (italic ? 'italic' : 'normal');
    doc.setFont('helvetica', estilo);
    doc.setFontSize(size);
  }

  // Linha justificada palavra a palavra (a última linha do parágrafo fica à esquerda).
  function linhaJustificada(doc, texto, x, y, largura, ultima) {
    const palavras = texto.split(' ').filter(Boolean);
    if (ultima || palavras.length < 2) { doc.text(texto, x, y); return; }
    const soma = palavras.reduce((a, w) => a + doc.getTextWidth(w), 0);
    const gap = (largura - soma) / (palavras.length - 1);
    if (gap > doc.getTextWidth(' ') * 4) { doc.text(texto, x, y); return; }
    let cx = x;
    palavras.forEach((w) => { doc.text(w, cx, y); cx += doc.getTextWidth(w) + gap; });
  }

  function codigoBarras(numero) {
    try {
      const c = document.createElement('canvas');
      window.JsBarcode(c, numero, { format: 'CODE128', displayValue: true, fontSize: 16, height: 46, width: 2, margin: 0, font: 'Arial' });
      return { url: c.toDataURL('image/png'), w: c.width, h: c.height };
    } catch (e) { return null; }
  }

  function carregarImagem(src) {
    return new Promise((ok, erro) => {
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = erro;
      im.src = src;
    });
  }

  async function gerarPDF(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const numFmt = T.fmtNumero(d.numero);
    const titulo = 'TERMO DE INTERDIÇÃO Nº ' + numFmt;
    doc.setProperties({ title: titulo, subject: 'Termo de Interdição', creator: 'App Termo de Interdição' });

    const st = { y: 0 };
    const marcaDagua = (texto, x, y, size) => {
      doc.setTextColor(CINZA_MARCA);
      fonte(doc, true, size, true);
      doc.text(texto, x, y);
      doc.setTextColor(0);
    };
    const novaPagina = () => {
      doc.addPage();
      marcaDagua(titulo, MX, 53, 16);
      st.y = 81;
    };
    const garantir = (altura) => { if (st.y + altura > BOTTOM) novaPagina(); };

    // ---------- Página 1: cabeçalho ----------
    marcaDagua('Secretaria de Inspeção do Trabalho', 131, 177, 18);
    try {
      const brasao = await carregarImagem('assets/brasao.png');
      doc.addImage(brasao, 'PNG', 76, 40, 52, 52);
    } catch (e) { /* segue sem o brasão */ }
    const barras = d.numero ? codigoBarras(T.dig(d.numero)) : null;
    if (barras) {
      const k = Math.min(99 / barras.w, 48 / barras.h);
      doc.addImage(barras.url, 'PNG', 534 - barras.w * k, 38, barras.w * k, barras.h * k);
    }
    fonte(doc, true, 10); doc.text('Ministério do Trabalho e Emprego', 136, 49);
    fonte(doc, true, 8); doc.text('Secretaria de Inspeção do Trabalho', 136, 61);
    fonte(doc, false, 8);
    if (d.unidade1) doc.text(d.unidade1, 136, 71);
    if (d.unidade2) doc.text(d.unidade2, 136, 83);

    fonte(doc, true, 11);
    doc.text(titulo, 322, 120, { align: 'center' });

    // ---------- Dados do empregador ----------
    let y = 153;
    const rotulo = (r, x, yy) => { fonte(doc, true, BODY); doc.text(r, x, yy); return x + doc.getTextWidth(r) + 2; };
    const valor = (v, x, yy) => { fonte(doc, false, BODY); doc.text(v, x, yy); };
    const linhaLonga = (r, v) => { // rótulo + valor com quebra, recuo no valor
      const vx = rotulo(r, MX, y);
      fonte(doc, false, BODY);
      const ls = doc.splitTextToSize(v || '', MR - vx);
      (ls.length ? ls : ['']).forEach((l, i) => { doc.text(l, vx, y + i * 13); });
      y += Math.max(ls.length, 1) * 13;
    };
    linhaLonga('EMPREGADOR:', d.empregador);
    // CNPJ e CNAE na mesma linha
    valor(d.cnpj, rotulo('CNPJ:', MX, y) + 1, y);
    valor(d.cnae, rotulo('CNAE:', 312, y), y);
    y += 13;
    linhaLonga('Endereço:', d.endereco);
    // Município, UF e CEP na mesma linha
    valor(d.municipio, rotulo('Município:', MX, y), y);
    valor(d.uf, rotulo('UF:', 427, y), y);
    valor(d.cep, rotulo('CEP:', 463, y), y);
    y += 12;
    linhaLonga('Nome de Fantasia:', d.fantasia);
    st.y = y + 6; // 19 pt abaixo do Nome de Fantasia (205 -> 224 no modelo)

    // ---------- Corpo ----------
    const paragrafo = (texto, opc) => {
      fonte(doc, !!(opc && opc.bold), BODY);
      const ls = doc.splitTextToSize(texto, W);
      ls.forEach((l, i) => {
        garantir(LH);
        linhaJustificada(doc, l, MX, st.y, W, i === ls.length - 1);
        st.y += LH;
      });
      st.y -= LH; // deixa st.y na linha base da última linha impressa
    };

    paragrafo(T.FUNDAMENTO);
    st.y += 29;

    (d.objetos || []).forEach((o, i) => {
      garantir(60);
      fonte(doc, true, BODY);
      doc.text('OBJETO: ' + (i + 1) + ' - ' + o.tipo + ' - Paralisação: ' + o.paralisacao, MX, st.y);
      st.y += 15.5;
      paragrafo(o.descricao || '');
      st.y += 28;
    });
    st.y -= 2; // 26 pt entre o último objeto e o primeiro parágrafo fixo

    T.paragrafos(d).forEach((p) => { paragrafo(p); st.y += LH; });

    // ---------- Bloco de assinaturas (altura ~ 215 pt) ----------
    const lAviso = (fonte(doc, false, BODY), doc.splitTextToSize(T.AVISO_PENAL, W - 2));
    const alturaBloco = 150 + lAviso.length * LH + 6;
    let oy;
    if (st.y + 30 + alturaBloco <= BOTTOM + 14) oy = st.y + 30;
    else { novaPagina(); oy = 81; }

    marcaDagua('CIF ' + (d.aftCif || ''), 281, oy + 44, 14);
    fonte(doc, false, BODY);
    doc.text((d.localData ? d.localData + ', ' : '') + (d.data || '') + '.', 275, oy);
    // assinatura do AFT (opcional) e linha
    if (d.aftRubrica) doc.addImage(d.aftRubrica, 'PNG', 440, oy - 2, 75, 25.5);
    doc.setLineWidth(0.8); doc.setDrawColor(0);
    doc.line(290, oy + 23, 517, oy + 23);
    doc.text(d.aftNome || '', 403.5, oy + 34, { align: 'center' });
    doc.text('Auditor-Fiscal do Trabalho', 403.5, oy + 45, { align: 'center' });
    doc.text('CIF ' + (d.aftCif || ''), 403.5, oy + 57, { align: 'center' });

    // recibo do empregador
    doc.text('Recebi em:', MX, oy + 50);
    doc.text(d.recebiEm || '____/_____/______', 134, oy + 50);
    if (d.empAssinatura) doc.addImage(d.empAssinatura, 'PNG', 196, oy + 36, 94, 32);
    doc.line(77, oy + 69, 271, oy + 69);
    doc.text('Assinatura do Empregador/Preposto:', 97, oy + 82);

    const campo = (rot, x, yy, linhaIni, linhaFim, val) => {
      doc.text(rot, x, yy);
      if (val) doc.text(val, linhaIni + 4, yy - 1.5);
      doc.setLineWidth(0.5); doc.line(linhaIni, yy + 1.5, linhaFim, yy + 1.5);
    };
    campo('Nome:', MX, oy + 98, 108, 452, d.empNome);
    campo('Ident.:', MX, oy + 117, 108, 190, d.empIdent);
    campo('CPF:', 218, oy + 117, 240, 322, d.empCpf);
    campo('Função:', 341, oy + 117, 377, 459, d.empFuncao);

    if (d.aut || d.codDownload) {
      doc.setTextColor(185); fonte(doc, false, BODY);
      if (d.aut) doc.text('Aut.:' + d.aut, MX, oy + 138);
      doc.setTextColor(0); fonte(doc, false, 9);
      if (d.codDownload) doc.text('Cód.Download:' + d.codDownload, MR, oy + 138, { align: 'right' });
    }

    // caixa do aviso penal
    doc.setLineWidth(1); doc.setDrawColor(0);
    doc.rect(MX, oy + 150, W, lAviso.length * LH + 3);
    fonte(doc, false, BODY);
    lAviso.forEach((l, i) => linhaJustificada(doc, l, MX + 1, oy + 160 + i * LH, W - 2, i === lAviso.length - 1));

    // ---------- Pós-passe: numeração e rodapé em todas as páginas ----------
    const total = doc.getNumberOfPages();
    const impresso = 'Gerado em campo por ' + (d.aftCif || '') + ', em ' + (d.data || T.hojeBR()) + '.';
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setTextColor(0);
      if (p === 1) { fonte(doc, false, 10); doc.text('Folha nº 1/' + total, MR, 98, { align: 'right' }); }
      else {
        fonte(doc, true, 10); doc.text(titulo, 322, 49, { align: 'center' });
        fonte(doc, false, 10); doc.text('Folha nº ' + p + '/' + total, MR, 49, { align: 'right' });
      }
      fonte(doc, false, 6);
      doc.text('CIF-AFT emitente: ' + (d.aftCif || ''), 77, 813);
      doc.text(impresso, 564, 813, { align: 'right' });
    }
    return doc.output('blob');
  }

  window.gerarPDF = gerarPDF;
})();
