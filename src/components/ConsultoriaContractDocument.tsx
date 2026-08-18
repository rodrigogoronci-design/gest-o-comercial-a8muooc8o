import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import logoUrl from '@/assets/logomarca-service-ea011.png'

/**
 * Contrato de Prestação de Serviços de Consultoria de Estruturação
 * Operacional e Regulatória — Prysmian Cabos e Sistemas do Brasil S.A.
 *
 * Documento específico (NÃO é o contrato padrão de licença de uso de software).
 * Renderizado como documento visual formatado na aba "Contrato Inicial".
 *
 * O conteúdo jurídico abaixo é intocável. Apenas a diagramação (CSS) foi
 * totalmente refeita do zero. Ver bloco de estilos em src/main.css
 * ("Contrato de Consultoria (Prysmian) — diagramação profissional").
 */

type ClauseProps = {
  n: string
  title: string
  children: React.ReactNode
}

/** Bloco de uma cláusula: título + corpo. Título nunca se separa do corpo. */
function Clause({ n, title, children }: ClauseProps) {
  return (
    <section className="cc-clause">
      <h2 className="cc-clause-title">
        CLÁUSULA {n}ª &ndash; {title}
      </h2>
      <div className="cc-clause-body">{children}</div>
    </section>
  )
}

type SubProps = {
  n: string
  title?: string
  children: React.ReactNode
}

/** Subseção numerada (ex.: 1.1, 2.3). */
function Sub({ n, title, children }: SubProps) {
  return (
    <div className="cc-sub">
      {title ? (
        <p className="cc-sub-head">
          <strong>
            {n}. {title}
          </strong>
        </p>
      ) : (
        <p className="cc-sub-head">
          <strong>{n}.</strong>{' '}
        </p>
      )}
      <div className="cc-sub-body">{children}</div>
    </div>
  )
}

/** Lista de alíneas (a, b, c). */
function Alineas({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="cc-alineas">
      {items.map((it, i) => (
        <li key={i} value={i + 1}>
          {it}
        </li>
      ))}
    </ol>
  )
}

/** Lista numerada (1, 2, 3) — usada para anexos. */
function Numeros({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="cc-numeros">
      {items.map((it, i) => (
        <li key={i} value={i + 1}>
          {it}
        </li>
      ))}
    </ol>
  )
}

export function ConsultoriaContractDocument() {
  const handlePrint = () => {
    const printContent = document.getElementById('consultoria-contract-print')
    if (printContent) {
      const originalContents = document.body.innerHTML
      document.body.innerHTML = printContent.outerHTML
      window.print()
      document.body.innerHTML = originalContents
      window.location.reload()
    }
  }

  return (
    <div className="space-y-3">
      <div className="cc-no-print flex justify-end gap-2 print:hidden">
        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
          <Printer className="h-4 w-4 mr-2" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <div id="consultoria-contract-print" className="cc-doc">
        {/* =========================================================
            CABEÇALHO: logomarca Service Logic + título do contrato
            (visível em tela e no PDF; a borda laranja vem do CSS .cc-header)
           ========================================================= */}
        <div className="cc-header">
          <img src={logoUrl} alt="Service Logic" className="cc-logo" />
          <h1 className="cc-doc-title">
            CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSULTORIA DE ESTRUTURAÇÃO OPERACIONAL E
            REGULATÓRIA
          </h1>
        </div>

        {/* =========================================================
            QUALIFICAÇÃO DAS PARTES
           ========================================================= */}
        <section className="cc-qualif">
          <p>Pelo presente instrumento particular, de um lado:</p>

          <p>
            <strong>PRYSMIAN CABOS E SISTEMAS DO BRASIL S.A.</strong>, pessoa jurídica de direito
            privado, inscrita no CNPJ sob nº 61.150.751/0035-28, com sede à VILA ISABEL, S/N, SÃO
            TORQUATO, VILA VELHA – ES, neste ato representada na forma de seus atos constitutivos,
            doravante denominada <strong>CONTRATANTE</strong>;
          </p>

          <p>e, de outro lado,</p>

          <p>
            <strong>CONTACTO SOLUÇÕES EM TECNOLOGIA – LTDA</strong>, pessoa jurídica de direito
            privado, inscrita no CNPJ sob nº 27.751.577/0001-91, com sede na Av. Central, nº 1439,
            Sala 201, Ed. Comercial Santa Clara, Laranjeiras, Serra/ES, neste ato representada na
            forma de seus atos constitutivos, doravante denominada <strong>CONTRATADA</strong>;
          </p>

          <p>
            têm entre si justo e contratado o presente Contrato de Prestação de Serviços de
            Consultoria de Estruturação Operacional e Regulatória, mediante as cláusulas e condições
            seguintes.
          </p>
        </section>

        {/* =========================================================
            CLÁUSULA 1 — DO OBJETO
           ========================================================= */}
        <Clause n="1" title="DO OBJETO">
          <Sub n="1.1">
            O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços
            especializados de consultoria para estruturação operacional e regulatória da operação de
            transporte rodoviário de cargas da CONTRATANTE, especialmente no contexto das operações
            destinadas ao atendimento da Petrobras, envolvendo a contratação de transportadoras
            terceiras/subcontratadas e a emissão de documentos fiscais relacionados ao transporte.
          </Sub>
          <Sub n="1.2">
            A consultoria terá como finalidade compreender o modelo operacional pretendido pela
            CONTRATANTE, analisar os requisitos regulatórios aplicáveis e estruturar os processos
            necessários para que a operação possa ser conduzida de forma organizada, rastreável e
            aderente às exigências identificadas no projeto.
          </Sub>
          <Sub n="1.3">
            O trabalho será desenvolvido considerando as informações, documentos e premissas
            fornecidos pela CONTRATANTE ao longo da execução do projeto.
          </Sub>
          <Sub n="1.4">
            Integram este contrato, para todos os fins, a Proposta Comercial de Estruturação e
            Implantação Operacional aprovada pela CONTRATANTE, bem como os documentos e informações
            formalmente fornecidos durante o projeto.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 2 — DO CONTEXTO DA OPERAÇÃO
           ========================================================= */}
        <Clause n="2" title="DO CONTEXTO DA OPERAÇÃO">
          <Sub n="2.1">
            Para fins de planejamento da consultoria, as partes consideram, inicialmente, o seguinte
            cenário informado pela CONTRATANTE:
            <Alineas
              items={[
                'a operação está relacionada ao atendimento de demandas da Petrobras;',
                'a contratação do transporte será realizada pela CONTRATANTE junto a transportadoras terceirizadas homologadas;',
                'atualmente existem, segundo informações fornecidas pela CONTRATANTE, duas transportadoras homologadas pela Petrobras aptas a executar a operação;',
                'a CONTRATANTE pretende assumir a emissão dos documentos relacionados ao transporte, especialmente o CT-e, em razão de exigências relacionadas à operação;',
                'a CONTRATANTE já realizou adequações cadastrais, incluindo alteração de CNAE e cadastro junto à ANTT, conforme informado durante os alinhamentos;',
                'a CONTRATANTE já possui solução tecnológica utilizada para emissão de CT-es marítimos e avalia sua utilização também para as operações terrestres;',
                'durante o período de estruturação, poderá ser utilizado o sistema da CONTRATADA como alternativa operacional para emissão dos documentos de transporte, caso necessário e mediante alinhamento entre as partes;',
                'a operação inicialmente estimada contempla aproximadamente 3 carretas por trimestre, podendo esse volume ser alterado conforme a demanda da Petrobras;',
                'as cargas inicialmente informadas correspondem a acessórios/caixaria, transportados predominantemente em carreta;',
                'foram informadas como origens a unidade da Prysmian em Cariacica/ES e como destinos bases da Petrobras em Vitória/ES e São João da Barra/RJ.',
              ]}
            />
          </Sub>
          <Sub n="2.2">
            As premissas acima poderão ser revisadas durante a consultoria caso o levantamento
            operacional identifique características diferentes daquelas inicialmente apresentadas.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 3 — DO ESCOPO DA CONSULTORIA
           ========================================================= */}
        <Clause n="3" title="DO ESCOPO DA CONSULTORIA">
          <Sub n="3.1">
            A Etapa 1 contratada compreende a realização de Consultoria de Estruturação Operacional
            e Regulatória, contemplando, entre outros trabalhos necessários ao objetivo contratado:
          </Sub>

          <div className="cc-subitems">
            <Sub n="3.1.1" title="Levantamento e entendimento da operação">
              <Alineas
                items={[
                  'compreensão detalhada do modelo operacional pretendido;',
                  'levantamento do fluxo atual e do fluxo projetado;',
                  'identificação dos participantes da operação;',
                  'identificação das responsabilidades de cada área envolvida;',
                  'entendimento do processo de contratação das transportadoras;',
                  'análise do fluxo documental;',
                  'entendimento do processo de solicitação, contratação, execução e encerramento do transporte;',
                  'levantamento das premissas e restrições operacionais apresentadas pela Petrobras;',
                  'entendimento dos processos internos da CONTRATANTE relacionados à operação.',
                ]}
              />
            </Sub>

            <Sub n="3.1.2" title="Estruturação regulatória">
              <p>
                A consultoria contemplará análise dos requisitos regulatórios relacionados à
                atividade de transporte rodoviário aplicáveis ao modelo apresentado pela
                CONTRATANTE, incluindo, conforme pertinência ao caso:
              </p>
              <Alineas
                items={[
                  'requisitos relacionados à ANTT;',
                  'RNTRC e enquadramento dos participantes da operação;',
                  'requisitos relacionados à contratação de transportadoras terceirizadas;',
                  'CIOT;',
                  'Vale-Pedágio Obrigatório;',
                  'seguros obrigatórios relacionados à operação de transporte;',
                  'responsabilidades regulatórias atribuíveis à CONTRATANTE e às transportadoras contratadas;',
                  'requisitos documentais relacionados à execução do transporte;',
                  'análise das obrigações relacionadas à emissão dos documentos de transporte;',
                  'identificação de requisitos específicos apresentados pela Petrobras que impactem a operação;',
                  'análise dos principais pontos de atenção regulatórios identificados no modelo proposto.',
                ]}
              />
            </Sub>

            <Sub n="3.1.3" title="Análise do modelo de emissão do CT-e">
              <p>
                A consultoria contemplará a análise operacional e regulatória do modelo pretendido
                para emissão do CT-e pela CONTRATANTE, considerando:
              </p>
              <Alineas
                items={[
                  'participação da Prysmian na operação;',
                  'contratação de transportadoras terceirizadas;',
                  'responsabilidades de cada participante;',
                  'informações necessárias para emissão dos documentos;',
                  'fluxo entre contratação, execução e documentação do transporte;',
                  'pontos de atenção relacionados ao modelo proposto.',
                ]}
              />
            </Sub>

            <Sub n="3.1.4" title="Responsabilidades entre as partes">
              <p>
                Será realizado o levantamento e direcionamento das responsabilidades relacionadas à
                operação entre:
              </p>
              <ul className="cc-bullets">
                <li>Prysmian;</li>
                <li>transportadoras subcontratadas;</li>
                <li>demais participantes que venham a ser identificados como relevantes.</li>
              </ul>
              <p>
                O objetivo será estabelecer uma visão estruturada de quem executa, quem fornece as
                informações, quem emite documentos, quem controla e quem responde por cada etapa do
                processo, dentro dos limites da consultoria contratada.
              </p>
            </Sub>

            <Sub n="3.1.5" title="Fluxo operacional">
              <p>Será estruturado o fluxo macro da operação, contemplando:</p>
              <div className="cc-flow">
                solicitação da Petrobras → contratação da transportadora → disponibilização das
                informações → emissão documental → execução do transporte → pedágio/CIOT e demais
                obrigações → comprovação da operação → encerramento/medição.
              </div>
              <p>
                O fluxo definitivo será ajustado após o levantamento detalhado das premissas e
                procedimentos internos da CONTRATANTE.
              </p>
            </Sub>
          </div>
        </Clause>

        {/* =========================================================
            CLÁUSULA 4 — DOS REQUISITOS DA PETROBRAS
           ========================================================= */}
        <Clause n="4" title="DOS REQUISITOS DA PETROBRAS">
          <Sub n="4.1">
            Considerando que a operação está vinculada ao atendimento da Petrobras, a CONTRATANTE
            fornecerá à CONTRATADA os contratos, procedimentos, cláusulas, manuais, documentos e
            demais requisitos aplicáveis que estejam sob sua posse.
          </Sub>
          <Sub n="4.2">
            A CONTRATADA analisará, dentro do escopo contratado, os requisitos que tenham impacto
            direto sobre a estruturação operacional e regulatória do transporte rodoviário.
          </Sub>
          <Sub n="4.3">
            A CONTRATADA não será responsável por interpretar ou emitir parecer sobre obrigações
            contratuais da Petrobras que não estejam relacionadas diretamente ao objeto desta
            consultoria.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 5 — DOS ENTREGÁVEIS
           ========================================================= */}
        <Clause n="5" title="DOS ENTREGÁVEIS">
          <Sub n="5.1">
            Como resultado da Etapa 1, a CONTRATADA apresentará os materiais resultantes da
            consultoria, que poderão contemplar:
            <Alineas
              items={[
                'levantamento estruturado da operação;',
                'identificação das premissas operacionais;',
                'identificação dos participantes e respectivas responsabilidades;',
                'fluxo operacional proposto;',
                'direcionamento quanto aos requisitos regulatórios analisados;',
                'identificação dos pontos de atenção regulatórios;',
                'identificação de riscos e respectivas medidas de tratamento ou mitigação, quando aplicável;',
                'direcionamentos relacionados a CIOT, Vale-Pedágio, seguros e demais obrigações analisadas;',
                'direcionamentos relacionados ao modelo de contratação das transportadoras;',
                'direcionamento quanto ao modelo operacional de emissão do CT-e;',
                'identificação de eventuais ajustes necessários no modelo analisado;',
                'conclusão técnica/consultiva quanto à estrutura operacional e regulatória analisada, dentro dos limites do escopo contratado.',
              ]}
            />
          </Sub>
          <Sub n="5.2">
            A entrega terá caráter consultivo e orientativo, não constituindo parecer jurídico,
            tributário ou contábil.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 6 — DOS LIMITES DA CONSULTORIA
           ========================================================= */}
        <Clause n="6" title="DOS LIMITES DA CONSULTORIA">
          <Sub n="6.1">
            A presente contratação não contempla assessoria ou parecer jurídico, tributário ou
            contábil.
          </Sub>
          <Sub n="6.2">
            A análise regulatória realizada pela CONTRATADA será direcionada à atividade de
            transporte rodoviário e aos processos operacionais relacionados ao modelo apresentado,
            considerando a legislação e os requisitos regulatórios aplicáveis identificados durante
            o projeto.
          </Sub>
          <Sub n="6.3">
            Quando determinada questão exigir interpretação jurídica, tributária ou contábil
            específica, a CONTRATADA poderá indicar a necessidade de validação pela área competente
            da CONTRATANTE ou por assessor especializado por ela contratado.
          </Sub>
          <Sub n="6.4">
            A conclusão da consultoria não substitui eventual manifestação de órgãos reguladores,
            autoridades fiscais, Petrobras ou demais entidades competentes.
          </Sub>
          <Sub n="6.5">
            A CONTRATADA não garante aprovação, homologação ou autorização da operação por terceiros
            ou órgãos públicos.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 7 — DO PASSIVO ANTERIOR
           ========================================================= */}
        <Clause n="7" title="DO PASSIVO ANTERIOR">
          <Sub n="7.1">
            A presente contratação está direcionada à estruturação e regularização do modelo
            operacional a ser utilizado daqui em diante, não abrangendo, salvo contratação adicional
            expressa, a análise, regularização, retificação ou tratamento de operações/passivos
            históricos anteriores ao início do projeto.
          </Sub>
          <Sub n="7.2">
            Caso durante a consultoria sejam identificadas situações relacionadas a períodos
            anteriores que demandem atuação específica, as partes poderão avaliar a contratação de
            trabalho adicional.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 8 — DA ETAPA 2 – IMPLANTAÇÃO SISTÊMICA
           ========================================================= */}
        <Clause n="8" title="DA ETAPA 2 – IMPLANTAÇÃO SISTÊMICA">
          <Sub n="8.1">
            A eventual implantação e parametrização do sistema Service Logic não integra a obrigação
            principal deste contrato.
          </Sub>
          <Sub n="8.2">
            A CONTRATANTE poderá, caso tenha interesse e necessidade, solicitar posteriormente a
            contratação da Etapa 2 – Consultoria de Implantação e Parametrização do Sistema, cujo
            investimento inicialmente apresentado na proposta comercial é de R$ 5.900,00.
          </Sub>
          <Sub n="8.3">
            A contratação da Etapa 2 dependerá de solicitação e aprovação específica da CONTRATANTE,
            não constituindo obrigação de contratação decorrente deste instrumento.
          </Sub>
          <Sub n="8.4">
            Durante a Etapa 1, a CONTRATADA poderá avaliar e recomendar soluções tecnológicas que
            sejam adequadas ao modelo operacional identificado.
          </Sub>
          <Sub n="8.5">
            Caso a solução atualmente utilizada pela CONTRATANTE não esteja disponível ou não seja
            suficiente para suportar a operação durante a fase de transição, as partes poderão
            avaliar a utilização temporária do sistema Service Logic, mediante alinhamento comercial
            e técnico específico.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 9 — DAS OBRIGAÇÕES DA CONTRATADA
           ========================================================= */}
        <Clause n="9" title="DAS OBRIGAÇÕES DA CONTRATADA">
          <p>São obrigações da CONTRATADA:</p>
          <Alineas
            items={[
              'executar os serviços com diligência e conhecimento técnico compatível com o objeto contratado;',
              'realizar as reuniões necessárias ao levantamento das informações;',
              'analisar os documentos disponibilizados pela CONTRATANTE;',
              'estruturar os fluxos e direcionamentos previstos no escopo;',
              'manter comunicação com o ponto focal definido pela CONTRATANTE;',
              'informar eventuais inconsistências ou informações adicionais necessárias à execução;',
              'apresentar os resultados e entregáveis previstos;',
              'manter sigilo sobre as informações recebidas durante a execução do projeto.',
            ]}
          />
        </Clause>

        {/* =========================================================
            CLÁUSULA 10 — DAS OBRIGAÇÕES DA CONTRATANTE
           ========================================================= */}
        <Clause n="10" title="DAS OBRIGAÇÕES DA CONTRATANTE">
          <p>São obrigações da CONTRATANTE:</p>
          <Alineas
            items={[
              'disponibilizar as informações necessárias à execução dos serviços;',
              'fornecer documentos, contratos, procedimentos e requisitos da Petrobras que sejam relevantes ao projeto;',
              'disponibilizar acesso aos profissionais responsáveis pelas áreas envolvidas;',
              'indicar um ponto focal oficial para centralização dos alinhamentos;',
              'garantir a participação das áreas necessárias, especialmente Operação/Logística, Jurídico, Fiscal/Tributário, Compras/Contratos e demais áreas envolvidas;',
              'fornecer informações verdadeiras, completas e atualizadas;',
              'analisar e validar os materiais apresentados dentro dos prazos acordados;',
              'efetuar os pagamentos nas condições estabelecidas neste contrato.',
            ]}
          />
        </Clause>

        {/* =========================================================
            CLÁUSULA 11 — DO PONTO FOCAL
           ========================================================= */}
        <Clause n="11" title="DO PONTO FOCAL">
          <Sub n="11.1">
            Para centralização das comunicações e organização do projeto, a CONTRATANTE indicou:
            <div className="cc-callout">
              <p>
                <strong>Gabriel Cavallaro</strong>
              </p>
              <p>Cargo: Supervisor de Logística</p>
              <p>E-mail: gabriel.cavallaro@prysmian.com</p>
              <p>Telefone: (27) 99662-1984</p>
            </div>
          </Sub>
          <Sub n="11.2">
            O ponto focal será responsável por centralizar internamente as informações e direcionar
            as demandas da CONTRATADA às áreas responsáveis.
          </Sub>
          <Sub n="11.3">
            A indicação de um ponto focal não impede a participação de outros profissionais da
            CONTRATANTE nas reuniões ou atividades técnicas, quando necessária.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 12 — DOS RESPONSÁVEIS POR ÁREA
           ========================================================= */}
        <Clause n="12" title="DOS RESPONSÁVEIS POR ÁREA">
          <Sub n="12.1">
            Conforme informações fornecidas pela CONTRATANTE, foram indicados os seguintes
            responsáveis:
            <div className="cc-area-list">
              <p>
                <strong>Operação/Logística:</strong> Gabriel Cavallaro – Supervisor de Logística.
              </p>
              <p>
                <strong>Jurídico:</strong> Luciana Perusseto – Legal Manager LATAM.
              </p>
              <p>
                <strong>Fiscal/Tributário:</strong> João Gimenes – Tax Manager.
              </p>
              <p>
                <strong>Compras/Contratos:</strong> Lucas Sousa – Comprador.
              </p>
              <p>
                <strong>Financeiro:</strong> Eleidiane D. Boone – Sr. Tax Analyst.
              </p>
            </div>
          </Sub>
          <Sub n="12.2">
            A CONTRATANTE poderá substituir ou complementar os responsáveis durante a execução do
            projeto.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 13 — DO PRAZO
           ========================================================= */}
        <Clause n="13" title="DO PRAZO">
          <Sub n="13.1">
            A Etapa 1 possui prazo estimado de 30 a 45 dias úteis, contados a partir do cumprimento
            das condições necessárias ao início efetivo dos trabalhos.
          </Sub>
          <Sub n="13.2">
            O prazo poderá ser impactado caso haja atraso no fornecimento de documentos,
            informações, acessos, validações ou participação dos responsáveis indicados pela
            CONTRATANTE.
          </Sub>
          <Sub n="13.3">
            Eventuais alterações relevantes no escopo ou nas premissas da operação poderão ensejar
            revisão do cronograma.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 14 — DO VALOR E CONDIÇÕES DE PAGAMENTO
           ========================================================= */}
        <Clause n="14" title="DO VALOR E CONDIÇÕES DE PAGAMENTO">
          <Sub n="14.1">
            Pela execução da Etapa 1 – Consultoria de Estruturação Operacional e Regulatória, a
            CONTRATANTE pagará à CONTRATADA o valor total de:
            <div className="cc-value-box">
              <span className="cc-value-amount">R$ 39.900,00</span>
              <span className="cc-value-ext">(trinta e nove mil e novecentos reais)</span>
            </div>
          </Sub>
          <Sub n="14.2">
            O pagamento será realizado da seguinte forma:
            <div className="cc-pay-list">
              <p>
                <strong>a)</strong> 50% na assinatura do contrato: <strong>R$ 19.950,00</strong>{' '}
                (dezenove mil, novecentos e cinquenta reais);
              </p>
              <p>
                <strong>b)</strong> 50% na conclusão da Etapa 1 e entrega dos resultados previstos:{' '}
                <strong>R$ 19.950,00</strong> (dezenove mil, novecentos e cinquenta reais).
              </p>
            </div>
          </Sub>
          <Sub n="14.3">
            O faturamento será realizado mediante emissão do documento fiscal correspondente,
            observadas as condições previamente alinhadas entre as partes.
          </Sub>
          <Sub n="14.4">
            Eventuais retenções tributárias legalmente obrigatórias serão realizadas pela
            CONTRATANTE, quando aplicáveis, observada a legislação vigente e as orientações fiscais
            apresentadas pelas partes.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 15 — DOS SERVIÇOS ADICIONAIS
           ========================================================= */}
        <Clause n="15" title="DOS SERVIÇOS ADICIONAIS">
          <Sub n="15.1">
            Qualquer atividade não contemplada expressamente neste contrato deverá ser previamente
            avaliada entre as partes.
          </Sub>
          <Sub n="15.2">
            Havendo necessidade de ampliação do escopo, será realizada avaliação comercial e técnica
            específica antes do início da atividade adicional.
          </Sub>
          <Sub n="15.3">
            Nenhuma atividade adicional será considerada automaticamente incluída no valor
            contratado.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 16 — DA CONFIDENCIALIDADE
           ========================================================= */}
        <Clause n="16" title="DA CONFIDENCIALIDADE">
          <Sub n="16.1">
            As partes comprometem-se a manter sigilo sobre todas as informações técnicas,
            comerciais, operacionais, estratégicas, financeiras e documentais às quais tenham acesso
            em razão deste contrato.
          </Sub>
          <Sub n="16.2">
            As informações somente poderão ser utilizadas para execução do objeto contratado.
          </Sub>
          <Sub n="16.3">
            A obrigação de confidencialidade permanecerá vigente mesmo após o encerramento do
            contrato, enquanto as informações permanecerem de natureza confidencial.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 17 — DA PROTEÇÃO DE DADOS
           ========================================================= */}
        <Clause n="17" title="DA PROTEÇÃO DE DADOS">
          <Sub n="17.1">
            As partes comprometem-se a observar a legislação aplicável à proteção de dados pessoais,
            especialmente a Lei nº 13.709/2018 – Lei Geral de Proteção de Dados (LGPD).
          </Sub>
          <Sub n="17.2">
            Eventuais dados pessoais disponibilizados à CONTRATADA deverão ser utilizados
            exclusivamente para execução das atividades previstas neste contrato.
          </Sub>
          <Sub n="17.3">
            Cada parte será responsável pelas medidas de segurança aplicáveis aos dados sob sua
            responsabilidade.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 18 — DA PROPRIEDADE DOS MATERIAIS
           ========================================================= */}
        <Clause n="18" title="DA PROPRIEDADE DOS MATERIAIS">
          <Sub n="18.1">
            Os materiais, fluxos, análises e documentos produzidos especificamente para a
            CONTRATANTE no âmbito desta contratação poderão ser utilizados pela CONTRATANTE para
            fins internos relacionados à operação objeto do projeto.
          </Sub>
          <Sub n="18.2">
            Permanecem de titularidade da CONTRATADA seus métodos, conhecimentos, modelos,
            ferramentas, metodologias, templates, sistemas e materiais preexistentes utilizados na
            execução da consultoria.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 19 — DA INEXISTÊNCIA DE VÍNCULO
           ========================================================= */}
        <Clause n="19" title="DA INEXISTÊNCIA DE VÍNCULO">
          <Sub n="19.1">
            O presente contrato não estabelece qualquer relação societária, trabalhista,
            representação comercial, mandato ou vínculo empregatício entre as partes.
          </Sub>
          <Sub n="19.2">
            Cada parte será responsável pelas obrigações decorrentes de seus próprios empregados,
            prestadores e representantes.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 20 — DA RESCISÃO
           ========================================================= */}
        <Clause n="20" title="DA RESCISÃO">
          <Sub n="20.1">
            O presente contrato poderá ser rescindido:
            <Alineas
              items={[
                'por acordo entre as partes;',
                'pelo descumprimento de obrigação contratual não sanado após notificação;',
                'por impossibilidade superveniente de execução do objeto;',
                'por qualquer outra hipótese prevista na legislação aplicável.',
              ]}
            />
          </Sub>
          <Sub n="20.2">
            Na hipótese de rescisão após o início dos trabalhos, deverão ser considerados os
            serviços efetivamente executados até a data de encerramento, bem como os valores já
            devidos.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 21 — DA RESPONSABILIDADE DAS PARTES
           ========================================================= */}
        <Clause n="21" title="DA RESPONSABILIDADE DAS PARTES">
          <Sub n="21.1">
            A CONTRATADA responderá pela execução dos serviços dentro dos limites do escopo
            contratado.
          </Sub>
          <Sub n="21.2">
            A CONTRATADA não será responsável por decisões tomadas pela CONTRATANTE com base nos
            direcionamentos apresentados, quando tais decisões dependerem de validação jurídica,
            tributária, contábil, regulatória ou de terceiros.
          </Sub>
          <Sub n="21.3">
            A CONTRATANTE será responsável pela veracidade, integralidade e atualização das
            informações fornecidas à CONTRATADA.
          </Sub>
          <Sub n="21.4">
            A CONTRATADA não será responsável por alterações legislativas, regulatórias, contratuais
            ou operacionais ocorridas após a conclusão da análise que alterem as premissas
            consideradas no projeto.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 22 — DAS COMUNICAÇÕES
           ========================================================= */}
        <Clause n="22" title="DAS COMUNICAÇÕES">
          <Sub n="22.1">
            As comunicações relacionadas à execução do projeto serão realizadas preferencialmente
            por e-mail e/ou pelos canais previamente definidos entre os pontos focais.
          </Sub>
          <Sub n="22.2">
            A CONTRATANTE deverá manter atualizados os dados de seus responsáveis e pontos focais.
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 23 — DAS DISPOSIÇÕES GERAIS
           ========================================================= */}
        <Clause n="23" title="DAS DISPOSIÇÕES GERAIS">
          <Sub n="23.1">Qualquer alteração deste contrato deverá ser formalizada por escrito.</Sub>
          <Sub n="23.2">
            A eventual tolerância de uma parte quanto ao descumprimento de determinada obrigação não
            constituirá renúncia ou alteração contratual.
          </Sub>
          <Sub n="23.3">
            Caso qualquer disposição deste contrato seja considerada inválida, as demais
            permanecerão em pleno vigor.
          </Sub>
          <Sub n="23.4">
            Integram este instrumento, quando aplicáveis:
            <Numeros
              items={[
                'Anexo I – Proposta Comercial aprovada;',
                'Anexo II – Escopo e cronograma da consultoria;',
                'Anexo III – Documentos e informações fornecidos pela CONTRATANTE.',
              ]}
            />
          </Sub>
        </Clause>

        {/* =========================================================
            CLÁUSULA 24 — DO FORO
           ========================================================= */}
        <Clause n="24" title="DO FORO">
          <Sub n="24.1">
            Fica eleito o foro da comarca de Serra, Estado do Espírito Santo, para dirimir eventuais
            controvérsias decorrentes deste contrato, com renúncia expressa a qualquer outro, por
            mais privilegiado que seja.
          </Sub>
        </Clause>

        {/* =========================================================
            BLOCO FINAL — encerramento + assinaturas
            (mantido sempre junto, nunca isolado em página separada)
           ========================================================= */}
        <section className="cc-final">
          <p className="cc-final-intro">
            E, por estarem de acordo, as partes firmam o presente instrumento.
          </p>
          <p className="cc-final-local">Serra/ES, 20 de agosto de 2026.</p>

          {/* Assinaturas — Contratante e Contratada lado a lado */}
          <div className="cc-signatures">
            <div className="cc-sign-block">
              <div className="cc-sign-line" />
              <p className="cc-sign-role">CONTRATANTE</p>
              <p className="cc-sign-name">PRYSMIAN CABOS E SISTEMAS DO BRASIL S.A.</p>
              <p className="cc-sign-field">
                Representante: <strong>Gabriel Cavallaro</strong>
              </p>
              <p className="cc-sign-field">Cargo: Supervisor de Logística</p>
              <p className="cc-sign-field">CPF: 359.459.628-13</p>
            </div>

            <div className="cc-sign-block">
              <div className="cc-sign-line" />
              <p className="cc-sign-role">CONTRATADA</p>
              <p className="cc-sign-name">CONTACTO SOLUÇÕES EM TECNOLOGIA – LTDA</p>
              <p className="cc-sign-field">
                Representante: <strong>Rodrigo Goronci Sant&apos;Ana</strong>
              </p>
              <p className="cc-sign-field">Cargo: Sócio-Administrador</p>
              <p className="cc-sign-field">CPF: 022.885.287-02</p>
              <p className="cc-sign-field">RG: 1.165.84 SSP-ES</p>
            </div>
          </div>
        </section>

        {/* Rodapé visível apenas na tela (o rodapé do PDF vem de @page) */}
        <div className="cc-screen-footer">Contrato de Consultoria — Prysmian × Contacto</div>
      </div>
    </div>
  )
}
