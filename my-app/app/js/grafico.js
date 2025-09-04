// ------------------- IMPORTS -------------------
import { auth, db } from '/my-bd/firebase-config.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

  const selectBot = document.getElementById("selectBotRelatorio");
  const totalMensagens = document.getElementById("totalMensagensRelatorio");
  const usuariosAtivos = document.getElementById("usuariosAtivosRelatorio");
  const statusRelatorio = document.getElementById("statusRelatorio");
  const canvas = document.getElementById("graficoMensagens");
  const ctx = canvas.getContext("2d");
  const btnToggleTheme = document.getElementById("btnToggleTheme");

  let listaDeBots = [];
  let grafico;

  // Toggle dark/clean mode
  btnToggleTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const icon = btnToggleTheme.querySelector("i");
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
  });

  function formatNumber(n){
    if(n>=1_000_000) return (n/1_000_000).toFixed(1).replace(/\.0$/,"")+"M";
    if(n>=1000) return (n/1000).toFixed(1).replace(/\.0$/,"")+"k";
    return n;
  }

  function atualizarSelect(){
    selectBot.innerHTML = '<option value="">Todos os Bots</option>';
    listaDeBots.forEach(bot=>{
      const opt = document.createElement("option");
      opt.value = bot.id;
      opt.textContent = bot.nome;
      selectBot.appendChild(opt);
    });
  }

  function atualizarCards(botSelecionado=null){
    let totalMsg = 0;
    let usuariosSet = new Set();
    let labels = [], data = [];

    if(botSelecionado){
      totalMsg = botSelecionado.mensagens;
      (botSelecionado.usuarios || []).forEach(u=>usuariosSet.add(u));
      labels = ['Mensagens', 'Usuários'];
      data = [totalMsg, usuariosSet.size];
      statusRelatorio.textContent = botSelecionado.status;
    } else {
      listaDeBots.forEach(bot=>{
        totalMsg += bot.mensagens;
        (bot.usuarios || []).forEach(u=>usuariosSet.add(u));
      });
      labels = listaDeBots.map(b=>b.nome);
      data = listaDeBots.map(b=>b.mensagens);
      statusRelatorio.textContent = "-";
    }

    totalMensagens.textContent = formatNumber(totalMsg);
    usuariosAtivos.textContent = usuariosSet.size;

    if(grafico) grafico.destroy();

    grafico = new Chart(ctx,{
      type:'bar',
      data:{
        labels,
        datasets:[{
          label:'Mensagens',
          data,
          backgroundColor:'rgba(52,152,219,0.7)',
          borderRadius:4,
          barPercentage:0.4
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{yAlign:'bottom',padding:10,titleFont:{size:14},bodyFont:{size:14}},
          title:{display:true,text:'Mensagens por Bot'}
        },
        scales:{
          x:{grid:{display:false}},
          y:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.1)'}}
        }
      }
    });
  }

  onAuthStateChanged(auth, user=>{
    if(!user) return;
    const uid = user.uid;
    const qBots = query(collection(db,"bots"), where("uid","==",uid));

    onSnapshot(qBots, snapshot=>{
      listaDeBots=[];
      snapshot.forEach(doc=>{
        const bot = doc.data();
        listaDeBots.push({
          id:doc.id,
          nome:bot.nome,
          mensagens:bot.mensagens||0,
          status:bot.status||"Inativo",
          usuarios:Array.isArray(bot.usuarios)?bot.usuarios:[]
        });
      });

      atualizarSelect();
      atualizarCards();
    });
  });

  selectBot.addEventListener("change",()=>{
    const id = selectBot.value;
    const botSel = listaDeBots.find(b=>b.id===id);
    atualizarCards(botSel||null);
  });

});
