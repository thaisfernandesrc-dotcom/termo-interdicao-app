// Texto fixo do Termo de Interdição (copiado literalmente do modelo oficial) e formatadores.
window.TERMO = (function () {
  const FUNDAMENTO =
    'Com fundamento na decisão proferida pela 2ª Turma do Tribunal Regional do Trabalho da 14ª Região ' +
    'nos autos do processo n° 0010450-12.2013.5.14.0008, a qual declarou que os Auditores-Fiscais do ' +
    'Trabalho estão autorizados, em todo território nacional, a interditar estabelecimento, setor de serviço, ' +
    'máquina ou equipamento, e embargar obra, quando constatada situação de grave e iminente risco à ' +
    'saúde ou à segurança dos trabalhadores, sem necessidade da medida ser previamente autorizada ou ' +
    'confirmada por autoridade diversa não envolvida na ação fiscal; e em conformidade com as disposições ' +
    'legais e regulamentares previstas no Art. 7º, inciso XXII da Constituição Federal, no Art. 161 da ' +
    'Consolidação das Leis Trabalhistas - CLT e no Art. 80 da Portaria nº 672/2021, do Ministério do Trabalho ' +
    'e Previdência e considerando o que dispõe o item 3.2 e seguintes da Norma Regulamentadora nº 03, fica ' +
    'determinada a INTERDIÇÃO dos objetos abaixo descritos, nos termos da Consolidação das Leis do ' +
    'Trabalho, em razão da constatação da situação de grave e iminente risco descrita no Relatório Técnico ' +
    'anexo a este Termo.';

  const PARAGRAFOS = [
    'Durante a paralisação dos serviços, em decorrência da interdição, os empregados devem receber os ' +
      'salários como se estivessem em efetivo exercício, nos termos do § 6º do art. 161 da Consolidação das ' +
      'Leis do Trabalho.',
    'É facultado ao empregador recorrer da interdição imposta, no prazo de dez dias, nos termos do § 3º do ' +
      'artigo 161 da Consolidação das Leis do Trabalho.',
    'O empregador poderá requerer o levantamento da interdição, após adoção das medidas de proteção da ' +
      'segurança e saúde no trabalho indicadas no Relatório Técnico anexo a este Termo.',
    'Durante a vigência da interdição, podem ser desenvolvidas atividades necessárias à correção da situação ' +
      'de grave e iminente risco, desde que garantidas condições de segurança e saúde aos trabalhadores ' +
      'envolvidos.',
    'Os documentos referentes à interdição imposta, incluído o requerimento para o levantamento, devem ser ' +
      'protocolizados, preferencialmente, por meio do peticionamento eletrônico, por usuário externo do ' +
      'Sistema Eletrônico de Informações - SEI, selecionando o tipo de processo "Fiscalização do Trabalho: ' +
      'Termo de Embargo/Interdição" e indicando a unidade da federação do local do embargo ou interdição, ' +
      'nos termos do art. 89 da Portaria nº 672, de 8 de novembro de 2021.',
    '@PROTOCOLO', // "Podem, ainda, ser protocolizados no seguinte endereço: ..." (só se informado)
    'A retomada das atividades deve ser precedida da emissão de Termo de Levantamento de Interdição.',
  ];

  const AVISO_PENAL =
    'Responderá por desobediência à ordem legal de funcionário público e por expor a vida ou a saúde de ' +
    'outrem a perigo direto e iminente, respectivamente tipificados nos artigos 330 e 132 do Código Penal ' +
    'Brasileiro, sem prejuízo das demais sanções cabíveis, quem ordenar ou permitir a realização ou ' +
    'continuação da referida operação ou atividade após a presente determinação de INTERDIÇÃO.';

  const TIPOS_OBJETO = ['Máquina/Equipamento', 'Setor de Serviço', 'Estabelecimento'];

  const dig = (s) => String(s || '').replace(/\D/g, '');

  function paragrafos(d) {
    const out = [];
    PARAGRAFOS.forEach((p) => {
      if (p === '@PROTOCOLO') {
        if (d.protocolo && d.protocolo.trim())
          out.push('Podem, ainda, ser protocolizados no seguinte endereço: ' + d.protocolo.trim());
      } else out.push(p);
    });
    return out;
  }

  return {
    FUNDAMENTO, PARAGRAFOS, AVISO_PENAL, TIPOS_OBJETO, paragrafos,
    dig,
    fmtNumero(v) {
      const d = dig(v);
      if (d.length < 2) return d;
      const corpo = d.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return corpo + '-' + d.slice(-1);
    },
    fmtCnpj(v) {
      const d = dig(v).slice(0, 14);
      return d.replace(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2}).*/, (m, a, b, c, e, f) =>
        a + (b ? '.' + b : '') + (c ? '.' + c : '') + (e ? '/' + e : '') + (f ? '-' + f : ''));
    },
    fmtCpf(v) {
      const d = dig(v).slice(0, 11);
      return d.replace(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2}).*/, (m, a, b, c, e) =>
        a + (b ? '.' + b : '') + (c ? '.' + c : '') + (e ? '-' + e : ''));
    },
    fmtCep(v) {
      const d = dig(v).slice(0, 8);
      return d.replace(/^(\d{0,2})(\d{0,3})(\d{0,3}).*/, (m, a, b, c) => a + (b ? '.' + b : '') + (c ? '-' + c : ''));
    },
    fmtCnae(v) {
      const d = dig(v).slice(0, 7);
      return d.replace(/^(\d{0,4})(\d{0,1})(\d{0,2}).*/, (m, a, b, c) => a + (b ? '-' + b : '') + (c ? '/' + c : ''));
    },
    hojeBR() {
      const t = new Date();
      return String(t.getDate()).padStart(2, '0') + '/' + String(t.getMonth() + 1).padStart(2, '0') + '/' + t.getFullYear();
    },
    isoParaBR(iso) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
      return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
    },
  };
})();
