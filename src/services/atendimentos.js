import store from "../store"
import axios from "axios"
import axios_api from "./serviceAxios"
import { axiosTokenJWT } from "./serviceAxios"
import { carregarIframe, ClearIFrames } from "./iframe"

const TEMPO_ATUALIZACAO = 2000
var status_gerenciador = 0 // 0 = Liberado; 1 = bloqueado
var status_encerrando = 0 // 0 = liberado; 1 = em pausa
var contador_request_erro = 0
var parar_request = false
var app

const dicionario = store.getters.getDicionario

export function getAtendimentos(appVue) {
  if (appVue) {
    app = appVue
  } else {
    console.error('E necessario informar a instancia do vue')
    return
  }
  bloqueiaRequest()
  liberaRequest()
  verificarAlertaErroRequest()
  axios({
    method: 'get',
    url: store.getters.getURL + 'get-atendimento?' + store.getters.getReqTeste
  })
    .then(response => {
      contador_request_erro = 0
      tratarResponse(response)
    })
    .then(() => {
      app.$root.$emit("req-aguardando", "pessoal", true)
      app.$root.$emit("req-aguardando", "todos", true)
    })
    .catch(err => {
      setTimeout(() => {
        contador_request_erro++
        console.error(err)
        if (!parar_request) {
          getAtendimentos(app)
        }
        adicionaCaso(400)
      }, 500)
    }
    )
}

function verificarAlertaErroRequest() {
  if (contador_request_erro > 0) {
    console.error('Erro de conexao ' + contador_request_erro)
  }

  if (contador_request_erro > 5) {
    if (window.confirm(dicionario.msg_sem_conexao)) {
      document.location.reload();
    } else {
      parar_request = true
    }
  }
}

function loopAtualizacaoDeAtendimentos(count = 0) {
  start()
  setTimeout(async () => {
    if (verificaRequest()) {
      bloqueiaRequest()
      if (store.getters.getOrigemBlocker !== "atd-parado") {
        await atualizarAtendimentos()
      }
    }
    end()
    loopAtualizacaoDeAtendimentos(count = count + 1)
  }, TEMPO_ATUALIZACAO);
}

function tratarResponse(response) {
  if (response.headers.authorization) {
    axiosTokenJWT(response.headers.authorization)
  } else {
    setTimeout(() => {
      console.error(dicionario.msg_erro_autorizacao)
      adicionaCaso(400)
      getAtendimentos(app)
    }, TEMPO_ATUALIZACAO)
    return
  }

  var status = response.status
  var mainData = response.data

  setCorDestaque(mainData)

  switch (status) {
    case 200:
      if (!mainData) { // tratando erro quando os dados nao chegaram da api
        setTimeout(() => {
          adicionaCaso(400)
          getAtendimentos(app)
        }, TEMPO_ATUALIZACAO)
        return
      } else {
        if (mainData.atendimentos) { // executando fluxo normal sem erros
          adicionaCaso(200)

          let regex = /\s|\]|\[/g
          for (let atd in mainData.atendimentos) {
            if (mainData.atendimentos[atd].login_usu.match(regex)) {
              mainData.atendimentos[atd].login_usu = mainData.atendimentos[atd].login_usu.replace(regex, '')
            }
            store.dispatch('setNomeOpe', mainData.atendimentos[atd].login_operador)
          }

          store.dispatch('setAtendimentos', mainData.atendimentos)

          acionaProcessos(mainData)
          loopAtualizacaoDeAtendimentos()
        } else { // tratando erro quando os atendimentos nao chegaram nos dados da api
          console.log('Erro ao tentar obter dados no servidor')
          console.log(mainData)
          adicionaCaso(400)
          setTimeout(() => {
            getAtendimentos(app)
          }, TEMPO_ATUALIZACAO)
          return
        }
      }
      break;

    case 206:
      setTimeout(() => { // Timeout aguardando cliente
        adicionaCaso(206)
        acionaProcessos(mainData)
        if (store.getters.getOrigemBlocker !== "atd-parado") {
          getAtendimentos(app)
        }
      }, TEMPO_ATUALIZACAO)
      break;

    default:
      if (mainData) {
        if (mainData.atendimentos) {
          store.dispatch('setAtendimentos', mainData.atendimentos)
        }
        acionaProcessos(mainData)
      }
      console.error('ERRO STATUS ' + response.status + ' ' + response.statusText)
      adicionaCaso(400)
      break
  }
}

let primeiraRequest = true

function acionaProcessos(mainData) {

  if (!mainData) {
    return
  }

  if (primeiraRequest) {
    // Pausa/Em atendimento
    if (mainData.status_operacao) {
      store.dispatch("setStatusAtd", "em-atendimento")
    } else {
      store.dispatch("setStatusAtd", "parado")
      if (!mainData.atendimentos) {
        store.dispatch("setBlocker", true)
        store.dispatch("setOrigemBlocker", "atd-parado")
      }
    }
  }

  // Carregando os iframes
  if (mainData.atendimentos) {
    carregarIframe(mainData.atendimentos)
  }

  // Ativar Cliente
  if (mainData.ativo) {
    store.dispatch("setAtivo", mainData.ativo)
  }

  // Gerenciador
  if (mainData.gerenciador) {
    store.dispatch("setGerenciador", mainData.gerenciador)
  }

  // Agenda
  if (mainData.agenda && mainData.agenda.length) {
    store.dispatch("setAgenda", mainData.agenda)
  }

  primeiraRequest = false
}

function verificaRequest() {
  if (status_gerenciador === 0) {
    return true
  } else {
    return false
  }
}

function bloqueiaRequest() {
  status_gerenciador = 1
}

function liberaRequest() {
  status_gerenciador = 0
}

export function executandoEncerrar() {
  status_encerrando = 1
}

export function liberarEncerrar() {
  status_encerrando = 0
  liberaRequest()
}

function verificaEncerramento() {
  if (status_encerrando === 0) {
    return true
  } else {
    return false
  }
}

function adicionaCaso(caso) {
  store.dispatch('setCaso', caso)
}

function acionaProcessosAtualizacao(mainData) {
  // Gerenciador
  if (mainData.gerenciador) {
    store.dispatch("setGerenciador", mainData.gerenciador)
  }

  // Agenda
  if (mainData.agenda) {
    store.dispatch("setAgenda", mainData.agenda)
  }
}

async function atualizarAtendimentos() {
  await axios_api({
    method: 'get',
    url: store.getters.getURL + 'get-atendimento?' + store.getters.getReqTeste
  })
    .then(response => {
      if (response.headers.authorization) {
        axiosTokenJWT(response.headers.authorization)
      }
      let mainData = response.data
      if (mainData.st_ret === 'OK' || mainData.atendimentos) {
        adicionaCaso(200)
        atualizarClientes(mainData)
        acionaProcessosAtualizacao(mainData)
      } else if (mainData.st_ret === 'AVISO') {
        adicionaCaso(206)
        acionaProcessosAtualizacao(mainData)
      } else {
        if (response.data) {
          for (let atd in response.data) {
            if (typeof response.data[atd] == 'object') {
              if (response.data[atd].arrMsg > 0) {
                response.data[atd].novoContato = true
                let novoAtd = new Object(),
                  chave = atd
                novoAtd[chave] = response.data[atd]
              }
            }
          }
        } else {
          setTimeout(() => {
            getAtendimentos(app)
          }, TEMPO_ATUALIZACAO)
          return
        }
      }

      liberaRequest()
    })
    .catch(
      err => {
        contador_request_erro++
        console.error(err)
        liberaRequest()
        getAtendimentos(app)
      }
    )
}

function setCorDestaque(mainData) {
  if (mainData.cor_destaque) {
    const corAtual = store.getters.getCorDestaque
    if (mainData.cor_destaque != corAtual) {
      store.dispatch("setCorDestaque", mainData.cor_destaque)
    }

  }
}

function atualizarClientes(mainData) {
  var atendimentosServer = mainData.atendimentos
  var atendimentosLocal = store.getters.getTodosAtendimentos
  var novosAtendimentos = {}
  var idsCli = []
  const regex = /\s|\]|\[/g
  const matchAtendimento = (local, server) => (Object.keys(server).every(ramal => local.hasOwnProperty(ramal) && local[ramal].id_cli === server[ramal].id_cli))

  const hasDiffInObjectsServer = !matchAtendimento(atendimentosLocal, atendimentosServer) //se os atendimentos forem diferentes existe diferença no atendimento
  const hasDiffInObjectsLocal = !matchAtendimento(atendimentosServer, atendimentosLocal) //se os atendimentos forem diferentes existe diferença no atendimento

  if(hasDiffInObjectsServer || hasDiffInObjectsLocal){
    for (var ramal_server in atendimentosServer) {
      // console.log(atendimentosServer[ramal_server])
      idsCli.push(atendimentosServer[ramal_server].login_usu.replace(regex, ''))
      novosAtendimentos[ramal_server] = atendimentosServer[ramal_server]
    }
  } else {
    for (var ramal_local in atendimentosLocal) {
      // console.log(atendimentosLocal[ramal_local]):
      idsCli.push(atendimentosLocal[ramal_local].login_usu.replace(regex, ''))
      novosAtendimentos[ramal_local] = atendimentosLocal[ramal_local]
    }
  }

  for (var ramal_server in atendimentosServer) {
    // var temClienteNovo = hasDiffInObjectsServer || hasDiffInObjectsLocal
    var temClienteNovo = true
    for (var ramal_local in atendimentosLocal) {
      if (atendimentosServer[ramal_server] && atendimentosLocal[ramal_local]) {
        if (atendimentosServer[ramal_server].id_cli === atendimentosLocal[ramal_local].id_cli) {
          temClienteNovo = false
        }
      }
    }

    if (temClienteNovo && verificaEncerramento()) {
      if (store.getters.getUltimoIdRemovido == atendimentosServer[ramal_server].id_cli) {
        store.dispatch('setUltimoIdRemovido', '')
        return
      }

      novosAtendimentos[ramal_server] = atendimentosServer[ramal_server]
      novosAtendimentos[ramal_server].novoContato = true

      store.dispatch('setAtendimentos', novosAtendimentos)
      temClienteNovo = false
    } else {
      atualizarMensagens(atendimentosServer[ramal_server], ramal_server, novosAtendimentos)
    }
  }
}

function atualizarMensagens(cliente, ramal, novosAtendimentos) {
  //cliente -> novo retorno do back
  //novosAtendimentos -> mem�ria local
  if (!novosAtendimentos[ramal]) {
    return
  }

  for (let chave in novosAtendimentos[ramal].arrMsg) {
    if (!novosAtendimentos[ramal].arrMsg[chave].msg) {
      return
    }
    if (!novosAtendimentos[ramal].arrMsg[chave].msg.length) {
      return
    }
    const seqs = novosAtendimentos[ramal].arrMsg[chave].msg.map(({ seq }) => (seq))

    if (cliente.arrMsg[chave]) {
      cliente.arrMsg[chave].msg.map(message => {
        if (!seqs.includes(message.seq)) {
          novosAtendimentos[ramal].arrMsg[chave].msg.push(message)

          if (store.getters.getIdAtendimentoAtivo !== novosAtendimentos[ramal].id_cli && message.resp_msg == 'CLI') {
            novosAtendimentos[ramal].alertaMsgNova = true
            if (!novosAtendimentos[ramal].qtdMsgNova) {
              novosAtendimentos[ramal].qtdMsgNova = 1;
            } else {
              novosAtendimentos[ramal].qtdMsgNova += 1;
            }
          } else if (message.resp_msg == "CLI") {
            // Adicionando posicao para sinalizar caso venha mensagem do cliente ativo e o ope esteja rolando a conversa
            if (store.getters.getIdAtendimentoAtivo == novosAtendimentos[ramal].id_cli) {
              novosAtendimentos[ramal].novaMsgCttAtivo = true
            }
            app.$root.$emit('atualizar-mensagem', message)
          } else if (message.resp_msg == "OPE") {
            if (store.getters.getMensagemViaTextarea) {
              return
            } else {
              app.$root.$emit('atualizar-mensagem', message)
            }
          }
          store.dispatch('setAtendimentos', novosAtendimentos)
        }
      })
    }
  }

}

var startTime, endTime;
function start() {
  startTime = new Date();
};
function end() {
  endTime = new Date();
  var timeDiff = endTime - startTime;

  var seconds = Math.round(timeDiff);
  return seconds
}
