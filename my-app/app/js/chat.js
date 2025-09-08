// ------------------- IMPORTS -------------------
import { db } from '/my-bd/firebase-config.js';
import { collection, query, where, getDocs, updateDoc, increment, doc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ------------------- SELETORES -------------------
const chatContainer = document.querySelector(".chat-container");
const chatBox = document.getElementById("chatBox");
const chatHeader = document.getElementById("chatHeader");

// ------------------- NOMES ALEATÓRIOS -------------------
const primeirosNomes = ["Mario","Lucas","Ana","Bruno","Julia","Lara","Gabriel","Beatriz","Rafael","Camila"];
function nomeAleatorio(){return `${primeirosNomes[Math.floor(Math.random()*primeirosNomes.length)]} Guia Virtual`;}

// ------------------- UTILITÁRIOS -------------------
function obterUIDDaURL(){return new URLSearchParams(window.location.search).get("uid");}
function obterSaudacao(){const h=new Date().getHours(); return h<12?"Bom dia! 👋":h<18?"Boa tarde! 🌞":"Boa noite! 🌙";}

// ------------------- VISITANTE -------------------
const userId = sessionStorage.getItem("visitanteId") || ("visitante_" + Math.floor(Math.random()*1000000));
sessionStorage.setItem("visitanteId", userId);

// ------------------- TRANSFORMAR LINKS -------------------
function transformarLinks(texto){
    if(!texto) return "";
    return texto.replace(/(https?:\/\/[^\s]+)/g,url=>`<a href="${url}" target="_blank">[Saiba mais]</a>`).replace(/\n/g,"<br>");
}

// ------------------- MENSAGENS -------------------
function adicionarMensagem(mensagem,tipo="usuario"){
    const p=document.createElement("p");
    p.classList.add(tipo);
    p.innerHTML=transformarLinks(mensagem);
    chatBox.appendChild(p);
    p.scrollIntoView({behavior:"smooth",block:"start"});
}

// ------------------- ENVIAR MENSAGEM -------------------
async function enviarMensagemUsuario(botId,mensagem){
    adicionarMensagem(mensagem,"user");
    const usuariosKey = `bot_${botId}_usuarios`;
    if(!sessionStorage.getItem(usuariosKey)){
        await updateDoc(doc(db,"bots",botId),{
            usuarios: arrayUnion(userId),
            usuariosMensagens: increment(1)
        });
        sessionStorage.setItem(usuariosKey,"1");
    }
}

// ------------------- MENSAGEM BOT -------------------
async function adicionarMensagemBot(botId,mensagem,tempo=1500,contar=true){
    const p=document.createElement("p");
    p.classList.add("bot");
    p.textContent="Digitando...";
    chatBox.appendChild(p);
    p.scrollIntoView({behavior:"smooth",block:"start"});

    return new Promise(resolve=>{
        setTimeout(async()=>{
            p.remove();
            if(contar) await updateDoc(doc(db,"bots",botId),{mensagens:increment(1)});
            adicionarMensagem(mensagem,"bot");
            resolve();
        },tempo);
    });
}

// ------------------- INICIAR CHAT -------------------
async function iniciarChatPublico(){
    const uid = obterUIDDaURL();
    if(!uid){
        chatBox.innerHTML="<p class='bot'>Link inválido ou UID não encontrado.</p>";
        return;
    }
    chatContainer.style.display="flex";

    // Pega bots ativos apenas uma vez
    const snapshot = await getDocs(query(collection(db,"bots"),where("uid","==",uid)));
    const botsAtivos = snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(b=>b.status==="Ativo");

    if(botsAtivos.length===0){
        chatBox.innerHTML="<p class='bot'>Nenhum bot ativo disponível.</p>";
        return;
    }

    // Criar select apenas uma vez
    const selectContainer=document.createElement("div");
    selectContainer.classList.add("select-container");
    const titulo=document.createElement("p");
    titulo.textContent="Selecione uma função do bot:";
    titulo.classList.add("bot");
    selectContainer.appendChild(titulo);
    const selectChat=document.createElement("select");
    selectChat.classList.add("select-chat");
    selectContainer.appendChild(selectChat);
    chatHeader.appendChild(selectContainer);

    const placeholder=document.createElement("option");
    placeholder.textContent="Selecione...";
    placeholder.value="";
    placeholder.disabled=true;
    placeholder.selected=true;
    selectChat.appendChild(placeholder);

    botsAtivos.forEach(bot=>{
        const opt=document.createElement("option");
        opt.value=bot.id;
        opt.textContent=bot.funcao||"Função não definida";
        selectChat.appendChild(opt);
    });

    selectChat.onchange=async()=>{
        const botId=selectChat.value;
        if(!botId) return;
        const botData=botsAtivos.find(b=>b.id===botId);
        if(!botData) return;

        await enviarMensagemUsuario(botId,botData.funcao||"Bot");
        await adicionarMensagemBot(botId,botData.descricao||"Sem resposta configurada.",1000);
        selectChat.value="";
    };

    // Boas-vindas do primeiro bot
    const firstBot=botsAtivos[0];
    const nomeAssistente=nomeAleatorio();
    await adicionarMensagemBot(firstBot.id,obterSaudacao(),1500,false);
    await adicionarMensagemBot(firstBot.id,`Eu sou o ${nomeAssistente}.`,1500,false);
    await adicionarMensagemBot(firstBot.id,"Escolha uma opção acima para começar.",1500,false);
}

iniciarChatPublico();
