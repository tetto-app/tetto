<p align="center"><img src="icon-512.png" width="120" alt="Logo do Tetto: a letra T com uma barra de progresso no traço de cima"></p>

# Tetto

Organizador financeiro pessoal com **teto de gastos por categoria e subcategoria**. A cada lançamento, o app mostra quanto você já gastou e quanto ainda pode gastar no mês, e acompanha a regra 50/30/20 sobre a sua receita.

Feito para uso no celular, em tema escuro e **sem internet** depois de instalado.

## Como o app é organizado

| Aba | O que tem |
|---|---|
| **Início** | Balanço do mês, saldo das contas e investimentos, fatura de cada cartão, regra 50/30/20 e tetos que passaram ou estão quase no limite |
| **Lançamentos** | Extrato do mês agrupado por dia, com filtros por tipo e por conta ou cartão |
| **Cartões** | Tudo de cartão de crédito: fatura aberta (já gasto e programado), limite, próximas faturas com parcelas, faturas anteriores, Nova compra, Pagar fatura e cadastro dos cartões |
| **Orçamento** | **Tetos e regra:** cada parte da regra 50/30/20 (limite, planejado e gasto) com as suas categorias e subcategorias, quanto resta em cada uma e a opção de mover categorias entre as partes. **Análise:** gráficos e tendências. Também é onde se editam as categorias e os tetos. |
| **Mais** | Ajustes gerais: porcentagens da regra 50/30/20, moeda, backup e exportação |

Cada coisa é gerenciada onde aparece: contas e investimentos no **Início** (com aplicar, resgatar e atualizar valor), cartões em **Cartões** e categorias e tetos no **Orçamento**.

O botão **+** abre um menu com as ações, e cada uma mostra só os campos dela: **Despesa**, **Receita**, **Compra no cartão** (com parcelas), **Investir** e **Transferir ou pagar fatura**.

## O que o app faz

- **Categorias e subcategorias com teto:** por exemplo, Moradia → Aluguel, Internet. O teto da categoria é a soma dos tetos das subcategorias.
- **Teto e Recorrente:** cada subcategoria tem um **teto** e a opção **Recorrente**.
  - **Recorrente** (aluguel, mercado, salário): o app lança sozinho todo mês, como pendente, no dia e na conta escolhidos. Para mudar o valor de um mês, basta editar o lançamento daquele mês.
  - **Ao lançar pelo +:** o app mostra o teto da subcategoria, quanto fica com o gasto e quanto ainda resta, ou quanto passou.
- **Regra 50/30/20:** mostra quanto da receita do mês vai para Necessidades, Desejos e Poupança, e funciona como trava:
  - um gasto que faria Necessidades ou Desejos passar do limite do mês só é lançado se você confirmar;
  - no Orçamento, quando os tetos de uma parte passam do limite, o app oferece ajustar o teto para o máximo que cabe.

  As porcentagens podem ser ajustadas.
- **Análise:** gráficos de barras dos últimos 6 ou 12 meses, por total, categoria ou subcategoria, com a linha do teto. Mostra a tendência em relação ao mesmo período do mês anterior (parabéns quando os gastos caem, alerta quando sobem), o que mais mudou, receitas x despesas e a regra 50/30/20 mês a mês.
- **Cartões de crédito:** compras parceladas (até 24x), limite usado e disponível, fatura separada em já gasto e programado e próximas faturas com as parcelas comprometidas.
- **Investimentos:** quantos precisar. A meta de Poupança conta só as aplicações (menos os resgates); as categorias da Poupança servem para planejar quanto guardar. Atualizar o valor registra o rendimento.
- **Previsto que não conta em dobro:** um gasto lançado numa subcategoria recorrente (o mercado, por exemplo) sai do previsto daquele mês, em vez de somar a ele.
- **Estorno no cartão:** ao abrir uma compra no cartão, **↩ Estornar esta compra** registra o valor devolvido, já com o cartão e a categoria da compra. Ele abate a fatura, libera o limite e devolve o valor ao teto da categoria escolhida.
- **Reajuste de saldo:** em Gerenciar contas, informe o saldo real de hoje. A diferença vira um "Ajuste de saldo", que não conta como receita nem despesa.
- **Fixos do mês:** despesas e receitas fixas são cadastradas no **Orçamento**, e o aporte mensal fica no próprio investimento, no **Início**. O app programa os próximos 12 meses como pendentes e vai estendendo sozinho. Em **Mais → Fixos do mês** há uma lista para consulta, e tocar num item leva para onde ele é editado.
- **Programados:** lançamentos com data futura já contam no orçamento daquele mês, sem mexer no saldo de hoje das contas.
- **Calendário e vencimentos:** a aba Lançamentos tem um calendário de vencimentos do mês, só com os recorrentes e as faturas dos cartões (gastos avulsos ficam no extrato), com pontos para a vencer, atrasado, fatura e pago; tocar num dia mostra o que vence nele. No Início, o card **Vencimentos** mostra o que está atrasado, vence hoje ou nos próximos 3 dias, incluindo as faturas dos cartões, com o botão para marcar como pago.
- **Backup e exportação:** backup completo em `.json`, planilha `.csv` para Excel e Google Planilhas, e lembrete quando o último backup tem mais de 30 dias.

## Privacidade

- Não pede login, nome, e-mail nem nenhum dado pessoal.
- Os dados ficam salvos **somente no aparelho** de quem usa, no armazenamento local do navegador.
- O app não envia dados para nenhum servidor. Este repositório contém apenas o código.

## Como instalar no Android

1. Abra o link do app (na seção **About** deste repositório) no **Chrome**.
2. Toque no menu **⋮** e depois em **Instalar app** (ou **Adicionar à tela inicial**).
3. Abra o app pelo ícone, defina os tetos e os recorrentes em **Orçamento**, confira as contas no **Início** e cadastre seus cartões em **Cartões**.

Dica: faça um backup de vez em quando em **Mais → Exportar backup**.

## Como funciona

É um PWA (Progressive Web App) feito com HTML, CSS e JavaScript puros, sem bibliotecas nem dependências externas.

| Arquivo | Função |
|---|---|
| `index.html` | O app: interface, estilos e lógica |
| `manifest.webmanifest` | Permite instalar o app na tela inicial |
| `sw.js` | Guarda o app no aparelho para funcionar sem internet |
| `icon-192.png`, `icon-512.png` | Ícones |

Para publicar uma versão nova, altere os arquivos e troque o nome do cache em `sw.js` (por exemplo, de `tetto-v1` para `tetto-v2`). O app se atualiza sozinho na próxima vez que for aberto com internet, sem perder os dados.

## Licença

**Todos os direitos reservados.** O código está público apenas para consulta e para o funcionamento do app. Não é permitido copiar, modificar, distribuir ou vender este código, no todo ou em parte, sem autorização. Veja o arquivo [LICENSE](LICENSE).

## Autoria

Projeto desenvolvido em coautoria com IA (Claude, da Anthropic): eu defini o problema, os requisitos e as decisões de produto, e o código foi gerado e revisado em conjunto com a IA. Baseado no Viaggeuro, app de orçamento de viagem do mesmo projeto.
