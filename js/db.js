import { openDB } from "idb";

let db;

async function createDB() {
  try {
    db = await openDB("banco", 1, {
      upgrade(db, oldVersion, newVersion, transaction) {
        switch (oldVersion) {
          case 0:
          case 1:
            const store = db.createObjectStore("anotacao", {
              keyPath: "titulo",
            });
            store.createIndex("categoria", "categoria");
            showResult("Banco de dados criado!");
        }
      },
    });
    showResult("Banco de dados aberto.");
  } catch (e) {
    showResult("Erro ao criar o banco de dados: " + e.message);
  }
}

window.addEventListener("DOMContentLoaded", async (event) => {
  createDB();
  document.getElementById("btnCadastro").addEventListener("click", adicionarAnotacao);
  document.getElementById("btnCarregar").addEventListener("click", buscarTodasAnotacoes);
  document.getElementById("btnBuscar").addEventListener("click", buscarAnotacaoPorTitulo);
});

async function buscarTodasAnotacoes() {
  if (db === undefined) {
    showResult("O banco de dados está fechado.");
    return;
  }

  const tx = await db.transaction("anotacao", "readonly");
  const store = tx.objectStore("anotacao");
  const value = await store.getAll();
  const listagemDiv = document.querySelector('.listagem'); 

  listagemDiv.innerHTML = '';

  if (value.length > 0) {
    value.forEach(item => {
      const card = document.createElement('div');
      card.classList.add('card'); 

      const tituloElement = document.createElement('p');
      const descricaoElement = document.createElement('p');
      const categoriaElement = document.createElement('p');

      tituloElement.textContent = `Título: ${item.titulo}`;
      descricaoElement.textContent = `Descrição: ${item.descricao}`;
      categoriaElement.textContent = `Categoria: ${item.categoria}`

      const removerButton = document.createElement('button');
      removerButton.textContent = 'Remover';
      removerButton.addEventListener('click', () => excluirAnotacao(item.titulo));
      
      card.appendChild(tituloElement);
      card.appendChild(descricaoElement);
      card.appendChild(categoriaElement);
      card.appendChild(removerButton);
      listagemDiv.appendChild(card);
    });
  } else {
    showResult("Não há nenhuma anotação no banco!");
  }
}

async function adicionarAnotacao() {
  const titulo = document.getElementById("titulo").value;
  const categoria = document.getElementById("categoria").value;
  const descricao = document.getElementById("descricao").value;
  const data = document.getElementById("data").value;

  if (db === undefined) {
    showResult("O banco de dados está fechado.");
    return;
  }

  if (!titulo || !categoria || !descricao || !data) {
    showResult("Preencha todos os campos.");
    return;
  }

  const tx = await db.transaction("anotacao", "readwrite");
  const store = tx.objectStore("anotacao");
  
  try {
    await store.add({ titulo, categoria, descricao, data });
    await tx.done;
    limparCampos();
    buscarTodasAnotacoes(); 
    showResult("Anotação adicionada com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar anotação:", error);
    tx.abort();
  }
}

async function excluirAnotacao(titulo) {
  if (db === undefined) {
    showResult("O banco de dados está fechado.");
    return;
  }

  const tx = await db.transaction("anotacao", "readwrite");
  const store = tx.objectStore("anotacao");

  try {
    await store.delete(titulo);
    await tx.done;
    showResult("Anotação excluída com sucesso!");
    buscarTodasAnotacoes(); 
  } catch (error) {
    console.error("Erro ao excluir anotação:", error);
    tx.abort();
  }
}

async function buscarAnotacaoPorTitulo() {
  if (db === undefined) {
    showResult("O banco de dados está fechado.");
    return;
  }

  const buscaTitulo = document.getElementById("buscaTitulo").value;

  if (!buscaTitulo) {
    showResult("Insira um título para buscar.");
    return;
  }

  const tx = await db.transaction("anotacao", "readonly");
  const store = tx.objectStore("anotacao");

  try {
    const anotacao = await store.get(buscaTitulo);

    if (anotacao) {
      const listagemDiv = document.querySelector('.listagem');
      listagemDiv.innerHTML = '';

      const card = document.createElement('div');
      card.classList.add('card');

      const tituloElement = document.createElement('p');
      const descricaoElement = document.createElement('p');
      const categoriaElement = document.createElement('p');

      tituloElement.textContent = `Título: ${anotacao.titulo}`;
      descricaoElement.textContent = `Descrição: ${anotacao.descricao}`;
      categoriaElement.textContent = `Categoria: ${anotacao.categoria}`

      const removerButton = document.createElement('button');
      removerButton.textContent = 'Remover';
      removerButton.addEventListener('click', () => excluirAnotacao(anotacao.titulo));

      card.appendChild(tituloElement);
      card.appendChild(descricaoElement);
      card.appendChild(categoriaElement);
      card.appendChild(removerButton);
      listagemDiv.appendChild(card);

      showResult("Anotação encontrada.");
    } else {
      showResult("Nenhuma anotação encontrada com esse título.");
    }
  } catch (error) {
    console.error("Erro ao buscar anotação por título:", error);
  }
}

function limparCampos() {
  document.getElementById("titulo").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("data").value = "";
}

function showResult(text) {
  document.querySelector("output").innerHTML = text;
}
