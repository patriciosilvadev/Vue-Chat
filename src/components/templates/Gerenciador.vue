<template>
    <!-- class="d-none" -->
  <div id="gerenciador-container" :class="{'d-none': !reqTeste, 'aguardando' : reqEmAndamento, 'em-atendimento' : statusAtd == 'em-atendimento', 'parado' : statusAtd == 'parado'}" v-if="gerenciador && gerenciador.length">
    <div class="gerenciador-btn" @click="mudarEstadoAtendimento()">
      <div v-show="statusAtd == 'em-atendimento'" :title="dicionario.title_status_em_atendimento">
        <font-awesome-icon :icon="['fas', 'pause']" />
      </div>
      <div v-show="statusAtd == 'parado'" :title="dicionario.title_status_parado">
        <font-awesome-icon :icon="['fas', 'play']" />
      </div>
    </div>
    <div class="gerenciador-lista" ref="gerenciador-lista" :class="{'existe-ativo' : ativo == true}">
      <div v-for="(tipo, index) in gerenciador" :key="index">
        <span class="titulo" v-text="tipo.texto"></span>
        <span class="valor" v-text="tipo.count"></span>
      </div>
    </div>
    <div class="gerenciador-btn" :title="dicionario.title_btn_adicionar_cliente" @click="abrirAtivarCtt()" v-if="ativo">
      <font-awesome-icon :icon="['fas', 'user-plus']" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import axios_api from '@/services/serviceAxios';
import { getAtendimentos } from "@/services/atendimentos"

export default {
  computed: {
    ...mapGetters({
      gerenciador: "getGerenciador",
      ativo: "getAtivo",
      dominio: "getDominio",
      reqTeste: "getReqTeste",
      statusAtd: "getStatusAtd",
      todosAtendimentos: "getTodosAtendimentos",
      semIframe: "getSemIframe",
      dicionario: "getDicionario",
      abaSelecionada: "getAbaSelecionada",
      todos: "getTodos",
      aguardando: "getAguardando"
    })
  },
  data(){
    return{
      qtdAguardando: 0,
      qtdTodos: 0,
      reqEmAndamento: false,
      contador: 0
    }
  },
  mounted(){
    window.addEventListener("message", this.listenerPostMessage, false);

    this.$root.$on("mudar-estado-atd", () => {
      this.mudarEstadoAtendimento()
    })
  },
  methods: {
    listenerPostMessage(event){

      if(event.origin == this.dominio){
        if(event.data.ativarContato){
          this.abrirAtivarCtt()
        }
        if(event.data.toggleAtd){
          this.mudarEstadoAtendimento()
        }
      }
    },
    mudarEstadoAtendimento(){
      if(this.reqEmAndamento){
        return
      }

      this.reqEmAndamento = true
      this.preencherDiv()

      axios_api.put(`start-and-stop?${this.reqTeste}`)
        .then(response => {
          if(response.data.st_ret == "OK"){
            if(this.statusAtd == "em-atendimento"){
              this.$store.dispatch("setStatusAtd", "parado")

              let arrTodosAtds = Object.values(this.todosAtendimentos)
              if(arrTodosAtds.length == 0){
                this.$store.dispatch("setBlocker", true)
                this.$store.dispatch("setOrigemBlocker", "atd-parado")
              }else{
                this.$store.dispatch("setBlocker", false)
              }

            }else{
              this.$store.dispatch("setStatusAtd", "em-atendimento")
              this.$store.dispatch("setBlocker", false)

              if(this.$store.getters.getOrigemBlocker == "atd-parado"){
                this.$store.dispatch("setOrigemBlocker", "")
                getAtendimentos(this)
              }
            }

            this.reqEmAndamento = false

            this.preencherDiv()
          }
        })
        .catch(error => {

          this.reqEmAndamento = false

          this.$store.dispatch("setOrigemBlocker", "atd-parado")

          let arrTodosAtds = Object.values(this.todosAtendimentos)
          if(arrTodosAtds.length == 0){
            this.$store.dispatch("setBlocker", true)
            this.$store.dispatch("setOrigemBlocker", "atd-parado")
          }else{
            this.$store.dispatch("setBlocker", false)
          }

          this.preencherDiv()
          console.log("error start/stop: ", error)
        })

    },
    abrirAtivarCtt(){
      if(this.$store.getters.getBlocker){
        this.$store.dispatch("setBlocker", false)
        this.$store.dispatch("setOrigemBlocker", "")
        this.$root.$emit("abrir-iframe", "")
      }else{
        this.$store.dispatch("setBlocker", true)
        this.$store.dispatch("setOrigemBlocker", "visualizar-iframe")
        this.$root.$emit("abrir-iframe", `${this.dominio}/im/atdHumano/view/atd_contato_atv.php`)
      }
    },
    preencherDiv(){

      if(!this.$refs["gerenciador-lista"]){
        this.contador++
        if(this.contador < 10){
          setTimeout(() => {
            this.preencherDiv()
          }, 500)
        }

        return
      }

      this.contador = 0

      const gerenciadorV8 = parent.document.querySelector("#TelaOpeGer")
      if(gerenciadorV8){
        const gerenciador = document.querySelector("#gerenciador-container")

        const gerenciadorListaV8 = parent.document.querySelector("#TelaOpeGer .gerenciador-lista")
        const iconeGerenciador = parent.document.querySelector("#icone-gerenciador")

        if(gerenciadorListaV8){
          gerenciadorListaV8.innerHTML = this.$refs["gerenciador-lista"].innerHTML
        }

        if(iconeGerenciador){
          if(this.reqEmAndamento){
            gerenciadorV8.classList.add("aguardando")
            return
          }

          if(gerenciadorV8.classList.contains("aguardando")){
            gerenciadorV8.classList.remove("aguardando")
          }

          if(this.statusAtd == "em-atendimento"){
            gerenciadorV8.classList.add("em-atendimento")
            gerenciadorV8.classList.remove("parado")

            iconeGerenciador.classList.remove("i-play-4")
            iconeGerenciador.classList.add("i-pause-2")
          }else{
            gerenciadorV8.classList.add("parado")
            gerenciadorV8.classList.remove("em-atendimento")

            iconeGerenciador.classList.remove("i-pause-2")
            iconeGerenciador.classList.add("i-play-4")
          }
        }


        if(this.ativo){
          gerenciadorListaV8.classList.add("existe-ativo")
          const btnChamarCliente = parent.document.querySelector(".gerenciador-btn.icone-mais")
          if(btnChamarCliente){
            btnChamarCliente.classList.remove("d-none")
          }
        }

        this.$nextTick(() => {
          gerenciadorV8.classList.remove('d-none')
          if(gerenciador){
            gerenciador.classList.add('d-none')
          }
        })
      }
    }
  },
  watch: {
    gerenciador(){
      if(this.gerenciador){
        this.preencherDiv()

        if(this.gerenciador.length){
          this.gerenciador.map(i => {
            // Todos
            if(i.cod == 3){
              if(i.count != this.todos.length){
                this.$root.$emit("req-aguardando", "todos")
              }
            }
            // Pessoal
            if(i.cod == 4){
              if(i.count != this.aguardando.length){
                this.$root.$emit("req-aguardando", "pessoal")
              }
            }
          })
        }
      }
    }
  }
}
</script>
