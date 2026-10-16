# Interdição e Embargo Mobile

Aplicativo web instalável (PWA) para preencher, no celular, os dados de um **Termo de Interdição ou de Embargo** e gerar o
PDF no mesmo layout do termo do Sistema Auditor, com campo para o empregador **assinar ou rubricar com o dedo**.

## Como usar

1. Abra o endereço do app no celular (Chrome, no Android) e use **Menu ⋮ → Adicionar à tela inicial**.
   Depois da primeira abertura ele funciona **sem internet**.
2. Em **Meus dados**, preencha uma vez: nome, CIF, linhas do cabeçalho da unidade, local e (opcional) endereço de
   protocolo e rubrica do AFT. Ficam salvos só no aparelho.
3. Preencha o empregador (nº do termo, CNPJ, CNAE, endereço...) e os **objetos** (tipo, paralisação total/parcial,
   descrição). Toque em **Gerar**.
4. Confira o texto, entregue o celular ao empregador, que preenche o recibo e assina no quadro. Toque em **Gerar PDF**
   e use **Compartilhar** (WhatsApp, e-mail...) ou **Baixar**.

## Privacidade

Nada sai do aparelho: não há servidor, conta nem envio de dados. Dados e rubrica ficam no armazenamento local do
navegador. O repositório não contém dado de empresa, trabalhador ou auditor.

## Observações

- O texto fixo do termo (fundamento, parágrafos finais e aviso penal) segue o modelo oficial. Confira com o seu
  modelo vigente antes de usar em ação fiscal.
- Os campos **Aut.** e **Cód. Download** são opcionais e só aparecem no PDF se você os digitar; o app não os gera.
- A fonte do PDF é Helvetica (a Tahoma do modelo é proprietária); posições, tamanhos e linhas seguem o modelo.
- O número do termo é opcional: em branco, o PDF sai com "Nº ______" e sem código de barras (o número vem depois).
- O texto do **Embargo** foi derivado do texto de interdição (troca de "interdição" por "embargo"); confira com um Termo de Embargo oficial. Este app **não substitui** o Sistema Auditor.

## Estrutura

`index.html`, `css/`, `js/` (`texto.js` texto fixo e máscaras, `pdf.js` layout do PDF, `app.js` interface),
`vendor/` (jsPDF 2.5.1 e JsBarcode 3.11.6, local para uso offline), `sw.js` e `manifest.webmanifest` (PWA).
Sem etapa de compilação: para testar localmente, sirva a pasta por HTTP (ex.: `python -m http.server`).
