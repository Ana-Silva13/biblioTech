const STORAGE_CLIENTES = 'biblioTech_clientes';
const STORAGE_EMPRESTIMOS = 'biblioTech_emprestimos';
const STORAGE_LIVRO = 'biblioTech_livroSelecionado';
const STORAGE_CRACHA = 'biblioTech_cracha';

const formCliente = document.getElementById('formCliente');
const inputNome = document.getElementById('nome');
const inputCpf = document.getElementById('cpf');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');
const selectPerfil = document.getElementById('perfil');
const listaClientes = document.getElementById('listaClientes');

const formLogin = document.getElementById('formLogin');
const inputUsername = document.getElementById('username');
const inputPassword = document.getElementById('password');
const usuarioLogadoBadge = document.getElementById('usuarioLogado');
const btnLogout = document.getElementById('btnLogout');

const btnBuscarLivro = document.getElementById('btnBuscarLivro');
const inputBuscaLivro = document.getElementById('termoBusca');
const statusBusca = document.getElementById('buscaStatus');
const resultados = document.getElementById('resultados');
const detalhesLivro = document.getElementById('detalhesLivro');
const historicoEmprestimos = document.getElementById('historicoEmprestimos');
const listaEmprestimos = document.getElementById('listaEmprestimos');

let clientes = JSON.parse(localStorage.getItem(STORAGE_CLIENTES) || '[]');
let emprestimos = JSON.parse(localStorage.getItem(STORAGE_EMPRESTIMOS) || '[]');
let livroSelecionado = JSON.parse(localStorage.getItem(STORAGE_LIVRO) || 'null');
let ultimosLivros = [];

function salvarClientes() {
    localStorage.setItem(STORAGE_CLIENTES, JSON.stringify(clientes));
}

function salvarEmprestimos() {
    localStorage.setItem(STORAGE_EMPRESTIMOS, JSON.stringify(emprestimos));
}

function salvarLivroSelecionado() {
    localStorage.setItem(STORAGE_LIVRO, JSON.stringify(livroSelecionado));
}

function salvarUsuarioLogado(usuario) {
    sessionStorage.setItem(STORAGE_CRACHA, JSON.stringify(usuario));
}

function obterUsuarioLogado() {
    return JSON.parse(sessionStorage.getItem(STORAGE_CRACHA) || 'null');
}

function sair() {
    sessionStorage.removeItem(STORAGE_CRACHA);
    window.location.href = 'Login.html';
}

function mostrarUsuarioLogado() {
    const usuario = obterUsuarioLogado();
    if (!usuario || !usuarioLogadoBadge) return;
    usuarioLogadoBadge.textContent = `Crachá: ${usuario.nome} (${usuario.perfil})`;
}

function verificarAcessoPagina() {
    const usuario = obterUsuarioLogado();
    const pagina = location.pathname.split('/').pop();

    if (pagina === 'Login.html') {
        if (usuario) {
            if (usuario.perfil === 'ADMIN') {
                window.location.href = 'ControleEmprestimo.html';
            } else {
                window.location.href = 'BuscaLivros.html';
            }
        }
        return;
    }

    if (pagina === 'index.html') {
        return;
    }

    if (!usuario) {
        window.location.href = 'Login.html';
        return;
    }

    if (pagina === 'BuscaLivros.html' && usuario.perfil !== 'LEITOR') {
        window.location.href = 'ControleEmprestimo.html';
        return;
    }

    if (pagina === 'ControleEmprestimo.html' && usuario.perfil !== 'ADMIN') {
        window.location.href = 'BuscaLivros.html';
        return;
    }
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
            info.textContent = `${cliente.nome} | CPF: ${cliente.cpf} | E-mail: ${cliente.email} | Perfil: ${cliente.perfil}`;

            const botaoExcluir = document.createElement('button');
            botaoExcluir.type = 'button';
            botaoExcluir.textContent = 'Excluir';
            botaoExcluir.addEventListener('click', () => removerCliente(index));

            li.appendChild(info);
            li.appendChild(botaoExcluir);
            listaClientes.appendChild(li);
        }

    });
}

function adicionarCliente(event) {
    event.preventDefault();

    if (!inputNome || !inputCpf || !inputEmail || !inputSenha || !selectPerfil) return;

    const nome = inputNome.value.trim();
    const cpf = inputCpf.value.trim();
    const email = inputEmail.value.trim();
    const senha = inputSenha.value.trim();
    const perfil = selectPerfil.value;

    if (!nome || !cpf || !email || !senha) {
        alert('Preencha todos os campos do usuário.');
        return;
    }

    const existente = clientes.some((cliente) => cliente.email.toLowerCase() === email.toLowerCase());
    if (existente) {
        alert('Já existe um usuário com esse e-mail.');
        return;
    }

    clientes.push({ nome, cpf, email, senha, perfil });
    salvarClientes();
    renderizarClientes();
    formCliente.reset();
    alert('Usuário cadastrado com sucesso.');
}

function removerCliente(index) {
    const cliente = clientes[index];
    if (!cliente || !confirm(`Remover o usuário ${cliente.nome}?`)) return;

    clientes.splice(index, 1);
    salvarClientes();
    renderizarClientes();
}

function logarUsuario(event) {
    event.preventDefault();

    if (!inputUsername || !inputPassword) return;

    const email = inputUsername.value.trim().toLowerCase();
    const senha = inputPassword.value.trim();

    if (!email || !senha) {
        alert('Preencha e-mail e senha.');
        return;
    }

    const usuario = clientes.find((cliente) => cliente.email.toLowerCase() === email && cliente.senha === senha);
    if (!usuario) {
        alert('E-mail ou senha inválidos.');
        return;
    }

    salvarUsuarioLogado({ nome: usuario.nome, email: usuario.email, perfil: usuario.perfil });
    if (usuario.perfil === 'ADMIN') {
        window.location.href = 'ControleEmprestimo.html';
    } else {
        window.location.href = 'BuscaLivros.html';
    }
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
        ultimosLivros = livros;
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

    livros.forEach((livro, index) => {
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

        const actions = document.createElement('div');
        actions.className = 'card-actions';

        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'select-book';
        botao.dataset.index = index;
        botao.textContent = 'Selecionar para Empréstimo';

        const botaoConfirmar = document.createElement('button');
        botaoConfirmar.type = 'button';
        botaoConfirmar.className = 'confirm-book';
        botaoConfirmar.dataset.index = index;
        botaoConfirmar.textContent = 'Confirmar Empréstimo';
        botaoConfirmar.style.display = 'none';

        actions.appendChild(botao);
        actions.appendChild(botaoConfirmar);

        card.appendChild(imagem);
        card.appendChild(titulo);
        card.appendChild(autorEl);
        card.appendChild(actions);
        resultados.appendChild(card);
    });
}

function handleResultadoClick(event) {
    const botaoSelecionar = event.target.closest('button.select-book');
    const botaoConfirmar = event.target.closest('button.confirm-book');
    if (botaoSelecionar) {
        const card = botaoSelecionar.closest('.card-livro');
        const index = Number(botaoSelecionar.dataset.index);
        if (Number.isNaN(index) || !ultimosLivros[index]) return;

        const livro = ultimosLivros[index];
        selecionarLivro({
            titulo: livro.title || 'Título desconhecido',
            autor: livro.author_name ? livro.author_name.join(', ') : 'Autor desconhecido',
            capa: criarCapa(livro.cover_i)
        }, card);
        return;
    }

    if (botaoConfirmar) {
        const card = botaoConfirmar.closest('.card-livro');
        if (card && card.classList.contains('selecionado')) {
            confirmarEmprestimo();
        } else {
            alert('Selecione um livro antes de confirmar.');
        }
    }
}

function selecionarLivro(livro, card = null) {
    livroSelecionado = livro;
    salvarLivroSelecionado();

    if (resultados) {
        resultados.querySelectorAll('.card-livro').forEach((item) => {
            item.classList.remove('selecionado');
            const existente = item.querySelector('.selected-label');
            if (existente) {
                existente.remove();
            }
            const confirm = item.querySelector('.confirm-book');
            if (confirm) {
                confirm.style.display = 'none';
            }
        });

        if (card) {
            card.classList.add('selecionado');
            const label = document.createElement('span');
            label.className = 'selected-label';
            label.textContent = 'Livro escolhido';
            card.appendChild(label);

            const confirm = card.querySelector('.confirm-book');
            if (confirm) {
                confirm.style.display = 'inline-block';
            }
        }
    }

    exibirLivroSelecionado();
    renderizarHistorico();
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

    const usuario = obterUsuarioLogado();
    if (usuario && usuario.perfil === 'LEITOR') {
        const botaoEmprestar = document.createElement('button');
        botaoEmprestar.type = 'button';
        botaoEmprestar.textContent = 'Confirmar Empréstimo';
        botaoEmprestar.addEventListener('click', confirmarEmprestimo);
        conteudo.appendChild(botaoEmprestar);
    }

    detalhesLivro.appendChild(imagem);
    detalhesLivro.appendChild(conteudo);
}

function renderizarHistorico() {
    const usuario = obterUsuarioLogado();
    if (!historicoEmprestimos) return;

    historicoEmprestimos.innerHTML = '';
    if (!usuario) {
        const li = document.createElement('li');
        li.textContent = 'Faça login para ver seu histórico de empréstimos.';
        historicoEmprestimos.appendChild(li);
        return;
    }

    const historico = emprestimos.filter((emprestimo) => emprestimo.clienteEmail === usuario.email);
    if (historico.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Você ainda não pegou nenhum livro emprestado.';
        historicoEmprestimos.appendChild(li);
        return;
    }

    historico.forEach((emprestimo) => {
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

        const devolucao = document.createElement('p');
        devolucao.textContent = `Devolução: ${formatarData(emprestimo.devolucao)}`;

        conteudo.appendChild(titulo);
        conteudo.appendChild(autor);
        conteudo.appendChild(devolucao);

        card.appendChild(imagem);
        card.appendChild(conteudo);

        historicoEmprestimos.appendChild(card);
    });
}

function confirmarEmprestimo() {
    const usuario = obterUsuarioLogado();
    if (!usuario) {
        alert('Faça login para confirmar o empréstimo.');
        window.location.href = 'Login.html';
        return;
    }

    if (!livroSelecionado) {
        alert('Nenhum livro selecionado.');
        return;
    }

    const dataDevolucao = new Date();
    dataDevolucao.setDate(dataDevolucao.getDate() + 7);

    emprestimos.unshift({
        clienteNome: usuario.nome,
        clienteCpf: usuario.cpf || '',
        clienteEmail: usuario.email,
        livroTitulo: livroSelecionado.titulo,
        livroAutor: livroSelecionado.autor,
        livroCapa: livroSelecionado.capa,
        devolucao: dataDevolucao.toISOString()
    });

    salvarEmprestimos();
    livroSelecionado = null;
    salvarLivroSelecionado();
    exibirLivroSelecionado();
    alert(`Empréstimo realizado! Devolução: ${formatarData(dataDevolucao.toISOString())}`);
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
    verificarAcessoPagina();
    mostrarUsuarioLogado();

    renderizarClientes();

    if (formCliente) {
        formCliente.addEventListener('submit', adicionarCliente);
    }

    if (formLogin) {
        formLogin.addEventListener('submit', logarUsuario);
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', sair);
    }

    if (btnBuscarLivro) {
        btnBuscarLivro.addEventListener('click', buscarLivros);
        if (resultados) {
            resultados.addEventListener('click', handleResultadoClick);
        }
        exibirLivroSelecionado();
        renderizarHistorico();
    }

    if (location.pathname.split('/').pop() === 'ControleEmprestimo.html') {
        renderizarEmprestimos();
    }

});