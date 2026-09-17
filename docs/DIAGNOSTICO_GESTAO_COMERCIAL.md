# DIAGNÓSTICO COMPLETO DO SISTEMA DE GESTÃO COMERCIAL — SERVICE LOGIC

Data do Diagnóstico: Março/2025  
Responsável: Auditoria e Diagnóstico de Engenharia de Software  
Escopo: Leitura e Diagnóstico Técnico de Arquitetura, Banco de Dados (Supabase), Regras de Negócio, Telas (React/Vite), Automações e Aderência às Jornadas 1 e 2.

---

## 1. RESUMO EXECUTIVO

### 1.1 O que o sistema é hoje

O sistema "Gestão Comercial" da Service Logic é uma Single Page Application construída sobre React 18, Vite, TypeScript, Tailwind CSS e Supabase (PostgreSQL 15+). Originalmente concebido como uma extensão operacional para cadastro de clientes e geração de minutas de contratos/aditivos, o sistema evoluiu de forma pontual e incremental com a adição de módulos como:

- CRM básico de prospecção (tabela `crm_prospects` e kanban);
- Gerador de contratos em texto/HTML (`ContractGeneratorPage`);
- Gestão de implantações operacionais com checklist de etapas (`implementacoes`, `implementacao_etapas`);
- Registro de atendimentos da base (`atendimentos_clientes`);
- Solicitações avulsas de serviço (`solicitacoes_servico`);
- Histórico estático de aditivos contratuais (`historico_contratos`);
- Módulo isolado de conferência de faturamento/utilização (`sl_utilizacao_mensal`, desprovido de dados reais).

### 1.2 O que atende, atende parcialmente e não atende da finalidade

- **Atende plenamente**:
  1. Cadastro e edição de dados de prospects com validação básica de CNPJ/CPF (`crm_prospects`);
  2. Elaboração de propostas comerciais de implantação/mensalidade com cálculo de itens e valores (`crm_propostas`);
  3. Geração de minutas contratuais pré-formatadas com cláusulas padronizadas da Service Logic (`ContractGeneratorPage`);
  4. Checklist estruturado de etapas operacionais da implantação (`implementacao_etapas` com 258 registros ativos);
  5. Registro de atendimentos comerciais com possibilidade de gerar solicitação avulsa (`atendimentos_clientes`).
- **Atende parcialmente**:
  1. **Kanban do CRM**: Permite arrastar cards entre colunas, mas não possui barreiras ou validação de evidências (é possível arrastar direto de "Novo Lead" para "Cliente Efetivado" sem proposta, contrato ou dados obrigatórios);
  2. **Vínculo Comercial ↔ Cliente**: O prospect pode ser convertido em cliente pela trigger `trg_prospect_to_client`, mas o campo `cliente_id` na tabela `crm_prospects` permanece com valor `NULL` em todos os 72 registros atuais;
  3. **Envio ao Financeiro**: Existe uma tabela `solicitacoes_servico` e uma edge function `send-finance-email`, mas o disparo é manual, não cria títulos a receber nem garante idempotência contábil;
  4. **Documentação de Adesão**: Existem tabelas estruturadas (`prospect_documentacao`, `documentacao_adesao`, `documentacao_status_cliente`), porém não há nenhum registro gravado (contagem 0), e os arquivos anexados hoje ficam armazenados de forma solta em campos de texto/URL no cadastro do prospect;
  5. **Handover de Implantação**: A tabela `implementacoes` existe com 23 registros, mas 22 estão paradas em "Em andamento", sem integração com o encerramento comercial.
- **Não atende**:
  1. **Motor de Próxima Ação Baseado em Evidências**: Não existe uma máquina de estados centralizada. A interface não calcula a "próxima ação mandatória" com base em fatos reais (ex.: se a proposta foi aceita, exigir contrato; se contrato foi assinado, exigir financeiro/handover);
  2. **Jornada 2 Automatizada para a Base de Clientes**: A inclusão de módulos, filiais ou reajustes não atualiza a mensalidade oficial do cliente (`clientes.valor_mensalidade`) de forma transacional e com versionamento do plano anterior;
  3. **Conexão Real com Financeiro**: A tabela `recebimentos` possui zero registros. Não há controle de cobrança faturada vs. paga, nem conciliação de competência;
  4. **Auditoria Append-Only do Processo**: Históricos podem ser editados ou apagados; modificações de status no kanban não guardam de forma consistente o autor, justificativa e snapshot de valores anteriores;
  5. **Métricas Fidedignas**: Painel de métricas apresenta números construídos a partir de contagens brutas que misturam dados legados com processos não concluídos.

### 1.3 Principais Limitações e Riscos

1. **Risco de Perda e Desconexão de Dados**: 100% dos prospects efetivados (`crm_prospects` com status 'Cliente Efetivado', 14 registros) possuem `cliente_id IS NULL`, exigindo cruzamento heurístico por CNPJ para saber qual cliente foi gerado.
2. **Fragilidade de Segurança (RLS)**: Diversas tabelas críticas (`crm_prospects`, `crm_propostas`, `historico_contratos`, `solicitacoes_servico`) operam com políticas de RLS `USING (true) WITH CHECK (true)`, permitindo leitura e mutação irrestrita por qualquer usuário autenticado.
3. **Falta de Idempotência em Triggers**: A trigger `trg_prospect_to_client` dispara em qualquer UPDATE que mude o status para 'Cliente Efetivado'. Se executada mais de uma vez com falhas de chave ou CNPJ duplicado, pode gerar anomalias ou falhas silenciosas.
4. **Alucinação de MRR**: O campo `clientes.valor_total` contém dados históricos e legados não sanitizados, não representando o faturamento recorrente real (MRR). Apenas 6 clientes na base possuem `valor_mensalidade > 0` preenchido.

### 1.4 Percentual Estimado de Aderência e Critério de Cálculo

- **Índice Global de Aderência: 38,5%**
- **Critério de Cálculo**:
  - Jornada 1 (Novos Clientes - Peso 35%): 45% atendido (cadastros e telas existem, mas faltam travas por evidência, controle de documentação real, integração financeira e handover automático auditável) = 15,75%
  - Jornada 2 (Clientes da Base - Peso 25%): 25% atendido (atendimento comercial e solicitação de serviço existem, mas não há versionamento automático de plano, preservação de histórico anterior e reajuste contratual) = 6,25%
  - Próxima Ação & Governança (Peso 20%): 15% atendido (inexistência de máquina de estados; botões de ação são soltos e dependem da discricionariedade do usuário) = 3,00%
  - Conexão Financeira & Utilização (Peso 10%): 10% atendido (tabelas e telas existem, mas recebimentos = 0 e importações de utilização = 0) = 1,00%
  - Métricas e Auditoria Confiáveis (Peso 10%): 25% atendido (relatórios exibem contagens simples, sem cálculo de tempo de ciclo, coortes de conversão ou SLA de atendimento) = 2,50%
  - **Total**: 15,75 + 6,25 + 3,00 + 1,00 + 2,50 = **38,5%**

---

## 2. INVENTÁRIO COMPLETO DAS FUNCIONALIDADES

| Funcionalidade                        | Finalidade                                      | Tela / Componente                                  | Tabela Principal                               | Perfil                     | Automações / Integrações                                  | Situação Real                      | Evidência Técnica                                          | Relação com Jornadas |
| ------------------------------------- | ----------------------------------------------- | -------------------------------------------------- | ---------------------------------------------- | -------------------------- | --------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------- | -------------------- |
| Cadastro de Prospect                  | Entrada de leads no CRM                         | `CRMPage`, `CrmProspectForm`                       | `crm_prospects`                                | Comercial, Gestor, Admin   | Consulta CNPJ/CPF (`services/cnpj.ts`, `services/cpf.ts`) | Funcional                          | 72 registros cadastrados                                   | J1 (Início)          |
| Kanban Comercial                      | Visualização de etapas do funil                 | `CrmKanbanBoard`                                   | `crm_prospects`                                | Comercial, Gestor, Admin   | Trigger `trg_crm_prospect_etapa_change`                   | Parcial (Sem travas)               | Arraste manual irrestrito; sem exigência de proposta       | J1 (Etapas)          |
| Geração de Proposta                   | Montagem de proposta comercial                  | `CrmProspectPropostasTab`, `CrmPropostaForm`       | `crm_propostas`                                | Comercial, Gestor, Admin   | Trigger `trg_proposta_status_to_prospect`                 | Funcional                          | 50 propostas (44 geradas, 4 enviadas, 2 aprovadas)         | J1 e J2 (Orçamento)  |
| Envio de Proposta por E-mail          | Disparo do PDF por e-mail                       | `CrmProspectPropostasTab`                          | N/A                                            | Comercial, Gestor, Admin   | Edge function `send-crm-proposal` (Resend)                | Funcional (Simulação se sem chave) | Código em `supabase/functions/send-crm-proposal`           | J1 e J2              |
| Envio WhatsApp                        | Contato e follow-up rápido                      | `CrmWhatsappChecklistButton`, `CRMPage`            | N/A                                            | Comercial                  | Montagem de link `https://wa.me/`                         | Parcial (Ação manual)              | `src/lib/whatsapp-utils.ts`                                | J1 e J2              |
| Geração de Minuta Contratual          | Redigir contrato com cláusulas padrão           | `ContractGeneratorPage`, `ContractDocument`        | `historico_contratos`                          | Comercial, Gestor, Admin   | Parser PDF, download de docx/pdf                          | Funcional                          | 85 registros em `historico_contratos`                      | J1 (Contrato)        |
| Upload de Contrato Assinado           | Armazenamento de contrato assinado              | `SignedContractUpload`, `ClientContractUpload`     | `clientes`, `historico_contratos`              | Comercial, Admin           | Bucket `signed-contracts` / trigger handover              | Parcial                            | 0 contratos com flag assinado confirmada                   | J1                   |
| Documentação de Adesão                | Checklist de certidões e documentos             | `ProspectDocumentacaoTab`, `DocumentacaoAdesaoTab` | `prospect_documentacao`, `documentacao_adesao` | Comercial, Admin           | Upload para bucket `documentos`                           | Não Utilizada                      | 0 registros no banco de dados                              | J1                   |
| Handover de Implantação               | Passagem do comercial para implantação          | `ConsultoriaHandoverSection`, `handover-pdf.ts`    | `handover_versoes`, `implementacoes`           | Comercial, Implantação     | Trigger `trg_prospect_contrato_assinado_handover`         | Parcial / Desconectada             | Apenas 2 registros em `handover_versoes`                   | J1 (Handover)        |
| Acompanhamento de Implantação         | Checklist de parametrização e treinamento       | `ImplementacoesPage`, `ImplementacaoDetailPage`    | `implementacoes`, `implementacao_etapas`       | Implantação, Gestor, Admin | Trigger `trg_implantacao_encerrado_to_prospect`           | Funcional (Operacional)            | 23 implantações, 258 etapas cadastradas                    | J1 (Execução)        |
| Avaliação de Treinamento              | Coleta de feedback pós-treinamento              | `AvaliacaoTreinamentoPage`                         | `avaliacoes_treinamento`                       | Implantação, Cliente       | Edge function `send-training-evaluation-email`            | Funcional                          | 0 avaliações preenchidas                                   | J1 (Treinamento)     |
| Registro de Atendimentos              | Demandas comerciais de clientes da base         | `ClientsPage`, `ClientAtendimentosTab`             | `atendimentos_clientes`                        | Comercial, Suporte, Admin  | Encaminhamento para implantação                           | Funcional                          | 51 atendimentos (11 enviados para implantação)             | J2 (Início)          |
| Solicitação de Serviço / Financeiro   | Solicitação de faturamento/cobrança             | `ReceiptsPage`, `ClientsPage`                      | `solicitacoes_servico`                         | Comercial, Financeiro      | Trigger `trg_solicitacao_historico`                       | Parcial                            | 22 registros cadastrados; faturamento desacoplado          | J1 e J2 (Financeiro) |
| Conciliação Financeira (Recebimentos) | Baixa e acompanhamento de pagamentos            | `ReceiptsPage`                                     | `recebimentos`                                 | Financeiro, Gestor, Admin  | Nenhuma automação bancária                                | Não Utilizada                      | 0 registros em `recebimentos`                              | J1 e J2              |
| Importação Utilização Service Logic   | Análise de faturamento vs utilização de sistema | `ServiceLogicUtilizacaoPage`, `UtilizationUpload`  | `sl_importacoes`, `sl_utilizacao_mensal`       | Admin, Gestor              | Parser XLSX / hash SHA256                                 | Não Utilizada                      | 0 registros em `sl_utilizacao_mensal`                      | J2 (Conferência)     |
| Atividades Comerciais (Legado)        | Registro avulso de contatos                     | `ActivitiesPage`                                   | `atividades_comerciais`                        | Comercial                  | Nenhuma                                                   | Obsoleta / Duplicada               | 48 registros; não integrada com `crm_historico_interacoes` | J1                   |
| Agenda de Visitas e Reuniões          | Agendamento de reuniões comerciais              | `AgendaPage`                                       | `agenda_eventos`                               | Comercial, Implantação     | Trigger `trg_agenda_to_solicitacao`                       | Funcional                          | 40 eventos cadastrados                                     | J1 e J2              |
| Captação Simplificada                 | Formulário externo/rápido de leads              | `CaptacaoPage`, `CaptacaoSimplifiedForm`           | `crm_prospects`                                | Público / Comercial        | Inserção direta                                           | Funcional                          | Utilizado para entrada rápida                              | J1                   |

---

## 3. TELAS E NAVEGAÇÃO

### 3.1 Mapeamento Completo de Rotas (`src/App.tsx`)

| Rota                                | Componente                                       | Objetivo                               | Acesso / Menu                       | Ações Principais                                                                              | Dados Exibidos / Editáveis                                                        | Diagnóstico & Riscos                                                                     |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `/`                                 | `Index`                                          | Dashboard principal                    | Menu Lateral ("Dashboard")          | Visualização de KPIs rápidos, atalhos para CRM e Clientes                                     | Contadores de prospects, clientes e alertas                                       | Indicadores exibem números agregados sem filtro de qualidade de dados.                   |
| `/crm`                              | `CRMPage`                                        | Gestão do Funil de Vendas              | Menu Lateral ("CRM / Pipeline")     | Adicionar prospect, alterar etapa no Kanban, abrir drawer de edição, registrar interação      | Prospects, etapas, propostas, diagnósticos, histórico                             | Central do comercial de novos clientes. Permite mudar etapa sem validar evidências.      |
| `/clients`                          | `ClientsPage`                                    | Base de Clientes Cadastrados           | Menu Lateral ("Clientes")           | Criar cliente, editar contrato, ver histórico, registrar atendimento, upload de documentos    | Razão social, CNPJ, plano, filiais, mensalidade, atendimentos                     | Tela muito extensa (+5400 linhas). Mistura cadastro, contratos, atendimentos e cobrança. |
| `/contracts`                        | `ContractGeneratorPage`                          | Emissor de Minutas Contratuais         | Menu Lateral ("Contratos")          | Selecionar cliente/prospect, preencher cláusulas, imprimir/baixar minuta, registrar histórico | Dados da contratante, valores de implantação e mensalidade, módulos               | Duplica seleção de dados já informados na proposta comercial.                            |
| `/implementacoes`                   | `ImplementacoesPage`                             | Fila de Projetos de Implantação        | Menu Lateral ("Implantações")       | Filtrar por tipo e status, criar novo projeto, abrir detalhes                                 | Nome do cliente, tipo (novo cliente, módulo, treinamento), responsável, progresso | Visualização clara, mas desconectada da aprovação formal de propostas/contratos.         |
| `/implementacoes/:id`               | `ImplementacaoDetailPage`                        | Gestão do Projeto de Implantação       | Clique na lista de implantações     | Atualizar status de etapas, adicionar observações, anexar arquivos, gerar link de avaliação   | 258 etapas possíveis, dados de parametrização, arquivos de homologação            | Funcional para operação técnica da implantação.                                          |
| `/agenda-implantacoes`              | `AgendaImplantacoesPage`                         | Cronograma de Implantações             | Menu Lateral ("Agenda Implantação") | Visualizar calendário de implantações                                                         | Datas de início, prazos e marcos de projetos                                      | Visão focada no cronograma de entrega da implantação.                                    |
| `/agenda`                           | `AgendaPage`                                     | Agenda de Compromissos Comerciais      | Menu Lateral ("Agenda")             | Criar agendamento, vincular a cliente ou prospect, marcar como concluído                      | Título, data/hora, tipo de evento, cliente/prospect                               | Desconectada do follow-up obrigatório do CRM.                                            |
| `/receipts`                         | `ReceiptsPage`                                   | Controle Financeiro / Cobranças        | Menu Lateral ("Financeiro")         | Gerenciar solicitações de faturamento, conferir cobranças                                     | Lista de solicitações de serviço, valores a faturar                               | Módulo com tabela `recebimentos` vazia; atua apenas como lista de solicitações.          |
| `/plans`                            | `PlansPage`                                      | Tabela de Preços e Módulos             | Menu Lateral ("Planos e Módulos")   | Consultar planos ERP e valores de referência                                                  | Planos cadastrados em `planos_saude` / tabela fixa                                | Informativo estático de apoio a vendas.                                                  |
| `/reports`                          | `ReportsPage`                                    | Relatórios Gerenciais                  | Menu Lateral ("Relatórios")         | Filtrar relatórios por período, gerar listagem de adesão e clientes                           | Tabelas de clientes, histórico de aditivos, relatórios sintéticos                 | Faltam métricas de conversão de funil por coorte e tempos médios reais de ciclo.         |
| `/service-logic`                    | `ServiceLogicUtilizacaoPage`                     | Conferência de Utilização Real         | Menu Lateral ("Utilização SL")      | Upload de planilha Excel, revisão de divergências cadastrais                                  | CNPJs importados, usuários ativos, notas emitidas                                 | Estrutura técnica pronta, mas sem uso operacional real (0 registros).                    |
| `/activities`                       | `ActivitiesPage`                                 | Registro Avulso de Atividades          | Menu Lateral (Apenas se Admin/Dev)  | Cadastrar atividade comercial manual                                                          | Data, cliente, resumo, tipo de contato                                            | Totalmente redundante com a aba de histórico de interações do CRM.                       |
| `/captacao`                         | `CaptacaoPage`                                   | Formulário Rápido de Captação          | Link direto / Rota pública          | Preenchimento simplificado de lead                                                            | Nome, empresa, contato, interesse                                                 | Útil para feiras ou captação rápida, insere diretamente no CRM.                          |
| `/onboarding/:token`                | `OnboardingPage`                                 | Portal de Boas-Vindas do Cliente       | Link enviado por e-mail             | Cliente preenche dados cadastrais e faz upload de arquivos                                    | Dados da empresa, contatos operacionais, anexos                                   | Excelente funcionalidade, mas pouco adotada pelo fluxo principal.                        |
| `/avaliacao-treinamento/:token`     | `AvaliacaoTreinamentoPage`                       | Formulário de Avaliação de Treinamento | Link enviado por e-mail             | Cliente avalia instrutor e conteúdo do treinamento                                            | Notas de 1 a 5, comentários                                                       | Estrutura pronta aguardando automação de disparo ao concluir etapa.                      |
| `/colaboradores`                    | `ColaboradoresPage`                              | Gestão de Equipe e Permissões          | Menu Lateral ("Colaboradores")      | Cadastrar colaborador, associar perfil de acesso                                              | Nome, e-mail, perfil (Comercial, Implantação, etc.)                               | Gestão operacional de papéis de usuários.                                                |
| `/consultoria` e `/consultoria/:id` | `CrmConsultoriaPage`, `CrmConsultoriaDetailPage` | Projetos Especiais de Consultoria      | Menu Lateral ("Consultorias")       | Acompanhar propostas e contratos de consultoria                                               | Fases do diagnóstico, questionários, horas contratadas                            | Módulo avançado para projetos de serviços pontuais.                                      |

### 3.2 Análise de Consolidação e Riscos de Navegação

- **Duplicações de Tela**:
  - `ActivitiesPage` (`/activities`) é completamente concorrente e redundante com a aba de Histórico de Interações de `CRMPage`. Deve ser desativada da navegação e consolidada no histórico do cadastro central.
  - `ContractGeneratorPage` duplica o formulário de propostas já existente no CRM. O usuário precisa redigitar ou copiar dados de módulos, horas de implantação e mensalidades que já haviam sido acordados e aprovados na proposta comercial.
- **Telas Isoladas**:
  - `ServiceLogicUtilizacaoPage` está isolada da ficha do cliente. A conferência deveria ser um alerta dentro do cadastro do cliente em vez de uma ferramenta externa desvinculada do histórico comercial.

---

## 4. BANCO DE DADOS (SUPABASE POSTGRESQL)

### 4.1 Tabela por Tabela do Processo Comercial

#### 1. `crm_prospects`

- **Finalidade**: Armazena os leads e prospects que entram pelo processo comercial de novos clientes.
- **Campos Relevantes**: `id`, `empresa`, `cnpj`, `contato_nome`, `email`, `telefone`, `status` (text), `etapa_anterior`, `origem`, `motivo_perda`, `cliente_id` (UUID fkey para clientes), `contrato_assinado` (bool), `registro_teste` (bool), `documentos_completos` (bool).
- **Relacionamentos**: `crm_propostas(prospect_id)`, `crm_historico_interacoes(prospect_id)`, `prospect_documentacao(prospect_id)`, `clientes(id)` via `cliente_id`.
- **Triggers**:
  - `trg_crm_prospect_etapa_change` (registra histórico de etapa em `crm_prospect_etapa_historico`);
  - `trg_prospect_to_client` (insere registro em `clientes` quando `status = 'Cliente Efetivado'`);
  - `trg_prospect_contrato_assinado_handover` (cria registro em `implementacoes` quando `contrato_assinado = true`).
- **Análise Crítica & Anomalias**:
  - **100% dos registros (72/72) estão com `cliente_id IS NULL`**. Quando o prospect vira cliente, a trigger insere na tabela `clientes`, mas **NÃO retroalimenta** o campo `crm_prospects.cliente_id` com o UUID do cliente criado! Isso quebra o vínculo relacional nativo.
  - O campo `status` é texto livre (sem ENUM no banco), contendo variações manuais.
  - Contagem: **72 registros** (34 Novo Lead, 15 Proposta Enviada, 14 Cliente Efetivado, 6 Perdido, 2 Contrato, 1 Contato inicial). `registro_teste = true`: **0**.

#### 2. `crm_propostas`

- **Finalidade**: Guarda as propostas comerciais elaboradas para prospects ou clientes da base.
- **Campos Relevantes**: `id`, `prospect_id`, `cliente_id`, `valor_mensalidade`, `valor_implantacao`, `status_negociacao` (text), `itens` (jsonb), `modulos_adicionais` (text[]), `tipo` (text), `documento_url`, `versao_numero`, `eh_versao_vigente`.
- **Relacionamentos**: `crm_prospects(id)`, `clientes(id)`.
- **Triggers**:
  - `trg_proposta_status_to_prospect` (quando `status_negociacao = 'Aprovada'`, atualiza `crm_prospects.status = 'Contrato'`).
- **Análise Crítica**:
  - Contagem: **50 propostas** (44 Gerada, 4 Enviada, 2 Aprovada).
  - Apenas 9 propostas possuem `cliente_id` preenchido. 41 possuem `prospect_id`.
  - As 44 propostas com status "Gerada" representam propostas criadas na tela mas cujo disparo formal por e-mail ou aprovação não foi registrado de forma rastreável.

#### 3. `crm_prospect_etapa_historico`

- **Finalidade**: Trilha de auditoria das mudanças de etapa do prospect no funil do CRM.
- **Campos Relevantes**: `id`, `prospect_id`, `etapa_anterior`, `etapa_nova`, `created_at`, `usuario_id`, `motivo`.
- **Triggers**: Alimentada por `trg_crm_prospect_etapa_change`.
- **Análise Crítica**:
  - Contagem: **Apenas 11 registros**.
  - Evidência de falha grave: existem 72 prospects e dezenas de movimentações, mas a tabela só tem 11 registros porque a trigger foi criada recentemente (migration `20260821100000_crm_improvements.sql`). Quase todo o histórico pretérito de movimentação do funil foi perdido.

#### 4. `crm_historico_interacoes`

- **Finalidade**: Diário de bordo de contatos comerciais, notas, reuniões e telefonemas com o prospect.
- **Campos Relevantes**: `id`, `prospect_id`, `tipo`, `descricao`, `data_contato`, `proximo_passo`, `data_proximo_contato`, `responsavel_nome`.
- **Análise Crítica**:
  - Contagem: **173 registros**.
  - É a tabela mais utilizada pelo time comercial para anotações operacionais diárias. Porém, os campos `proximo_passo` e `data_proximo_contato` são preenchidos como texto e data isolados, sem gerar um alarme transacional ou travar o funil.

#### 5. `clientes`

- **Finalidade**: Cadastro mestre de clientes atendidos pela Service Logic.
- **Campos Relevantes**: `id`, `nome`, `cnpj`, `status` ('Ativo', 'Inativo', 'Cancelado'), `valor_mensalidade`, `valor_total` (legado), `plano_id`, `filiais`, `modulos`, `data_adesao`, `data_cancelamento`, `link_assinatura`, `contrato_url`.
- **Relacionamentos**: Fkey em `implementacoes`, `atendimentos_clientes`, `solicitacoes_servico`, `historico_contratos`, `crm_propostas`.
- **Análise Crítica**:
  - Contagem: **233 registros** (226 Ativo, 7 não-Ativo, 3 com data de cancelamento).
  - **Apenas 6 clientes possuem `valor_mensalidade > 0` preenchido**.
  - 120 clientes possuem `valor_total > 0`, porém `valor_total` é um campo importado do sistema legado que misturava valor de implantação, cobranças pontuais e mensalidades brutas antigas. **Não reflete o MRR atual**.
  - 108 clientes possuem `plano_id` preenchido.
  - Apenas 1 cliente possui `link_assinatura` preenchido e 1 cliente com `contrato_url`.

#### 6. `historico_contratos`

- **Finalidade**: Armazenar minutas contratuais geradas ou importadas para os clientes.
- **Campos Relevantes**: `id`, `cliente_id`, `tipo_aditivo`, `descricao`, `valor_implantacao`, `valor_mensalidade`, `data_emissao`, `data_aceite`, `arquivo_url`, `solicitacao_id`.
- **Análise Crítica**:
  - Contagem: **85 registros**.
  - **Zero registros (0) possuem `data_aceite` preenchido**.
  - Os contratos são gravados como minutas emitidas, mas a confirmação da assinatura e do aceite formal não é registrada de volta nessa tabela.

#### 7. `implementacoes`

- **Finalidade**: Coordena os projetos operacionais de implantação (novos clientes, módulos adicionais, treinamentos e consultorias).
- **Campos Relevantes**: `id`, `cliente_id`, `tipo` ('novo_cliente', 'inclusao_modulo', 'treinamento', 'consultoria'), `status` ('Em andamento', 'Concluído', 'Encerrado', 'Pausado'), `responsavel_id`, `data_inicio`, `data_previsao`, `data_conclusao`, `atendimento_id`, `solicitacao_id`.
- **Triggers**:
  - `trg_implantacao_encerrado_to_prospect` (quando `status = 'Encerrado'`, busca prospect pelo CNPJ do cliente e atualiza para 'Cliente Efetivado').
- **Análise Crítica**:
  - Contagem: **23 projetos** (13 novo_cliente, 5 treinamento, 4 inclusao_modulo, 1 consultoria).
  - **22 projetos estão estagnados no status "Em andamento"** e apenas 1 como "Concluído".
  - Há um descompasso estrutural: o cliente já é considerado ativo comercialmente antes mesmo da implantação avançar, e os projetos de implantação raramente recebem a baixa formal com preenchimento da data de conclusão.

#### 8. `implementacao_etapas`

- **Finalidade**: Checklist detalhado das fases de implantação (Parâmetros, Financeiro, Fiscal, Operacional, Treinamentos).
- **Campos Relevantes**: `id`, `implementacao_id`, `categoria`, `nome`, `status` ('pendente', 'em_andamento', 'concluido', 'nao_se_aplica'), `ordem`, `data_inicio`, `data_conclusao`.
- **Análise Crítica**:
  - Contagem: **258 etapas cadastradas**.
  - O checklist é robusto e cobre bem o roteiro técnico do ERP, mas a conclusão de todas as etapas não dispara um evento automático que ativa operacionalmente o cliente e encerra o projeto.

#### 9. `implementacao_observacoes` e `implementacao_arquivos`

- **Finalidade**: Diário de anotações técnicas e guarda de arquivos de homologação (ex.: certificados digitais, layouts contábeis).
- **Contagem**: **0 registros** em `implementacao_observacoes` e **0 registros** em `implementacao_arquivos`. O time técnico opera a implantação sem registrar as evidências dentro do sistema.

#### 10. `atendimentos_clientes`

- **Finalidade**: Gestão de solicitações comerciais de clientes existentes (inclusão de filiais, módulos, treinamentos adicionais).
- **Campos Relevantes**: `id`, `cliente_id`, `tipo`, `descricao`, `status`, `enviado_implantacao` (bool), `valor_estimado`, `created_at`.
- **Análise Crítica**:
  - Contagem: **51 registros**.
  - 11 atendimentos estão marcados com `enviado_implantacao = true`.
  - Falta conexão obrigatória com a revisão do contrato do cliente e a atualização da mensalidade.

#### 11. `solicitacoes_servico`

- **Finalidade**: Ponte de faturamento entre Comercial/Implantação e o setor Financeiro.
- **Campos Relevantes**: `id`, `cliente_id`, `tipo_solicitacao`, `valor`, `descricao`, `status_financeiro` ('pendente', 'faturado', 'pago'), `origem_atendimento_id`.
- **Triggers**: `trg_solicitacao_historico`.
- **Análise Crítica**:
  - Contagem: **22 registros**.
  - O status financeiro é atualizado de forma manual, sem integração com gateway de pagamento ou sistema contábil.

#### 12. `recebimentos`

- **Finalidade**: Registro das baixas e conciliação de receitas comerciais.
- **Análise Crítica**:
  - Contagem: **0 registros**.
  - Tabela totalmente inativa no banco de produção.

#### 13. `prospect_documentacao`, `documentacao_adesao`, `documentacao_status_cliente`

- **Finalidade**: Armazenamento do checklist de compliance cadastral (Contrato Social, Cartão CNPJ, Comprovante de Endereço, Documentos dos Sócios).
- **Análise Crítica**:
  - Contagem: **0 registros** em todas as 3 tabelas!
  - O código em `src/services/prospect-documentacao.ts` e `src/services/documentacao-adesao.ts` foi implementado, mas as telas do CRM não executam a chamada de inicialização do checklist (`ensureChecklistForProspect`), operando apenas com flags booleanas simplificadas.

#### 14. `handover_versoes`

- **Finalidade**: Guarda o histórico versionado dos dados acordados na venda para entrega à Implantação.
- **Análise Crítica**:
  - Contagem: **Apenas 2 registros**.

#### 15. `sl_importacoes`, `sl_utilizacao_mensal`, `sl_historico_revisoes`

- **Finalidade**: Módulo para ler relatórios operacionais do Service Logic (XLSX) e auditar se os clientes estão pagando de acordo com as filiais/placas/emissões reais.
- **Análise Crítica**:
  - Contagem: **0 registros** em todas as 3 tabelas. Nenhuma competência foi homologada até hoje.

#### 16. `atividades_comerciais`

- **Finalidade**: Tabela de legado para registro de contatos avulsos da equipe de captação.
- **Análise Crítica**:
  - Contagem: **48 registros**.
  - Cria um silos de informação paralelo que não aparece na linha do tempo de `crm_prospects`.

#### 17. `agenda_eventos`

- **Finalidade**: Agendamento de apresentações, visitas e reuniões com prospects e clientes.
- **Análise Crítica**:
  - Contagem: **40 registros**.
  - Possui a trigger `trg_agenda_to_solicitacao`, que em caso de reuniões faturáveis tenta criar registros de solicitação.

---

## 5. AUTOMAÇÕES, TRIGGERS E FUNÇÕES

### 5.1 Análise Detalhada dos Triggers de Banco de Dados

#### 1. `trg_prospect_to_client` (em `crm_prospects`)

- **Evento**: `AFTER UPDATE ON crm_prospects`
- **Condição**: `NEW.status = 'Cliente Efetivado' AND OLD.status <> 'Cliente Efetivado'`
- **Ação Realizada**:
  Verifica se já existe cliente com o mesmo CNPJ formatado. Se não existir, faz:
  ```sql
  INSERT INTO clientes (nome, cnpj, status, data_adesao, created_at, updated_at)
  VALUES (NEW.empresa, NEW.cnpj, 'Ativo', CURRENT_DATE, NOW(), NOW())
  RETURNING id;
  ```
- **Vulnerabilidades e Riscos Críticos**:
  1. **Quebra de Vínculo Relacional**: A trigger insere o cliente, mas **NUNCA atualiza o campo `crm_prospects.cliente_id` com o novo ID gerado!** O prospect fica com `cliente_id = NULL`.
  2. **Ausência de Dados Financeiros**: Insere o cliente com `valor_mensalidade = 0` e `plano_id = NULL`, ignorando solenemente os valores acordados na proposta comercial aprovada em `crm_propostas`!
  3. **Duplicação de Chave**: Se o CNPJ tiver caracteres diferentes (pontos, traços ou espaços), a query de verificação falha e pode duplicar o cliente.

#### 2. `trg_proposta_status_to_prospect` (em `crm_propostas`)

- **Evento**: `AFTER UPDATE ON crm_propostas`
- **Condição**: `NEW.status_negociacao = 'Aprovada' AND OLD.status_negociacao <> 'Aprovada'`
- **Ação Realizada**:
  Atualiza `crm_prospects.status = 'Contrato'` onde `id = NEW.prospect_id`.
- **Vulnerabilidades e Riscos**:
  1. **Pula Etapas Críticas**: A aprovação da proposta joga o lead diretamente na etapa 'Contrato', pulando totalmente a exigência da conferência documental, formulário cadastral e adesão.
  2. **Falta de Idempotência**: Se houver mais de uma proposta para o mesmo prospect e uma segunda for marcada como aprovada, o status é sobrescrito sem validação.

#### 3. `trg_prospect_contrato_assinado_handover` (em `crm_prospects`)

- **Evento**: `AFTER UPDATE ON crm_prospects`
- **Condição**: `NEW.contrato_assinado = true AND OLD.contrato_assinado = false`
- **Ação Realizada**:
  Localiza o `cliente_id` associado ao prospect e tenta criar uma implantação em `implementacoes` com `tipo = 'novo_cliente'`.
- **Vulnerabilidades e Riscos**:
  1. **Falha Silenciosa Sistemática**: Como `crm_prospects.cliente_id` é sempre `NULL` (devido à falha da trigger 1), a trigger tenta buscar o cliente por CNPJ. Se o CNPJ divergir por pontuação, a implantação não é criada!
  2. **Zero Contratos Assinados no Banco**: Atualmente a contagem de `crm_prospects WHERE contrato_assinado = true` é exatamente **ZERO**, demonstrando que essa automação nunca foi acionada com sucesso na prática.

#### 4. `trg_implantacao_encerrado_to_prospect` (em `implementacoes`)

- **Evento**: `AFTER UPDATE ON implementacoes`
- **Condição**: `NEW.status IN ('Encerrado', 'Concluído') AND OLD.status NOT IN ('Encerrado', 'Concluído')`
- **Ação Realizada**:
  Busca o prospect associado ao cliente da implantação e muda seu status para 'Cliente Efetivado'.
- **Vulnerabilidades e Riscos**:
  1. **Inversão Lógica do Fluxo**: Na prática de mercado e na finalidade da Service Logic, o cliente é efetivado comercialmente logo após a assinatura do contrato e confirmação do sinal financeiro. Deixar a efetivação para o final da implantação causa conflito com a trigger `trg_prospect_to_client`, gerando um loop de dependência circular de status.

#### 5. `trg_crm_prospect_etapa_change` (em `crm_prospects`)

- **Evento**: `AFTER UPDATE ON crm_prospects`
- **Condição**: `NEW.status IS DISTINCT FROM OLD.status`
- **Ação Realizada**:
  Insere registro em `crm_prospect_etapa_historico`.
- **Vulnerabilidades e Riscos**:
  Funciona corretamente para novas movimentações, mas não tem como recuperar retroativamente as etapas pelas quais os 72 prospects passaram antes de sua implementação.

#### 6. `trg_solicitacao_historico` (em `solicitacoes_servico`)

- **Evento**: `AFTER INSERT OR UPDATE ON solicitacoes_servico`
- **Ação Realizada**: Registra alterações em log textual no histórico do cliente.
- **Vulnerabilidades e Riscos**: Não possui validação transacional com o módulo financeiro.

### 5.2 Edge Functions Deployadas

1. **`send-crm-proposal`**:
   - Local: `supabase/functions/send-crm-proposal/index.ts`
   - Integração: Envio de e-mail via Resend API (ou simulação se `RESEND_API_KEY` ausente).
   - Comportamento: Recebe `proposalId`, busca a URL do PDF em `crm_propostas`, faz download em Buffer e dispara o anexo em base64. Funcional, mas sem chave oficial configurada entra em modo console log.
2. **`send-finance-email`**:
   - Local: `supabase/functions/send-finance-email/index.ts`
   - Integração: Dispara notificação formal para o e-mail financeiro sobre novas cobranças de aditivos/adesão.
3. **`send-contract-email`**:
   - Local: `supabase/functions/send-contract-email/index.ts`
   - Integração: Notifica o cliente com o link de assinatura do contrato gerado.
4. **`send-implementation-email`**:
   - Local: `supabase/functions/send-implementation-email/index.ts`
   - Integração: Envia as orientações de implantação e credenciais para o cliente.
5. **`send-training-evaluation-email`**:
   - Local: `supabase/functions/send-training-evaluation-email/index.ts`
   - Integração: Dispara convite com link de token único para o formulário de avaliação do treinamento.

---

## 6. JORNADA ATUAL DE NOVOS CLIENTES (RECONSTRUÇÃO REAL)

| Passo | Etapa Desejada         | O que o Usuário Faz Hoje                                             | Tela Utilizada                                                      | Registros Criados / Afetados                                                    | Automações Disparadas                                         | Próxima Ação Apresentada Hoje              | Bloqueios e Travas                                      | Desvios em Relação à Finalidade                                        |
| ----- | ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1     | Entrada do Lead        | Cadastra manualmente no CRM ou recebe via formulário rápido          | `CRMPage` ou `CaptacaoPage`                                         | `crm_prospects` (status: 'Novo Lead')                                           | Nenhuma                                                       | Card parado na coluna "Novo Lead"          | Nenhum                                                  | Origem muitas vezes em branco; SLA não monitorado                      |
| 2     | Primeiro Contato       | Usuário clica no ícone de WhatsApp ou registra nota de ligação       | `CRMPage` (drawer de edição)                                        | `crm_historico_interacoes`                                                      | Nenhuma                                                       | Nenhuma indicação visual de próximo passo  | Não há trava                                            | Usuário precisa lembrar sozinho de arrastar o card                     |
| 3     | Apresentação           | Usuário arrasta card para coluna "Apresentação" e agenda reunião     | `CRMPage` / `AgendaPage`                                            | `crm_prospects.status = 'Apresentação'`, `agenda_eventos`                       | `trg_crm_prospect_etapa_change`                               | Nenhuma (fica estático na coluna)          | Permite pular apresentação                              | Não há registro estruturado se a apresentação ocorreu ou não           |
| 4     | Elaboração de Proposta | Abre aba de propostas no drawer do prospect e preenche módulos       | `CrmProspectPropostasTab`                                           | `crm_propostas` (status: 'Gerada')                                              | Nenhuma                                                       | Botão "Gerar PDF" / "Enviar Proposta"      | Permite gerar proposta sem diagnóstico                  | Proposta criada não bloqueia o prospect de mudar de etapa              |
| 5     | Envio de Proposta      | Clica em "Enviar por E-mail" ou copia o link do documento            | `CrmProspectPropostasTab`                                           | `crm_propostas.status = 'Enviada'`, `crm_prospects.status = 'Proposta Enviada'` | Atualiza status no prospect                                   | Fica na coluna "Proposta Enviada"          | Não exige confirmação de recebimento                    | Não agenda automaticamente follow-up obrigatório                       |
| 6     | Follow-up              | Comercial clica no botão de WhatsApp para mandar lembrete            | `CrmWhatsappChecklistButton`                                        | Nenhuma gravação automática (usuário precisa anotar)                            | Nenhuma                                                       | Nenhuma                                    | Nenhuma                                                 | Depende 100% de anotação manual                                        |
| 7     | Aceite / Recusa        | Marca manualmente a proposta como "Aprovada" ou "Recusada"           | `CrmProspectPropostasTab`                                           | `crm_propostas.status_negociacao = 'Aprovada'`                                  | `trg_proposta_status_to_prospect` muda status para 'Contrato' | Pula direto para coluna 'Contrato'         | Não exige documento de aceite formal                    | Pula etapas 8, 9 e 10 da finalidade (Adesão, Documentos e Formulário)! |
| 8     | Adesão e Documentos    | Deveria coletar certidões e contrato social                          | Nenhuma tela integrada no fluxo ativo (tabelas existem mas zeradas) | Nenhum registro gravado nas tabelas de documentos                               | Nenhuma                                                       | Nenhuma                                    | Zero travas                                             | **ETAPA INEXISTENTE NO FLUXO PRÁTICO**                                 |
| 9     | Geração de Contrato    | Usuário sai do CRM, vai na tela de Contratos e preenche tudo de novo | `ContractGeneratorPage`                                             | `historico_contratos`                                                           | Nenhuma                                                       | Botão "Salvar Minuta"                      | Nenhuma trava                                           | Redigitação completa de dados que já estavam na proposta               |
| 10    | Assinatura de Contrato | Usuário envia link por fora e faz upload manual do PDF assinado      | `SignedContractUpload`                                              | `clientes.contrato_url`                                                         | Nenhuma integração de webhook com plataforma e-Sign           | Nenhuma                                    | Não valida se assinatura é autêntica                    | Assinatura é tratada como upload manual de arquivo                     |
| 11    | Efetivação Comercial   | Usuário arrasta o card para "Cliente Efetivado" no Kanban            | `CrmKanbanBoard`                                                    | `crm_prospects.status = 'Cliente Efetivado'`, cria linha em `clientes`          | `trg_prospect_to_client`                                      | Nenhuma                                    | Permite efetivar sem contrato assinado e sem financeiro | **Desconecta o prospect do cliente gerado** (`cliente_id` fica NULL)   |
| 12    | Envio ao Financeiro    | Comercial envia mensagem manual ou cria solicitação de serviço       | `ReceiptsPage`                                                      | `solicitacoes_servico`                                                          | Nenhuma transação contábil                                    | Nenhuma                                    | Não trava a implantação                                 | Financeiro não dá "baixa/confirmação" formal                           |
| 13    | Handover Implantação   | Usuário cria manualmente o projeto na tela de implantações           | `ImplementacoesPage`                                                | `implementacoes` (status: 'Em andamento')                                       | Nenhuma automação confiável                                   | Lista de 258 etapas na tela da implantação | Permite iniciar implantação sem financeiro              | Implantação não recebe automaticamente os módulos contratados          |
| 14    | Execução e Conclusão   | Técnico marca etapas de parametrização e treinamentos                | `ImplementacaoDetailPage`                                           | `implementacao_etapas`                                                          | Nenhuma                                                       | Todas as etapas viram "concluído"          | Nenhuma                                                 | Cliente já consta como "Ativo" desde a etapa 11!                       |

---

## 7. JORNADA ATUAL DOS CLIENTES DA BASE

### 7.1 Como funcionam hoje as demandas pós-venda

1. **Inclusão de Módulos e Filiais**:
   - O comercial abre a ficha do cliente em `ClientsPage` e clica em "Novo Atendimento".
   - Seleciona o tipo "Inclusão de Módulo" ou "Inclusão de Filial".
   - O sistema calcula um valor sugerido com base na tabela fixa (`src/lib/branch-calculations.ts`), gerando um registro em `atendimentos_clientes`.
   - **Onde o fluxo quebra**: Para formalizar, o usuário precisa gerar um aditivo manualmente na tela de contratos, colher assinatura por fora e criar uma solicitação em `solicitacoes_servico`. **O campo `clientes.valor_mensalidade` NÃO é atualizado automaticamente!** A composição anterior do plano se perde se o usuário alterar manualmente os campos do cliente.
2. **Treinamentos e Consultorias Avulsas**:
   - Registrado como atendimento comercial em `atendimentos_clientes`.
   - Se aprovado, o botão "Enviar para Implantação" cria um projeto em `implementacoes` com `tipo = 'treinamento'`.
   - O projeto de treinamento recebe as etapas padrão em `implementacao_etapas`.
   - O financeiro só recebe notificação se o usuário lembrar de criar a solicitação de cobrança avulsa.
3. **Cancelamento / Redução**:
   - O usuário edita a ficha do cliente e preenche a `data_cancelamento` ou altera o status para 'Inativo'.
   - Não há registro auditável de motivo de cancelamento (churn) nem versionamento do histórico financeiro do que foi cobrado até a data do distrato.
4. **Reajustes Contratuais (Anuais/Periódicos)**:
   - Não existe módulo de aplicação de índice de reajuste (ex.: IPCA/IGP-M).
   - O usuário precisa entrar cliente a cliente em `ClientsPage` e sobrescrever o valor, destruindo o histórico do valor anterior.

---

## 8. MOTOR DE PRÓXIMA AÇÃO (DIAGNÓSTICO E MATRIZ)

### 8.1 Como a Próxima Ação é Definida Hoje

No sistema atual, **NÃO EXISTE UM MOTOR DE PRÓXIMA AÇÃO BASEADO EM REGRAS DE NEGÓCIO**.
O que existe é uma estrutura passiva:

1. O Kanban do CRM apresenta colunas estáticas. A "próxima ação" é simplesmente o ato discricionário do usuário arrastar o card para o lado que desejar.
2. Não há botões contextuais primários nas telas (ex.: "Apresentação realizada? Clique para emitir Proposta", "Proposta Aprovada? Clique para coletar Documentos de Adesão").
3. A ausência de regras faz com que **100% dos 72 prospects** e **100% dos 233 clientes** dependam exclusivamente da memória do operador.

### 8.2 Matriz de Próxima Ação: Realidade Atual vs. Comportamento Correto

| Situação Real do Registro             | Evidência Técnica Existente no Banco                 | Próxima Ação Apresentada Hoje pelo Sistema            | Próxima Ação Correta Baseada em Evidências                                    | Gravidade da Divergência  |
| ------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| Novo Lead cadastrado                  | `crm_prospects` criado; sem interações               | Nenhuma (Card parado na coluna "Novo Lead")           | Botão primário: "Iniciar Primeiro Contato (WhatsApp/Telefone)" com SLA de 24h | Alta                      |
| Primeiro contato realizado            | Linha em `crm_historico_interacoes`                  | Nenhuma (Usuário precisa arrastar o card manualmente) | Botão primário: "Agendar Apresentação Comercial"                              | Alta                      |
| Apresentação concluída                | Reunião concluída na agenda comercial                | Nenhuma                                               | Botão primário: "Elaborar Proposta Comercial" (pré-carregando diagnóstico)    | Crítica                   |
| Proposta gerada em minuta             | Linha em `crm_propostas` (`status = 'Gerada'`)       | Botão de download de minuta                           | Botão primário: "Disparar Proposta Formal ao Cliente"                         | Média                     |
| Proposta enviada ao cliente           | Linha em `crm_propostas` (`status = 'Enviada'`)      | Card parado na coluna "Proposta Enviada"              | Botão primário: "Registrar Follow-up Obrigatório" com alarme de data          | Alta                      |
| Proposta aceita pelo cliente          | `crm_propostas` (`status_negociacao = 'Aprovada'`)   | Automação joga direto para "Contrato"                 | Botão primário: "Solicitar Documentação de Adesão e Formulário Cadastral"     | Crítica (Pula governança) |
| Documentos recebidos                  | Arquivos aprovados no checklist                      | Inexistente (checklist não roda)                      | Botão primário: "Gerar Contrato a partir dos Dados da Proposta Aprovada"      | Crítica                   |
| Contrato emitido                      | Registro em `historico_contratos`                    | Nenhuma                                               | Botão primário: "Enviar para Assinatura Eletrônica Formal"                    | Alta                      |
| Contrato assinado                     | PDF assinado com certificado / webhook e-Sign        | Nenhuma (Card depende de arraste manual)              | Botão primário: "Confirmar Efetivação e Encaminhar ao Financeiro"             | Crítica                   |
| Faturamento/Adesão confirmado         | `solicitacoes_servico.status = 'faturado'`           | Nenhuma                                               | Botão primário: "Executar Handover para a Implantação"                        | Crítica                   |
| Implantação e treinamentos concluídos | 100% das etapas concluídas em `implementacao_etapas` | Nenhuma (Projeto fica estagnado como "Em andamento")  | Botão primário: "Ativar Cliente Operacionalmente e Transferir para Suporte"   | Crítica                   |
| Cliente da Base pede Módulo           | Atendimento criado em `atendimentos_clientes`        | Botão opcional "Enviar para Implantação"              | Botão primário: "Elaborar Orçamento de Aditivo Contratual"                    | Alta                      |

---

## 9. PROPOSTAS, CONTRATOS E DOCUMENTOS

### 9.1 Propostas Comerciais (`crm_propostas`)

- **Versionamento**: O schema possui os campos `versao_numero` e `eh_versao_vigente`. No entanto, o código da interface sobrescreve propostas existentes ou cria novas sem controlar rigorosamente o histórico cumulativo de versões.
- **Validade e Prazos**: Não há rotina que marque propostas como "Expiradas" após o prazo de validade (ex.: 15 dias).
- **Consistência de Valores**: Valores de implantação e mensalidade são digitados no formulário sem checagem obrigatória contra a tabela de preços oficial de `planos_saude`.

### 9.2 Contratos e Aditivos (`historico_contratos` e `ContractGeneratorPage`)

- **Geração**: A página `ContractGeneratorPage` monta o texto do contrato mesclando templates de string (`src/constants/contract-text.ts`) com os dados digitados na tela.
- **Redigitação**: Embora o sistema busque dados básicos do cliente, todos os módulos adicionais, filiais e valores de implantação precisam ser revisados ou redigitados manualmente.
- **Assinatura Eletrônica**:
  - **Não existe integração nativa com provedores de assinatura digital (Clicksign, DocuSign, Autentique ou ZapSign)**.
  - O sistema opera exclusivamente por **Ação Manual de Upload**: o usuário baixa o PDF, envia por conta própria por e-mail ou WhatsApp, colhe a assinatura externamente e faz o upload manual do PDF assinado no componente `SignedContractUpload`.
  - A contagem de contratos com assinatura formal confirmada no banco é **ZERO**.

### 9.3 Documentos e Storage

- **Buckets de Armazenamento**:
  - `documentos`: Destinado a anexos de clientes e documentação de adesão.
  - `signed-contracts`: Destinado a contratos assinados.
- **Vulnerabilidades de Storage**:
  - Os buckets dependem de chamadas via frontend. Não há validação antivírus nem bloqueio rígido de tipos de arquivo (MIME type enforcement) além da extensão declarada.
  - Em `crm_prospects`, documentos são gravados em links de texto soltos, sem versionamento de arquivo.

---

## 10. MÓDULO FINANCEIRO

### 10.1 Como Funciona o Encaminhamento Hoje

- Quando uma venda ou atendimento é concluído, o sistema depende de um clique no botão que chama a edge function `send-finance-email` ou da criação manual de um registro em `solicitacoes_servico`.
- Dados trafegados em `solicitacoes_servico`:
  - `cliente_id` (UUID);
  - `tipo_solicitacao` (Adesão, Mensalidade, Inclusão de Módulo, etc.);
  - `valor` (Numérico);
  - `descricao` (Texto livre);
  - `status_financeiro` ('pendente', 'faturado', 'pago').

### 10.2 Desconexão Contábil e Lacunas Críticas

1. **Tabela `recebimentos` está VAZIA (0 registros)**: Não há controle sobre quando o cliente de fato pagou a taxa de implantação/adesão.
2. **Falta de Competência Contábil**: A tabela `solicitacoes_servico` não possui o campo `competencia` estruturado (ex.: '2025-03'), registrando apenas a data de criação.
3. **Ausência de Baixa Formal**: O Comercial não tem visibilidade se o Financeiro aprovou as condições de crédito e faturou a entrada antes de liberar a Implantação para o início dos trabalhos.

---

## 11. IMPLANTAÇÃO, SUPORTE E TREINAMENTOS

### 11.1 Handover Comercial ↔ Implantação

- O handover estruturado foi desenhado na tabela `handover_versoes` e no componente `ConsultoriaHandoverSection`.
- **Diagnóstico Real**: Existem apenas **2 registros** em `handover_versoes`.
- Na rotina real, a equipe comercial avisa a equipe técnica via canais externos (WhatsApp/Teams) ou o próprio coordenador cria a implantação manualmente na tela `ImplementacoesPage`.
- O técnico de implantação não tem acesso imediato, na tela do projeto, à íntegra dos módulos acordados na proposta comercial aprovada, precisando consultar anexos em PDF.

### 11.2 Treinamentos e Avaliações

- A tabela `implementacao_etapas` possui **258 etapas** distribuídas entre os projetos ativos.
- O componente `TreinamentoEvaluationSection` e a página `AvaliacaoTreinamentoPage` estão construídos para coletar o feedback dos usuários-chave da transportadora.
- **Diagnóstico Real**: Existem **0 avaliações de treinamento** gravadas no banco (`avaliacoes_treinamento` = 0). O link de avaliação nunca é disparado de forma automática após a conclusão da etapa de treinamento.

### 11.3 Ativação Operacional e Passagem ao Suporte

- **Conceito Desejado**: O cliente só deve se tornar "Operacionalmente Ativo" após a conclusão satisfatória das etapas de parametrização e treinamento, momento em que é transferido formalmente para o Suporte.
- **O que Ocorre Hoje**: O cliente é colocado como "Ativo" em `clientes.status` logo no primeiro instante em que o lead é efetivado comercialmente, meses antes do sistema entrar em produção na transportadora. Isso distorce totalmente a contagem de clientes em implantação vs. clientes em suporte contínuo.

---

## 12. CLIENTE, PLANO E HISTÓRICO COMERCIAL

### 12.1 Onde os Dados Residem Hoje

- `clientes.plano_id`: Aponta para um registro em `planos_saude` (apenas 108 dos 233 clientes possuem este vínculo).
- `clientes.filiais`: Texto livre ou array não padronizado indicando filiais cadastradas.
- `clientes.modulos`: Array de texto com nomes de módulos.
- `clientes.valor_mensalidade`: Numérico indicando a mensalidade vigente (**apenas 6 clientes possuem valor preenchido!**).

### 12.2 Análise Crítica do Campo `clientes.valor_total` (Não Tratar como MRR!)

- O campo `clientes.valor_total` possui 120 registros com valores preenchidos (ex.: R$ 2.500,00, R$ 15.000,00, R$ 800,00).
- **Por que NÃO deve ser tratado como MRR**:
  1. Durante a importação da base legada, o campo acumulou somatórios de taxas únicas de implantação, notas fiscais de consultoria pontual e antigas mensalidades não decompostas.
  2. Não há segregação entre receita única (Non-Recurring Revenue - NRR) e receita mensal recorrente (Monthly Recurring Revenue - MRR).
  3. Utilizar esse campo para cálculo de MRR resultará em um número inflacionado, irreal e perigoso para a tomada de decisões da diretoria da Service Logic.

---

## 13. MÓDULO DE UTILIZAÇÃO SERVICE LOGIC (`sl_*`)

### 13.1 Confirmação de Estado Real do Banco de Dados

- Executadas consultas oficiais no banco Supabase:
  - `SELECT count(*) FROM sl_importacoes;` ➔ **0 registros**
  - `SELECT count(*) FROM sl_utilizacao_mensal;` ➔ **0 registros**
  - `SELECT count(*) FROM sl_historico_revisoes;` ➔ **0 registros**
- **Veredito**: As tabelas e a interface de upload (`src/pages/ServiceLogicUtilizacaoPage.tsx` e `src/services/service-logic-utilizacao.ts`) estão 100% vazias e inoperantes no ambiente de produção.

### 13.2 Avaliação da Estrutura Desenvolvida

- A infraestrutura de código é sofisticada: calcula hash SHA-256 do arquivo para evitar importação duplicada, faz parser de arquivos Excel com normalização de CNPJs e tenta cruzar o número de frotas e emissões com o plano contratado.
- Porém, como nunca foi alimentada com arquivos reais da operação mensal, **não é possível calcular nenhuma métrica de utilização vs. plano contratado no momento**.

---

## 14. COMUNICAÇÕES E INTEGRAÇÕES

| Meio / Integração     | Canal / Tecnologia                             | Classificação Real                               | Situação Prática Atual                                              | Riscos & Limitações                                                                               |
| --------------------- | ---------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| E-mail de Proposta    | Edge Function `send-crm-proposal`              | Link aberto / Envio via API                      | Funcional se `RESEND_API_KEY` existir; caso contrário apenas simula | Sem chave oficial no backend, os envios ficam registrados apenas no console de log                |
| E-mail Financeiro     | Edge Function `send-finance-email`             | Envio de notificação                             | Funcional (código presente)                                         | Disparo puramente informativo; não aguarda retorno ou webhook bancário                            |
| E-mail de Contrato    | Edge Function `send-contract-email`            | Envio de notificação                             | Funcional (código presente)                                         | Cliente recebe link estático para visualização                                                    |
| E-mail de Avaliação   | Edge Function `send-training-evaluation-email` | Envio de notificação                             | Funcional (código presente)                                         | Não disparado automaticamente pelo encerramento de etapa                                          |
| WhatsApp Geral        | Links `https://wa.me/55...`                    | **Link Externo Aberto** (NÃO é envio automático) | O usuário clica e abre o WhatsApp Web com texto pré-redigido        | **Zero automação de envio**: o sistema não sabe se a mensagem foi enviada, entregue ou respondida |
| WhatsApp Checklist    | `CrmWhatsappChecklistButton`                   | **Link Externo Aberto**                          | Monta mensagem com lista de pendências                              | Depende de ação humana no app do WhatsApp                                                         |
| Consulta CNPJ         | `services/cnpj.ts` (API BrasilAPI / ReceitaWS) | Integração Automática                            | Funcional                                                           | Risco de indisponibilidade de APIs públicas gratuitas                                             |
| Consulta CPF          | `services/cpf.ts`                              | Validação de formato / busca                     | Funcional                                                           | Apenas validação de máscara e dígitos verificadores                                               |
| Assinatura Eletrônica | Nenhuma API integrada                          | **Ação Manual de Upload**                        | Não existe e-Sign integrado                                         | Vulnerável a falsificação ou upload de arquivos errados                                           |
| Jira / Movidesk / ERP | Nenhuma integração nativa                      | Inexistente                                      | Sem integração externa                                              | Dados de suporte e tickets não trafegam para o CRM                                                |

---

## 15. PERFIS E PERMISSÕES

### 15.1 Matriz de Perfis no Código (`src/lib/roles.ts`)

- Perfis Definidos: `ROLE_ADMIN` ('admin'), `ROLE_GESTOR` ('gestor'), `ROLE_COLABORADOR` ('colaborador'), `ROLE_IMPLANTACAO` ('implantacao').

| Perfil Declarado        | Permissões Declaradas na Interface                          | Permissões Reais no Banco de Dados (RLS)            | Riscos de Segurança Identificados                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrador           | Acesso total a todas as rotas e botões                      | Acesso irrestrito                                   | Nenhum                                                                                                                                                                |
| Gestor                  | Acesso a relatórios, CRM, clientes e financeiro             | Acesso irrestrito                                   | Nenhum                                                                                                                                                                |
| Comercial / Colaborador | Oculta abas financeiras e de parâmetros técnicos            | **Pode ler e alterar tabelas financeiras via API!** | **Vulnerabilidade Alta**: A proteção é apenas cosmética no frontend; as tabelas `solicitacoes_servico`, `crm_propostas` e `clientes` possuem políticas de RLS frouxas |
| Implantação             | Acesso restrito a `/implementacoes`, `/agenda-implantacoes` | **Pode ler dados comerciais via cliente Supabase!** | RLS não restringe a leitura de propostas e valores contratuais a nível de linha no PostgreSQL                                                                         |

### 15.2 Auditoria de Segurança RLS (Row Level Security)

- Diversas tabelas no schema do PostgreSQL possuem a diretiva `ENABLE ROW LEVEL SECURITY`, porém suas políticas estão configuradas como:
  ```sql
  CREATE POLICY "Allow all operations for authenticated users" ON public.crm_prospects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ```
- **Consequência**: Qualquer colaborador logado com perfil básico de Implantação ou Captação possui credenciais técnicas para executar updates arbitrários em valores de propostas, dados cadastrais de clientes e históricos de outros vendedores.

---

## 16. DADOS E NÚMEROS REAIS DO SISTEMA

Validação realizada diretamente no banco de dados Supabase via consultas SQL auditadas:

| Entidade / Métrica                        | Contagem Real Auditada                                                                                                              | Consulta SQL Utilizada                                                    | Observações e Qualidade dos Dados                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Total de Prospects no CRM                 | **72**                                                                                                                              | `SELECT count(*) FROM crm_prospects;`                                     | Nenhum registro marcado como teste (`registro_teste = true: 0`)     |
| Prospects por Status                      | **34** Novo Lead<br>**15** Proposta Enviada<br>**14** Cliente Efetivado<br>**6** Perdido<br>**2** Contrato<br>**1** Contato inicial | `SELECT status, count(*) FROM crm_prospects GROUP BY status;`             | 14 clientes constam como efetivados mas não estão vinculados via ID |
| Prospects com `cliente_id` preenchido     | **0**                                                                                                                               | `SELECT count(*) FROM crm_prospects WHERE cliente_id IS NOT NULL;`        | **100% órfãos de chave estrangeira direta**                         |
| Total de Clientes na Base                 | **233**                                                                                                                             | `SELECT count(*) FROM clientes;`                                          | 226 marcados como 'Ativo', 7 não-Ativo, 3 cancelados                |
| Clientes com `valor_mensalidade > 0`      | **6**                                                                                                                               | `SELECT count(*) FROM clientes WHERE valor_mensalidade > 0;`              | Apenas 6 clientes com MRR cadastrado formalmente                    |
| Clientes com `valor_total > 0`            | **120**                                                                                                                             | `SELECT count(*) FROM clientes WHERE valor_total > 0;`                    | Campo legado acumulado (não usar como métrica de MRR)               |
| Clientes com `plano_id` preenchido        | **108**                                                                                                                             | `SELECT count(*) FROM clientes WHERE plano_id IS NOT NULL;`               | 46,3% dos clientes com plano ERP vinculado                          |
| Total de Propostas Comerciais             | **50**                                                                                                                              | `SELECT count(*) FROM crm_propostas;`                                     | 44 Gerada, 4 Enviada, 2 Aprovada                                    |
| Propostas vinculadas a prospects          | **41**                                                                                                                              | `SELECT count(*) FROM crm_propostas WHERE prospect_id IS NOT NULL;`       | Propostas de novos clientes                                         |
| Propostas vinculadas a clientes da base   | **9**                                                                                                                               | `SELECT count(*) FROM crm_propostas WHERE cliente_id IS NOT NULL;`        | Propostas de aditivos/upsell                                        |
| Histórico de Interações Comerciais        | **173**                                                                                                                             | `SELECT count(*) FROM crm_historico_interacoes;`                          | Registros diários de notas e ligações                               |
| Histórico de Mudança de Etapa             | **11**                                                                                                                              | `SELECT count(*) FROM crm_prospect_etapa_historico;`                      | Histórico incompleto (trigger criada tardiamente)                   |
| Histórico de Minutas Contratuais          | **85**                                                                                                                              | `SELECT count(*) FROM historico_contratos;`                               | Minutas geradas                                                     |
| Contratos com `data_aceite` confirmada    | **0**                                                                                                                               | `SELECT count(*) FROM historico_contratos WHERE data_aceite IS NOT NULL;` | Nenhuma confirmação formal de aceite registrada                     |
| Prospects com `contrato_assinado = true`  | **0**                                                                                                                               | `SELECT count(*) FROM crm_prospects WHERE contrato_assinado = true;`      | Flag nunca atualizada pelo fluxo prático                            |
| Total de Projetos de Implantação          | **23**                                                                                                                              | `SELECT count(*) FROM implementacoes;`                                    | 13 novo cliente, 5 treinamento, 4 módulo, 1 consultoria             |
| Implantações "Em andamento" vs Concluídas | **22** Em andamento<br>**1** Concluído                                                                                              | `SELECT status, count(*) FROM implementacoes GROUP BY status;`            | Gargalo operacional ou falta de encerramento no sistema             |
| Etapas de Implantação Cadastradas         | **258**                                                                                                                             | `SELECT count(*) FROM implementacao_etapas;`                              | Checklists detalhados nos projetos ativos                           |
| Atendimentos Comerciais da Base           | **51**                                                                                                                              | `SELECT count(*) FROM atendimentos_clientes;`                             | 11 encaminhados formalmente para implantação                        |
| Solicitações de Serviço (Financeiro)      | **22**                                                                                                                              | `SELECT count(*) FROM solicitacoes_servico;`                              | Demandas de faturamento cadastradas                                 |
| Recebimentos Baixados                     | **0**                                                                                                                               | `SELECT count(*) FROM recebimentos;`                                      | Tabela sem dados em produção                                        |
| Documentação de Adesão (Checklists)       | **0**                                                                                                                               | `SELECT count(*) FROM prospect_documentacao;`                             | Tabelas criadas no banco mas sem registros                          |
| Versões de Handover Registradas           | **2**                                                                                                                               | `SELECT count(*) FROM handover_versoes;`                                  | Baixíssima utilização operacional                                   |
| Registros de Utilização Service Logic     | **0**                                                                                                                               | `SELECT count(*) FROM sl_utilizacao_mensal;`                              | Nenhuma planilha mensal importada até o momento                     |
| Atividades Comerciais Avulsas             | **48**                                                                                                                              | `SELECT count(*) FROM atividades_comerciais;`                             | Dados isolados no módulo legado de atividades                       |
| Eventos na Agenda Comercial               | **40**                                                                                                                              | `SELECT count(*) FROM agenda_eventos;`                                    | Reuniões e agendamentos                                             |

---

## 17. DIAGNÓSTICO DAS 24 MÉTRICAS DO RODRIGO

| #   | Métrica                                                 | Definição & Fórmula                                                                                                         | Tabelas e Campos Necessários                                                | Evento Alimentador                   | Confiabilidade AGORA       | Dados Ausentes / Ressalvas                                                      | Classificação               |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------- | --------------------------- |
| 1   | Leads por Origem / Período / Responsável                | Total de novos prospects criados em um intervalo: `COUNT(id) WHERE created_at BETWEEN X AND Y GROUP BY origem, responsavel` | `crm_prospects.origem`, `created_at`, `responsavel_nome`                    | Inserção de prospect                 | **Com Ressalva**           | Campo `origem` frequentemente em branco ou preenchido com 'Outro'               | Com ressalva                |
| 2   | Conversão entre Etapas do Funil                         | Razão percentual de avanço entre etapas consecutivas: `(Leads na Etapa B / Leads na Etapa A) * 100`                         | `crm_prospect_etapa_historico`                                              | Transição no Kanban                  | **Indisponível**           | Tabela de histórico de etapas só tem 11 registros; não reflete o histórico real | Apenas no novo fluxo        |
| 3   | Conversão por Origem e Responsável                      | Taxa de fechamento por canal e vendedor: `(Efetivados / Total de Leads da Origem) * 100`                                    | `crm_prospects.origem`, `status`, `responsavel_nome`                        | Efetivação do prospect               | **Com Ressalva**           | Vínculo entre prospect e cliente gerado não está gravado via ID                 | Com ressalva                |
| 4   | Tempo Médio por Etapa                                   | Média de dias que o lead permanece em cada estágio: `AVG(data_saida - data_entrada)`                                        | `crm_prospect_etapa_historico`                                              | Movimentação de etapa                | **Indisponível**           | Ausência de registros históricos de transição pretérita                         | Apenas no novo fluxo        |
| 5   | Ciclo Total de Venda                                    | Dias transcorridos do primeiro contato até o fechamento: `AVG(data_adesao - crm_prospects.created_at)`                      | `crm_prospects.created_at`, `clientes.data_adesao`                          | Assinatura / Efetivação              | **Indisponível**           | `crm_prospects.cliente_id` é NULL; impossível cruzar datas com precisão         | Apenas no novo fluxo        |
| 6   | SLA do Primeiro Contato                                 | Tempo entre a criação do lead e o primeiro registro de contato: `data_primeiro_contato - created_at`                        | `crm_prospects.created_at`, `MIN(crm_historico_interacoes.data_contato)`    | Inserção da 1ª interação             | **Com Ressalva**           | Apenas para leads que possuem interações manuais anotadas                       | Com ressalva                |
| 7   | SLA de Follow-up Comercial                              | Verificação se contatos de acompanhamento ocorreram dentro do prazo estipulado                                              | `crm_historico_interacoes.data_proximo_contato`                             | Agendamento de follow-up             | **Indisponível**           | A maioria dos registros não tem data de próximo contato estruturada             | Apenas no novo fluxo        |
| 8   | Follow-ups Pendentes e Atrasados                        | Contagem de interações com data prevista menor que a data de hoje sem baixa                                                 | `crm_historico_interacoes.data_proximo_contato < CURRENT_DATE`              | Consulta diária de pendências        | **Indisponível**           | Não há campo de status de conclusão do follow-up na tabela                      | Apenas no novo fluxo        |
| 9   | Volume de Apresentações Realizadas                      | Total de reuniões de demonstração executadas no período                                                                     | `agenda_eventos.tipo = 'apresentacao'`, `crm_prospect_etapa_historico`      | Conclusão de evento na agenda        | **Com Ressalva**           | Agenda tem apenas 40 eventos; apresentações informais não são registradas       | Com ressalva                |
| 10  | Propostas por Status                                    | Quantidade e valor de propostas em cada estágio (Gerada, Enviada, Aprovada, Recusada)                                       | `crm_propostas.status_negociacao`, `valor_implantacao`, `valor_mensalidade` | Mudança de status da proposta        | **Disponível e Confiável** | 50 registros existentes e consistentes                                          | Disponível e confiável      |
| 11  | Taxa de Aceite de Propostas                             | Razão entre propostas aprovadas e propostas enviadas: `(Aprovadas / Enviadas) * 100`                                        | `crm_propostas.status_negociacao`                                           | Aprovação formal de proposta         | **Disponível e Confiável** | 2 aprovadas sobre 4 enviadas (50% no universo restrito de enviadas)             | Disponível e confiável      |
| 12  | Motivos de Perda                                        | Distribuição quantitativa das razões de descarte de leads no funil                                                          | `crm_prospects.motivo_perda`                                                | Descarte / Perda de lead             | **Com Ressalva**           | Apenas 6 prospects possuem motivo de perda anotado no banco                     | Com ressalva                |
| 13  | Novos Clientes Efetivados                               | Contagem oficial de contratos assinados que viraram clientes no mês                                                         | `clientes.created_at`, `clientes.data_adesao`                               | Criação de cliente comercial         | **Disponível e Confiável** | 233 clientes existentes na base mestre                                          | Disponível e confiável      |
| 14  | Valor de Implantação Vendido                            | Somatório das taxas únicas acordadas nas propostas aprovadas: `SUM(valor_implantacao)`                                      | `crm_propostas.valor_implantacao WHERE status = 'Aprovada'`                 | Aprovação de proposta                | **Com Ressalva**           | Propostas geradas sem status formal de aprovação não são computadas             | Com ressalva                |
| 15  | MRR Adicionado (Novos Clientes)                         | Nova receita recorrente mensal contratada: `SUM(valor_mensalidade)`                                                         | `crm_propostas.valor_mensalidade` da proposta vigente aprovada              | Efetivação comercial                 | **Indisponível**           | `clientes.valor_mensalidade` está zerado em 97,4% da base                       | Apenas no novo fluxo        |
| 16  | Serviços Adicionais Vendidos                            | Contagem e valor de módulos, filiais e consultorias vendidos para a base                                                    | `atendimentos_clientes.tipo`, `valor_estimado`                              | Conclusão de atendimento             | **Com Ressalva**           | Valores em atendimentos são apenas estimados e sem confirmação de faturamento   | Com ressalva                |
| 17  | Tempos entre Aceite, Contrato, Financeiro e Implantação | Intervalos em dias entre marcos do fluxo: `data_contrato - data_aceite`, `data_handover - data_contrato`                    | Timestamps em propostas, contratos, solicitações e implementações           | Conclusão de cada marco              | **Indisponível**           | Contratos não têm data de aceite gravada; dados não encadeados                  | Apenas no novo fluxo        |
| 18  | Implantações em Andamento, Atrasadas e Concluídas       | Painel operacional de entrega: `COUNT() GROUP BY status, prazo_estourado`                                                   | `implementacoes.status`, `data_previsao`, `data_conclusao`                  | Atualização de status da implantação | **Com Ressalva**           | 22 implantações estagnadas como "Em andamento" sem atualização de prazo         | Com ressalva                |
| 19  | Volume de Atendimentos da Base                          | Quantidade de demandas abertas por clientes por tipo de serviço                                                             | `atendimentos_clientes.tipo`, `created_at`                                  | Criação de atendimento               | **Disponível e Confiável** | 51 atendimentos cadastrados e auditáveis                                        | Disponível e confiável      |
| 20  | Conversão de Atendimentos em Vendas                     | Percentual de solicitações da base que resultaram em implantação ou aditivo faturado                                        | `atendimentos_clientes.enviado_implantacao`, `solicitacoes_servico`         | Encaminhamento para entrega          | **Com Ressalva**           | 11 atendimentos enviados para implantação (21,5% de conversão bruta)            | Com ressalva                |
| 21  | Upsell / Expansão de Base                               | Crescimento de mensalidade gerado por clientes existentes (Expansion MRR)                                                   | Delta de `clientes.valor_mensalidade` pós-aditivo                           | Atualização do plano do cliente      | **Indisponível**           | Mensalidade não versionada e campo de histórico ausente                         | Apenas no novo fluxo        |
| 22  | Valores Aguardando Faturamento no Financeiro            | Somatório de serviços concluídos ainda não faturados: `SUM(valor) WHERE status = 'pendente'`                                | `solicitacoes_servico.valor`, `status_financeiro`                           | Criação de solicitação de serviço    | **Com Ressalva**           | 22 solicitações existentes; depende de conferência com o faturamento real       | Dependente do Financeiro    |
| 23  | Registros sem Competência e Vencimento                  | Contagem de lançamentos com dados contábeis incompletos                                                                     | `solicitacoes_servico` sem competência                                      | Auditoria de integridade             | **Indisponível**           | Tabela `solicitacoes_servico` não possui o campo `competencia`                  | Dependente do Financeiro    |
| 24  | Utilização Real vs. Plano Contratado                    | Comparativo entre usuários/filiais usados no ERP e o limite contratual                                                      | `sl_utilizacao_mensal.total_emitentes` vs. `clientes.filiais`               | Importação da planilha mensal        | **Indisponível**           | Tabelas `sl_*` estão com 0 registros no banco de dados                          | Dependente da Utilização SL |

---

## 18. DUPLICIDADES, RISCOS E DÍVIDAS TÉCNICAS

### 18.1 Tabela de Riscos de Engenharia e Integridade

| Risco / Dívida Técnica                       | Localização / Evidência Técnica                                                                                        | Nível de Risco | Impacto no Negócio                                                                                        | Recomendação de Mitigação                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Vínculo Rompido entre Prospect e Cliente** | `crm_prospects.cliente_id IS NULL` em todos os 72 registros; trigger `trg_prospect_to_client` não grava o ID retornado | **CRÍTICO**    | Impossibilita saber a origem comercial do cliente, calcular ciclo de venda e rastrear propostas originais | Ajustar a trigger para fazer `UPDATE crm_prospects SET cliente_id = v_cliente_id WHERE id = NEW.id` |
| **Fragilidade de Segurança em RLS**          | Políticas `Allow all` em `crm_prospects`, `crm_propostas`, `solicitacoes_servico`                                      | **ALTO**       | Qualquer usuário logado pode alterar propostas de colegas ou visualizar/modificar valores financeiros     | Implementar políticas RLS por perfil de acesso (`is_admin`, `is_commercial`, `is_financial`)        |
| **Pulo Cego de Etapas no Kanban**            | `CrmKanbanBoard.tsx` permite drag-and-drop livre entre quaisquer colunas                                               | **ALTO**       | O vendedor pode mover um lead direto para "Contrato" ou "Cliente Efetivado" sem proposta ou documentos    | Implementar validação de transição impedindo avanço sem a evidência correspondente                  |
| **Duplicação de Formulários de Contrato**    | `ContractGeneratorPage` vs. `CrmProspectPropostasTab`                                                                  | **MÉDIO**      | O comercial redigita valores, planos e módulos na tela de contratos, gerando inconsistências e retrabalho | Fazer com que o gerador de contratos carregue automaticamente a proposta aprovada                   |
| **Tabelas de Documentação Desconectadas**    | `prospect_documentacao` e `documentacao_adesao` com 0 registros                                                        | **MÉDIO**      | A documentação de adesão exigida na finalidade não é controlada dentro do sistema                         | Ativar a inicialização do checklist documental na aprovação da proposta                             |
| **Campos Financeiros Ambíguos**              | `clientes.valor_total` (legado) vs `clientes.valor_mensalidade`                                                        | **ALTO**       | Relatórios e dashboards exibem faturamento falso misturando implantação antiga com mensalidade            | Isolar `valor_total` em coluna legada e consolidar o faturamento no campo `valor_mensalidade`       |
| **Módulo de Utilização Paralisado**          | Tabelas `sl_importacoes` e `sl_utilizacao_mensal` com zero linhas                                                      | **MÉDIO**      | A empresa não audita se os clientes estão usando filiais e recursos além do que foi contratado            | Homologar o fluxo de importação mensal com planilhas de teste e vincular ao cliente                 |
| **Histórico de Interações Concorrente**      | `atividades_comerciais` (48 registros) concorrendo com `crm_historico_interacoes` (173 registros)                      | **BAIXO**      | Contatos ficam espalhados em duas tabelas diferentes                                                      | Desativar `atividades_comerciais` e migrar dados para `crm_historico_interacoes`                    |

---

## 19. MATRIZ COMPARATIVA: SISTEMA ATUAL × FINALIDADE

| Necessidade da Finalidade                   | Existe no Sistema? | Onde Está?                           | Nível de Atendimento           | Problema Identificado                                                                  | O que Falta para Completar                                     | Prioridade        |
| ------------------------------------------- | ------------------ | ------------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------- |
| Cadastro Central do Prospect/Cliente        | Sim                | `crm_prospects`, `clientes`          | Existe mas precisa reorganizar | Registros não estão vinculados via `cliente_id`; dados financeiros zerados em clientes | Vincular entidades e consolidar dados comerciais em tela única | **Indispensável** |
| Identificação da Próxima Ação por Evidência | Não                | N/A                                  | Não atendida                   | Ações dependem da memória do operador; Kanban livre                                    | Máquina de estados centralizada e botões primários contextuais | **Indispensável** |
| Elaboração e Versionamento de Proposta      | Sim                | `crm_propostas`                      | Atendida com ressalva          | Propostas não versionadas formalmente; 44 paradas em "Gerada"                          | Bloqueio de edição pós-envio e controle de versão vigente      | Importante        |
| Coleta de Documentação de Adesão            | Parcial            | `prospect_documentacao`              | Não utilizada (0 registros)    | Tabelas existem no banco mas a tela não inicializa o checklist                         | Exibir checklist de certidões e RG/CPF na aba do prospect      | **Indispensável** |
| Geração de Minuta sem Redigitação           | Parcial            | `ContractGeneratorPage`              | Parcial                        | Exige redigitar valores e módulos já contidos na proposta                              | Carregar dados da proposta aprovada na minuta contratual       | **Indispensável** |
| Assinatura Eletrônica Formal                | Não                | N/A                                  | Não atendida                   | Opera apenas por upload manual de arquivo assinado por fora                            | Integração via link/webhook com plataforma de assinatura       | Importante        |
| Validação Financeira Pré-Implantação        | Parcial            | `solicitacoes_servico`               | Parcial                        | Financeiro não dá confirmação formal de crédito/sinal                                  | Botão de liberação e confirmação pelo setor financeiro         | **Indispensável** |
| Handover Estruturado para Implantação       | Parcial            | `handover_versoes`, `implementacoes` | Parcial                        | Apenas 2 handovers gravados; implantação sem dados de proposta                         | Transmitir escopo e módulos contratados automaticamente        | **Indispensável** |
| Gestão Operacional de Implantação           | Sim                | `implementacao_etapas`               | Atendida                       | 258 etapas cadastradas e funcionais na rotina técnica                                  | Automatizar encerramento do projeto e ativação operacional     | Importante        |
| Ativação Operacional do Cliente             | Não                | N/A                                  | Não atendida                   | Cliente é marcado como "Ativo" comercialmente logo no início                           | Separar status: "Efetivado Comercial" vs "Ativo Operacional"   | **Indispensável** |
| Jornada da Base com Versionamento de Plano  | Parcial            | `atendimentos_clientes`              | Parcial                        | Inclusão de módulo/filial não atualiza a mensalidade oficial                           | Versionar aditivos e recalcular a mensalidade vigente          | **Indispensável** |
| Auditoria Append-Only e Sem Apagamento      | Parcial            | Triggers pontuais                    | Parcial                        | Históricos e propostas podem ser editados ou deletados                                 | Bloquear deleção de histórico e criar log auditável            | Importante        |
| Métricas Fidedignas de Ciclo e Conversão    | Parcial            | `ReportsPage`, `Index`               | Parcial                        | Métricas calculadas com contagens brutas sem coorte                                    | Implementar as 24 métricas com base em eventos reais           | Importante        |

---

## 20. O QUE DEVE SER PRESERVADO

O desenvolvimento e reorganização futura **NÃO DEVEM REESCREVER DO ZERO** os componentes e rotinas que já funcionam com excelência:

1. **Modelagem de Etapas de Implantação (`implementacao_etapas`)**: O roteiro técnico de parametrização e treinamento de transportadoras é completo e possui 258 etapas ativas bem estruturadas.
2. **Componente de Propostas (`CrmProspectPropostasTab` e `CrmPropostaForm`)**: A lógica de cálculo de itens, horas de implantação e módulos adicionais é robusta e deve ser mantida.
3. **Serviços de Consulta de CNPJ/CPF (`services/cnpj.ts`, `services/cpf.ts`)**: Funcionam perfeitamente para acelerar o preenchimento de cadastros.
4. **Estrutura do Módulo de Utilização (`services/service-logic-utilizacao.ts`)**: O parser de planilhas XLSX e conferência por SHA-256 está bem arquitetado, necessitando apenas de homologação de dados.
5. **Formulários de Onboarding e Avaliação de Treinamento (`OnboardingPage`, `AvaliacaoTreinamentoPage`)**: As telas públicas com validação por token estão prontas para serem acionadas pelos eventos automáticos.
6. **Módulo de Consultoria (`CrmConsultoriaDetailPage`)**: Estrutura detalhada de questionários operacionais com excelente design e organização.

---

## 21. O QUE FALTA (LACUNAS REAIS POR PRIORIDADE)

### 21.1 Nível 1: Indispensável (Sem isso o sistema não cumpre a finalidade)

1. **Máquina de Estados e Motor de Próxima Ação**: Criar lógica no backend/frontend que avalie as evidências de cada cadastro e exiba o botão da ação mandatória para o responsável.
2. **Correção do Vínculo Relacional Comercial ↔ Cliente**: Garantir que a efetivação grave `crm_prospects.cliente_id` e transfira os valores da proposta aprovada para `clientes.valor_mensalidade`.
3. **Ativação Real do Checklist de Documentação**: Habilitar a tela de conferência de documentos de adesão antes da emissão do contrato.
4. **Carregamento Automático da Proposta no Contrato**: Eliminar a redigitação de valores e módulos entre a proposta e o contrato.
5. **Confirmação Financeira (Gatekeeper Financeiro)**: Criar o status de liberação do Financeiro para que uma implantação não inicie sem confirmação do sinal.
6. **Separação Conceitual entre "Cliente Efetivado" e "Cliente Ativo"**:
   - _Cliente Efetivado_: Contrato assinado e sinal financeiro confirmado.
   - _Cliente Ativo_: Implantação e treinamentos concluídos com aceite operacional.

### 21.2 Nível 2: Importante (Impacto na eficiência e governança)

1. **Versionamento de Planos na Base (Jornada 2)**: Quando um aditivo for concluído, arquivar a composição anterior em tabela de histórico e atualizar o plano vigente.
2. **Travas no Kanban do CRM**: Impedir que o usuário arraste cards para etapas avançadas sem o cumprimento das regras obrigatórias.
3. **Segurança e RLS**: Reforçar as políticas no Supabase para que colaboradores vejam apenas o que lhes cabe.
4. **Disparo Automático de Avaliação de Treinamento**: Integrar a conclusão da etapa de treinamento ao disparo do e-mail com token de avaliação.

### 21.3 Nível 3: Melhorias Futuras e Integrações Opcionais

1. **Integração com Plataforma de Assinatura Eletrônica (e-Sign)** via webhook (Clicksign/DocuSign).
2. **Integração Bancária para Baixas Automáticas** na tabela `recebimentos`.
3. **Integração com Sistema de Tickets** (Jira/Movidesk) na ficha do cliente.

---

## 22. ARQUITETURA MÍNIMA RECOMENDADA

### 22.1 Estados e Evidências das Jornadas

```
[JORNADA 1: NOVOS CLIENTES]
(1) NOVO LEAD ──[Evidência: Contato registrado]──> (2) PRIMEIRO CONTATO
  │
  └──[Evidência: Reunião realizada]──> (3) APRESENTAÇÃO
        │
        └──[Evidência: Proposta gerada]──> (4) PROPOSTA ENVIADA
              │
              └──[Evidência: Registro de follow-up]──> (5) EM NEGOCIAÇÃO
                    │
                    └──[Evidência: Aceite formal registrado]──> (6) PROPOSTA APROVADA
                          │
                          └──[Evidência: Checklists aprovados]──> (7) DOCUMENTAÇÃO APROVADA
                                │
                                └──[Evidência: Doc assinado anexado]──> (8) CONTRATO ASSINADO
                                      │
                                      └──[Evidência: Baixa confirmada]──> (9) FINANCEIRO LIBERADO
                                            │   (Status: CLIENTE EFETIVADO)
                                            │
                                            └──[Evidência: Handover preenchido]──> (10) EM IMPLANTAÇÃO
                                                  │
                                                  └──[Evidência: 100% etapas concluídas]──> (11) CLIENTE ATIVO
```

### 22.2 Regras de Idempotência e Auditoria Append-Only

- **Tabela de Eventos (`processo_comercial_eventos`)**:
  Criar tabela de eventos imutáveis com: `id`, `entidade_tipo` ('prospect', 'cliente'), `entidade_id`, `evento_tipo`, `dados_payload` (jsonb), `usuario_id`, `created_at`.
- **Nenhuma atualização de status por sobrescrita manual direta**: toda mudança deve ser consequência do registro de um evento factual.

---

## 23. FLUXO FINAL PROPOSTO

### 23.1 Jornada 1: Novos Clientes (Matriz de Responsabilidade e Ação)

| Etapa           | Responsável        | Ação do Usuário                    | Evidência Requerida                         | Transição Automática          | Próxima Ação Apresentada                |
| --------------- | ------------------ | ---------------------------------- | ------------------------------------------- | ----------------------------- | --------------------------------------- |
| 1. Entrada      | SDR / Vendas       | Cadastra lead                      | Nome + Contato válido                       | Novo Lead                     | "Registrar Primeiro Contato"            |
| 2. Contato      | Vendedor           | Registra ligação/WhatsApp          | Linha em histórico                          | Contato Realizado             | "Agendar Apresentação"                  |
| 3. Apresentação | Vendedor           | Registra resultado da call         | Reunião concluída                           | Apresentado                   | "Elaborar Proposta Comercial"           |
| 4. Proposta     | Vendedor           | Monta itens e valores              | Linha em `crm_propostas`                    | Proposta Emitida              | "Enviar Proposta ao Cliente"            |
| 5. Negociação   | Vendedor           | Dispara e-mail / WhatsApp          | E-mail enviado / link gerado                | Proposta Enviada              | "Registrar Follow-up Obrigatório"       |
| 6. Aprovação    | Vendedor           | Registra aceite do cliente         | Registro de aceite                          | Proposta Aprovada             | "Coletar Documentação de Adesão"        |
| 7. Compliance   | Comercial / Admin  | Aprova certidões e CNPJ            | 100% docs obrigatórios aprovados            | Adesão Homologada             | "Emitir Minuta Contratual"              |
| 8. Contrato     | Jurídico / Vendas  | Gera contrato a partir da proposta | Minuta gerada                               | Aguardando Assinatura         | "Anexar Contrato Assinado"              |
| 9. Assinatura   | Vendedor           | Anexa contrato assinado            | Arquivo em `signed-contracts`               | Contrato Assinado             | "Encaminhar para Validação Financeira"  |
| 10. Financeiro  | Financeiro         | Confirma faturamento/sinal         | Baixa em `solicitacoes_servico`             | **Cliente Efetivado**         | "Realizar Handover para Implantação"    |
| 11. Handover    | Comercial          | Preenche notas do escopo           | Linha em `handover_versoes`                 | Handover Concluído            | Notifica Implantação                    |
| 12. Implantação | Coord. Implantação | Executa parametrização e treinos   | Etapas concluídas em `implementacao_etapas` | Em Implantação                | Acompanhamento do checklist técnico     |
| 13. Ativação    | Coord. Implantação | Valida Go-Live com cliente         | Homologação final                           | **Cliente Ativo Operacional** | "Transferir para Atendimento / Suporte" |

### 23.2 Jornada 2: Clientes da Base (Expansão, Aditivos e Serviços)

| Etapa                   | Responsável          | Ação do Usuário                 | Evidência Requerida                                 | Resultado no Sistema                                     |
| ----------------------- | -------------------- | ------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| 1. Solicitação          | Comercial / Suporte  | Registra demanda do cliente     | Linha em `atendimentos_clientes`                    | Atendimento aberto com número de protocolo               |
| 2. Orçamento            | Comercial            | Elabora orçamento de aditivo    | Linha em `crm_propostas` vinculada a `cliente_id`   | Orçamento gerado com cálculo de acréscimo de mensalidade |
| 3. Aprovação            | Vendedor             | Registra aprovação do cliente   | Proposta marcada como aprovada                      | "Emitir Termo Aditivo Contratual"                        |
| 4. Formalização         | Comercial            | Colhe assinatura do aditivo     | Arquivo de aditivo anexado em `historico_contratos` | "Encaminhar ao Financeiro e Implantação"                 |
| 5. Execução             | Implantação          | Parametriza módulo / filial     | Projeto em `implementacoes` concluído               | Notifica conclusão técnica                               |
| 6. Atualização do Plano | Sistema (Automático) | Aplica alteração na mensalidade | Arquiva plano anterior em tabela histórica          | Atualiza `clientes.valor_mensalidade` e lista de módulos |

---

## 24. PLANO DE IMPLEMENTAÇÃO EM LOTES

### Lote 0: Governança, Regras de Estados, Vínculos e Auditoria

- **Objetivo**: Criar a base transacional imutável, corrigir triggers quebradas e sanear vínculos relacionais.
- **O que Corrige**: Corrige a trigger `trg_prospect_to_client` para atualizar `crm_prospects.cliente_id`.
- **O que Cria**: Tabela `processo_eventos_historico`, enums para estados obrigatórios.
- **Risco**: Baixo (não afeta as telas existentes, apenas blinda o banco).
- **Rollback**: Restaurar versões anteriores das triggers.

### Lote 1: Cadastro Central do Prospect e Motor de Próxima Ação

- **Objetivo**: Transformar o drawer de visualização do prospect/cliente em central de comando com botão da próxima ação baseado em evidências.
- **O que Reaproveita**: `CrmProspectForm.tsx`, `CrmKanbanBoard.tsx`.
- **O que Corrige**: Insere botões contextuais primários e trava movimentação sem evidência.
- **Métricas Habilitadas**: SLA de primeiro contato, follow-ups atrasados.

### Lote 2: Primeiro Contato, Apresentação e Follow-up Estruturado

- **Objetivo**: Integrar a agenda comercial e o histórico de interações com alarmes de follow-up.
- **O que Corrige**: Desativa `ActivitiesPage` e unifica em `crm_historico_interacoes`.
- **Métricas Habilitadas**: Volume de apresentações, taxa de conversão contato ➔ apresentação.

### Lote 3: Proposta Comercial, Versionamento e Adesão

- **Objetivo**: Conectar a proposta comercial com validade e habilitar o checklist real de documentação de adesão.
- **O que Reaproveita**: `CrmProspectPropostasTab`, `ProspectDocumentacaoTab`.
- **O que Corrige**: Torna o preenchimento de documentos um requisito formal para a emissão do contrato.

### Lote 4: Contrato, Minuta Automática e Efetivação Comercial

- **Objetivo**: Puxar dados da proposta aprovada diretamente para a minuta contratual, eliminando a redigitação.
- **O que Reaproveita**: `ContractGeneratorPage`, `SignedContractUpload`.
- **O que Corrige**: Associa o contrato assinado à proposta e marca o cliente como "Efetivado Comercial".

### Lote 5: Gatekeeper Financeiro e Handover para Implantação

- **Objetivo**: Exigir validação formal do Financeiro antes de liberar a entrega técnica.
- **O que Reaproveita**: `solicitacoes_servico`, `handover_versoes`.
- **O que Corrige**: Cria tela de aprovação de faturamento e transfere o escopo acordado para a Implantação.

### Lote 6: Execução da Implantação, Treinamentos e Ativação Operacional

- **Objetivo**: Gerenciar a entrega técnica com disparo automático de avaliações de treinamento e ativação operacional ao término.
- **O que Reaproveita**: `ImplementacoesPage`, `implementacao_etapas`, `AvaliacaoTreinamentoPage`.
- **O que Corrige**: Marca o cliente como "Ativo Operacional" e transfere para a fila de suporte contínuo.

### Lote 7: Cadastro Central do Cliente da Base e Histórico de MRR

- **Objetivo**: Estruturar a ficha cadastral do cliente ativo com separação nítida de mensalidade vigente, filiais e histórico.
- **O que Corrige**: Isola o campo `valor_total` legado e padroniza `valor_mensalidade`.

### Lote 8: Jornada 2 — Atendimentos da Base, Orçamento de Aditivos e Upsell

- **Objetivo**: Permitir que atendimentos comerciais gerem orçamentos de aditivos padronizados.
- **O que Reaproveita**: `atendimentos_clientes`, `CrmPropostaForm`.

### Lote 9: Execução de Aditivos e Atualização Automática do Plano

- **Objetivo**: Após conclusão técnica e validação financeira, atualizar a mensalidade do cliente preservando o histórico anterior.

### Lote 10: Relatórios Gerenciais e Painel das 24 Métricas

- **Objetivo**: Entregar os dashboards do Rodrigo calculados a partir de eventos reais do banco de dados.

### Lote 11: Saneamento Opcional de Dados Históricos

- **Objetivo**: Rodar rotina de cruzamento de CNPJ para associar retroativamente os 14 prospects efetivados aos seus respectivos clientes em `clientes`.

### Lote 12: Homologação, Testes de Carga e Não-Regressão

- **Objetivo**: Garantir cobertura de testes e estabilidade em todos os navegadores e perfis de usuário.

---

## 25. CONCLUSÃO OBRIGATÓRIA (RESPOSTAS DIRETAS)

1. **O que o sistema faz hoje?**  
   Cadastra leads no CRM, calcula propostas comerciais em interface web, gera minutas contratuais pré-formatadas, acompanha checklists operacionais de implantação de software e registra anotações diárias de contato com clientes.
2. **O que já funciona conforme a finalidade?**  
   O cadastro de prospects com validação de CNPJ, o cálculo de propostas de implantação/mensalidade, o checklist de 258 etapas operacionais de implantação e o catálogo de planos e módulos.
3. **O que existe mas está espalhado ou desconectado?**  
   A geração de contratos (que exige redigitar o que já estava na proposta), o registro de contatos comerciais (dividido entre `crm_historico_interacoes` e `atividades_comerciais`), o checklist de documentação de adesão (estruturado no banco, mas esquecido pela interface) e o handover comercial (que não trafega o escopo vendido diretamente para a tela do técnico).
4. **O que está incompleto?**  
   O processo de efetivação comercial (que não vincula o ID do cliente criado), a conferência financeira (solicitações de faturamento não possuem confirmação de baixa) e os projetos de implantação (22 de 23 parados em "Em andamento" sem encerramento formal).
5. **O que não existe?**  
   O motor central de identificação da "Próxima Ação" baseada em evidências reais; o versionamento transacional de planos e mensalidades para clientes da base; o controle de recebimentos reais; e os relatórios de conversão de funil por coorte e tempo de ciclo de venda.
6. **O que está errado ou gerando risco grave?**
   - 100% dos prospects efetivados estão com `cliente_id = NULL`;
   - O campo `clientes.valor_total` contém lixo histórico e não pode ser usado como MRR;
   - Políticas de RLS frouxas permitem que usuários com perfil básico modifiquem dados comerciais;
   - O kanban permite arrastar cards livremente sem validar evidências.
7. **O que deve ser preservado?**  
   As 258 etapas cadastradas de implantação, a lógica de cálculo de propostas, os serviços de consulta de CNPJ/CPF, as rotinas de token de onboarding e avaliação de treinamento e os dados cadastrais legítimos dos 233 clientes.
8. **Qual é a menor intervenção necessária para destravar o fluxo?**  
   Ajustar a trigger `trg_prospect_to_client` para retroalimentar o `cliente_id` no prospect e colocar no topo do drawer do prospect um botão indicando a próxima ação obrigatória com base no status atual.
9. **Qual deve ser o primeiro lote a ser executado?**  
   O **Lote 0 (Governança, Triggers e Vínculos)**, seguido imediatamente do **Lote 1 (Cadastro Central e Próxima Ação)**.
10. **O Lote 0 é isolável sem quebrar o sistema atual?**  
    **Sim, 100% isolável.** Trata-se de uma correção cirúrgica de banco de dados (triggers e integridade relacional) que não altera as assinaturas das tabelas nem impede o uso da interface atual.
11. **Quais são os riscos que permanecem se nada for feito?**  
    A base continuará acumulando prospects órfãos, vendedores continuarão pulando etapas de documentação e contrato, a diretoria continuará sem saber o MRR real da transportadora e as métricas gerenciais continuarão baseadas em números fictícios.
12. **Qual é a porcentagem estimada do objetivo que já está pronta?**  
    **38,5%** da finalidade total está pronta e utilizável (sendo 45% da Jornada 1 e 25% da Jornada 2).
13. **Qual é a sequência lógica recomendada de execução?**  
    Lote 0 ➔ Lote 1 ➔ Lote 2 ➔ Lote 3 ➔ Lote 4 ➔ Lote 5 ➔ Lote 6 ➔ Lote 7 ➔ Lote 8 ➔ Lote 9 ➔ Lote 10 ➔ Lote 11 ➔ Lote 12.
14. **Quando o sistema pode ser considerado pronto para uso definitivo?**  
    Quando um lead puder ser percorrido desde o primeiro contato até a ativação operacional exclusivamente através de botões guiados pela evidência de cada marco, com o faturamento recorrente (MRR) refletindo com exatidão a mensalidade contratada no cadastro mestre do cliente.
