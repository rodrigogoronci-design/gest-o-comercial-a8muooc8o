import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import logoUrl from '@/assets/logomarca-service-ea011.png'

/**
 * Contrato de Prestação de Serviços de Consultoria de Estruturação
 * Operacional e Regulatória — Prysmian Cabos e Sistemas do Brasil S.A.
 *
 * Documento específico (NÃO é o contrato padrão de licença de uso de software).
 * Renderizado como documento visual formatado na aba "Contrato Inicial".
 */

const Clause = ({
  n,
  title,
  children,
}: {
  n: string
  title: string
  children: React.ReactNode
}) => (
  <div className="contract-clause mb-4 break-inside-avoid">
    <h3 className="contract-clause-title font-bold uppercase mt-5 mb-2.5 text-[13px] text-[#1b4382] border-b border-[#1b4382]/30 pb-1">
      CLÁUSULA {n}ª – {title}
    </h3>
    <div className="space-y-2 text-justify">{children}</div>
  </div>
)

const Subsection = ({
  n,
  title,
  children,
}: {
  n: string
  title?: string
  children: React.ReactNode
}) => (
  <div className="contract-subsection mb-2.5 break-inside-avoid">
    {title ? (
      <p>
        <strong>
          {n}. {title}
        </strong>
      </p>
    ) : (
      <p className="font-medium">{n}</p>
    )}
    <div className="space-y-2 mt-1">{children}</div>
  </div>
)

const LetterList = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="contract-alineas list-[lower-alpha] pl-6 space-y-1 marker:text-slate-500">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ul>
)

const NumList = ({ items }: { items: React.ReactNode[] }) => (
  <ol className="list-decimal pl-5 space-y-1.5 marker:text-slate-500">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ol>
)

export function ConsultoriaContractDocument() {
  const handlePrint = () => {
    const printContent = document.getElementById('consultoria-contract-print')
    if (printContent) {
      const originalContents = document.body.innerHTML
      document.body.innerHTML = printContent.innerHTML
      window.print()
      document.body.innerHTML = originalContents
      window.location.reload()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2 no-print">
        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
          <Printer className="h-4 w-4 mr-2" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <div
        id="consultoria-contract-print"
        className="contract-doc bg-white mx-auto text-[12px] text-slate-800 font-serif leading-relaxed shadow-sm print:shadow-none"
      >
        {/* Cabeçalho / identificação do contrato (aparece no topo do documento) */}
        <div className="contract-doc-header flex w-full justify-between items-center mb-6 border-b-2 border-[#f37021] pb-4">
          <img src={logoUrl} alt="Service Logic" className="h-14 object-contain" />
          <h1 className="text-sm font-bold uppercase w-2/3 text-right leading-tight text-[#1b4382]">
            CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSULTORIA DE ESTRUTURAÇÃO OPERACIONAL E
            REGULATÓRIA
          </h1>
        </div>

        {/* Qualificação */}
        <div className="space-y-3 text-justify">
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
        </div>

        {/* CLÁUSULA 1 */}
        <Clause n="1" title="DO OBJETO">
          <Subsection n="1.1">
            O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços
            especializados de consultoria para estruturação operacional e regulatória da operação de
            transporte rodoviário de cargas da CONTRATANTE, especialmente no contexto das operações
            destinadas ao atendimento da Petrobras, envolvendo a contratação de transportadoras
            terceiras/subcontratadas e a emissão de documentos fiscais relacionados ao transporte.
          </Subsection>
          <Subsection n="1.2">
            A consultoria terá como finalidade compreender o modelo operacional pretendido pela
            CONTRATANTE, analisar os requisitos regulatórios aplicáveis e estruturar os processos
            necessários para que a operação possa ser conduzida de forma organizada, rastreável e
            aderente às exigências identificadas no projeto.
          </Subsection>
          <Subsection n="1.3">
            O trabalho será desenvolvido considerando as informações, documentos e premissas
            fornecidos pela CONTRATANTE ao longo da execução do projeto.
          </Subsection>
          <Subsection n="1.4">
            Integram este contrato, para todos os fins, a Proposta Comercial de Estruturação e
            Implantação Operacional aprovada pela CONTRATANTE, bem como os documentos e informações
            formalmente fornecidos durante o projeto.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 2 */}
        <Clause n="2" title="DO CONTEXTO DA OPERAÇÃO">
          <Subsection n="2.1">
            Para fins de planejamento da consultoria, as partes consideram, inicialmente, o seguinte
            cenário informado pela CONTRATANTE:
            <div className="mt-2">
              <LetterList
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
            </div>
          </Subsection>
          <Subsection n="2.2">
            As premissas acima poderão ser revisadas durante a consultoria caso o levantamento
            operacional identifique características diferentes daquelas inicialmente apresentadas.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 3 */}
        <Clause n="3" title="DO ESCOPO DA CONSULTORIA">
          <Subsection n="3.1">
            A Etapa 1 contratada compreende a realização de Consultoria de Estruturação Operacional
            e Regulatória, contemplando, entre outros trabalhos necessários ao objetivo contratado:
          </Subsection>

          <div className="pl-2 space-y-3.5">
            <div className="break-inside-avoid">
              <p className="font-semibold">3.1.1. Levantamento e entendimento da operação</p>
              <div className="mt-1.5">
                <LetterList
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
              </div>
            </div>

            <div className="break-inside-avoid">
              <p className="font-semibold">3.1.2. Estruturação regulatória</p>
              <p className="mt-1">
                A consultoria contemplará análise dos requisitos regulatórios relacionados à
                atividade de transporte rodoviário aplicáveis ao modelo apresentado pela
                CONTRATANTE, incluindo, conforme pertinência ao caso:
              </p>
              <div className="mt-1.5">
                <LetterList
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
              </div>
            </div>

            <div className="break-inside-avoid">
              <p className="font-semibold">3.1.3. Análise do modelo de emissão do CT-e</p>
              <p className="mt-1">
                A consultoria contemplará a análise operacional e regulatória do modelo pretendido
                para emissão do CT-e pela CONTRATANTE, considerando:
              </p>
              <div className="mt-1.5">
                <LetterList
                  items={[
                    'participação da Prysmian na operação;',
                    'contratação de transportadoras terceirizadas;',
                    'responsabilidades de cada participante;',
                    'informações necessárias para emissão dos documentos;',
                    'fluxo entre contratação, execução e documentação do transporte;',
                    'pontos de atenção relacionados ao modelo proposto.',
                  ]}
                />
              </div>
            </div>

            <div className="break-inside-avoid">
              <p className="font-semibold">3.1.4. Responsabilidades entre as partes</p>
              <p className="mt-1">
                Será realizado o levantamento e direcionamento das responsabilidades relacionadas à
                operação entre:
              </p>
              <div className="mt-1.5">
                <ul className="list-disc pl-6 space-y-1 marker:text-slate-500">
                  <li>Prysmian;</li>
                  <li>transportadoras subcontratadas;</li>
                  <li>demais participantes que venham a ser identificados como relevantes.</li>
                </ul>
              </div>
              <p className="mt-1.5">
                O objetivo será estabelecer uma visão estruturada de quem executa, quem fornece as
                informações, quem emite documentos, quem controla e quem responde por cada etapa do
                processo, dentro dos limites da consultoria contratada.
              </p>
            </div>

            <div className="break-inside-avoid">
              <p className="font-semibold">3.1.5. Fluxo operacional</p>
              <p className="mt-1">Será estruturado o fluxo macro da operação, contemplando:</p>
              <div className="mt-1.5 bg-slate-50 border border-slate-200 rounded p-3 text-center font-medium text-[#1b4382]">
                solicitação da Petrobras → contratação da transportadora → disponibilização das
                informações → emissão documental → execução do transporte → pedágio/CIOT e demais
                obrigações → comprovação da operação → encerramento/medição.
              </div>
              <p className="mt-1.5">
                O fluxo definitivo será ajustado após o levantamento detalhado das premissas e
                procedimentos internos da CONTRATANTE.
              </p>
            </div>
          </div>
        </Clause>

        {/* CLÁUSULA 4 */}
        <Clause n="4" title="DOS REQUISITOS DA PETROBRAS">
          <Subsection n="4.1">
            Considerando que a operação está vinculada ao atendimento da Petrobras, a CONTRATANTE
            fornecerá à CONTRATADA os contratos, procedimentos, cláusulas, manuais, documentos e
            demais requisitos aplicáveis que estejam sob sua posse.
          </Subsection>
          <Subsection n="4.2">
            A CONTRATADA analisará, dentro do escopo contratado, os requisitos que tenham impacto
            direto sobre a estruturação operacional e regulatória do transporte rodoviário.
          </Subsection>
          <Subsection n="4.3">
            A CONTRATADA não será responsável por interpretar ou emitir parecer sobre obrigações
            contratuais da Petrobras que não estejam relacionadas diretamente ao objeto desta
            consultoria.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 5 */}
        <Clause n="5" title="DOS ENTREGÁVEIS">
          <Subsection n="5.1">
            Como resultado da Etapa 1, a CONTRATADA apresentará os materiais resultantes da
            consultoria, que poderão contemplar:
            <div className="mt-2">
              <LetterList
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
            </div>
          </Subsection>
          <Subsection n="5.2">
            A entrega terá caráter consultivo e orientativo, não constituindo parecer jurídico,
            tributário ou contábil.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 6 */}
        <Clause n="6" title="DOS LIMITES DA CONSULTORIA">
          <Subsection n="6.1">
            A presente contratação não contempla assessoria ou parecer jurídico, tributário ou
            contábil.
          </Subsection>
          <Subsection n="6.2">
            A análise regulatória realizada pela CONTRATADA será direcionada à atividade de
            transporte rodoviário e aos processos operacionais relacionados ao modelo apresentado,
            considerando a legislação e os requisitos regulatórios aplicáveis identificados durante
            o projeto.
          </Subsection>
          <Subsection n="6.3">
            Quando determinada questão exigir interpretação jurídica, tributária ou contábil
            específica, a CONTRATADA poderá indicar a necessidade de validação pela área competente
            da CONTRATANTE ou por assessor especializado por ela contratado.
          </Subsection>
          <Subsection n="6.4">
            A conclusão da consultoria não substitui eventual manifestação de órgãos reguladores,
            autoridades fiscais, Petrobras ou demais entidades competentes.
          </Subsection>
          <Subsection n="6.5">
            A CONTRATADA não garante aprovação, homologação ou autorização da operação por terceiros
            ou órgãos públicos.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 7 */}
        <Clause n="7" title="DO PASSIVO ANTERIOR">
          <Subsection n="7.1">
            A presente contratação está direcionada à estruturação e regularização do modelo
            operacional a ser utilizado daqui em diante, não abrangendo, salvo contratação adicional
            expressa, a análise, regularização, retificação ou tratamento de operações/passivos
            históricos anteriores ao início do projeto.
          </Subsection>
          <Subsection n="7.2">
            Caso durante a consultoria sejam identificadas situações relacionadas a períodos
            anteriores que demandem atuação específica, as partes poderão avaliar a contratação de
            trabalho adicional.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 8 */}
        <Clause n="8" title="DA ETAPA 2 – IMPLANTAÇÃO SISTÊMICA">
          <Subsection n="8.1">
            A eventual implantação e parametrização do sistema Service Logic não integra a obrigação
            principal deste contrato.
          </Subsection>
          <Subsection n="8.2">
            A CONTRATANTE poderá, caso tenha interesse e necessidade, solicitar posteriormente a
            contratação da Etapa 2 – Consultoria de Implantação e Parametrização do Sistema, cujo
            investimento inicialmente apresentado na proposta comercial é de R$ 5.900,00.
          </Subsection>
          <Subsection n="8.3">
            A contratação da Etapa 2 dependerá de solicitação e aprovação específica da CONTRATANTE,
            não constituindo obrigação de contratação decorrente deste instrumento.
          </Subsection>
          <Subsection n="8.4">
            Durante a Etapa 1, a CONTRATADA poderá avaliar e recomendar soluções tecnológicas que
            sejam adequadas ao modelo operacional identificado.
          </Subsection>
          <Subsection n="8.5">
            Caso a solução atualmente utilizada pela CONTRATANTE não esteja disponível ou não seja
            suficiente para suportar a operação durante a fase de transição, as partes poderão
            avaliar a utilização temporária do sistema Service Logic, mediante alinhamento comercial
            e técnico específico.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 9 */}
        <Clause n="9" title="DAS OBRIGAÇÕES DA CONTRATADA">
          <p>São obrigações da CONTRATADA:</p>
          <div className="mt-1.5">
            <LetterList
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
          </div>
        </Clause>

        {/* CLÁUSULA 10 */}
        <Clause n="10" title="DAS OBRIGAÇÕES DA CONTRATANTE">
          <p>São obrigações da CONTRATANTE:</p>
          <div className="mt-1.5">
            <LetterList
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
          </div>
        </Clause>

        {/* CLÁUSULA 11 */}
        <Clause n="11" title="DO PONTO FOCAL">
          <Subsection n="11.1">
            Para centralização das comunicações e organização do projeto, a CONTRATANTE indicou:
            <div className="mt-2 bg-slate-50 border border-slate-200 rounded p-3 not-italic">
              <p>
                <strong>Gabriel Cavallaro</strong>
              </p>
              <p>Cargo: Supervisor de Logística</p>
              <p>E-mail: gabriel.cavallaro@prysmian.com</p>
              <p>Telefone: (27) 99662-1984</p>
            </div>
          </Subsection>
          <Subsection n="11.2">
            O ponto focal será responsável por centralizar internamente as informações e direcionar
            as demandas da CONTRATADA às áreas responsáveis.
          </Subsection>
          <Subsection n="11.3">
            A indicação de um ponto focal não impede a participação de outros profissionais da
            CONTRATANTE nas reuniões ou atividades técnicas, quando necessária.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 12 */}
        <Clause n="12" title="DOS RESPONSÁVEIS POR ÁREA">
          <Subsection n="12.1">
            Conforme informações fornecidas pela CONTRATANTE, foram indicados os seguintes
            responsáveis:
            <div className="mt-2 space-y-1">
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
          </Subsection>
          <Subsection n="12.2">
            A CONTRATANTE poderá substituir ou complementar os responsáveis durante a execução do
            projeto.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 13 */}
        <Clause n="13" title="DO PRAZO">
          <Subsection n="13.1">
            A Etapa 1 possui prazo estimado de 30 a 45 dias úteis, contados a partir do cumprimento
            das condições necessárias ao início efetivo dos trabalhos.
          </Subsection>
          <Subsection n="13.2">
            O prazo poderá ser impactado caso haja atraso no fornecimento de documentos,
            informações, acessos, validações ou participação dos responsáveis indicados pela
            CONTRATANTE.
          </Subsection>
          <Subsection n="13.3">
            Eventuais alterações relevantes no escopo ou nas premissas da operação poderão ensejar
            revisão do cronograma.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 14 */}
        <Clause n="14" title="DO VALOR E CONDIÇÕES DE PAGAMENTO">
          <Subsection n="14.1">
            Pela execução da Etapa 1 – Consultoria de Estruturação Operacional e Regulatória, a
            CONTRATANTE pagará à CONTRATADA o valor total de:
            <div className="mt-2 bg-[#1b4382]/5 border border-[#1b4382]/20 rounded p-3 text-center">
              <p className="text-base font-bold text-[#1b4382]">R$ 39.900,00</p>
              <p className="text-xs text-slate-600">(trinta e nove mil e novecentos reais)</p>
            </div>
          </Subsection>
          <Subsection n="14.2">
            O pagamento será realizado da seguinte forma:
            <div className="mt-2 space-y-2">
              <p>
                <strong>a)</strong> 50% na assinatura do contrato: <strong>R$ 19.950,00</strong>{' '}
                (dezenove mil, novecentos e cinquenta reais);
              </p>
              <p>
                <strong>b)</strong> 50% na conclusão da Etapa 1 e entrega dos resultados previstos:{' '}
                <strong>R$ 19.950,00</strong> (dezenove mil, novecentos e cinquenta reais).
              </p>
            </div>
          </Subsection>
          <Subsection n="14.3">
            O faturamento será realizado mediante emissão do documento fiscal correspondente,
            observadas as condições previamente alinhadas entre as partes.
          </Subsection>
          <Subsection n="14.4">
            Eventuais retenções tributárias legalmente obrigatórias serão realizadas pela
            CONTRATANTE, quando aplicáveis, observada a legislação vigente e as orientações fiscais
            apresentadas pelas partes.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 15 */}
        <Clause n="15" title="DOS SERVIÇOS ADICIONAIS">
          <Subsection n="15.1">
            Qualquer atividade não contemplada expressamente neste contrato deverá ser previamente
            avaliada entre as partes.
          </Subsection>
          <Subsection n="15.2">
            Havendo necessidade de ampliação do escopo, será realizada avaliação comercial e técnica
            específica antes do início da atividade adicional.
          </Subsection>
          <Subsection n="15.3">
            Nenhuma atividade adicional será considerada automaticamente incluída no valor
            contratado.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 16 */}
        <Clause n="16" title="DA CONFIDENCIALIDADE">
          <Subsection n="16.1">
            As partes comprometem-se a manter sigilo sobre todas as informações técnicas,
            comerciais, operacionais, estratégicas, financeiras e documentais às quais tenham acesso
            em razão deste contrato.
          </Subsection>
          <Subsection n="16.2">
            As informações somente poderão ser utilizadas para execução do objeto contratado.
          </Subsection>
          <Subsection n="16.3">
            A obrigação de confidencialidade permanecerá vigente mesmo após o encerramento do
            contrato, enquanto as informações permanecerem de natureza confidencial.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 17 */}
        <Clause n="17" title="DA PROTEÇÃO DE DADOS">
          <Subsection n="17.1">
            As partes comprometem-se a observar a legislação aplicável à proteção de dados pessoais,
            especialmente a Lei nº 13.709/2018 – Lei Geral de Proteção de Dados (LGPD).
          </Subsection>
          <Subsection n="17.2">
            Eventuais dados pessoais disponibilizados à CONTRATADA deverão ser utilizados
            exclusivamente para execução das atividades previstas neste contrato.
          </Subsection>
          <Subsection n="17.3">
            Cada parte será responsável pelas medidas de segurança aplicáveis aos dados sob sua
            responsabilidade.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 18 */}
        <Clause n="18" title="DA PROPRIEDADE DOS MATERIAIS">
          <Subsection n="18.1">
            Os materiais, fluxos, análises e documentos produzidos especificamente para a
            CONTRATANTE no âmbito desta contratação poderão ser utilizados pela CONTRATANTE para
            fins internos relacionados à operação objeto do projeto.
          </Subsection>
          <Subsection n="18.2">
            Permanecem de titularidade da CONTRATADA seus métodos, conhecimentos, modelos,
            ferramentas, metodologias, templates, sistemas e materiais preexistentes utilizados na
            execução da consultoria.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 19 */}
        <Clause n="19" title="DA INEXISTÊNCIA DE VÍNCULO">
          <Subsection n="19.1">
            O presente contrato não estabelece qualquer relação societária, trabalhista,
            representação comercial, mandato ou vínculo empregatício entre as partes.
          </Subsection>
          <Subsection n="19.2">
            Cada parte será responsável pelas obrigações decorrentes de seus próprios empregados,
            prestadores e representantes.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 20 */}
        <Clause n="20" title="DA RESCISÃO">
          <Subsection n="20.1">
            O presente contrato poderá ser rescindido:
            <div className="mt-2">
              <LetterList
                items={[
                  'por acordo entre as partes;',
                  'pelo descumprimento de obrigação contratual não sanado após notificação;',
                  'por impossibilidade superveniente de execução do objeto;',
                  'por qualquer outra hipótese prevista na legislação aplicável.',
                ]}
              />
            </div>
          </Subsection>
          <Subsection n="20.2">
            Na hipótese de rescisão após o início dos trabalhos, deverão ser considerados os
            serviços efetivamente executados até a data de encerramento, bem como os valores já
            devidos.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 21 */}
        <Clause n="21" title="DA RESPONSABILIDADE DAS PARTES">
          <Subsection n="21.1">
            A CONTRATADA responderá pela execução dos serviços dentro dos limites do escopo
            contratado.
          </Subsection>
          <Subsection n="21.2">
            A CONTRATADA não será responsável por decisões tomadas pela CONTRATANTE com base nos
            direcionamentos apresentados, quando tais decisões dependerem de validação jurídica,
            tributária, contábil, regulatória ou de terceiros.
          </Subsection>
          <Subsection n="21.3">
            A CONTRATANTE será responsável pela veracidade, integralidade e atualização das
            informações fornecidas à CONTRATADA.
          </Subsection>
          <Subsection n="21.4">
            A CONTRATADA não será responsável por alterações legislativas, regulatórias, contratuais
            ou operacionais ocorridas após a conclusão da análise que alterem as premissas
            consideradas no projeto.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 22 */}
        <Clause n="22" title="DAS COMUNICAÇÕES">
          <Subsection n="22.1">
            As comunicações relacionadas à execução do projeto serão realizadas preferencialmente
            por e-mail e/ou pelos canais previamente definidos entre os pontos focais.
          </Subsection>
          <Subsection n="22.2">
            A CONTRATANTE deverá manter atualizados os dados de seus responsáveis e pontos focais.
          </Subsection>
        </Clause>

        {/* CLÁUSULA 23 */}
        <Clause n="23" title="DAS DISPOSIÇÕES GERAIS">
          <Subsection n="23.1">
            Qualquer alteração deste contrato deverá ser formalizada por escrito.
          </Subsection>
          <Subsection n="23.2">
            A eventual tolerância de uma parte quanto ao descumprimento de determinada obrigação não
            constituirá renúncia ou alteração contratual.
          </Subsection>
          <Subsection n="23.3">
            Caso qualquer disposição deste contrato seja considerada inválida, as demais
            permanecerão em pleno vigor.
          </Subsection>
          <Subsection n="23.4">
            Integram este instrumento, quando aplicáveis:
            <div className="mt-2">
              <NumList
                items={[
                  'Anexo I – Proposta Comercial aprovada;',
                  'Anexo II – Escopo e cronograma da consultoria;',
                  'Anexo III – Documentos e informações fornecidos pela CONTRATANTE.',
                ]}
              />
            </div>
          </Subsection>
        </Clause>

        {/* CLÁUSULA 24 */}
        <Clause n="24" title="DO FORO">
          <Subsection n="24.1">
            Fica eleito o foro da comarca de Serra, Estado do Espírito Santo, para dirimir eventuais
            controvérsias decorrentes deste contrato, com renúncia expressa a qualquer outro, por
            mais privilegiado que seja.
          </Subsection>
        </Clause>

        {/* Bloco final: encerramento + assinaturas + testemunhas (mantido junto) */}
        <div className="contract-final-block break-before-page break-inside-avoid mt-8">
          {/* Encerramento */}
          <p className="text-center mb-4">
            E, por estarem de acordo, as partes firmam o presente instrumento.
          </p>

          <p className="text-center mb-10">Serra/ES, 20 de agosto de 2026.</p>

          {/* Assinaturas — Prysmian (Contratante) e Contacto (Contratada) */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-10 sm:gap-16 print:flex-row print:gap-16 print:items-end">
            <div className="flex-1 flex flex-col items-center text-center min-w-0">
              <div className="h-20 print:h-20 flex items-end" />
              <div className="w-full border-t-2 border-[#1b4382] pt-2">
                <p className="font-bold text-[#1b4382] text-sm">CONTRATANTE</p>
                <p className="text-[11px] text-slate-700 mt-1">
                  PRYSMIAN CABOS E SISTEMAS DO BRASIL S.A.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Representante: Gabriel Cavallaro</p>
                <p className="text-[11px] text-slate-500">Cargo: Supervisor de Logística</p>
                <p className="text-[11px] text-slate-500">CPF: 359.459.628-13</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center text-center min-w-0">
              <div className="h-20 print:h-20 flex items-end" />
              <div className="w-full border-t-2 border-[#1b4382] pt-2">
                <p className="font-bold text-[#1b4382] text-sm">CONTRATADA</p>
                <p className="text-[11px] text-slate-700 mt-1">
                  CONTACTO SOLUÇÕES EM TECNOLOGIA – LTDA
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Representante: Rodrigo Goronci Sant'Ana
                </p>
                <p className="text-[11px] text-slate-500">Cargo: Sócio-Administrador</p>
                <p className="text-[11px] text-slate-500">CPF: [A PREENCHER]</p>
              </div>
            </div>
          </div>

          {/* Testemunhas */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 print:grid-cols-2 print:gap-8">
            {[1, 2].map((n) => (
              <div key={n} className="text-[11px] text-slate-600">
                <p className="font-semibold mb-2">TESTEMUNHA {n}</p>
                <p>Nome: ____________________________________</p>
                <p className="mt-1">CPF: ___________________________________________</p>
                <p className="mt-1">Assinatura: _____________________________________</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé na tela (simula o rodapé de impressão; oculto no PDF) */}
        <div className="contract-screen-footer">Contrato de Consultoria — Prysmian × Contacto</div>
      </div>
    </div>
  )
}
