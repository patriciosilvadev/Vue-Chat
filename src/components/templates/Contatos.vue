<template>
  <div id="todos-contatos" :class="{'fechado' : fechado}"> <!-- class="resizable-content" -->
    <div class="titulo-contatos tamanho-titulos">
      <div class="titulo-contatos--icone-container" :class="{'fechado' : fechado}">
        <font-awesome-icon :icon="['fas', 'comment']" :title="dicionario.titulo_atendimentos" />
        <transition name="fade">
          <h1 v-show="!fechado"> Smart<span class="destaque-letra">CHANNEL</span> </h1> <!-- dicionario.titulo_atendimentos -->
        </transition>
      </div>
      <div>
      </div>
      <div @click="toggleContatos($event)" class="container-flecha" :class="rotate ? 'rotate' : ''">
        <font-awesome-icon :icon="['fas', 'long-arrow-alt-left']" class="flecha" />
      </div>
    </div>
    <template v-if="objAtendimentos">
      <!-- Busca Cliente -->
      <!-- <busca-cliente v-if="caso != 400" :estado="fechado" /> -->
      <!-- Caso Aguardando Cliente ou esperando a primeira requisicao ao buscaAtendimentos -->
      <div class="lista-contatos-container-vazio" :class="{'existe-agenda' : minhaAgenda.length || aguardando.length || caso !== 400}" v-if="caso == 206 || caso == 'aguardando'">
        <div class="load">
          <font-awesome-icon :icon="['fas', 'hourglass-end']" />
          <transition name="fade">
            <p v-show="!fechado" >
              <template v-if="caso == 206"> {{ dicionario.msg_aguardando_clientes }} </template>
              <template v-else> {{ dicionario.msg_carregando_clientes }} </template>
            </p>
          </transition>
        </div>
      </div>
      <!-- Caso haja Cliente -->
      <div class="lista-contatos-container" v-if="objAtendimentos && caso !== 400">
        <div class="lista-atendimento--titulo" v-if="caso != 400 && caso != 206" :class="{'fechado' : fechado}">
          <div :class="{'fechado' : fechado}" class="start-stop-contatos" @click="$root.$emit('mudar-estado-atd')">
            <div v-show="statusAtd == 'em-atendimento'" class="bg-em-atendimento" :title="dicionario.title_status_em_atendimento">
              <font-awesome-icon :icon="['fas', 'pause']" />
            </div>
            <div v-show="statusAtd == 'parado'" class="bg-parado" :title="dicionario.title_status_parado">
              <font-awesome-icon :icon="['fas', 'play']" />
            </div>
          </div>
          <!-- <h2 v-show="!fechado" v-text="dicionario.sub_titulo_atendimentos"></h2> -->
          <badges-gerenciador :estado="fechado" />
          <div v-if="!fechado" class="container-contadores">
            <span v-if="objAtendimentos.length" :title="dicionario.title_total_clientes" class="total-clientes" v-text="objAtendimentos.length"></span>
            <span v-if="totalClientesNovos != ''" :title="dicionario.title_total_novos_clientes" class="total-clientes-novos" v-text="totalClientesNovos"></span>
            <span v-if="totalMsgNovas != ''" :title="dicionario.title_total_msgs_novas" class="total-msgs-novas" v-text="totalMsgNovas"></span>
          </div>
        </div>

        <ul :class="{'fechado' : fechado}"  id="lista-contatos">
          <li
            v-for="(atd, indice) in objAtendimentos"
            :key="indice"
            :title="acionaFormataNome(atd.nome_usu)"
            :class="{'destaque-novo-contato' : atd.novoContato, 'nova-msg' : atd.alertaMsgNova, 'ativo' : idAtendimentoAtivo == atd.id_cli}"
            @click="ativarConversa( atd, indice )"
            @contextmenu="abrirMenuBotaoDireito($event)"
          >
            <div class="circulo-contatos" v-if="atd.nome_usu">
              <p v-text="acionaFormataSigla(atd.nome_usu[0], 'upper')"></p>
              <p v-if="fechado" v-text="acionaFormataSigla(atd.nome_usu[1], 'lower')"></p>
              <img v-if="atd.sigla" :src="`${dominio}/callcenter/imagens/ext_top_${atd.sigla}.png`">
            </div>
            <template v-if="!fechado">{{ acionaFormataNome(atd.nome_usu) }}</template>
            <ultima-msg v-if="!fechado" :mensagens="atd.arrMsg" />
            <span v-if="atd.alertaMsgNova && atd.qtdMsgNova > 0 && idAtendimentoAtivo !== atd.id_cli" class="destaque-nova-msg" v-text="atd.qtdMsgNova"></span>
            <span v-if="idAtendimentoAtivo == atd.id_cli" class="ctt-ativo"></span>
          </li>
        </ul>

        <div class="lista-aguardando--titulo">
          <div :class="{'fechado' : fechado}">
            <font-awesome-icon :icon="['fas', 'hourglass-end']" :title="dicionario.sub_titulo_aguardando" />
          </div>
          <transition name="fade">
            <h2 v-show="!fechado" v-text="dicionario.sub_titulo_aguardando"></h2>
          </transition>
        </div>
        <lista-aguardando :fechado="fechado" />

        <lista-agenda :fechado="fechado" />
      </div>
    </template>
    <!-- Caso nao haja atendimentos -->
    <div  class="lista-contatos-container-vazio" :class="{'fechado' : fechado}" v-if="caso == 400 && !todosAtendimentos.length">
      <div>
        <font-awesome-icon :icon="['fas', 'folder-open']" />
        <transition name="fade">
          <p v-show="!fechado" v-text="dicionario.msg_sem_contatos"></p>
        </transition>
      </div>
    </div>

    <resize :origem="'todos-contatos'" />
  </div>
</template>

<style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity .5s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
</style>

<script>
import { mapGetters } from "vuex"
import axios_api from '@/services/serviceAxios'

import { formataNome, formataSigla, formataDataHora, formataHoraMensagem } from "@/services/formatacaoDeTextos"
import { limparIframeUsuarioRemovido } from "@/services/iframe"

import SimpleContextMenu from 'vue-simple-context-menu'
import ListaAguardando from "../ListaAguardando"
import ListaAgenda from "../ListaAgenda"
import UltimaMsg from "../UltimaMsg"
import BadgesGerenciador from "../BadgesGerenciador"
import BuscaCliente from "../BuscaCliente"

export default {
  data() {
    return {
      fechado: false,
      rotate: false,
      haContatos: true,
      objAtendimentos: [],
      totalMsgNovas: '',
      totalClientesNovos: '',
      reqEmAndamento: false
    };
  },
  components: {
    "simple-context-menu" : SimpleContextMenu,
    "ultima-msg" : UltimaMsg,
    "lista-aguardando": ListaAguardando,
    "lista-agenda": ListaAgenda,
    "badges-gerenciador": BadgesGerenciador,
    "busca-cliente" : BuscaCliente
  },
  watch: {
    todosAtendimentos() {
      if(this.todosAtendimentos){
        this.objAtendimentos = Object.values(this.todosAtendimentos)

        for(let ramal in this.todosAtendimentos){
          this.objAtendimentos.map(atd => {
            if(atd.id_cli == this.todosAtendimentos[ramal].id_cli){
              if(atd.nro_chat != this.todosAtendimentos[ramal].nro_chat){
                console.log("atd nro_chat: ", atd.nro_chat)
                console.log("todos atds nro_chat: ", this.todosAtendimentos[ramal].nro_chat)
                console.log("Ajustou nro_chat")
                atd.nro_chat = this.todosAtendimentos[ramal].nro_chat
              }
            }
          })
        }

        this.contarMsgClientes()

        if(this.objAtendimentos.length && this.idAtendimentoAtivo == ''){
          if(!this.$store.getters.getAbrirPreviaCliente){
            this.ativarConversa(this.objAtendimentos[0], 0)
          }
        }else if(this.objAtendimentos.length && this.idAtendimentoAtivo){
          let qtdNegativo = 0
          for(let atd in this.objAtendimentos){
            if(this.objAtendimentos[atd].id_cli !== this.idAtendimentoAtivo){
              qtdNegativo++
            }
          }

          if(qtdNegativo == this.objAtendimentos.length){
            this.ativarConversa(this.objAtendimentos[0], 0)
          }
        }

        this.verificarDuplicataMinhaAgenda()
      } else {
        this.objAtendimentos = []
      }
    },
    caso(){
      if(this.caso == 206 || this.caso == 400){
        this.$root.$emit("reverter-cores")

        const tituloContatos = document.querySelector('.titulo-contatos')
        const tituloAgenda = document.querySelector('.lista-agenda--titulo')

        if(tituloContatos, tituloAgenda){
          tituloContatos.style.background = ''
          tituloAgenda.style.background = ''
        }

        if(this.objAtendimentos.length || this.todosAtendimentos){
          this.objAtendimentos = []
          this.$store.dispatch("setAtendimentos", {})
          this.$store.dispatch("limparAtendimentoAtivo")
          this.$store.dispatch("limparIdAtendimentoAtivo")
        }
      }
    }
  },
  mounted(){
    this.$root.$on('ativar-contato', (atd, indice) => {
      this.ativarConversa(atd, indice)
    })

    this.$root.$on('adicionar-fechado', () => {
      this.fechado = true
      this.rotate = true
    })

    this.$root.$on('remover-fechado', () => {
      this.fechado = false
      this.rotate = false
    })
  },
  computed: {
    ...mapGetters({
      todosAtendimentos: "getTodosAtendimentos",
      minhaAgenda: "getAgenda",
      aguardando: "getAguardando",
      todos: "getTodos",
      caso: "getCaso",
      atendimentoAtivo: "getAtendimentoAtivo",
      idAtendimentoAtivo: "getIdAtendimentoAtivo",
      reqRegras: "getReqRegras",
      dominio: "getDominio",
      reqTeste: "getReqTeste",
      dicionario: "getDicionario",
      regexIframe: "getRegexIframe",
      regexLinks: "getRegexLinks",
      statusAtd: "getStatusAtd",
      ativo: "getAtivo"
    })
  },
  updated(){
    if(this.todosAtendimentos){
      for(let ramal in this.todosAtendimentos){
        if(this.minhaAgenda.length){
          this.minhaAgenda.map(atdAgenda => {
            if(this.todosAtendimentos[ramal] && atdAgenda){
              if(atdAgenda.login_usu == this.todosAtendimentos[ramal].login_usu){
                this.verificarDuplicataEmAtendimento(atdAgenda.login_usu)
              }
            }
          })
        }
        if(this.aguardando.length){
          this.aguardando.map(atdAguardando => {
            if(this.todosAtendimentos[ramal] && atdAguardando){
              if(atdAguardando.login_usu == this.todosAtendimentos[ramal].login_usu){
                this.verificarDuplicataEmAtendimento(atdAguardando.login_usu)
              }
            }
          })
        }
        if(this.todos.length){
          this.todos.map(atdTodos => {
            if(this.todosAtendimentos[ramal] && atdTodos){
              if(atdTodos.login_usu == this.todosAtendimentos[ramal].login_usu){
                this.verificarDuplicataEmAtendimento(atdTodos.login_usu)
              }
            }
          })
        }
      }
    }
  },
  methods: {
    verificarDuplicataEmAtendimento(loginUsuComparativo){

      let objAtdAux = {}
      for(let ramal in this.todosAtendimentos){
        if(this.todosAtendimentos[ramal].login_usu != loginUsuComparativo){
          objAtdAux[ramal] = this.todosAtendimentos[ramal]
        }
      }

      const idIframe = loginUsuComparativo.replace(this.regexIframe, "")

      limparIframeUsuarioRemovido(`iframe_${idIframe}`)
      this.$store.dispatch("setAtendimentos", objAtdAux)
      if(Object.values(objAtdAux)){
        this.objAtendimentos = Object.values(objAtdAux)
      }else{
        this.objAtendimentos = []
      }

      if(!objAtdAux || !Object.keys(objAtdAux).length){
        this.$store.dispatch("setCaso", 206)
      }

      this.$forceUpdate()
    },
    verificarDuplicataMinhaAgenda(){
      if(this.minhaAgenda.length && this.objAtendimentos.length){
        let fazerRequisicao = false
        this.objAtendimentos.map(atd => {
          this.minhaAgenda.map(atdAgenda => {
            if(atd.login_usu === atdAgenda.login_usu){
              fazerRequisicao = true
            }
          })
        })

        if(fazerRequisicao){
          this.$root.$emit("req-agenda")
        }
      }
    },
    abrirMenuBotaoDireito(ev){
      this.$root.$emit("abrir-menu", ev)
    },
    contarMsgClientes() {
      this.totalMsgNovas = ''
      this.totalClientesNovos = ''
      let auxContMsgNova = 0
      let auxContNovoContato = 0
      for(let index in this.objAtendimentos) {
        if(this.objAtendimentos[index].qtdMsgNova) {
          auxContMsgNova = auxContMsgNova + this.objAtendimentos[index].qtdMsgNova
        }
        if(this.objAtendimentos[index].novoContato) {
          auxContNovoContato++
        }
      }

      this.totalMsgNovas = auxContMsgNova
      this.totalClientesNovos = auxContNovoContato

      if(this.totalClientesNovos == 1 && this.objAtendimentos.length == 1){
        this.objAtendimentos[0].novoContato = false
        this.totalClientesNovos = 0
      }
    },
    ativarConversa(atd, indice) {

      if(atd.tipo == 'ligacao'){
        if(this.$store.getters.getAbrirPreviaCliente){
          this.$store.dispatch("setAbrirPreviaCliente", false)
          this.$store.dispatch("setObjPreviaCli", {})
        }
        this.$store.dispatch('setAtendimentoAtivo', atd)
        this.exibirInformacoes(atd, indice)
        this.$store.dispatch('setIdAtendimentoAtivo', atd.id_cli)
        return
      }

      if(atd.id_cli == this.idAtendimentoAtivo){
        if(atd.nro_chat == this.atendimentoAtivo.nro_chat){
          return
        }else{
          console.log("nro chat diferentes")
        }
      }

      atd.novoContato = false
      atd.alertaMsgNova = false
      atd.qtdMsgNova = 0

      if(this.$store.getters.getVerificaMsgFormatadaAberto){
        this.$root.$emit("toggle-msg-formatada")
      }

      this.contarMsgClientes()

      if(this.$store.getters.getAbrirPreviaCliente){
        this.$store.dispatch("setAbrirPreviaCliente", false)
        this.$store.dispatch("setObjPreviaCli", {})
      }
      this.$store.dispatch('setAtendimentoAtivo', atd)

      let objMensagens = Object.values(atd.arrMsg)
      let todasMensagens = []
      for(let objMsg in objMensagens){
        todasMensagens.push(objMensagens[objMsg].msg)
      }

      this.setMensagensClienteAtivo(atd.id_cli, todasMensagens)

      this.exibirInformacoes(atd, indice)

      this.$store.dispatch('setIdAtendimentoAtivo', atd.id_cli)

      setTimeout(() => {
        if(document.querySelector("textarea")){
          document.querySelector("textarea").focus()
        }
      }, 150)
    },
    exibirInformacoes(atd, indice) {
      atd.informacoes = {}
      atd.informacoes.nome = atd.nome_usu
      atd.id = atd.login_usu

      this.$root.$emit('mostrar-iframe', atd.id, atd.url)
    },
    setMensagensClienteAtivo(id, arrMensagens) {

      for(let index in arrMensagens){
        for (let i in arrMensagens[index]) {
          if(i != 'st_ret') {

            // Caso nao entre nesse if significa que a mensagem ja esta na estrutura esperada
            if(!(arrMensagens[index][i].origem)){

              let mensagem = arrMensagens[index][i].msg;
              let link = false
              let status = arrMensagens[index][i].status
              let tooltip = ""
              let origem;
              arrMensagens[index][i].resp_msg == "CLI" ? (origem = "outros") : (origem = "principal");
              let horario = formataHoraMensagem(arrMensagens[index][i].hora)

              let autor = ""
              if(arrMensagens[index][i].nome){
                autor = arrMensagens[index][i].nome;
              }else{
                autor = arrMensagens[index][i].resp_msg
                switch (autor) {
                  case "CLI":
                    autor = "Cliente";
                    break;
                  case "OPE":
                    autor = "Operador";
                    break;
                }
              }

              let anexo = false;

              let imgAnexo = "";
              let tipoDoc = ""
              let docAnexo = "";
              let nomeArquivo = ""
              let audio = false
              let video = false
              let seq = arrMensagens[index][i].seq

              if(arrMensagens[index][i].anexos){
                anexo = true

                var regex = /(\w+)\/(\w+)/g;
                var type = regex.exec(arrMensagens[index][i].anexos.type);

                if(!type){
                  type = arrMensagens[index][i].anexos.type
                }else{
                  type = type[1]
                }

                switch (type) {
                  case "image":
                    imgAnexo = `${this.dominio}/callcenter/docs.php?mku=${arrMensagens[index][i].anexos.mku}`
                    nomeArquivo = arrMensagens[index][i].anexos.name
                    break;
                  case "audio/ogg":
                  case "audio/oga":
                  case "audio":
                  case "ogg":
                  case "oga":
                  case "mpga":
                  case "audio/mpga":
                  case "mp3":
                  case "audio/mp3":
                    tipoDoc = arrMensagens[index][i].anexos.type
                    docAnexo = `${this.dominio}/callcenter/docs.php?mku=${arrMensagens[index][i].anexos.mku}`
                    nomeArquivo = arrMensagens[index][i].anexos.name
                    audio = true
                    break;
                  case "video/mp4":
                  case "video":
                  case "mp4":
                    tipoDoc = arrMensagens[index][i].anexos.type
                    docAnexo = `${this.dominio}/callcenter/docs.php?mku=${arrMensagens[index][i].anexos.mku}`
                    nomeArquivo = arrMensagens[index][i].anexos.name
                    video = true
                    break;
                  default:
                    tipoDoc = arrMensagens[index][i].anexos.type
                    docAnexo = `${this.dominio}/callcenter/docs.php?mku=${arrMensagens[index][i].anexos.mku}`
                    nomeArquivo = arrMensagens[index][i].anexos.name
                    break;
                }
              }

              if(mensagem.search(this.regexLinks) !== -1){
                link = true
                let arrLinks = mensagem.split(" ")
                arrLinks = arrLinks.map((link) => {
                  if(link.search(this.regexLinks) !== -1){
                    let href = ""
                    if(!link.startsWith("http")){
                      href = `https://${link}`
                    }else{
                      href = link
                    }

                    link = `<a href="${href}" target="_blank" title="${link} ${this.dicionario.msg_link}">${link}</a>`
                  }
                  return link
                })

                mensagem = arrLinks.join(" ")
              }

              // Tratativa de *negrito* _italico_ e ~cortado~
              if(!link){
                const regexNegrito = /\*[\sA-Za-z0-9\u00C0-\u00FF]+\*/g
                const regexItalico = /\_[\sA-Za-z0-9\u00C0-\u00FF]+\_/g
                const regexLinha = /\~[\sA-Za-z0-9\u00C0-\u00FF]+\~/g

                if(mensagem.search(regexNegrito) !== -1){
                  let arrTexto = mensagem.split(" ")

                  let abrirTag = true
                  arrTexto = arrTexto.map((mensagem) => {
                    if(mensagem.search(/\*/) !== -1){
                        if(mensagem.length > 1){
                          if(mensagem.match(/\*/g).length > 1){
                            mensagem = mensagem.replace(/\*/g, "")
                            mensagem = `<b>${mensagem}</b>`
                          }else{
                            mensagem = mensagem.replace(/\*/, "")
                            if(abrirTag){
                              mensagem = `<b>${mensagem}`
                              abrirTag = false
                            }else{
                              mensagem += "</b>"
                            }
                          }
                        }else{
                          if(abrirTag){
                            mensagem = mensagem.replace(/\*/, "<b>")
                            abrirTag = false
                          }else{
                            mensagem = mensagem.replace(/\*/, "</b>")
                          }
                        }
                      }
                      return mensagem
                  })
                  mensagem = arrTexto.join(" ")
                }

                if(mensagem.search(regexItalico) !== -1){
                  let arrTexto = mensagem.split(" ")

                  let abrirTag = true
                  arrTexto = arrTexto.map((mensagem) => {
                    if(mensagem.search(/\_/) !== -1){
                        if(mensagem.length > 1){
                          if(mensagem.match(/\_/g).length > 1){
                            mensagem = mensagem.replace(/\_/g, "")
                            mensagem = `<i>${mensagem}</i>`
                          }else{
                            mensagem = mensagem.replace(/\_/, "")
                            if(abrirTag){
                              mensagem = `<i>${mensagem}`
                              abrirTag = false
                            }else{
                              mensagem += "</i>"
                            }
                          }
                        }else{
                          if(abrirTag){
                            mensagem = mensagem.replace(/\_/, "<i>")
                            abrirTag = false
                          }else{
                            mensagem = mensagem.replace(/\_/, "</i>")
                          }
                        }
                      }
                      return mensagem
                  })
                  mensagem = arrTexto.join(" ")
                }

                if(mensagem.search(regexLinha) !== -1){
                  let arrTexto = mensagem.split(" ")

                  let abrirTag = true
                  arrTexto = arrTexto.map((mensagem) => {
                    if(mensagem.search(/\~/) !== -1){
                        if(mensagem.length > 1){
                          if(mensagem.match(/\~/g).length > 1){
                            mensagem = mensagem.replace(/\~/g, "")
                            mensagem = `<del>${mensagem}</del>`
                          }else{
                            mensagem = mensagem.replace(/\~/, "")
                            if(abrirTag){
                              mensagem = `<del>${mensagem}`
                              abrirTag = false
                            }else{
                              mensagem += "</del>"
                            }
                          }
                        }else{
                          if(abrirTag){
                            mensagem = mensagem.replace(/\~/, "<del>")
                            abrirTag = false
                          }else{
                            mensagem = mensagem.replace(/\~/, "</del>")
                          }
                        }
                      }
                      return mensagem
                  })
                  mensagem = arrTexto.join(" ")
                }
              }

              let msgStatus = "msg_status_"+arrMensagens[index][i].status
              let str = `<p class="tooltip-titulo-status-message">${this.dicionario[msgStatus]}</p>`
              if(arrMensagens[index][i].data_hora_status && arrMensagens[index][i].data_hora_status !== "1111-11-11 00:00:00"){
                str += `<p>${this.acionaFormataDataHora(arrMensagens[index][i].data_hora_status, true)}</p>`
              }
              str += `<ul class="tooltip-list">`
              if(arrMensagens[index][i].data_hora_gravacao && arrMensagens[index][i].data_hora_gravacao !== "1111-11-11 00:00:00"){
                str += `<li>${this.dicionario.msg_data_hora_gravacao} - ${this.acionaFormataDataHora(arrMensagens[index][i].data_hora_gravacao, true)}</li>`
              }
              if(arrMensagens[index][i].data_hora_envio_fila && arrMensagens[index][i].data_hora_envio_fila !== "1111-11-11 00:00:00"){
                str += `<li>${this.dicionario.msg_data_hora_envio_fila} - ${this.acionaFormataDataHora(arrMensagens[index][i].data_hora_envio_fila, true)}</li>`
              }
              if(arrMensagens[index][i].data_hora_envio_cliente && arrMensagens[index][i].data_hora_envio_cliente !== "1111-11-11 00:00:00"){
                str += `<li>${this.dicionario.msg_data_hora_envio_cliente} - ${this.acionaFormataDataHora(arrMensagens[index][i].data_hora_envio_cliente, true)}</li>`
              }
              if(arrMensagens[index][i].data_hora_entrega && arrMensagens[index][i].data_hora_entrega !== "1111-11-11 00:00:00"){
                str += `<li>${this.dicionario.msg_data_hora_entrega} - ${this.acionaFormataDataHora(arrMensagens[index][i].data_hora_entrega, true)}</li>`
              }
              if(arrMensagens[index][i].data_hora_leitura && arrMensagens[index][i].data_hora_leitura !== "1111-11-11 00:00:00"){
                str += `<li>${this.dicionario.msg_data_hora_leitura} - ${this.acionaFormataDataHora(arrMensagens[index][i].data_hora_leitura, true)}</li>`
              }
              if(arrMensagens[index][i].status_msg){
                str += `<li>${arrMensagens[index][i].status_msg}</li>`
              }
              str += "</ul>"

              if(!str.endsWith('<ul class="tooltip-list"></ul>')){
                tooltip = str
              }

              arrMensagens[index][i] = this.getObjMensagem( seq, autor, origem, mensagem, link, status, horario, anexo, imgAnexo, tipoDoc, docAnexo, nomeArquivo, audio, video, tooltip );

              if(document.querySelector('#textarea')){
                document.querySelector('#textarea').focus()
              }
            }
          }
        }
      }
    },
    getObjMensagem(
      inSeq,
      inAutor,
      inOrigem,
      inMensagem,
      inLink,
      inStatus,
      inHorario,
      inAnexo,
      inImgAnexo,
      inTipoDoc,
      inDocAnexo,
      inNomeArquivo,
      inAudio,
      inVideo,
      inTooltip
    ) {
      let objMensagem = {
        seq: inSeq,
        autor: inAutor, // Operador, Cliente
        origem: inOrigem, // principal e outros
        msg: inMensagem,
        link: inLink,
        status: inStatus,
        horario: inHorario,
        anexo: inAnexo,
        imgAnexo: inImgAnexo,
        tipoDoc: inTipoDoc,
        docAnexo: inDocAnexo,
        nomeArquivo: inNomeArquivo,
        audio: inAudio,
        video: inVideo,
        tooltip: inTooltip
      };
      return objMensagem;
    },
    toggleContatos(event) {
      this.rotate = !this.rotate
      this.fechado = !this.fechado;

      this.$root.$emit("toggle-contatos", this.fechado)

      localStorage.setItem("contatos-fechado", this.fechado)
    },
    obterMensagensDoContatoAtivoPeloId( id ) {
      for( let ramal in this.todosAtendimentos ) {
        if( id == this.todosAtendimentos[ramal].id_cli ) {
          return this.todosAtendimentos[ramal].arrMsg
        }
      }
    },
    acionaFormataDataHora(dataHora, origem){
      return formataDataHora(dataHora, origem)
    },
    acionaFormataNome(nome){
      return formataNome(nome)
    },
    acionaFormataSigla(letra, acao){
      return formataSigla(letra, acao)
    },
  }
};
</script>
