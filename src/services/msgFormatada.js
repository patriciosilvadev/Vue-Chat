import store from "../store"
import axios_api from "./serviceAxios"

export function obterMsgFormatada(tipo, tokenCliente) {
    return axios_api({
            method: 'get',
            url: `${store.getters.getURL}get-messages/${tipo}?token_cliente=${tokenCliente}`
        })
        .then(response => {
            if(response.data.st_ret === 'OK') {
                store.dispatch('setTipoMsg', response.data.tipo)
                return response.data.nivel
            }
        })
        .catch(err => console.log(err))
}