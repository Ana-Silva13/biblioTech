const STORAGE_CLIENTES = 'biblioTech_clientes';
const STORAGE_EMPRESTIMOS = 'biblioTech_emprestimos';
const STORAGE_LIVRO = 'biblioTech_livroSelecionado';

const formCliente = document.getElementById('formCliente');
const inputNome = document.getElementById('nome');
const inputCpf = document.getElementById('cpf');
const inputEmail = document.getElementById('email');
const listaClientes = document.getElementById('listaClientes');
const selectCliente = document.getElementById('selectCliente');

const btnBuscarLivro = document.getElementById('btnBuscarLivro');
const inputBuscaLivro = document.getElementById('termoBusca');
const statusBusca = document.getElementById('buscaStatus');
const resultados = document.getElementById('resultados');
const detalhesLivro = document.getElementById('detalhesLivro');

const btnFinalizar = document.getElementById('btnFinalizar');
const listaEmprestimos = document.getElementById('listaEmprestimos');

let clientes = JSON.parse(localStorage.getItem(STORAGE_CLIENTES) || '[]');
let emprestimos = JSON.parse(localStorage.getItem(STORAGE_EMPRESTIMOS) || '[]');
let livroSelecionado = JSON.parse(localStorage.getItem(STORAGE_LIVRO) || 'null');

function salvarClientes() {
    localStorage.setItem(STORAGE_CLIENTES, JSON.stringify(clientes));
}

function salvarEmprestimos() {
    localStorage.setItem(STORAGE_EMPRESTIMOS, JSON.stringify(emprestimos));
}

function salvarLivroSelecionado() {
    localStorage.setItem(STORAGE_LIVRO, JSON.stringify(livroSelecionado));
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function criarCapa(coverId) {
    return coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
        : 'https://via.placeholder.com/180x260?text=Sem+Capa';
}

function atualizarStatus(texto, erro = false) {
    if (!statusBusca) return;
    statusBusca.textContent = texto;
    statusBusca.style.color = erro ? '#b91c1c' : '#0b5394';
}

function renderizarClientes() {
    if (listaClientes) {
        listaClientes.innerHTML = '';
    }
    if (selectCliente) {
        selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';
    }

    if (clientes.length === 0) {
        if (listaClientes) {
            const li = document.createElement('li');
            li.textContent = 'Nenhum cliente cadastrado ainda.';
            listaClientes.appendChild(li);
        }
        return;
    }

    clientes.forEach((cliente, index) => {
        if (listaClientes) {
            const li = document.createElement('li');
            const info = document.createElement('span');
            info.textContent = `${cliente.nome} | CPF: ${cliente.cpf} | E-mail: ${cliente.email}`;

            const botaoExcluir = document.createElement('button');
            botaoExcluir.type = 'button';
            botaoExcluir.textContent = 'Excluir';
            botaoExcluir.addEventListener('click', () => removerCliente(index));

            li.appendChild(info);
            li.appendChild(botaoExcluir);
            listaClientes.appendChild(li);
        }

        if (selectCliente) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = cliente.nome;
            selectCliente.appendChild(option);
        }
    });
}

function adicionarCliente(event) {
    event.preventDefault();

    if (!inputNome || !inputCpf || !inputEmail) return;

    const nome = inputNome.value.trim();
    const cpf = inputCpf.value.trim();
    const email = inputEmail.value.trim();

    if (!nome || !cpf || !email) {
        alert('Preencha todos os campos do cliente.');
        return;
    }

    clientes.push({ nome, cpf, email });
    salvarClientes();
    renderizarClientes();
    formCliente.reset();
    alert('Cliente cadastrado com sucesso.');
}

function removerCliente(index) {
    const cliente = clientes[index];
    if (!cliente || !confirm(`Remover o cliente ${cliente.nome}?`)) return;

    clientes.splice(index, 1);
    salvarClientes();
    renderizarClientes();
}

async function buscarLivros() {
    if (!inputBuscaLivro || !resultados) return;

    const termo = inputBuscaLivro.value.trim();
    if (!termo) {
        atualizarStatus('Digite o nome de um livro para buscar.', true);
        resultados.innerHTML = '';
        return;
    }

    atualizarStatus('Buscando livros...');
    resultados.innerHTML = '';

    try {
        const resposta = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(termo)}`);
        if (!resposta.ok) throw new Error('Falha na requisição');

        const dados = await resposta.json();
        const livros = (dados.docs || []).slice(0, 10);

        if (livros.length === 0) {
            atualizarStatus('Nenhum livro encontrado para esse termo.', true);
            return;
        }

        atualizarStatus(`Encontrados ${livros.length} livros. Selecione um para empréstimo.`);
        renderizarResultados(livros);
    } catch (erro) {
        console.error(erro);
        atualizarStatus('Erro ao buscar livros. Verifique sua conexão.', true);
        resultados.innerHTML = '';
    }
}

function renderizarResultados(livros) {
    if (!resultados) return;
    resultados.innerHTML = '';

    livros.forEach((livro) => {
        const capa = criarCapa(livro.cover_i);
        const autor = livro.author_name ? livro.author_name.join(', ') : 'Autor desconhecido';

        const card = document.createElement('article');
        card.className = 'card-livro';

        const imagem = document.createElement('img');
        imagem.src = capa;
        imagem.alt = livro.title || 'Capa do livro';

        const titulo = document.createElement('h3');
        titulo.textContent = livro.title || 'Título não disponível';

        const autorEl = document.createElement('p');
        autorEl.textContent = autor;

        const botao = document.createElement('button');
        botao.type = 'button';
        botao.textContent = 'Selecionar para Empréstimo';
        botao.addEventListener('click', () => selecionarLivro({
            titulo: livro.title || 'Título desconhecido',
            autor,
            capa
        }));

        card.appendChild(imagem);
        card.appendChild(titulo);
        card.appendChild(autorEl);
        card.appendChild(botao);
        resultados.appendChild(card);
    });
}

function selecionarLivro(livro) {
    livroSelecionado = livro;
    salvarLivroSelecionado();

    alert('Livro selecionado com sucesso.');
    window.location.href = 'ControleEmprestimo.html';
}

function exibirLivroSelecionado() {
    if (!detalhesLivro) return;

    detalhesLivro.innerHTML = '';

    if (!livroSelecionado) {
        detalhesLivro.innerHTML = '<p>Nenhum livro selecionado.</p>';
        return;
    }

    const imagem = document.createElement('img');
    imagem.src = livroSelecionado.capa;
    imagem.alt = livroSelecionado.titulo;

    const conteudo = document.createElement('div');
    const titulo = document.createElement('h3');
    titulo.textContent = livroSelecionado.titulo;

    const autor = document.createElement('p');
    autor.textContent = `Autor: ${livroSelecionado.autor}`;

    conteudo.appendChild(titulo);
    conteudo.appendChild(autor);
    detalhesLivro.appendChild(imagem);
    detalhesLivro.appendChild(conteudo);
}

function finalizarEmprestimo() {
    if (!selectCliente) {
        alert('Erro ao localizar a lista de clientes.');
        return;
    }

    const clienteIndex = selectCliente.value;
    if (clienteIndex === '') {
        alert('Selecione um cliente.');
        return;
    }

    if (!livroSelecionado) {
        alert('Nenhum livro foi selecionado.');
        return;
    }

    const cliente = clientes[Number(clienteIndex)];
    if (!cliente) {
        alert('Cliente inválido.');
        return;
    }

    const dataDevolucao = new Date();
    dataDevolucao.setDate(dataDevolucao.getDate() + 7);

    emprestimos.unshift({
        clienteNome: cliente.nome,
        clienteCpf: cliente.cpf,
        clienteEmail: cliente.email,
        livroTitulo: livroSelecionado.titulo,
        livroAutor: livroSelecionado.autor,
        livroCapa: livroSelecionado.capa,
        devolucao: dataDevolucao.toISOString()
    });

    salvarEmprestimos();
    livroSelecionado = null;
    salvarLivroSelecionado();
    renderizarEmprestimos();
    alert(`Empréstimo realizado!\nDevolução: ${formatarData(dataDevolucao.toISOString())}`);
}

function renderizarEmprestimos() {
    if (!listaEmprestimos) return;
    listaEmprestimos.innerHTML = '';

    if (emprestimos.length === 0) {
        const vazio = document.createElement('p');
        vazio.textContent = 'Nenhum empréstimo ativo no momento.';
        listaEmprestimos.appendChild(vazio);
        return;
    }

    emprestimos.forEach((emprestimo, index) => {
        const card = document.createElement('div');
        card.className = 'card-emprestimo';

        const imagem = document.createElement('img');
        imagem.src = emprestimo.livroCapa;
        imagem.alt = emprestimo.livroTitulo;

        const conteudo = document.createElement('div');
        const titulo = document.createElement('h3');
        titulo.textContent = emprestimo.livroTitulo;

        const autor = document.createElement('p');
        autor.textContent = `Autor: ${emprestimo.livroAutor}`;

        const cliente = document.createElement('p');
        cliente.textContent = `Cliente: ${emprestimo.clienteNome}`;

        const devolucao = document.createElement('p');
        devolucao.textContent = `Devolução: ${formatarData(emprestimo.devolucao)}`;

        const botao = document.createElement('button');
        botao.type = 'button';
        botao.textContent = 'Concluir';
        botao.addEventListener('click', () => {
            if (confirm(`Concluir empréstimo de ${emprestimo.livroTitulo}?`)) {
                emprestimos.splice(index, 1);
                salvarEmprestimos();
                renderizarEmprestimos();
            }
        });

        conteudo.appendChild(titulo);
        conteudo.appendChild(autor);
        conteudo.appendChild(cliente);
        conteudo.appendChild(devolucao);
        conteudo.appendChild(botao);

        card.appendChild(imagem);
        card.appendChild(conteudo);
        listaEmprestimos.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {

    renderizarClientes();

    if (formCliente) {
        formCliente.addEventListener('submit', adicionarCliente);
    }

    if (btnBuscarLivro) {
        btnBuscarLivro.addEventListener('click', buscarLivros);
        exibirLivroSelecionado();
    }

    if (btnFinalizar) {
        renderizarEmprestimos();
        exibirLivroSelecionado();
        btnFinalizar.addEventListener('click', finalizarEmprestimo);
    }

});

