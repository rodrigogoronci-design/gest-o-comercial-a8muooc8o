// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4'
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
            foreignKeyName: 'afastamentos_aprovado_por_fkey'
            columns: ['aprovado_por']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'afastamentos_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
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
            foreignKeyName: 'agenda_eventos_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
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
            foreignKeyName: 'ajustes_ponto_aprovado_por_fkey'
            columns: ['aprovado_por']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ajustes_ponto_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
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
            foreignKeyName: 'atestados_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'atestados_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
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
            foreignKeyName: 'atividades_comerciais_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
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
            foreignKeyName: 'avaliacoes_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_avaliacoes_avaliador'
            columns: ['avaliador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_avaliacoes_colaborador'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
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
            foreignKeyName: 'beneficios_ticket_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
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
            foreignKeyName: 'beneficios_transporte_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
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
            foreignKeyName: 'calculos_horas_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'calculos_horas_periodo_id_fkey'
            columns: ['periodo_id']
            isOneToOne: false
            referencedRelation: 'periodos_folha'
            referencedColumns: ['id']
          },
        ]
      }
      clientes: {
        Row: {
          cnpj: string
          cobrancas: Json | null
          contrato_url: string | null
          created_at: string
          diagnostico: Json | null
          documentos_urls: Json | null
          email: string | null
          endereco: string | null
          id: string
          modo_implantacao: string | null
          modulos: Json | null
          nome: string
          rep_cpf: string | null
          rep_nome: string | null
          rep_rg: string | null
          status: string | null
          tags: Json | null
          telefone: string | null
          valor_implantacao: number | null
          valor_total: number | null
        }
        Insert: {
          cnpj: string
          cobrancas?: Json | null
          contrato_url?: string | null
          created_at?: string
          diagnostico?: Json | null
          documentos_urls?: Json | null
          email?: string | null
          endereco?: string | null
          id?: string
          modo_implantacao?: string | null
          modulos?: Json | null
          nome: string
          rep_cpf?: string | null
          rep_nome?: string | null
          rep_rg?: string | null
          status?: string | null
          tags?: Json | null
          telefone?: string | null
          valor_implantacao?: number | null
          valor_total?: number | null
        }
        Update: {
          cnpj?: string
          cobrancas?: Json | null
          contrato_url?: string | null
          created_at?: string
          diagnostico?: Json | null
          documentos_urls?: Json | null
          email?: string | null
          endereco?: string | null
          id?: string
          modo_implantacao?: string | null
          modulos?: Json | null
          nome?: string
          rep_cpf?: string | null
          rep_nome?: string | null
          rep_rg?: string | null
          status?: string | null
          tags?: Json | null
          telefone?: string | null
          valor_implantacao?: number | null
          valor_total?: number | null
        }
        Relationships: []
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
            foreignKeyName: 'colaborador_planos_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: true
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'colaborador_planos_plano_id_fkey'
            columns: ['plano_id']
            isOneToOne: false
            referencedRelation: 'planos_saude'
            referencedColumns: ['id']
          },
        ]
      }
      colaboradores: {
        Row: {
          adicional_noturno_percentual: number | null
          avatar_url: string | null
          cargo: string | null
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
          tipo_contrato: string | null
          user_id: string | null
        }
        Insert: {
          adicional_noturno_percentual?: number | null
          avatar_url?: string | null
          cargo?: string | null
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
          tipo_contrato?: string | null
          user_id?: string | null
        }
        Update: {
          adicional_noturno_percentual?: number | null
          avatar_url?: string | null
          cargo?: string | null
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
          tipo_contrato?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'colaboradores_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
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
            foreignKeyName: 'contracheques_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
        ]
      }
      crm_prospects: {
        Row: {
          cnpj: string | null
          contato_nome: string
          created_at: string | null
          data_followup: string | null
          diagnostico: Json | null
          email: string | null
          empresa: string
          endereco: string | null
          id: string
          observacoes: string | null
          status: string
          tags: Json | null
          telefone: string | null
          ultima_interacao: string | null
          user_id: string | null
        }
        Insert: {
          cnpj?: string | null
          contato_nome: string
          created_at?: string | null
          data_followup?: string | null
          diagnostico?: Json | null
          email?: string | null
          empresa: string
          endereco?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          tags?: Json | null
          telefone?: string | null
          ultima_interacao?: string | null
          user_id?: string | null
        }
        Update: {
          cnpj?: string | null
          contato_nome?: string
          created_at?: string | null
          data_followup?: string | null
          diagnostico?: Json | null
          email?: string | null
          empresa?: string
          endereco?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          tags?: Json | null
          telefone?: string | null
          ultima_interacao?: string | null
          user_id?: string | null
        }
        Relationships: []
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
            foreignKeyName: 'dependentes_plano_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
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
            foreignKeyName: 'dispositivos_autorizados_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
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
            foreignKeyName: 'faltas_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
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
            foreignKeyName: 'ferias_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ferias_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
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
            foreignKeyName: 'historico_ajustes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
        ]
      }
      historico_contratos: {
        Row: {
          cliente_id: string
          created_at: string
          data_solicitacao: string
          id: string
          modulos: Json | null
          observacoes: string | null
          plano: string | null
          solicitacao_id: string | null
          tipo: string
          valor_adicional: number | null
          valor_total: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_solicitacao?: string
          id?: string
          modulos?: Json | null
          observacoes?: string | null
          plano?: string | null
          solicitacao_id?: string | null
          tipo?: string
          valor_adicional?: number | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_solicitacao?: string
          id?: string
          modulos?: Json | null
          observacoes?: string | null
          plano?: string | null
          solicitacao_id?: string | null
          tipo?: string
          valor_adicional?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'historico_contratos_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'historico_contratos_solicitacao_id_fkey'
            columns: ['solicitacao_id']
            isOneToOne: false
            referencedRelation: 'solicitacoes_servico'
            referencedColumns: ['id']
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
            foreignKeyName: 'periodos_folha_fechado_por_fkey'
            columns: ['fechado_por']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
        ]
      }
      planos_saude: {
        Row: {
          codigo: string
          com_coparticipacao: boolean | null
          created_at: string
          descricao: string
          id: string
          padrao: boolean | null
          valor_dependente: number | null
          valor_titular: number | null
        }
        Insert: {
          codigo: string
          com_coparticipacao?: boolean | null
          created_at?: string
          descricao: string
          id?: string
          padrao?: boolean | null
          valor_dependente?: number | null
          valor_titular?: number | null
        }
        Update: {
          codigo?: string
          com_coparticipacao?: boolean | null
          created_at?: string
          descricao?: string
          id?: string
          padrao?: boolean | null
          valor_dependente?: number | null
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
            foreignKeyName: 'plantoes_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
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
            foreignKeyName: 'ponto_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ponto_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
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
            foreignKeyName: 'recebimentos_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
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
            foreignKeyName: 'recrutamento_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recrutamento_vaga_id_fkey'
            columns: ['vaga_id']
            isOneToOne: false
            referencedRelation: 'vagas'
            referencedColumns: ['id']
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
            foreignKeyName: 'registro_ponto_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
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
            foreignKeyName: 'solicitacoes_plano_aprovado_por_fkey'
            columns: ['aprovado_por']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'solicitacoes_plano_colaborador_id_fkey'
            columns: ['colaborador_id']
            isOneToOne: false
            referencedRelation: 'colaboradores'
            referencedColumns: ['id']
          },
        ]
      }
      solicitacoes_servico: {
        Row: {
          cliente_id: string
          created_at: string
          data_solicitacao: string | null
          data_vencimento: string | null
          descricao: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          status: string | null
          tipo: string
          valor: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_solicitacao?: string | null
          data_vencimento?: string | null
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          tipo: string
          valor?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_solicitacao?: string | null
          data_vencimento?: string | null
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'solicitacoes_servico_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
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
            foreignKeyName: 'vagas_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_colaborador_id: { Args: never; Returns: string }
      is_in_my_team: { Args: { target_colab_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: afastamentos
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (not null)
//   data_inicio: date (not null)
//   data_fim: date (not null)
//   tipo: text (not null)
//   dias_afastado: integer (nullable)
//   justificativa: text (nullable)
//   documento_anexo: text (nullable)
//   status: text (nullable, default: 'pendente'::text)
//   aprovado_por: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: agenda_eventos
//   id: uuid (not null, default: gen_random_uuid())
//   titulo: text (not null)
//   descricao: text (nullable)
//   data_evento: timestamp with time zone (not null)
//   tipo: text (not null, default: 'Reunião'::text)
//   cliente_id: uuid (nullable)
//   status: text (not null, default: 'Pendente'::text)
//   user_id: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: ajustes_ponto
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (not null)
//   data: date (not null)
//   tipo: text (not null)
//   motivo: text (nullable)
//   horas: numeric (nullable)
//   justificativa: text (nullable)
//   status: text (nullable, default: 'pendente'::text)
//   aprovado_por: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   documento_url: text (nullable)
// Table: atestados
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (not null)
//   data_inicio: date (not null)
//   data_fim: date (not null)
//   quantidade_dias: integer (not null)
//   arquivo_url: text (nullable)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   organization_id: uuid (nullable)
// Table: atividades_comerciais
//   id: uuid (not null, default: gen_random_uuid())
//   cliente_id: uuid (nullable)
//   demanda: text (not null)
//   data_atividade: date (not null, default: CURRENT_DATE)
//   created_at: timestamp with time zone (not null, default: now())
//   cliente_nome: text (nullable)
//   tipo: text (nullable)
//   acao_necessaria: text (nullable)
//   status: text (nullable)
//   data_follow_up: date (nullable)
//   observacoes: text (nullable)
//   valor_mensalidade: numeric (nullable)
//   valor_implantacao: numeric (nullable)
//   condicao: text (nullable)
//   parcelas: text (nullable)
// Table: auditoria_acessos
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   acao: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: avaliacoes
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (not null, default: now())
//   colaborador_id: uuid (not null)
//   avaliador_id: uuid (nullable)
//   periodo: text (not null)
//   nota_pontualidade: numeric (not null)
//   nota_qualidade: numeric (not null)
//   nota_trabalho_equipe: numeric (not null)
//   observacoes: text (nullable)
//   organization_id: uuid (nullable)
// Table: beneficiarios_plano_saude
//   id: uuid (not null, default: gen_random_uuid())
//   numero: text (nullable)
//   nome: text (nullable)
//   registro_operadora: text (nullable)
//   tipo: text (nullable)
//   sexo: text (nullable)
//   data_nascimento: date (nullable)
//   idade: integer (nullable)
//   inicio_vigencia: date (nullable)
//   plano_codigo: text (nullable)
//   plano_descricao: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: beneficios_ticket
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (not null)
//   mes_ano: text (not null)
//   dias_uteis: integer (not null, default: 0)
//   plantoes: integer (not null, default: 0)
//   atestados: integer (not null, default: 0)
//   ferias: integer (not null, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
//   faltas: integer (not null, default: 0)
//   credito: numeric (nullable, default: 0)
//   desconto: numeric (nullable, default: 0)
//   credito_justificativa: text (nullable, default: ''::text)
//   desconto_justificativa: text (nullable, default: ''::text)
//   feriados_trabalhados: integer (not null, default: 0)
// Table: beneficios_transporte
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (not null)
//   mes_ano: text (not null)
//   dias_uteis: integer (not null, default: 0)
//   home_office: integer (not null, default: 0)
//   ferias: integer (not null, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
//   atestados: integer (not null, default: 0)
//   faltas: integer (not null, default: 0)
//   credito: numeric (nullable, default: 0)
//   desconto: numeric (nullable, default: 0)
//   credito_justificativa: text (nullable, default: ''::text)
//   desconto_justificativa: text (nullable, default: ''::text)
//   plantoes: integer (not null, default: 0)
//   feriados_trabalhados: integer (not null, default: 0)
// Table: calculos_horas
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (not null)
//   periodo_id: uuid (not null)
//   horas_normais: numeric (nullable, default: 0)
//   horas_extras: numeric (nullable, default: 0)
//   horas_noturnas: numeric (nullable, default: 0)
//   faltas: numeric (nullable, default: 0)
//   banco_horas_saldo: numeric (nullable, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
// Table: clientes
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   cnpj: text (not null)
//   email: text (nullable)
//   telefone: text (nullable)
//   modulos: jsonb (nullable, default: '[]'::jsonb)
//   valor_total: numeric (nullable, default: 0)
//   status: text (nullable, default: 'Ativo'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   contrato_url: text (nullable)
//   endereco: text (nullable)
//   rep_nome: text (nullable)
//   rep_cpf: text (nullable)
//   rep_rg: text (nullable)
//   valor_implantacao: numeric (nullable, default: 0)
//   modo_implantacao: text (nullable, default: 'remoto'::text)
//   cobrancas: jsonb (nullable, default: '[]'::jsonb)
//   documentos_urls: jsonb (nullable, default: '[]'::jsonb)
//   diagnostico: jsonb (nullable, default: '{}'::jsonb)
//   tags: jsonb (nullable, default: '[]'::jsonb)
// Table: colaborador_planos
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (nullable)
//   plano_id: uuid (nullable)
//   data_adesao: date (nullable, default: CURRENT_DATE)
//   status: text (nullable, default: 'ativo'::text)
//   created_at: timestamp with time zone (not null, default: now())
// Table: colaboradores
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
//   nome: text (not null)
//   cpf: text (nullable)
//   rg: text (nullable)
//   data_nascimento: date (nullable)
//   endereco: text (nullable)
//   email: text (nullable)
//   telefone: text (nullable)
//   cargo: text (nullable)
//   departamento: text (nullable)
//   data_admissao: date (nullable)
//   salario: numeric (nullable)
//   tipo_contrato: text (nullable)
//   status: text (nullable, default: 'Ativo'::text)
//   documentos_urls: jsonb (nullable, default: '[]'::jsonb)
//   image_gender: text (nullable, default: 'male'::text)
//   role: text (not null, default: 'Colaborador'::text)
//   user_id: uuid (nullable)
//   organization_id: uuid (nullable)
//   recebe_transporte: boolean (not null, default: true)
//   avatar_url: text (nullable)
//   codigo_funcionario: text (nullable)
//   local_trabalho_lat: numeric (nullable)
//   local_trabalho_lng: numeric (nullable)
//   jornada_entrada: text (nullable)
//   jornada_saida_intervalo: text (nullable)
//   jornada_retorno_intervalo: text (nullable)
//   jornada_saida: text (nullable)
//   data_demissao: date (nullable)
//   motivo_demissao: text (nullable)
//   jornada_diaria: numeric (nullable)
//   intervalo_minutos: integer (nullable)
//   adicional_noturno_percentual: numeric (nullable)
//   jornada_dias: jsonb (nullable, default: '[]'::jsonb)
// Table: configuracoes
//   chave: text (not null)
//   valor: jsonb (not null)
//   updated_at: timestamp with time zone (not null, default: now())
// Table: contracheques
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (not null)
//   mes_ano: text (not null)
//   arquivo_url: text (not null)
//   valor_liquido: numeric (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   dados_extraidos: jsonb (nullable)
//   data_assinatura: timestamp with time zone (nullable)
//   assinado: boolean (nullable, default: false)
//   assinatura_nome: text (nullable)
// Table: crm_prospects
//   id: uuid (not null, default: gen_random_uuid())
//   empresa: text (not null)
//   contato_nome: text (not null)
//   telefone: text (nullable)
//   email: text (nullable)
//   status: text (not null, default: 'Contato Inicial'::text)
//   observacoes: text (nullable)
//   ultima_interacao: timestamp with time zone (nullable, default: now())
//   created_at: timestamp with time zone (nullable, default: now())
//   user_id: uuid (nullable)
//   cnpj: text (nullable)
//   endereco: text (nullable)
//   data_followup: date (nullable)
//   diagnostico: jsonb (nullable, default: '{}'::jsonb)
//   tags: jsonb (nullable, default: '[]'::jsonb)
// Table: dependentes_plano
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (nullable)
//   nome: text (not null)
//   cpf: text (nullable)
//   data_nascimento: date (nullable)
//   parentesco: text (nullable)
//   status: text (nullable, default: 'ativo'::text)
//   created_at: timestamp with time zone (not null, default: now())
// Table: dias_home_office
//   id: uuid (not null, default: gen_random_uuid())
//   data: date (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: dispositivos_autorizados
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (nullable)
//   device_id_hash: text (not null)
//   tipo: text (not null)
//   status: text (not null, default: 'pendente'::text)
//   ultima_autenticacao: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: escala_mes
//   mes_ano: text (not null)
//   status: text (not null, default: 'Rascunho'::text)
//   created_at: timestamp with time zone (not null, default: now())
// Table: faltas
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (not null)
//   data: date (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: faturamento_plano_saude
//   id: uuid (not null, default: gen_random_uuid())
//   mes_ano: text (nullable)
//   numero_beneficiario: text (nullable)
//   beneficiario_nome: text (nullable)
//   cpf: text (nullable)
//   plano: text (nullable)
//   tipo: text (nullable)
//   id_dependencia: text (nullable)
//   dependencia: text (nullable)
//   data_limite: date (nullable)
//   dt_inclusao: date (nullable)
//   rubrica: text (nullable)
//   valor: numeric (nullable)
//   valor_total: numeric (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: feriados
//   id: uuid (not null, default: gen_random_uuid())
//   data: date (not null)
//   descricao: text (not null, default: 'Feriado'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   tipo: text (nullable, default: 'Feriado Nacional'::text)
// Table: ferias
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
//   colaborador_id: uuid (nullable)
//   data_inicio: date (not null)
//   data_fim: date (not null)
//   status: text (nullable, default: 'Pendente'::text)
//   observacoes: text (nullable)
//   organization_id: uuid (nullable)
// Table: historico_ajustes
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   acao: text (not null)
//   detalhes: jsonb (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: historico_contratos
//   id: uuid (not null, default: gen_random_uuid())
//   cliente_id: uuid (not null)
//   tipo: text (not null, default: 'Contrato Inicial'::text)
//   data_solicitacao: date (not null, default: CURRENT_DATE)
//   plano: text (nullable)
//   modulos: jsonb (nullable, default: '[]'::jsonb)
//   valor_total: numeric (nullable, default: 0)
//   valor_adicional: numeric (nullable, default: 0)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   solicitacao_id: uuid (nullable)
// Table: meritocracia_cancelamentos
//   id: uuid (not null, default: gen_random_uuid())
//   mes_ano: text (not null)
//   cliente_nome: text (not null)
//   data_cancelamento: date (not null, default: CURRENT_DATE)
//   created_at: timestamp with time zone (not null, default: now())
//   user_id: uuid (nullable)
// Table: organizations
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (not null, default: now())
//   nome: text (not null)
// Table: periodos_folha
//   id: uuid (not null, default: gen_random_uuid())
//   mes: integer (not null)
//   ano: integer (not null)
//   data_inicio: date (not null)
//   data_fim: date (not null)
//   status: text (nullable, default: 'aberto'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   fechado_por: uuid (nullable)
//   data_fechamento: timestamp with time zone (nullable)
// Table: planos_saude
//   id: uuid (not null, default: gen_random_uuid())
//   codigo: text (not null)
//   descricao: text (not null)
//   valor_titular: numeric (nullable, default: 0)
//   valor_dependente: numeric (nullable, default: 0)
//   com_coparticipacao: boolean (nullable, default: false)
//   padrao: boolean (nullable, default: false)
//   created_at: timestamp with time zone (not null, default: now())
// Table: plantoes
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (not null)
//   data: date (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   periodo: text (nullable, default: 'Integral'::text)
// Table: ponto
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
//   colaborador_id: uuid (nullable)
//   data: date (not null)
//   hora_entrada: text (nullable)
//   hora_saida: text (nullable)
//   organization_id: uuid (nullable)
// Table: recebimentos
//   id: uuid (not null, default: gen_random_uuid())
//   cliente_id: uuid (nullable)
//   razao_social: text (not null)
//   cnpj: text (nullable)
//   valor_pago: numeric (nullable, default: 0)
//   valor_titulo: numeric (nullable, default: 0)
//   data_pagamento: date (nullable)
//   arquivo_origem: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   contrato: text (nullable)
//   numero_titulo: text (nullable)
//   data_vencimento: date (nullable)
//   data_transferencia: date (nullable)
//   data_retorno: date (nullable)
//   dias_vencidos: integer (nullable, default: 0)
//   status: text (nullable, default: 'EM ABERTO'::text)
// Table: recrutamento
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
//   nome_candidato: text (not null)
//   vaga: text (not null)
//   status: text (not null)
//   image_gender: text (nullable, default: 'male'::text)
//   vaga_id: uuid (nullable)
//   email: text (nullable)
//   telefone: text (nullable)
//   curriculo_url: text (nullable)
//   organization_id: uuid (nullable)
// Table: registro_ponto
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (nullable)
//   data_hora: timestamp with time zone (not null, default: now())
//   latitude: numeric (nullable)
//   longitude: numeric (nullable)
//   foto_url: text (nullable)
//   status: text (not null, default: 'pendente'::text)
//   tipo_registro: text (not null)
//   obs_usuario: text (nullable)
//   device_id_hash: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: regras_ponto
//   id: uuid (not null, default: gen_random_uuid())
//   departamento: text (not null)
//   funcao: text (not null)
//   jornada_diaria: numeric (nullable)
//   hora_entrada: text (nullable)
//   hora_saida: text (nullable)
//   intervalo_minutos: integer (nullable)
//   adicional_noturno_percentual: numeric (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: solicitacoes_plano
//   id: uuid (not null, default: gen_random_uuid())
//   colaborador_id: uuid (nullable)
//   tipo: text (not null)
//   status: text (nullable, default: 'pendente'::text)
//   detalhes: jsonb (nullable)
//   data_solicitacao: timestamp with time zone (nullable, default: now())
//   aprovado_por: uuid (nullable)
//   data_aprovacao: timestamp with time zone (nullable)
// Table: solicitacoes_servico
//   id: uuid (not null, default: gen_random_uuid())
//   cliente_id: uuid (not null)
//   tipo: text (not null)
//   descricao: text (not null)
//   data_solicitacao: date (nullable)
//   valor: numeric (nullable)
//   forma_pagamento: text (nullable)
//   data_vencimento: date (nullable)
//   observacoes: text (nullable)
//   status: text (nullable, default: 'Pendente'::text)
//   created_at: timestamp with time zone (not null, default: now())
// Table: vagas
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (not null, default: now())
//   titulo: text (not null)
//   descricao: text (not null)
//   departamento: text (not null)
//   requisitos: text (not null)
//   salario: numeric (not null)
//   tipo_contrato: text (not null)
//   status: text (not null, default: 'Aberta'::text)
//   organization_id: uuid (nullable)

// --- CONSTRAINTS ---
// Table: afastamentos
//   FOREIGN KEY afastamentos_aprovado_por_fkey: FOREIGN KEY (aprovado_por) REFERENCES colaboradores(id) ON DELETE SET NULL
//   FOREIGN KEY afastamentos_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   PRIMARY KEY afastamentos_pkey: PRIMARY KEY (id)
// Table: agenda_eventos
//   FOREIGN KEY agenda_eventos_cliente_id_fkey: FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
//   PRIMARY KEY agenda_eventos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY agenda_eventos_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: ajustes_ponto
//   FOREIGN KEY ajustes_ponto_aprovado_por_fkey: FOREIGN KEY (aprovado_por) REFERENCES colaboradores(id) ON DELETE SET NULL
//   FOREIGN KEY ajustes_ponto_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   PRIMARY KEY ajustes_ponto_pkey: PRIMARY KEY (id)
// Table: atestados
//   FOREIGN KEY atestados_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   FOREIGN KEY atestados_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY atestados_pkey: PRIMARY KEY (id)
// Table: atividades_comerciais
//   FOREIGN KEY atividades_comerciais_cliente_id_fkey: FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
//   PRIMARY KEY atividades_comerciais_pkey: PRIMARY KEY (id)
// Table: auditoria_acessos
//   PRIMARY KEY auditoria_acessos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY auditoria_acessos_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: avaliacoes
//   FOREIGN KEY avaliacoes_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY avaliacoes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY fk_avaliacoes_avaliador: FOREIGN KEY (avaliador_id) REFERENCES colaboradores(id) ON DELETE SET NULL
//   FOREIGN KEY fk_avaliacoes_colaborador: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
// Table: beneficiarios_plano_saude
//   PRIMARY KEY beneficiarios_plano_saude_pkey: PRIMARY KEY (id)
// Table: beneficios_ticket
//   FOREIGN KEY beneficios_ticket_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   UNIQUE beneficios_ticket_colaborador_id_mes_ano_key: UNIQUE (colaborador_id, mes_ano)
//   PRIMARY KEY beneficios_ticket_pkey: PRIMARY KEY (id)
// Table: beneficios_transporte
//   FOREIGN KEY beneficios_transporte_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   UNIQUE beneficios_transporte_colaborador_id_mes_ano_key: UNIQUE (colaborador_id, mes_ano)
//   PRIMARY KEY beneficios_transporte_pkey: PRIMARY KEY (id)
// Table: calculos_horas
//   FOREIGN KEY calculos_horas_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   FOREIGN KEY calculos_horas_periodo_id_fkey: FOREIGN KEY (periodo_id) REFERENCES periodos_folha(id) ON DELETE CASCADE
//   PRIMARY KEY calculos_horas_pkey: PRIMARY KEY (id)
// Table: clientes
//   PRIMARY KEY clientes_pkey: PRIMARY KEY (id)
// Table: colaborador_planos
//   FOREIGN KEY colaborador_planos_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   UNIQUE colaborador_planos_colaborador_id_key: UNIQUE (colaborador_id)
//   PRIMARY KEY colaborador_planos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY colaborador_planos_plano_id_fkey: FOREIGN KEY (plano_id) REFERENCES planos_saude(id) ON DELETE RESTRICT
// Table: colaboradores
//   FOREIGN KEY colaboradores_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY colaboradores_pkey: PRIMARY KEY (id)
//   FOREIGN KEY colaboradores_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: configuracoes
//   PRIMARY KEY configuracoes_pkey: PRIMARY KEY (chave)
// Table: contracheques
//   FOREIGN KEY contracheques_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   UNIQUE contracheques_colaborador_id_mes_ano_key: UNIQUE (colaborador_id, mes_ano)
//   PRIMARY KEY contracheques_pkey: PRIMARY KEY (id)
// Table: crm_prospects
//   PRIMARY KEY crm_prospects_pkey: PRIMARY KEY (id)
//   FOREIGN KEY crm_prospects_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
// Table: dependentes_plano
//   FOREIGN KEY dependentes_plano_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   PRIMARY KEY dependentes_plano_pkey: PRIMARY KEY (id)
// Table: dias_home_office
//   UNIQUE dias_home_office_data_key: UNIQUE (data)
//   PRIMARY KEY dias_home_office_pkey: PRIMARY KEY (id)
// Table: dispositivos_autorizados
//   FOREIGN KEY dispositivos_autorizados_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   UNIQUE dispositivos_autorizados_device_id_hash_key: UNIQUE (device_id_hash)
//   PRIMARY KEY dispositivos_autorizados_pkey: PRIMARY KEY (id)
// Table: escala_mes
//   PRIMARY KEY escala_mes_pkey: PRIMARY KEY (mes_ano)
// Table: faltas
//   UNIQUE faltas_colaborador_id_data_key: UNIQUE (colaborador_id, data)
//   FOREIGN KEY faltas_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   PRIMARY KEY faltas_pkey: PRIMARY KEY (id)
// Table: faturamento_plano_saude
//   PRIMARY KEY faturamento_plano_saude_pkey: PRIMARY KEY (id)
// Table: feriados
//   UNIQUE feriados_data_key: UNIQUE (data)
//   PRIMARY KEY feriados_pkey: PRIMARY KEY (id)
// Table: ferias
//   FOREIGN KEY ferias_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   FOREIGN KEY ferias_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY ferias_pkey: PRIMARY KEY (id)
// Table: historico_ajustes
//   PRIMARY KEY historico_ajustes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY historico_ajustes_user_id_fkey: FOREIGN KEY (user_id) REFERENCES colaboradores(id) ON DELETE SET NULL
// Table: historico_contratos
//   FOREIGN KEY historico_contratos_cliente_id_fkey: FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
//   PRIMARY KEY historico_contratos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY historico_contratos_solicitacao_id_fkey: FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes_servico(id) ON DELETE CASCADE
// Table: meritocracia_cancelamentos
//   PRIMARY KEY meritocracia_cancelamentos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY meritocracia_cancelamentos_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
// Table: organizations
//   PRIMARY KEY organizations_pkey: PRIMARY KEY (id)
// Table: periodos_folha
//   FOREIGN KEY periodos_folha_fechado_por_fkey: FOREIGN KEY (fechado_por) REFERENCES colaboradores(id)
//   PRIMARY KEY periodos_folha_pkey: PRIMARY KEY (id)
// Table: planos_saude
//   PRIMARY KEY planos_saude_pkey: PRIMARY KEY (id)
// Table: plantoes
//   UNIQUE plantoes_colaborador_id_data_key: UNIQUE (colaborador_id, data)
//   FOREIGN KEY plantoes_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   PRIMARY KEY plantoes_pkey: PRIMARY KEY (id)
// Table: ponto
//   FOREIGN KEY ponto_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   FOREIGN KEY ponto_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY ponto_pkey: PRIMARY KEY (id)
// Table: recebimentos
//   FOREIGN KEY recebimentos_cliente_id_fkey: FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
//   PRIMARY KEY recebimentos_pkey: PRIMARY KEY (id)
// Table: recrutamento
//   FOREIGN KEY recrutamento_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY recrutamento_pkey: PRIMARY KEY (id)
//   FOREIGN KEY recrutamento_vaga_id_fkey: FOREIGN KEY (vaga_id) REFERENCES vagas(id) ON DELETE CASCADE
// Table: registro_ponto
//   FOREIGN KEY registro_ponto_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   PRIMARY KEY registro_ponto_pkey: PRIMARY KEY (id)
// Table: regras_ponto
//   PRIMARY KEY regras_ponto_pkey: PRIMARY KEY (id)
// Table: solicitacoes_plano
//   FOREIGN KEY solicitacoes_plano_aprovado_por_fkey: FOREIGN KEY (aprovado_por) REFERENCES colaboradores(id) ON DELETE SET NULL
//   FOREIGN KEY solicitacoes_plano_colaborador_id_fkey: FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
//   PRIMARY KEY solicitacoes_plano_pkey: PRIMARY KEY (id)
// Table: solicitacoes_servico
//   FOREIGN KEY solicitacoes_servico_cliente_id_fkey: FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
//   PRIMARY KEY solicitacoes_servico_pkey: PRIMARY KEY (id)
// Table: vagas
//   FOREIGN KEY vagas_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY vagas_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: afastamentos
//   Policy "afastamentos_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (is_in_my_team(colaborador_id) OR (colaborador_id = get_current_colaborador_id()))
//   Policy "afastamentos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((colaborador_id = get_current_colaborador_id()) OR is_in_my_team(colaborador_id))
//   Policy "afastamentos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((colaborador_id = get_current_colaborador_id()) OR is_in_my_team(colaborador_id))
//   Policy "afastamentos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (is_in_my_team(colaborador_id) OR (colaborador_id = get_current_colaborador_id()))
//     WITH CHECK: (is_in_my_team(colaborador_id) OR (colaborador_id = get_current_colaborador_id()))
// Table: agenda_eventos
//   Policy "agenda_eventos_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "agenda_eventos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "agenda_eventos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "agenda_eventos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: ajustes_ponto
//   Policy "ajustes_ponto_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((colaborador_id = get_current_colaborador_id()) OR is_in_my_team(colaborador_id))
//   Policy "ajustes_ponto_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((colaborador_id = get_current_colaborador_id()) OR is_in_my_team(colaborador_id))
//   Policy "ajustes_ponto_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_in_my_team(colaborador_id)
// Table: atestados
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: atividades_comerciais
//   Policy "atividades_comerciais_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "atividades_comerciais_delete_anon" (DELETE, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "atividades_comerciais_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "atividades_comerciais_insert_anon" (INSERT, PERMISSIVE) roles={anon}
//     WITH CHECK: true
//   Policy "atividades_comerciais_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "atividades_comerciais_select_anon" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "atividades_comerciais_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "atividades_comerciais_update_anon" (UPDATE, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
// Table: auditoria_acessos
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: avaliacoes
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: beneficiarios_plano_saude
//   Policy "beneficiarios_plano_saude_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: beneficios_ticket
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: beneficios_transporte
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: calculos_horas
//   Policy "calculos_horas_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((colaborador_id = get_current_colaborador_id()) OR is_in_my_team(colaborador_id))
// Table: clientes
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: colaborador_planos
//   Policy "colab_planos_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "colab_planos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "colab_planos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "colab_planos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: colaboradores
//   Policy "colaboradores_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR is_in_my_team(id))
//   Policy "colaboradores_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR is_in_my_team(id))
// Table: configuracoes
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: contracheques
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: crm_prospects
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: dependentes_plano
//   Policy "dep_planos_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "dep_planos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "dep_planos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "dep_planos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: dias_home_office
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: dispositivos_autorizados
//   Policy "authenticated_all_dispositivos" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: escala_mes
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: faltas
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: faturamento_plano_saude
//   Policy "faturamento_plano_saude_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: feriados
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: ferias
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: historico_ajustes
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: historico_contratos
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: meritocracia_cancelamentos
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: organizations
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: periodos_folha
//   Policy "periodos_folha_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: planos_saude
//   Policy "planos_saude_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "planos_saude_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "planos_saude_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "planos_saude_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: plantoes
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: ponto
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: recebimentos
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: recrutamento
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow insert to anon users" (INSERT, PERMISSIVE) roles={anon}
//     WITH CHECK: true
// Table: registro_ponto
//   Policy "registro_ponto_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((colaborador_id = get_current_colaborador_id()) OR is_in_my_team(colaborador_id))
//   Policy "registro_ponto_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((colaborador_id = get_current_colaborador_id()) OR is_in_my_team(colaborador_id))
//   Policy "registro_ponto_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((colaborador_id = get_current_colaborador_id()) OR is_in_my_team(colaborador_id))
//   Policy "registro_ponto_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((colaborador_id = get_current_colaborador_id()) OR is_in_my_team(colaborador_id))
//     WITH CHECK: ((colaborador_id = get_current_colaborador_id()) OR is_in_my_team(colaborador_id))
// Table: regras_ponto
//   Policy "regras_ponto_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: solicitacoes_plano
//   Policy "solic_planos_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "solic_planos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "solic_planos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "solic_planos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: solicitacoes_servico
//   Policy "solicitacoes_servico_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: true
//   Policy "solicitacoes_servico_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "solicitacoes_servico_select" (SELECT, PERMISSIVE) roles={public}
//     USING: true
//   Policy "solicitacoes_servico_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: true
//     WITH CHECK: true
// Table: vagas
//   Policy "Allow all access to anon users" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow all access to authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow read access to anon users" (SELECT, PERMISSIVE) roles={anon}
//     USING: true

// --- DATABASE FUNCTIONS ---
// FUNCTION apply_ponto_tolerance()
//   CREATE OR REPLACE FUNCTION public.apply_ponto_tolerance()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_colab record;
//     v_time time;
//     v_expected time;
//     v_diff interval;
//   BEGIN
//     -- Se o status já for definido como aprovado/validado manualmente, não sobrescrever
//     IF NEW.status IN ('validado', 'aprovado') THEN
//       RETURN NEW;
//     END IF;
//
//     SELECT * INTO v_colab FROM public.colaboradores WHERE id = NEW.colaborador_id;
//
//     IF NOT FOUND THEN
//       RETURN NEW;
//     END IF;
//
//     -- Converter o data_hora para a hora local
//     v_time := (NEW.data_hora AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::time;
//
//     -- Obter horário esperado de acordo com o tipo de registro
//     IF NEW.tipo_registro = 'entrada' AND v_colab.jornada_entrada IS NOT NULL THEN
//       v_expected := v_colab.jornada_entrada::time;
//     ELSIF NEW.tipo_registro IN ('saida_intervalo', 'intervalo_saida', 'saida_de_intervalo') AND v_colab.jornada_saida_intervalo IS NOT NULL THEN
//       v_expected := v_colab.jornada_saida_intervalo::time;
//     ELSIF NEW.tipo_registro IN ('retorno_intervalo', 'intervalo_retorno', 'retorno_de_intervalo') AND v_colab.jornada_retorno_intervalo IS NOT NULL THEN
//       v_expected := v_colab.jornada_retorno_intervalo::time;
//     ELSIF NEW.tipo_registro = 'saida' AND v_colab.jornada_saida IS NOT NULL THEN
//       v_expected := v_colab.jornada_saida::time;
//     ELSE
//       -- Sem escala definida ou tipo_registro desconhecido, vai para pendente e aprovação gerencial
//       NEW.status := 'pendente';
//       RETURN NEW;
//     END IF;
//
//     -- Calcular diferença de horas
//     v_diff := v_time - v_expected;
//
//     -- Lidar com virada de dia (ex: esperado 23:55, batido 00:02 = diferença 7 minutos real, não 23h)
//     IF v_diff < interval '-12 hours' THEN
//       v_diff := v_diff + interval '24 hours';
//     ELSIF v_diff > interval '12 hours' THEN
//       v_diff := v_diff - interval '24 hours';
//     END IF;
//
//     -- Se a variação for de até 5 minutos, aprovar automaticamente
//     IF ABS(EXTRACT(EPOCH FROM v_diff) / 60) <= 5 THEN
//       NEW.status := 'validado';
//     ELSE
//       NEW.status := 'pendente';
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION auto_confirm_users()
//   CREATE OR REPLACE FUNCTION public.auto_confirm_users()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION check_periodo_fechado()
//   CREATE OR REPLACE FUNCTION public.check_periodo_fechado()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//       v_data DATE;
//       v_fechado BOOLEAN := FALSE;
//       v_record RECORD;
//   BEGIN
//       IF TG_OP = 'DELETE' THEN
//           v_record := OLD;
//       ELSE
//           v_record := NEW;
//       END IF;
//
//       IF TG_TABLE_NAME = 'registro_ponto' THEN
//           v_data := (v_record.data_hora AT TIME ZONE 'America/Sao_Paulo')::DATE;
//           SELECT EXISTS (
//               SELECT 1 FROM public.periodos_folha
//               WHERE status = 'fechado' AND v_data >= data_inicio AND v_data <= data_fim
//           ) INTO v_fechado;
//       ELSIF TG_TABLE_NAME = 'ajustes_ponto' THEN
//           v_data := v_record.data;
//           SELECT EXISTS (
//               SELECT 1 FROM public.periodos_folha
//               WHERE status = 'fechado' AND v_data >= data_inicio AND v_data <= data_fim
//           ) INTO v_fechado;
//       ELSIF TG_TABLE_NAME = 'afastamentos' THEN
//           SELECT EXISTS (
//               SELECT 1 FROM public.periodos_folha
//               WHERE status = 'fechado'
//                 AND (v_record.data_inicio <= data_fim AND v_record.data_fim >= data_inicio)
//           ) INTO v_fechado;
//       END IF;
//
//       IF v_fechado THEN
//           RAISE EXCEPTION 'Não é permitido alterar registros em um período fechado.';
//       END IF;
//
//       IF TG_OP = 'DELETE' THEN
//           RETURN OLD;
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION get_current_colaborador_id()
//   CREATE OR REPLACE FUNCTION public.get_current_colaborador_id()
//    RETURNS uuid
//    LANGUAGE sql
//    STABLE SECURITY DEFINER
//   AS $function$
//     SELECT id FROM public.colaboradores WHERE user_id = auth.uid() LIMIT 1;
//   $function$
//
// FUNCTION is_in_my_team(uuid)
//   CREATE OR REPLACE FUNCTION public.is_in_my_team(target_colab_id uuid)
//    RETURNS boolean
//    LANGUAGE plpgsql
//    STABLE SECURITY DEFINER
//   AS $function$
//   DECLARE
//     my_role TEXT;
//     my_dept TEXT;
//     target_dept TEXT;
//   BEGIN
//     SELECT role, departamento INTO my_role, my_dept FROM public.colaboradores WHERE user_id = auth.uid() LIMIT 1;
//
//     IF my_role ILIKE 'admin' OR my_role ILIKE 'administrador' THEN
//       RETURN TRUE;
//     END IF;
//
//     IF my_role ILIKE 'gerente' THEN
//       SELECT departamento INTO target_dept FROM public.colaboradores WHERE id = target_colab_id;
//       IF target_dept = my_dept THEN
//         RETURN TRUE;
//       END IF;
//     END IF;
//
//     RETURN FALSE;
//   END;
//   $function$
//
// FUNCTION on_ajuste_ponto_invalidate_falta()
//   CREATE OR REPLACE FUNCTION public.on_ajuste_ponto_invalidate_falta()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF NEW.status = 'aprovado' THEN
//       DELETE FROM public.faltas
//       WHERE colaborador_id = NEW.colaborador_id AND data = NEW.data;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION prevent_duplicate_entrada()
//   CREATE OR REPLACE FUNCTION public.prevent_duplicate_entrada()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_last_registro record;
//     v_dia date;
//   BEGIN
//     IF NEW.tipo_registro = 'entrada' THEN
//       v_dia := (NEW.data_hora AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date;
//
//       -- Busca o último registro do dia do colaborador
//       SELECT * INTO v_last_registro
//       FROM public.registro_ponto
//       WHERE colaborador_id = NEW.colaborador_id
//         AND (data_hora AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = v_dia
//         AND id != NEW.id
//       ORDER BY data_hora DESC
//       LIMIT 1;
//
//       -- Se encontrou um registro e o último NÃO for saída, o ponto ainda está aberto (em andamento)
//       IF FOUND AND v_last_registro.tipo_registro != 'saida' THEN
//         RAISE EXCEPTION 'Já existe uma marcação aberta para este colaborador no dia vigente.';
//       END IF;
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION prevent_unwanted_contracheques()
//   CREATE OR REPLACE FUNCTION public.prevent_unwanted_contracheques()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_nome text;
//     v_role text;
//   BEGIN
//     SELECT nome, role INTO v_nome, v_role
//     FROM public.colaboradores
//     WHERE id = NEW.colaborador_id;
//
//     -- Bloquear João Estagiário e variações (incluindo "Joã estagiaio")
//     IF v_nome ILIKE '%joão%estagi%' OR v_nome ILIKE '%joao%estagi%' OR v_nome ILIKE '%joã%estagi%' THEN
//       RETURN NULL;
//     END IF;
//
//     -- Bloquear Brunella
//     IF v_nome ILIKE '%brunella%' THEN
//       RETURN NULL;
//     END IF;
//
//     -- Bloquear Ismael Bomfim
//     IF v_nome ILIKE '%ismael bomfim%' THEN
//       RETURN NULL;
//     END IF;
//
//     -- Bloquear Administradores e Gerentes, exceto Rodrigo
//     IF (v_role ILIKE 'admin' OR v_role ILIKE 'gerente') AND v_nome NOT ILIKE '%rodrigo%' THEN
//       RETURN NULL;
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION sync_ticket_to_transporte()
//   CREATE OR REPLACE FUNCTION public.sync_ticket_to_transporte()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_recebe boolean;
//     v_home_office_count integer := 0;
//     v_plantoes_count integer := 0;
//     v_start_date date;
//     v_end_date date;
//     v_year integer;
//     v_month integer;
//   BEGIN
//     -- Prevent infinite recursion
//     IF pg_trigger_depth() > 1 THEN
//       RETURN NEW;
//     END IF;
//
//     v_year := split_part(NEW.mes_ano, '-', 1)::integer;
//     v_month := split_part(NEW.mes_ano, '-', 2)::integer;
//
//     -- Use PREVIOUS cycle dates for Home Office and Plantões as per rules
//     IF v_month = 1 THEN
//       v_start_date := make_date(v_year - 1, 12, 25);
//       v_end_date := make_date(v_year, 1, 24);
//     ELSE
//       v_start_date := make_date(v_year, v_month - 1, 25);
//       v_end_date := make_date(v_year, v_month, 24);
//     END IF;
//
//     SELECT recebe_transporte INTO v_recebe
//     FROM public.colaboradores
//     WHERE id = NEW.colaborador_id;
//
//     SELECT count(*) INTO v_home_office_count
//     FROM public.dias_home_office
//     WHERE data >= v_start_date AND data <= v_end_date;
//
//     SELECT count(*) INTO v_plantoes_count
//     FROM public.plantoes
//     WHERE data >= v_start_date AND data <= v_end_date AND colaborador_id = NEW.colaborador_id;
//
//     IF v_recebe = true THEN
//       INSERT INTO public.beneficios_transporte (
//         colaborador_id, mes_ano, ferias, atestados, faltas, dias_uteis, home_office, plantoes
//       ) VALUES (
//         NEW.colaborador_id, NEW.mes_ano, NEW.ferias, NEW.atestados, NEW.faltas, 20, v_home_office_count, v_plantoes_count
//       )
//       ON CONFLICT (colaborador_id, mes_ano) DO UPDATE SET
//         ferias = EXCLUDED.ferias,
//         atestados = EXCLUDED.atestados,
//         faltas = EXCLUDED.faltas,
//         home_office = EXCLUDED.home_office,
//         plantoes = EXCLUDED.plantoes;
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trg_agenda_to_solicitacao()
//   CREATE OR REPLACE FUNCTION public.trg_agenda_to_solicitacao()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//     BEGIN
//       IF NEW.cliente_id IS NOT NULL AND NEW.tipo IN ('Treinamento', 'Visita Técnica') THEN
//         IF TG_OP = 'INSERT' THEN
//           INSERT INTO public.solicitacoes_servico (
//             cliente_id, tipo, descricao, data_solicitacao, observacoes, status, valor
//           ) VALUES (
//             NEW.cliente_id, NEW.tipo, NEW.titulo, NEW.data_evento::date, COALESCE(NEW.descricao, ''), NEW.status, 0
//           );
//         END IF;
//       END IF;
//       RETURN NEW;
//     END;
//     $function$
//
// FUNCTION trg_solicitacao_historico()
//   CREATE OR REPLACE FUNCTION public.trg_solicitacao_historico()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_valor_total numeric;
//   BEGIN
//     SELECT valor_total INTO v_valor_total FROM public.clientes WHERE id = NEW.cliente_id;
//
//     IF TG_OP = 'INSERT' THEN
//       INSERT INTO public.historico_contratos (
//         cliente_id, solicitacao_id, tipo, data_solicitacao, observacoes, valor_adicional, valor_total
//       ) VALUES (
//         NEW.cliente_id,
//         NEW.id,
//         'Solicitação: ' || NEW.tipo,
//         COALESCE(NEW.data_solicitacao, CURRENT_DATE),
//         NEW.descricao || CASE WHEN NEW.observacoes IS NOT NULL AND NEW.observacoes <> '' THEN CHR(10) || 'Obs: ' || NEW.observacoes ELSE '' END,
//         COALESCE(NEW.valor, 0),
//         COALESCE(v_valor_total, 0)
//       );
//     ELSIF TG_OP = 'UPDATE' THEN
//       IF EXISTS (SELECT 1 FROM public.historico_contratos WHERE solicitacao_id = NEW.id) THEN
//         UPDATE public.historico_contratos
//         SET
//           tipo = 'Solicitação: ' || NEW.tipo,
//           data_solicitacao = COALESCE(NEW.data_solicitacao, CURRENT_DATE),
//           observacoes = NEW.descricao || CASE WHEN NEW.observacoes IS NOT NULL AND NEW.observacoes <> '' THEN CHR(10) || 'Obs: ' || NEW.observacoes ELSE '' END,
//           valor_adicional = COALESCE(NEW.valor, 0)
//         WHERE solicitacao_id = NEW.id;
//       ELSE
//         INSERT INTO public.historico_contratos (
//           cliente_id, solicitacao_id, tipo, data_solicitacao, observacoes, valor_adicional, valor_total
//         ) VALUES (
//           NEW.cliente_id,
//           NEW.id,
//           'Solicitação: ' || NEW.tipo,
//           COALESCE(NEW.data_solicitacao, CURRENT_DATE),
//           NEW.descricao || CASE WHEN NEW.observacoes IS NOT NULL AND NEW.observacoes <> '' THEN CHR(10) || 'Obs: ' || NEW.observacoes ELSE '' END,
//           COALESCE(NEW.valor, 0),
//           COALESCE(v_valor_total, 0)
//         );
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: afastamentos
//   trg_check_periodo_fechado_afastamentos: CREATE TRIGGER trg_check_periodo_fechado_afastamentos BEFORE INSERT OR DELETE OR UPDATE ON public.afastamentos FOR EACH ROW EXECUTE FUNCTION check_periodo_fechado()
// Table: agenda_eventos
//   on_agenda_eventos_created: CREATE TRIGGER on_agenda_eventos_created AFTER INSERT ON public.agenda_eventos FOR EACH ROW EXECUTE FUNCTION trg_agenda_to_solicitacao()
// Table: ajustes_ponto
//   trg_ajuste_ponto_invalidate_falta: CREATE TRIGGER trg_ajuste_ponto_invalidate_falta AFTER INSERT OR UPDATE OF status ON public.ajustes_ponto FOR EACH ROW EXECUTE FUNCTION on_ajuste_ponto_invalidate_falta()
//   trg_check_periodo_fechado_ajustes_ponto: CREATE TRIGGER trg_check_periodo_fechado_ajustes_ponto BEFORE INSERT OR DELETE OR UPDATE ON public.ajustes_ponto FOR EACH ROW EXECUTE FUNCTION check_periodo_fechado()
// Table: beneficios_ticket
//   on_ticket_changes_sync_transporte: CREATE TRIGGER on_ticket_changes_sync_transporte AFTER INSERT OR UPDATE OF ferias, atestados, faltas ON public.beneficios_ticket FOR EACH ROW EXECUTE FUNCTION sync_ticket_to_transporte()
// Table: contracheques
//   trg_prevent_unwanted_contracheques: CREATE TRIGGER trg_prevent_unwanted_contracheques BEFORE INSERT OR UPDATE ON public.contracheques FOR EACH ROW EXECUTE FUNCTION prevent_unwanted_contracheques()
// Table: registro_ponto
//   on_ponto_tolerance: CREATE TRIGGER on_ponto_tolerance BEFORE INSERT OR UPDATE ON public.registro_ponto FOR EACH ROW EXECUTE FUNCTION apply_ponto_tolerance()
//   trg_check_periodo_fechado_registro_ponto: CREATE TRIGGER trg_check_periodo_fechado_registro_ponto BEFORE INSERT OR DELETE OR UPDATE ON public.registro_ponto FOR EACH ROW EXECUTE FUNCTION check_periodo_fechado()
//   trg_prevent_duplicate_entrada: CREATE TRIGGER trg_prevent_duplicate_entrada BEFORE INSERT ON public.registro_ponto FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_entrada()
// Table: solicitacoes_servico
//   on_solicitacao_historico: CREATE TRIGGER on_solicitacao_historico AFTER INSERT OR UPDATE ON public.solicitacoes_servico FOR EACH ROW EXECUTE FUNCTION trg_solicitacao_historico()

// --- INDEXES ---
// Table: atividades_comerciais
//   CREATE INDEX idx_atividades_cliente_id ON public.atividades_comerciais USING btree (cliente_id)
//   CREATE INDEX idx_atividades_data ON public.atividades_comerciais USING btree (data_atividade)
// Table: auditoria_acessos
//   CREATE INDEX idx_auditoria_acessos_created_at ON public.auditoria_acessos USING btree (created_at DESC)
// Table: beneficios_ticket
//   CREATE UNIQUE INDEX beneficios_ticket_colaborador_id_mes_ano_key ON public.beneficios_ticket USING btree (colaborador_id, mes_ano)
// Table: beneficios_transporte
//   CREATE UNIQUE INDEX beneficios_transporte_colaborador_id_mes_ano_key ON public.beneficios_transporte USING btree (colaborador_id, mes_ano)
// Table: colaborador_planos
//   CREATE UNIQUE INDEX colaborador_planos_colaborador_id_key ON public.colaborador_planos USING btree (colaborador_id)
// Table: colaboradores
//   CREATE INDEX idx_colaboradores_organization_id ON public.colaboradores USING btree (organization_id)
//   CREATE INDEX idx_colaboradores_user_id ON public.colaboradores USING btree (user_id)
// Table: contracheques
//   CREATE UNIQUE INDEX contracheques_colaborador_id_mes_ano_key ON public.contracheques USING btree (colaborador_id, mes_ano)
// Table: dias_home_office
//   CREATE UNIQUE INDEX dias_home_office_data_key ON public.dias_home_office USING btree (data)
// Table: dispositivos_autorizados
//   CREATE UNIQUE INDEX dispositivos_autorizados_device_id_hash_key ON public.dispositivos_autorizados USING btree (device_id_hash)
// Table: faltas
//   CREATE UNIQUE INDEX faltas_colaborador_id_data_key ON public.faltas USING btree (colaborador_id, data)
// Table: feriados
//   CREATE UNIQUE INDEX feriados_data_key ON public.feriados USING btree (data)
// Table: plantoes
//   CREATE UNIQUE INDEX plantoes_colaborador_id_data_key ON public.plantoes USING btree (colaborador_id, data)
// Table: solicitacoes_servico
//   CREATE INDEX idx_solicitacoes_servico_cliente_id ON public.solicitacoes_servico USING btree (cliente_id)
