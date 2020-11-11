export default {
  state: {
    dicionario: {
      titulo_pausa: "Atendimento em pausa",
      titulo_retornar_pausa: "Clique aqui para voltar",
      titulo_chat: "Chat",
      msg_sem_chat: "Selecione um contato",
      titulo_atendimentos: "Atendimentos",
      msg_aguardando_clientes: "Aguardando clientes",
      msg_carregando_clientes: "Carregando clientes",
      title_total_clientes: "Total de clientes",
      title_total_novos_clientes: "Total de novos clientes",
      title_total_msgs_novas: "Total de mensagens novas",
      sub_titulo_atendimentos: "Em atendimento",
      sub_titulo_aguardando: "Aguardando",
      sub_titulo_agenda: "Minha Agenda",
      msg_sem_agenda: "Sem clientes para mostrar",
      msg_sem_contatos: "Sem contatos para mostrar",
      titulo_carregando: "Carregando",
      titulo_informacoes: "Informacoes",
      sub_titulo_telefone: "Telefone",
      sub_titulo_tempo_conectado: "Tempo conectado",
      sub_titulo_tempo_fila: "Tempo de fila",
      msg_sem_informacoes: "Sem informacoes para mostrar",
      placeholder_select_data_hora: "Selecione uma data e hora",
      btn_continuar_select_data_hora: "Continuar",
      btn_fechar_select_data_hora: "Fechar",
      btn_confirmar: "Confirmar",
      btn_cancelar: "Cancelar", 
      btn_todos: "Todos",
      btn_pessoal: "Pessoal",
      btn_agendar: "Agendar",
      msg_sucesso_retorno: "Retorno realizado",
      msg_erro_retorno: "Nao foi possivel realizar o retorno",
      msg_data_incorreta: "Selecione uma data e hora validas",
      msg_sem_resultados: "Nenhuma correspondencia encontrada",
      btn_agente: "Agente",
      btn_grupo: "Grupo",
      msg_erro_bot: "Nao existem bots disponiveis",
      msg_erro_agentes: "Nao existem agentes disponiveis",
      msg_erro_grupos: "Nao existem grupos disponiveis",
      msg_erro_transferencia: "Nao foi possivel realizar a transferencia",
      msg_sucesso_transferencia: "Transferencia realizada",
      msg_erro_carregamento: "Nao foi possivel carregar esta area",
      msg_erro_clique_finalizar: "Selecione um cliente antes de tentar finalizar o atendimento",
      msg_erro_finalizar: "Nao foi possivel encerrar o atendimento",
      title_nova_msg: "Existe uma nova mensagem",
      alt_previa_img: "Previa da imagem selecionada",
      msg_cancelar_anexo: "Cancelar selecao de anexo",
      placeholder_textarea: "Digite sua mensagem",
      title_enviar_msg: "Enviar",
      title_msg_formatada: "Mensagem formatada",
      title_selecionar_anexo: "Selecionar anexo",
      title_anexo_img: "Imagem",
      title_anexo_doc: "Documento",
      titulo_select: "Selecione",
      title_btn_preencher_msg_formatada: "Preencher campo de mensagem",
      title_btn_abrir_msg_tipo_2: "Abrir janela mensagem tipo 2",
      msg_erro_enviar_msg: "Nao foi possivel enviar a mensagem",
      msg_erro_sem_msg_formatada: "Sem mensagens para as opc�es selecionadas",
      titulo_selecionar_mensagem: "Selecione uma mensagem",
      msg_erro_msg_vazia: "Mensagem vazia",
      msg_extensoes_aceitas: "sao aceitos",
      titulo_baixar_img: "Baixar imagem",
      titulo_visualizar_img: "Visualizar imagem",
      alt_msg_img: "Imagem anexada",
      msg_erro_audio: "Seu navegador nao suporta o elemento audio",
      msg_abrir_audio: "Clique para abrir o audio em outra janela",
      msg_erro_video: "Seu navegador nao suporta o elemento video",
      msg_abrir_video: "Clique para abrir o video em outra janela",
      msg_sucesso: "Operacao realizada com sucesso",
      msg_erro: "Oops.. Erro inesperado",
      msg_limite_caracter: "Limite de caracteres atingido",
      msg_formato_invalido: "Selecione um formato valido",
      titulo_msg_formato_invalido: "Formato invalido!",
      msg_em_construcao: "Construcao em andamento",
      title_status_em_atendimento: "Em atendimento",
      title_status_parado: "Parado",
      title_btn_adicionar_cliente: "Adicionar novo cliente"
    }
  },
  mutations: {
    setDicionario(state, dicionario){
      state.dicionario = dicionario
    }
  },
  actions: {
    setDicionario: (context, payload) => {
      context.commit("setDicionario", payload)
    }
  },
  getters: {
    getDicionario(state){
      return state.dicionario
    }
  }
}