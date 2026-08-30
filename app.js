/* ==================================================
   Octopédia — app.js
   Sistema de navegação da enciclopédia
   ================================================== */


function abrirSecao(id) {

    const secoes = document.querySelectorAll(".secao");


    secoes.forEach((secao) => {

        secao.classList.add("escondido");

    });



    const destino = document.getElementById(id);


    if (destino) {

        destino.classList.remove("escondido");

    }

}




document.addEventListener("DOMContentLoaded", () => {


    const primeira = document.querySelector(".secao");


    if (primeira) {

        primeira.classList.remove("escondido");

    }


});


console.log("Octopédia carregada ");