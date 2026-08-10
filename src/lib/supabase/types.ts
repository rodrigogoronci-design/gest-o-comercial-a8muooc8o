// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      afastamentos: {
        Row: {
          aprovado_por: string | null
          colaborador_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          dias_afastado: number | null
          documento_anexo: string | null
          id: string
          justificativa: string | null
          status: string | null
          tipo: string
        }
        Insert: {
          aprovado_por?: string | null
          colaborador_id: string
          created_at?: string
          data_fim: string
          data_inicio: string
          dias_afastado?: number | null
          documento_anexo?: string | null
          id?: string
          justificativa?: string | null
          status?: string | null
          tipo: string
        }
        Update: {
          aprovado_por?: string | null
          colaborador_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          dias_afastado?: number | null
          documento_anexo?: string | null
          id?: string
          justificativa?: string | null
          status?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "afastamentos_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamentos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_eventos: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_evento: string
          descricao: string | null
          id: string
          status: string
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_evento: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_evento?: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_eventos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ajustes_ponto: {
        Row: {
          aprovado_por: string | null
          colaborador_id: string
          created_at: string
          data: string
          documento_url: string | null
          horas: number | null
          id: string
          justificativa: string | null
          motivo: string | null
          status: string | null
          tipo: string
        }
        Insert: {
          aprovado_por?: string | null
          colaborador_id: string
          created_at?: string
          data: string
          documento_url?: string | null
          horas?: number | null
          id?: string
          justificativa?: string | null
          motivo?: string | null
          status?: string | null
          tipo: string
        }
        Update: {
          aprovado_por?: string | null
          colaborador_id?: string
          created_at?: string
          data?: string
          documento_url?: string | null
          horas?: number | null
          id?: string
          justificativa?: string | null
          motivo?: string | null
          status?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_ponto_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_ponto_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      article_comments: {
        Row: {
          article_id: string | null
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      article_history: {
        Row: {
          action: string
          article_id: string | null
          changes: Json | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          article_id?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          article_id?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      article_jira_issues: {
        Row: {
          article_id: string
          created_at: string | null
          jira_issue_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          jira_issue_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          jira_issue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_jira_issues_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_jira_issues_jira_issue_id_fkey"
            columns: ["jira_issue_id"]
            isOneToOne: false
            referencedRelation: "jira_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tags: {
        Row: {
          article_id: string
          created_at: string | null
          tag_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          tag_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "knowledge_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tickets: {
        Row: {
          article_id: string
          created_at: string | null
          ticket_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          ticket_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tickets_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tickets_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "movidesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos_clientes: {
        Row: {
          cliente_id: string
          created_at: string
          data_atendimento: string
          documento_url: string | null
          enviado_implantacao: boolean
          id: string
          relatorio: string
          solicitacao: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_atendimento: string
          documento_url?: string | null
          enviado_implantacao?: boolean
          id?: string
          relatorio: string
          solicitacao: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_atendimento?: string
          documento_url?: string | null
          enviado_implantacao?: boolean
          id?: string
          relatorio?: string
          solicitacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      atestados: {
        Row: {
          arquivo_url: string | null
          colaborador_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          observacoes: string | null
          organization_id: string | null
          quantidade_dias: number
        }
        Insert: {
          arquivo_url?: string | null
          colaborador_id: string
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          quantidade_dias: number
        }
        Update: {
          arquivo_url?: string | null
          colaborador_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          quantidade_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "atestados_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atestados_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades_comerciais: {
        Row: {
          acao_necessaria: string | null
          cliente_id: string | null
          cliente_nome: string | null
          condicao: string | null
          created_at: string
          data_atividade: string
          data_follow_up: string | null
          demanda: string
          id: string
          observacoes: string | null
          parcelas: string | null
          status: string | null
          tipo: string | null
          valor_implantacao: number | null
          valor_mensalidade: number | null
        }
        Insert: {
          acao_necessaria?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          condicao?: string | null
          created_at?: string
          data_atividade?: string
          data_follow_up?: string | null
          demanda: string
          id?: string
          observacoes?: string | null
          parcelas?: string | null
          status?: string | null
          tipo?: string | null
          valor_implantacao?: number | null
          valor_mensalidade?: number | null
        }
        Update: {
          acao_necessaria?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          condicao?: string | null
          created_at?: string
          data_atividade?: string
          data_follow_up?: string | null
          demanda?: string
          id?: string
          observacoes?: string | null
          parcelas?: string | null
          status?: string | null
          tipo?: string | null
          valor_implantacao?: number | null
          valor_mensalidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_comerciais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_acessos: {
        Row: {
          acao: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          avaliador_id: string | null
          colaborador_id: string
          created_at: string
          id: string
          nota_pontualidade: number
          nota_qualidade: number
          nota_trabalho_equipe: number
          observacoes: string | null
          organization_id: string | null
          periodo: string
        }
        Insert: {
          avaliador_id?: string | null
          colaborador_id: string
          created_at?: string
          id?: string
          nota_pontualidade: number
          nota_qualidade: number
          nota_trabalho_equipe: number
          observacoes?: string | null
          organization_id?: string | null
          periodo: string
        }
        Update: {
          avaliador_id?: string | null
          colaborador_id?: string
          created_at?: string
          id?: string
          nota_pontualidade?: number
          nota_qualidade?: number
          nota_trabalho_equipe?: number
          observacoes?: string | null
          organization_id?: string | null
          periodo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_avaliacoes_avaliador"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_avaliacoes_colaborador"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiarios_plano_saude: {
        Row: {
          created_at: string
          data_nascimento: string | null
          id: string
          idade: number | null
          inicio_vigencia: string | null
          nome: string | null
          numero: string | null
          plano_codigo: string | null
          plano_descricao: string | null
          registro_operadora: string | null
          sexo: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          id?: string
          idade?: number | null
          inicio_vigencia?: string | null
          nome?: string | null
          numero?: string | null
          plano_codigo?: string | null
          plano_descricao?: string | null
          registro_operadora?: string | null
          sexo?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          id?: string
          idade?: number | null
          inicio_vigencia?: string | null
          nome?: string | null
          numero?: string | null
          plano_codigo?: string | null
          plano_descricao?: string | null
          registro_operadora?: string | null
          sexo?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      beneficios_fechamentos: {
        Row: {
          fechado_em: string | null
          fechado_por: string | null
          mes_ano: string
          status: string
        }
        Insert: {
          fechado_em?: string | null
          fechado_por?: string | null
          mes_ano: string
          status?: string
        }
        Update: {
          fechado_em?: string | null
          fechado_por?: string | null
          mes_ano?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficios_fechamentos_fechado_por_fkey"
            columns: ["fechado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficios_ticket: {
        Row: {
          atestados: number
          colaborador_id: string
          created_at: string
          credito: number | null
          credito_justificativa: string | null
          desconto: number | null
          desconto_justificativa: string | null
          dias_uteis: number
          faltas: number
          feriados_trabalhados: number
          ferias: number
          id: string
          mes_ano: string
          plantoes: number
        }
        Insert: {
          atestados?: number
          colaborador_id: string
          created_at?: string
          credito?: number | null
          credito_justificativa?: string | null
          desconto?: number | null
          desconto_justificativa?: string | null
          dias_uteis?: number
          faltas?: number
          feriados_trabalhados?: number
          ferias?: number
          id?: string
          mes_ano: string
          plantoes?: number
        }
        Update: {
          atestados?: number
          colaborador_id?: string
          created_at?: string
          credito?: number | null
          credito_justificativa?: string | null
          desconto?: number | null
          desconto_justificativa?: string | null
          dias_uteis?: number
          faltas?: number
          feriados_trabalhados?: number
          ferias?: number
          id?: string
          mes_ano?: string
          plantoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "beneficios_ticket_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficios_transporte: {
        Row: {
          atestados: number
          colaborador_id: string
          created_at: string
          credito: number | null
          credito_justificativa: string | null
          desconto: number | null
          desconto_justificativa: string | null
          dias_uteis: number
          faltas: number
          feriados_trabalhados: number
          ferias: number
          home_office: number
          id: string
          mes_ano: string
          plantoes: number
        }
        Insert: {
          atestados?: number
          colaborador_id: string
          created_at?: string
          credito?: number | null
          credito_justificativa?: string | null
          desconto?: number | null
          desconto_justificativa?: string | null
          dias_uteis?: number
          faltas?: number
          feriados_trabalhados?: number
          ferias?: number
          home_office?: number
          id?: string
          mes_ano: string
          plantoes?: number
        }
        Update: {
          atestados?: number
          colaborador_id?: string
          created_at?: string
          credito?: number | null
          credito_justificativa?: string | null
          desconto?: number | null
          desconto_justificativa?: string | null
          dias_uteis?: number
          faltas?: number
          feriados_trabalhados?: number
          ferias?: number
          home_office?: number
          id?: string
          mes_ano?: string
          plantoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "beneficios_transporte_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      calculos_horas: {
        Row: {
          banco_horas_saldo: number | null
          colaborador_id: string
          created_at: string
          faltas: number | null
          horas_extras: number | null
          horas_normais: number | null
          horas_noturnas: number | null
          id: string
          periodo_id: string
        }
        Insert: {
          banco_horas_saldo?: number | null
          colaborador_id: string
          created_at?: string
          faltas?: number | null
          horas_extras?: number | null
          horas_normais?: number | null
          horas_noturnas?: number | null
          id?: string
          periodo_id: string
        }
        Update: {
          banco_horas_saldo?: number | null
          colaborador_id?: string
          created_at?: string
          faltas?: number | null
          horas_extras?: number | null
          horas_normais?: number | null
          horas_noturnas?: number | null
          id?: string
          periodo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calculos_horas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculos_horas_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_folha"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cnpj: string
          cobrancas: Json | null
          cobrar_filiais: boolean | null
          contrato_url: string | null
          created_at: string
          data_assinatura: string | null
          data_cancelamento: string | null
          desconto_mensalidade: number | null
          diagnostico: Json | null
          documentos_urls: Json | null
          email: string | null
          endereco: string | null
          filiais_detalhes: Json | null
          id: string
          indice_reajuste_ipca: number | null
          link_assinatura: string | null
          modo_implantacao: string | null
          modulos: Json | null
          motivo_cancelamento: string | null
          nome: string
          plano_id: string | null
          quantidade_filiais: number | null
          rep_cpf: string | null
          rep_nome: string | null
          rep_rg: string | null
          status: string | null
          tags: Json | null
          telefone: string | null
          tipo_desconto: string
          valor_anual: number | null
          valor_implantacao: number | null
          valor_mensalidade: number | null
          valor_total: number | null
          vencimento_mensal: number | null
        }
        Insert: {
          cnpj: string
          cobrancas?: Json | null
          cobrar_filiais?: boolean | null
          contrato_url?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_cancelamento?: string | null
          desconto_mensalidade?: number | null
          diagnostico?: Json | null
          documentos_urls?: Json | null
          email?: string | null
          endereco?: string | null
          filiais_detalhes?: Json | null
          id?: string
          indice_reajuste_ipca?: number | null
          link_assinatura?: string | null
          modo_implantacao?: string | null
          modulos?: Json | null
          motivo_cancelamento?: string | null
          nome: string
          plano_id?: string | null
          quantidade_filiais?: number | null
          rep_cpf?: string | null
          rep_nome?: string | null
          rep_rg?: string | null
          status?: string | null
          tags?: Json | null
          telefone?: string | null
          tipo_desconto?: string
          valor_anual?: number | null
          valor_implantacao?: number | null
          valor_mensalidade?: number | null
          valor_total?: number | null
          vencimento_mensal?: number | null
        }
        Update: {
          cnpj?: string
          cobrancas?: Json | null
          cobrar_filiais?: boolean | null
          contrato_url?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_cancelamento?: string | null
          desconto_mensalidade?: number | null
          diagnostico?: Json | null
          documentos_urls?: Json | null
          email?: string | null
          endereco?: string | null
          filiais_detalhes?: Json | null
          id?: string
          indice_reajuste_ipca?: number | null
          link_assinatura?: string | null
          modo_implantacao?: string | null
          modulos?: Json | null
          motivo_cancelamento?: string | null
          nome?: string
          plano_id?: string | null
          quantidade_filiais?: number | null
          rep_cpf?: string | null
          rep_nome?: string | null
          rep_rg?: string | null
          status?: string | null
          tags?: Json | null
          telefone?: string | null
          tipo_desconto?: string
          valor_anual?: number | null
          valor_implantacao?: number | null
          valor_mensalidade?: number | null
          valor_total?: number | null
          vencimento_mensal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_saude"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_planos: {
        Row: {
          colaborador_id: string | null
          created_at: string
          data_adesao: string | null
          id: string
          plano_id: string | null
          status: string | null
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          data_adesao?: string | null
          id?: string
          plano_id?: string | null
          status?: string | null
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          data_adesao?: string | null
          id?: string
          plano_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_planos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_planos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_saude"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          adicional_noturno_percentual: number | null
          app_source: string | null
          avatar_url: string | null
          cargo: string | null
          chave_pix: string | null
          codigo_funcionario: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_demissao: string | null
          data_nascimento: string | null
          departamento: string | null
          documentos_urls: Json | null
          email: string | null
          endereco: string | null
          id: string
          image_gender: string | null
          intervalo_minutos: number | null
          jornada_diaria: number | null
          jornada_dias: Json | null
          jornada_entrada: string | null
          jornada_retorno_intervalo: string | null
          jornada_saida: string | null
          jornada_saida_intervalo: string | null
          local_trabalho_lat: number | null
          local_trabalho_lng: number | null
          motivo_demissao: string | null
          nome: string
          organization_id: string | null
          recebe_transporte: boolean
          rg: string | null
          role: string
          salario: number | null
          status: string | null
          telefone: string | null
          tipo_chave_pix: string | null
          tipo_contrato: string | null
          user_id: string | null
        }
        Insert: {
          adicional_noturno_percentual?: number | null
          app_source?: string | null
          avatar_url?: string | null
          cargo?: string | null
          chave_pix?: string | null
          codigo_funcionario?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          departamento?: string | null
          documentos_urls?: Json | null
          email?: string | null
          endereco?: string | null
          id?: string
          image_gender?: string | null
          intervalo_minutos?: number | null
          jornada_diaria?: number | null
          jornada_dias?: Json | null
          jornada_entrada?: string | null
          jornada_retorno_intervalo?: string | null
          jornada_saida?: string | null
          jornada_saida_intervalo?: string | null
          local_trabalho_lat?: number | null
          local_trabalho_lng?: number | null
          motivo_demissao?: string | null
          nome: string
          organization_id?: string | null
          recebe_transporte?: boolean
          rg?: string | null
          role?: string
          salario?: number | null
          status?: string | null
          telefone?: string | null
          tipo_chave_pix?: string | null
          tipo_contrato?: string | null
          user_id?: string | null
        }
        Update: {
          adicional_noturno_percentual?: number | null
          app_source?: string | null
          avatar_url?: string | null
          cargo?: string | null
          chave_pix?: string | null
          codigo_funcionario?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          departamento?: string | null
          documentos_urls?: Json | null
          email?: string | null
          endereco?: string | null
          id?: string
          image_gender?: string | null
          intervalo_minutos?: number | null
          jornada_diaria?: number | null
          jornada_dias?: Json | null
          jornada_entrada?: string | null
          jornada_retorno_intervalo?: string | null
          jornada_saida?: string | null
          jornada_saida_intervalo?: string | null
          local_trabalho_lat?: number | null
          local_trabalho_lng?: number | null
          motivo_demissao?: string | null
          nome?: string
          organization_id?: string | null
          recebe_transporte?: boolean
          rg?: string | null
          role?: string
          salario?: number | null
          status?: string | null
          telefone?: string | null
          tipo_chave_pix?: string | null
          tipo_contrato?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      contracheques: {
        Row: {
          arquivo_url: string
          assinado: boolean | null
          assinatura_nome: string | null
          colaborador_id: string
          created_at: string
          dados_extraidos: Json | null
          data_assinatura: string | null
          id: string
          mes_ano: string
          valor_liquido: number | null
        }
        Insert: {
          arquivo_url: string
          assinado?: boolean | null
          assinatura_nome?: string | null
          colaborador_id: string
          created_at?: string
          dados_extraidos?: Json | null
          data_assinatura?: string | null
          id?: string
          mes_ano: string
          valor_liquido?: number | null
        }
        Update: {
          arquivo_url?: string
          assinado?: boolean | null
          assinatura_nome?: string | null
          colaborador_id?: string
          created_at?: string
          dados_extraidos?: Json | null
          data_assinatura?: string | null
          id?: string
          mes_ano?: string
          valor_liquido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracheques_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_historico_interacoes: {
        Row: {
          created_at: string
          data_interacao: string
          detalhes: string | null
          id: string
          prospect_id: string
          resumo: string
          tipo_contato: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_interacao?: string
          detalhes?: string | null
          id?: string
          prospect_id: string
          resumo: string
          tipo_contato: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_interacao?: string
          detalhes?: string | null
          id?: string
          prospect_id?: string
          resumo?: string
          tipo_contato?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_historico_interacoes_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_propostas: {
        Row: {
          aos_cuidados_de: string | null
          cliente_id: string | null
          cobrar_filiais: boolean | null
          created_at: string
          data_envio: string | null
          data_proposta: string
          desconto_mensalidade: number | null
          documento_url: string | null
          filiais_detalhes: Json | null
          id: string
          is_gratuito: boolean | null
          isencao_periodo: number | null
          itens: Json
          parcelas_implantacao: number
          prazos_concedidos: string | null
          prospect_id: string | null
          quantidade_filiais: number
          status_negociacao: string | null
          tipo_cobranca: string | null
          tipo_desconto: string
          user_id: string | null
          valor_anual: number | null
          valor_implantacao: number
          valor_mensalidade: number
        }
        Insert: {
          aos_cuidados_de?: string | null
          cliente_id?: string | null
          cobrar_filiais?: boolean | null
          created_at?: string
          data_envio?: string | null
          data_proposta?: string
          desconto_mensalidade?: number | null
          documento_url?: string | null
          filiais_detalhes?: Json | null
          id?: string
          is_gratuito?: boolean | null
          isencao_periodo?: number | null
          itens?: Json
          parcelas_implantacao?: number
          prazos_concedidos?: string | null
          prospect_id?: string | null
          quantidade_filiais?: number
          status_negociacao?: string | null
          tipo_cobranca?: string | null
          tipo_desconto?: string
          user_id?: string | null
          valor_anual?: number | null
          valor_implantacao?: number
          valor_mensalidade?: number
        }
        Update: {
          aos_cuidados_de?: string | null
          cliente_id?: string | null
          cobrar_filiais?: boolean | null
          created_at?: string
          data_envio?: string | null
          data_proposta?: string
          desconto_mensalidade?: number | null
          documento_url?: string | null
          filiais_detalhes?: Json | null
          id?: string
          is_gratuito?: boolean | null
          isencao_periodo?: number | null
          itens?: Json
          parcelas_implantacao?: number
          prazos_concedidos?: string | null
          prospect_id?: string | null
          quantidade_filiais?: number
          status_negociacao?: string | null
          tipo_cobranca?: string | null
          tipo_desconto?: string
          user_id?: string | null
          valor_anual?: number | null
          valor_implantacao?: number
          valor_mensalidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_propostas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_propostas_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_prospects: {
        Row: {
          ata_primeiro_atendimento: string | null
          classificacao: string | null
          cliente_id: string | null
          cnpj: string | null
          contato_nome: string
          contrato_assinado: boolean | null
          contrato_assinado_url: string | null
          cpf: string | null
          created_at: string | null
          data_assinatura: string | null
          data_followup: string | null
          data_nascimento: string | null
          diagnostico: Json | null
          documentos_adesao: Json | null
          email: string | null
          empresa: string
          endereco: string | null
          id: string
          modulos_contratados: Json | null
          nome_mae: string | null
          nome_pai: string | null
          observacoes: string | null
          observacoes_comerciais: string | null
          plano_apresentado: string | null
          plano_contratado: string | null
          plano_id: string | null
          proposta_anexada_em: string | null
          proposta_url: string | null
          quantidade_uso: number | null
          razao_social: string | null
          responsavel_comercial: string | null
          status: string
          tags: Json | null
          telefone: string | null
          tipo_pessoa: string | null
          ultima_interacao: string | null
          user_id: string | null
        }
        Insert: {
          ata_primeiro_atendimento?: string | null
          classificacao?: string | null
          cliente_id?: string | null
          cnpj?: string | null
          contato_nome: string
          contrato_assinado?: boolean | null
          contrato_assinado_url?: string | null
          cpf?: string | null
          created_at?: string | null
          data_assinatura?: string | null
          data_followup?: string | null
          data_nascimento?: string | null
          diagnostico?: Json | null
          documentos_adesao?: Json | null
          email?: string | null
          empresa: string
          endereco?: string | null
          id?: string
          modulos_contratados?: Json | null
          nome_mae?: string | null
          nome_pai?: string | null
          observacoes?: string | null
          observacoes_comerciais?: string | null
          plano_apresentado?: string | null
          plano_contratado?: string | null
          plano_id?: string | null
          proposta_anexada_em?: string | null
          proposta_url?: string | null
          quantidade_uso?: number | null
          razao_social?: string | null
          responsavel_comercial?: string | null
          status?: string
          tags?: Json | null
          telefone?: string | null
          tipo_pessoa?: string | null
          ultima_interacao?: string | null
          user_id?: string | null
        }
        Update: {
          ata_primeiro_atendimento?: string | null
          classificacao?: string | null
          cliente_id?: string | null
          cnpj?: string | null
          contato_nome?: string
          contrato_assinado?: boolean | null
          contrato_assinado_url?: string | null
          cpf?: string | null
          created_at?: string | null
          data_assinatura?: string | null
          data_followup?: string | null
          data_nascimento?: string | null
          diagnostico?: Json | null
          documentos_adesao?: Json | null
          email?: string | null
          empresa?: string
          endereco?: string | null
          id?: string
          modulos_contratados?: Json | null
          nome_mae?: string | null
          nome_pai?: string | null
          observacoes?: string | null
          observacoes_comerciais?: string | null
          plano_apresentado?: string | null
          plano_contratado?: string | null
          plano_id?: string | null
          proposta_anexada_em?: string | null
          proposta_url?: string | null
          quantidade_uso?: number | null
          razao_social?: string | null
          responsavel_comercial?: string | null
          status?: string
          tags?: Json | null
          telefone?: string | null
          tipo_pessoa?: string | null
          ultima_interacao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_prospects_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospects_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_saude"
            referencedColumns: ["id"]
          },
        ]
      }
      dependentes_plano: {
        Row: {
          colaborador_id: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          id: string
          nome: string
          parentesco: string | null
          status: string | null
        }
        Insert: {
          colaborador_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome: string
          parentesco?: string | null
          status?: string | null
        }
        Update: {
          colaborador_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome?: string
          parentesco?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dependentes_plano_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      dias_home_office: {
        Row: {
          created_at: string
          data: string
          id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
        }
        Relationships: []
      }
      dispositivos_autorizados: {
        Row: {
          colaborador_id: string | null
          created_at: string
          device_id_hash: string
          id: string
          status: string
          tipo: string
          ultima_autenticacao: string | null
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          device_id_hash: string
          id?: string
          status?: string
          tipo: string
          ultima_autenticacao?: string | null
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          device_id_hash?: string
          id?: string
          status?: string
          tipo?: string
          ultima_autenticacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispositivos_autorizados_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      documentacao_adesao: {
        Row: {
          arquivo_url: string | null
          categoria: string
          cliente_id: string | null
          created_at: string | null
          id: string
          item: string
          observacoes: string | null
          status: string | null
          updated_at: string | null
          uploaded_at: string | null
        }
        Insert: {
          arquivo_url?: string | null
          categoria: string
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          item: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Update: {
          arquivo_url?: string | null
          categoria?: string
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          item?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentacao_adesao_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      documentacao_status_cliente: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          id: string
          status_geral: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          status_geral?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          status_geral?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentacao_status_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_obrigatorios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome_documento: string
          plano_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome_documento: string
          plano_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome_documento?: string
          plano_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_obrigatorios_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_saude"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_mes: {
        Row: {
          created_at: string
          mes_ano: string
          status: string
        }
        Insert: {
          created_at?: string
          mes_ano: string
          status?: string
        }
        Update: {
          created_at?: string
          mes_ano?: string
          status?: string
        }
        Relationships: []
      }
      faltas: {
        Row: {
          colaborador_id: string
          created_at: string
          data: string
          id: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data: string
          id?: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faltas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      faturamento_plano_saude: {
        Row: {
          beneficiario_nome: string | null
          cpf: string | null
          created_at: string
          data_limite: string | null
          dependencia: string | null
          dt_inclusao: string | null
          id: string
          id_dependencia: string | null
          mes_ano: string | null
          numero_beneficiario: string | null
          plano: string | null
          rubrica: string | null
          tipo: string | null
          valor: number | null
          valor_total: number | null
        }
        Insert: {
          beneficiario_nome?: string | null
          cpf?: string | null
          created_at?: string
          data_limite?: string | null
          dependencia?: string | null
          dt_inclusao?: string | null
          id?: string
          id_dependencia?: string | null
          mes_ano?: string | null
          numero_beneficiario?: string | null
          plano?: string | null
          rubrica?: string | null
          tipo?: string | null
          valor?: number | null
          valor_total?: number | null
        }
        Update: {
          beneficiario_nome?: string | null
          cpf?: string | null
          created_at?: string
          data_limite?: string | null
          dependencia?: string | null
          dt_inclusao?: string | null
          id?: string
          id_dependencia?: string | null
          mes_ano?: string | null
          numero_beneficiario?: string | null
          plano?: string | null
          rubrica?: string | null
          tipo?: string | null
          valor?: number | null
          valor_total?: number | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          article_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      feriados: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
          tipo: string | null
        }
        Insert: {
          created_at?: string
          data: string
          descricao?: string
          id?: string
          tipo?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          tipo?: string | null
        }
        Relationships: []
      }
      ferias: {
        Row: {
          colaborador_id: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          observacoes: string | null
          organization_id: string | null
          status: string | null
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          status?: string | null
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ferias_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ferias_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_ajustes: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes: Json
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_ajustes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_contratos: {
        Row: {
          cliente_id: string
          created_at: string
          data_aceite: string | null
          data_solicitacao: string
          desconto_mensalidade: number | null
          id: string
          is_gratuito: boolean | null
          isencao_periodo: number | null
          modulos: Json | null
          observacoes: string | null
          parcelas_implantacao: number
          plano: string | null
          prazos_concedidos: string | null
          solicitacao_id: string | null
          status: string | null
          tipo: string
          tipo_desconto: string
          valor_adicional: number | null
          valor_anual: number | null
          valor_total: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_aceite?: string | null
          data_solicitacao?: string
          desconto_mensalidade?: number | null
          id?: string
          is_gratuito?: boolean | null
          isencao_periodo?: number | null
          modulos?: Json | null
          observacoes?: string | null
          parcelas_implantacao?: number
          plano?: string | null
          prazos_concedidos?: string | null
          solicitacao_id?: string | null
          status?: string | null
          tipo?: string
          tipo_desconto?: string
          valor_adicional?: number | null
          valor_anual?: number | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_aceite?: string | null
          data_solicitacao?: string
          desconto_mensalidade?: number | null
          id?: string
          is_gratuito?: boolean | null
          isencao_periodo?: number | null
          modulos?: Json | null
          observacoes?: string | null
          parcelas_implantacao?: number
          plano?: string | null
          prazos_concedidos?: string | null
          solicitacao_id?: string | null
          status?: string | null
          tipo?: string
          tipo_desconto?: string
          valor_adicional?: number | null
          valor_anual?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_contratos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      implementacao_arquivos: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          implementacao_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          implementacao_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          implementacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementacao_arquivos_implementacao_id_fkey"
            columns: ["implementacao_id"]
            isOneToOne: false
            referencedRelation: "implementacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      implementacao_etapas: {
        Row: {
          categoria: string
          created_at: string
          data_prevista: string | null
          data_realizada: string | null
          documento_url: string | null
          id: string
          implementacao_id: string
          observacoes: string | null
          ordem: number
          responsavel_id: string | null
          status: string
          titulo: string
        }
        Insert: {
          categoria: string
          created_at?: string
          data_prevista?: string | null
          data_realizada?: string | null
          documento_url?: string | null
          id?: string
          implementacao_id: string
          observacoes?: string | null
          ordem?: number
          responsavel_id?: string | null
          status?: string
          titulo: string
        }
        Update: {
          categoria?: string
          created_at?: string
          data_prevista?: string | null
          data_realizada?: string | null
          documento_url?: string | null
          id?: string
          implementacao_id?: string
          observacoes?: string | null
          ordem?: number
          responsavel_id?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementacao_etapas_implementacao_id_fkey"
            columns: ["implementacao_id"]
            isOneToOne: false
            referencedRelation: "implementacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementacao_etapas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      implementacoes: {
        Row: {
          atendimento_id: string | null
          cliente_id: string | null
          cliente_nome: string | null
          consultoria_form_data: Json | null
          consultoria_texto: string | null
          consultoria_titulo: string | null
          consultoria_token: string | null
          contrato_id: string | null
          created_at: string
          dados_parametrizacao: Json | null
          id: string
          modulos_novos: Json | null
          progresso: number
          responsavel_id: string | null
          solicitacao_id: string | null
          status: string
          tipo: string
          token_onboarding: string | null
          treinamento_data: string | null
          treinamento_motivo: string | null
          treinamento_topicos: string | null
        }
        Insert: {
          atendimento_id?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          consultoria_form_data?: Json | null
          consultoria_texto?: string | null
          consultoria_titulo?: string | null
          consultoria_token?: string | null
          contrato_id?: string | null
          created_at?: string
          dados_parametrizacao?: Json | null
          id?: string
          modulos_novos?: Json | null
          progresso?: number
          responsavel_id?: string | null
          solicitacao_id?: string | null
          status?: string
          tipo?: string
          token_onboarding?: string | null
          treinamento_data?: string | null
          treinamento_motivo?: string | null
          treinamento_topicos?: string | null
        }
        Update: {
          atendimento_id?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          consultoria_form_data?: Json | null
          consultoria_texto?: string | null
          consultoria_titulo?: string | null
          consultoria_token?: string | null
          contrato_id?: string | null
          created_at?: string
          dados_parametrizacao?: Json | null
          id?: string
          modulos_novos?: Json | null
          progresso?: number
          responsavel_id?: string | null
          solicitacao_id?: string | null
          status?: string
          tipo?: string
          token_onboarding?: string | null
          treinamento_data?: string | null
          treinamento_motivo?: string | null
          treinamento_topicos?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "implementacoes_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementacoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "crm_propostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementacoes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementacoes_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      jira_issues: {
        Row: {
          assignee: string | null
          created_at: string | null
          description: string | null
          id: string
          issue_key: string
          module_id: string | null
          priority: string | null
          sprint: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          issue_key: string
          module_id?: string | null
          priority?: string | null
          sprint?: string | null
          status: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          issue_key?: string
          module_id?: string | null
          priority?: string | null
          sprint?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jira_issues_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_erp"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_article_embeddings: {
        Row: {
          article_id: string
          content_chunk: string
          created_at: string
          embedding: string | null
          id: string
        }
        Insert: {
          article_id: string
          content_chunk: string
          created_at?: string
          embedding?: string | null
          id?: string
        }
        Update: {
          article_id?: string
          content_chunk?: string
          created_at?: string
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_article_embeddings_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          author_id: string | null
          category_id: string | null
          causa: string | null
          created_at: string | null
          description: string | null
          id: string
          module_id: string | null
          nivel_dificuldade: string | null
          passo_a_passo: string | null
          problema: string | null
          solucao: string | null
          status: string | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          causa?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string | null
          nivel_dificuldade?: string | null
          passo_a_passo?: string | null
          problema?: string | null
          solucao?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          causa?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string | null
          nivel_dificuldade?: string | null
          passo_a_passo?: string | null
          problema?: string | null
          solucao?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_erp"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_attachments: {
        Row: {
          article_id: string | null
          created_at: string | null
          file_name: string
          file_url: string
          id: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          file_name: string
          file_url: string
          id?: string
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          file_name?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_attachments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          module_id: string | null
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          module_id?: string | null
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          module_id?: string | null
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_categories_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_erp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_drive_files: {
        Row: {
          article_id: string | null
          created_at: string | null
          download_url: string | null
          drive_file_id: string
          id: string
          mime_type: string | null
          module_id: string | null
          name: string
          thumbnail_url: string | null
          user_id: string | null
          view_url: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          download_url?: string | null
          drive_file_id: string
          id?: string
          mime_type?: string | null
          module_id?: string | null
          name: string
          thumbnail_url?: string | null
          user_id?: string | null
          view_url?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          download_url?: string | null
          drive_file_id?: string
          id?: string
          mime_type?: string | null
          module_id?: string | null
          name?: string
          thumbnail_url?: string | null
          user_id?: string | null
          view_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_drive_files_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_drive_files_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_erp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_drive_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      knowledge_videos: {
        Row: {
          article_id: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          module_id: string | null
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          module_id?: string | null
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          module_id?: string | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_videos_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_videos_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_erp"
            referencedColumns: ["id"]
          },
        ]
      }
      meritocracia_cancelamentos: {
        Row: {
          cliente_nome: string
          created_at: string
          data_cancelamento: string
          id: string
          mes_ano: string
          user_id: string | null
        }
        Insert: {
          cliente_nome: string
          created_at?: string
          data_cancelamento?: string
          id?: string
          mes_ano: string
          user_id?: string | null
        }
        Update: {
          cliente_nome?: string
          created_at?: string
          data_cancelamento?: string
          id?: string
          mes_ano?: string
          user_id?: string | null
        }
        Relationships: []
      }
      modules_erp: {
        Row: {
          created_at: string | null
          description: string | null
          drive_folder_id: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          drive_folder_id?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          drive_folder_id?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      movidesk_tickets: {
        Row: {
          category: string | null
          client_name: string | null
          created_at: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          priority: string | null
          resolution: string | null
          responsible_name: string | null
          status: string
          ticket_number: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          priority?: string | null
          resolution?: string | null
          responsible_name?: string | null
          status: string
          ticket_number: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          priority?: string | null
          resolution?: string | null
          responsible_name?: string | null
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      periodos_folha: {
        Row: {
          ano: number
          created_at: string
          data_fechamento: string | null
          data_fim: string
          data_inicio: string
          fechado_por: string | null
          id: string
          mes: number
          status: string | null
        }
        Insert: {
          ano: number
          created_at?: string
          data_fechamento?: string | null
          data_fim: string
          data_inicio: string
          fechado_por?: string | null
          id?: string
          mes: number
          status?: string | null
        }
        Update: {
          ano?: number
          created_at?: string
          data_fechamento?: string | null
          data_fim?: string
          data_inicio?: string
          fechado_por?: string | null
          id?: string
          mes?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "periodos_folha_fechado_por_fkey"
            columns: ["fechado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      planos_saude: {
        Row: {
          codigo: string
          com_coparticipacao: boolean | null
          created_at: string
          descricao: string
          franquia_quantidade: number | null
          id: string
          modulos: Json | null
          padrao: boolean | null
          tipo: string | null
          valor_dependente: number | null
          valor_excedente: number | null
          valor_titular: number | null
        }
        Insert: {
          codigo: string
          com_coparticipacao?: boolean | null
          created_at?: string
          descricao: string
          franquia_quantidade?: number | null
          id?: string
          modulos?: Json | null
          padrao?: boolean | null
          tipo?: string | null
          valor_dependente?: number | null
          valor_excedente?: number | null
          valor_titular?: number | null
        }
        Update: {
          codigo?: string
          com_coparticipacao?: boolean | null
          created_at?: string
          descricao?: string
          franquia_quantidade?: number | null
          id?: string
          modulos?: Json | null
          padrao?: boolean | null
          tipo?: string | null
          valor_dependente?: number | null
          valor_excedente?: number | null
          valor_titular?: number | null
        }
        Relationships: []
      }
      plantoes: {
        Row: {
          colaborador_id: string
          created_at: string
          data: string
          id: string
          periodo: string | null
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data: string
          id?: string
          periodo?: string | null
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data?: string
          id?: string
          periodo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      ponto: {
        Row: {
          colaborador_id: string | null
          created_at: string
          data: string
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          organization_id: string | null
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          data: string
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          organization_id?: string | null
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          data?: string
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ponto_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ponto_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_documentacao: {
        Row: {
          arquivo_url: string | null
          categoria: string
          created_at: string | null
          id: string
          item: string
          observacoes: string | null
          prospect_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          arquivo_url?: string | null
          categoria: string
          created_at?: string | null
          id?: string
          item: string
          observacoes?: string | null
          prospect_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          arquivo_url?: string | null
          categoria?: string
          created_at?: string | null
          id?: string
          item?: string
          observacoes?: string | null
          prospect_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_documentacao_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimentos: {
        Row: {
          arquivo_origem: string | null
          cliente_id: string | null
          cnpj: string | null
          contrato: string | null
          created_at: string
          data_pagamento: string | null
          data_retorno: string | null
          data_transferencia: string | null
          data_vencimento: string | null
          dias_vencidos: number | null
          id: string
          numero_titulo: string | null
          razao_social: string
          status: string | null
          valor_pago: number | null
          valor_titulo: number | null
        }
        Insert: {
          arquivo_origem?: string | null
          cliente_id?: string | null
          cnpj?: string | null
          contrato?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_retorno?: string | null
          data_transferencia?: string | null
          data_vencimento?: string | null
          dias_vencidos?: number | null
          id?: string
          numero_titulo?: string | null
          razao_social: string
          status?: string | null
          valor_pago?: number | null
          valor_titulo?: number | null
        }
        Update: {
          arquivo_origem?: string | null
          cliente_id?: string | null
          cnpj?: string | null
          contrato?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_retorno?: string | null
          data_transferencia?: string | null
          data_vencimento?: string | null
          dias_vencidos?: number | null
          id?: string
          numero_titulo?: string | null
          razao_social?: string
          status?: string | null
          valor_pago?: number | null
          valor_titulo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_access: {
        Row: {
          accessed_at: string | null
          article_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          article_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          article_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recent_access_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recent_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      recrutamento: {
        Row: {
          created_at: string
          curriculo_url: string | null
          email: string | null
          id: string
          image_gender: string | null
          nome_candidato: string
          organization_id: string | null
          status: string
          telefone: string | null
          vaga: string
          vaga_id: string | null
        }
        Insert: {
          created_at?: string
          curriculo_url?: string | null
          email?: string | null
          id?: string
          image_gender?: string | null
          nome_candidato: string
          organization_id?: string | null
          status: string
          telefone?: string | null
          vaga: string
          vaga_id?: string | null
        }
        Update: {
          created_at?: string
          curriculo_url?: string | null
          email?: string | null
          id?: string
          image_gender?: string | null
          nome_candidato?: string
          organization_id?: string | null
          status?: string
          telefone?: string | null
          vaga?: string
          vaga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recrutamento_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recrutamento_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_ponto: {
        Row: {
          colaborador_id: string | null
          created_at: string
          data_hora: string
          device_id_hash: string | null
          foto_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          obs_usuario: string | null
          status: string
          tipo_registro: string
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          data_hora?: string
          device_id_hash?: string | null
          foto_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          obs_usuario?: string | null
          status?: string
          tipo_registro: string
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          data_hora?: string
          device_id_hash?: string | null
          foto_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          obs_usuario?: string | null
          status?: string
          tipo_registro?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_ponto_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_ponto: {
        Row: {
          adicional_noturno_percentual: number | null
          created_at: string
          departamento: string
          funcao: string
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          intervalo_minutos: number | null
          jornada_diaria: number | null
        }
        Insert: {
          adicional_noturno_percentual?: number | null
          created_at?: string
          departamento: string
          funcao: string
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          intervalo_minutos?: number | null
          jornada_diaria?: number | null
        }
        Update: {
          adicional_noturno_percentual?: number | null
          created_at?: string
          departamento?: string
          funcao?: string
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          intervalo_minutos?: number | null
          jornada_diaria?: number | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      solicitacoes_plano: {
        Row: {
          aprovado_por: string | null
          colaborador_id: string | null
          data_aprovacao: string | null
          data_solicitacao: string | null
          detalhes: Json | null
          id: string
          status: string | null
          tipo: string
        }
        Insert: {
          aprovado_por?: string | null
          colaborador_id?: string | null
          data_aprovacao?: string | null
          data_solicitacao?: string | null
          detalhes?: Json | null
          id?: string
          status?: string | null
          tipo: string
        }
        Update: {
          aprovado_por?: string | null
          colaborador_id?: string | null
          data_aprovacao?: string | null
          data_solicitacao?: string | null
          detalhes?: Json | null
          id?: string
          status?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_plano_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_plano_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_servico: {
        Row: {
          cliente_id: string
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          data_solicitacao: string | null
          data_vencimento: string | null
          descricao: string
          documento_url: string | null
          forma_pagamento: string | null
          id: string
          is_gratuito: boolean | null
          observacoes: string | null
          prazos_concedidos: string | null
          status: string | null
          tipo: string
          valor: number | null
        }
        Insert: {
          cliente_id: string
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          data_solicitacao?: string | null
          data_vencimento?: string | null
          descricao: string
          documento_url?: string | null
          forma_pagamento?: string | null
          id?: string
          is_gratuito?: boolean | null
          observacoes?: string | null
          prazos_concedidos?: string | null
          status?: string | null
          tipo: string
          valor?: number | null
        }
        Update: {
          cliente_id?: string
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          data_solicitacao?: string | null
          data_vencimento?: string | null
          descricao?: string
          documento_url?: string | null
          forma_pagamento?: string | null
          id?: string
          is_gratuito?: boolean | null
          observacoes?: string | null
          prazos_concedidos?: string | null
          status?: string | null
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_ai_summaries: {
        Row: {
          created_at: string
          id: string
          sentiment: string | null
          summary: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sentiment?: string | null
          summary: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sentiment?: string | null
          summary?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_ai_summaries_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "movidesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas: {
        Row: {
          created_at: string
          departamento: string
          descricao: string
          id: string
          organization_id: string | null
          requisitos: string
          salario: number
          status: string
          tipo_contrato: string
          titulo: string
        }
        Insert: {
          created_at?: string
          departamento: string
          descricao: string
          id?: string
          organization_id?: string | null
          requisitos: string
          salario: number
          status?: string
          tipo_contrato: string
          titulo: string
        }
        Update: {
          created_at?: string
          departamento?: string
          descricao?: string
          id?: string
          organization_id?: string | null
          requisitos?: string
          salario?: number
          status?: string
          tipo_contrato?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "vagas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_consultoria_form: { Args: { p_token: string }; Returns: Json }
      get_current_colaborador_id: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_implementacao_onboarding: { Args: { p_token: string }; Returns: Json }
      global_search: {
        Args: { search_query: string }
        Returns: {
          description: string
          id: string
          rank: number
          title: string
          type: string
          url: string
        }[]
      }
      is_in_my_team: { Args: { target_colab_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_consultoria_form: {
        Args: { p_data: Json; p_token: string }
        Returns: boolean
      }
      submit_onboarding: {
        Args: { p_arquivos?: Json; p_data: Json; p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

