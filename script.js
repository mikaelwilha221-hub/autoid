function getStorage(key, fallback) {
  return JSON.parse(localStorage.getItem(key)) || fallback;
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsuarioPortal() {
  return JSON.parse(localStorage.getItem("usuarioPortal") || "null");
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function escapeHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function formatCurrency(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function parseMoney(value) {
  return parseFloat(String(value || "0").replace(/\./g, "").replace(",", ".")) || 0;
}

function setFieldValue(id, value) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el && !el.value) el.value = value;
}

function formatCep(value) {
  const digits = normalizeDigits(value);
  if (digits.length !== 8) return value;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhoneFromApi(value) {
  const digits = normalizeDigits(value);
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return value;
}

function getMapEmbedUrl(endereco) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(endereco)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

function hasApi() {
  return typeof api !== "undefined";
}

async function withApi(fn, fallback) {
  if (!hasApi()) return fallback();
  try {
    return await fn();
  } catch (error) {
    return fallback(error);
  }
}

function getLocalClientes() {
  return getStorage("clientes", []);
}

function setLocalClientes(clientes) {
  setStorage("clientes", clientes);
}

function getLocalEmpresas() {
  return getStorage("empresasCatalogo", [
    { name: "Alpha Solutions", segment: "Tecnologia e suporte", featuredService: "Implantacao de sistemas", rating: 4.8, city: "Sao Paulo", address: "Avenida Paulista, 1000, Bela Vista, Sao Paulo, SP, 01310-100", description: "Operacao focada em implantacao, suporte e servicos recorrentes." },
    { name: "Studio Prime", segment: "Marketing e design", featuredService: "Branding e criacao visual", rating: 4.9, city: "Curitiba", address: "Rua Mateus Leme, 850, Centro Civico, Curitiba, PR, 80530-010", description: "Consultoria criativa, branding e servicos visuais para negocios." },
    { name: "Central Service", segment: "Manutencao e operacoes", featuredService: "Atendimento tecnico e contratos", rating: 4.7, city: "Goiania", address: "Avenida T-63, 1200, Setor Bueno, Goiania, GO, 74230-100", description: "Equipe especializada em operacoes, manutencao e suporte continuado." }
  ]);
}

function getLocalServicos() {
  return getStorage("catalogoServicos", [
    { name: "Consultoria inicial", category: "Consultoria", average_deadline: "2 dias", base_price: 450, description: "Diagnostico inicial para mapear necessidade e proposta de execucao." },
    { name: "Implantacao operacional", category: "Implantacao", average_deadline: "5 dias", base_price: 1800, description: "Servico de implantacao e configuracao de rotina operacional." }
  ]);
}

function setLocalServicos(servicos) {
  setStorage("catalogoServicos", servicos);
}

function getLocalProdutos() {
  return getStorage("catalogoProdutos", [
    { name: "Pacote premium", category: "Assinatura", stock: 25, price: 299, description: "Plano recorrente com suporte e acesso ampliado." },
    { name: "Kit operacional", category: "Equipamento", stock: 14, price: 890, description: "Conjunto de itens para operacao e atendimento." }
  ]);
}

function setLocalProdutos(produtos) {
  setStorage("catalogoProdutos", produtos);
}

function getLocalOrcamentos() {
  return getStorage("orcamentos", [
    { customer_name: "Alpha Trade", quote_type: "Servico", status: "Aprovado", main_item: "Implantacao operacional", amount: 1800, notes: "Inicio previsto para a proxima semana" },
    { customer_name: "Maria Souza", quote_type: "Misto", status: "Em execucao", main_item: "Consultoria e kit operacional", amount: 1340, notes: "Projeto em andamento" }
  ]);
}

function setLocalOrcamentos(orcamentos) {
  setStorage("orcamentos", orcamentos);
}

async function buscarDadosCnpj(config) {
  const erro = document.getElementById(config.errorId);
  const cnpjInput = document.getElementById(config.documentoId);
  if (!cnpjInput) return;

  const cnpj = normalizeDigits(cnpjInput.value);
  if (erro) erro.textContent = "";
  if (cnpj.length !== 14) {
    if (erro) erro.textContent = "Informe um CNPJ valido com 14 digitos.";
    return;
  }

  const button = config.buttonId ? document.getElementById(config.buttonId) : null;
  const originalLabel = button?.textContent;

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Buscando...";
    }

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!response.ok) throw new Error("Falha ao consultar o CNPJ.");

    const data = await response.json();
    setFieldValue(config.nomeId, data.razao_social || data.nome_fantasia || "");
    setFieldValue(config.segmentoId, data.cnae_fiscal_descricao || "");
    setFieldValue(config.emailId, data.email || "");
    setFieldValue(config.telefoneId, formatPhoneFromApi(data.ddd_telefone_1 || data.ddd_telefone_2 || ""));
    setFieldValue(config.cidadeId, data.municipio || "");
    setFieldValue(config.estadoId, data.uf || "");
    setFieldValue(config.cepId, formatCep(data.cep || ""));
    setFieldValue(config.logradouroId, data.logradouro || "");
    setFieldValue(config.numeroId, data.numero || "S/N");
    setFieldValue(config.bairroId, data.bairro || "");
    setFieldValue(config.complementoId, data.complemento || "");

    const descricao = [
      data.nome_fantasia ? `Nome fantasia: ${data.nome_fantasia}` : "",
      data.cnae_fiscal_descricao ? `Atividade principal: ${data.cnae_fiscal_descricao}` : "",
      data.descricao_situacao_cadastral ? `Situacao cadastral: ${data.descricao_situacao_cadastral}` : ""
    ].filter(Boolean).join(" | ");
    setFieldValue(config.descricaoId, descricao);

    if (erro) erro.textContent = "Dados encontrados e preenchidos automaticamente.";
  } catch (error) {
    if (erro) erro.textContent = "Nao foi possivel buscar o CNPJ agora. Voce pode preencher manualmente.";
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel || "Buscar dados";
    }
  }
}

async function atualizarResumoDashboard() {
  const usuario = getUsuarioPortal();
  const dashTipoPessoa = document.getElementById("dashTipoPessoa");
  const dashPerfilUso = document.getElementById("dashPerfilUso");
  const dashEmpresas = document.getElementById("dashEmpresas");
  const dashStatus = document.getElementById("dashStatus");

  const empresas = await withApi(() => api.getCompanies(), () => getLocalEmpresas());

  if (dashTipoPessoa) dashTipoPessoa.textContent = usuario?.tipoPessoa?.toUpperCase() || "PF/PJ";
  if (dashPerfilUso) dashPerfilUso.textContent = usuario?.perfilUso || "usuario";
  if (dashEmpresas) dashEmpresas.textContent = empresas.length;
  if (dashStatus) dashStatus.textContent = hasApi() ? "Conectado" : "Modo local";
}

async function buscarCliente() {
  const inputEl = document.getElementById("busca");
  const resultado = document.getElementById("resultado");
  if (!inputEl || !resultado) return;

  const input = inputEl.value.trim().toLowerCase();
  if (!input) {
    resultado.innerHTML = '<div class="empty-state">Digite alguma informacao para iniciar a busca.</div>';
    return;
  }

  const empresas = await withApi(() => api.getCompanies(), () => getLocalEmpresas());
  const empresaEncontrada = empresas.find((empresa) =>
    (empresa.name || "").toLowerCase().includes(input) ||
    (empresa.segment || "").toLowerCase().includes(input) ||
    (empresa.featuredService || "").toLowerCase().includes(input)
  );

  if (empresaEncontrada && document.getElementById("dashPerfilUso")) {
    resultado.innerHTML = `
      <div class="list-card">
        <div class="list-card-header">
          <strong>${escapeHtml(empresaEncontrada.name)}</strong>
          <span class="status success">Avaliacao ${escapeHtml(empresaEncontrada.rating)}</span>
        </div>
        <div class="list-meta">
          <span>Segmento: ${escapeHtml(empresaEncontrada.segment)}</span>
          <span>Cidade: ${escapeHtml(empresaEncontrada.city || "Nao informada")}</span>
        </div>
        <p class="muted">Servico destaque: ${escapeHtml(empresaEncontrada.featuredService || "Nao informado")}</p>
        <p class="muted">Endereco: ${escapeHtml(empresaEncontrada.address || "Nao informado")}</p>
        <p class="muted">${escapeHtml(empresaEncontrada.description || "Empresa encontrada no catalogo da plataforma.")}</p>
      </div>
    `;
    return;
  }

  const clientes = await withApi(() => api.getCustomers(), () => getLocalClientes());
  const encontrado = clientes.find((cliente) =>
    (cliente.name || cliente.nome || "").toLowerCase().includes(input) ||
    (cliente.document || cliente.cpf || "").toLowerCase().includes(input) ||
    (cliente.identifier || cliente.placa || "").toLowerCase().includes(input)
  );

  if (!encontrado) {
    resultado.innerHTML = '<div class="empty-state">Nenhum resultado encontrado com os dados informados.</div>';
    return;
  }

  resultado.innerHTML = `
    <div class="list-card">
      <div class="list-card-header">
        <strong>${escapeHtml(encontrado.name || encontrado.nome)}</strong>
        <span class="status info">Cadastro localizado</span>
      </div>
      <div class="list-meta">
        <span>Documento: ${escapeHtml(encontrado.document || encontrado.cpf)}</span>
        <span>Identificador: ${escapeHtml(encontrado.identifier || encontrado.placa)}</span>
        <span>Item relacionado: ${escapeHtml(encontrado.related_item || encontrado.veiculo)}</span>
      </div>
      <p class="muted">Servico principal: ${escapeHtml(encontrado.primary_demand || encontrado.servico || "Nao informado")}</p>
      <p class="muted">Garantia: ${escapeHtml(encontrado.warranty_info || encontrado.garantia || "Nao informada")}</p>
    </div>
  `;
}

async function carregarEmpresas() {
  const lista = document.getElementById("listaEmpresas");
  const buscaEmpresa = document.getElementById("buscaEmpresa");
  const filtroSegmento = document.getElementById("filtroSegmento");
  if (!lista) return;

  const empresas = await withApi(() => api.getCompanies(), () => getLocalEmpresas());
  const segmentos = [...new Set(empresas.map((empresa) => empresa.segment))];

  if (filtroSegmento && filtroSegmento.options.length <= 1) {
    segmentos.forEach((segmento) => {
      filtroSegmento.innerHTML += `<option value="${escapeHtml(segmento)}">${escapeHtml(segmento)}</option>`;
    });
  }

  const termo = buscaEmpresa?.value.trim().toLowerCase() || "";
  const segmentoSelecionado = filtroSegmento?.value || "";
  const filtradas = empresas.filter((empresa) => {
    const bateBusca = !termo ||
      (empresa.name || "").toLowerCase().includes(termo) ||
      (empresa.segment || "").toLowerCase().includes(termo) ||
      (empresa.featuredService || "").toLowerCase().includes(termo);
    const bateSegmento = !segmentoSelecionado || empresa.segment === segmentoSelecionado;
    return bateBusca && bateSegmento;
  });

  if (!filtradas.length) {
    lista.innerHTML = '<div class="empty-state">Nenhuma empresa encontrada com os filtros aplicados.</div>';
    return;
  }

  lista.innerHTML = filtradas.map((empresa) => `
    <article class="list-card">
      <div class="list-card-header">
        <div>
          <strong>${escapeHtml(empresa.name)}</strong>
          <div class="list-meta">
            <span>${escapeHtml(empresa.segment)}</span>
            <span>${escapeHtml(empresa.city || "Cidade nao informada")}</span>
          </div>
        </div>
        <span class="status success">Avaliacao ${escapeHtml(empresa.rating)}</span>
      </div>
      <div class="tag-row">
        <span class="tag">${escapeHtml(empresa.featuredService || "Sem destaque")}</span>
      </div>
      <p class="muted">${escapeHtml(empresa.description || "Empresa cadastrada na plataforma.")}</p>
      <p class="muted">Endereco: ${escapeHtml(empresa.address || "Nao informado")}</p>
      ${empresa.address ? `<iframe class="map-frame" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${getMapEmbedUrl(empresa.address)}"></iframe>` : ""}
    </article>
  `).join("");
}

async function salvarCliente() {
  const nome = document.getElementById("nome")?.value.trim();
  const cpf = document.getElementById("cpf")?.value.trim();
  const placa = document.getElementById("placa")?.value.trim();
  const veiculo = document.getElementById("veiculo")?.value.trim();
  const servico = document.getElementById("servico")?.value.trim();
  const garantia = document.getElementById("garantia")?.value.trim();
  const msg = document.getElementById("msg");

  if (!nome || !cpf || !placa || !veiculo || !servico || !garantia) {
    if (msg) msg.textContent = "Preencha todos os campos antes de salvar.";
    return;
  }

  const payload = {
    name: nome,
    document: cpf,
    identifier: placa,
    relatedItem: veiculo,
    primaryDemand: servico,
    warrantyInfo: garantia
  };

  await withApi(
    async () => {
      await api.createCustomer(payload);
      if (msg) msg.textContent = "Cadastro salvo no banco com sucesso.";
    },
    () => {
      const clientes = getLocalClientes();
      clientes.push({ nome, cpf, placa, veiculo, servico, garantia, historico: [] });
      setLocalClientes(clientes);
      if (msg) msg.textContent = "Cadastro salvo localmente.";
    }
  );
}

async function carregarClientes() {
  const lista = document.getElementById("listaClientes");
  if (!lista) return;

  const clientes = await withApi(() => api.getCustomers(), () => getLocalClientes());
  if (!clientes.length) {
    lista.innerHTML = '<div class="empty-state">Nenhum cadastro salvo ate o momento.</div>';
    return;
  }

  lista.innerHTML = clientes.map((cliente, index) => {
    const id = cliente.id ?? index;
    const nome = cliente.name || cliente.nome;
    const documento = cliente.document || cliente.cpf;
    const identificador = cliente.identifier || cliente.placa;
    const item = cliente.related_item || cliente.veiculo;
    const demanda = cliente.primary_demand || cliente.servico;
    const garantia = cliente.warranty_info || cliente.garantia;
    const count = cliente.history_count ?? (cliente.historico || []).length;

    return `
      <article class="list-card">
        <div class="list-card-header">
          <div>
            <strong>${escapeHtml(nome)}</strong>
            <div class="list-meta">
              <span>${escapeHtml(item)}</span>
              <span>Identificador ${escapeHtml(identificador)}</span>
            </div>
          </div>
          <span class="status info">${escapeHtml(count)} registro(s)</span>
        </div>
        <div class="list-meta">
          <span>Documento: ${escapeHtml(documento)}</span>
          <span>Garantia: ${escapeHtml(garantia || "Nao informada")}</span>
        </div>
        <p class="muted">Demanda principal: ${escapeHtml(demanda || "Nao informada")}</p>
        <div class="list-actions">
          <button class="btn-secondary" onclick="abrirCliente(${id})">Ver cadastro</button>
          <button class="btn-ghost" onclick="abrirEdicao(${id})">Editar</button>
          <button class="btn-ghost" onclick="excluirCliente(${id})">Excluir</button>
        </div>
      </article>
    `;
  }).join("");
}

async function excluirCliente(id) {
  await withApi(
    () => api.deleteCustomer(id),
    () => {
      const clientes = getLocalClientes();
      clientes.splice(id, 1);
      setLocalClientes(clientes);
    }
  );

  carregarClientes();
}

function abrirEdicao(id) {
  localStorage.setItem("clienteEditando", id);
  window.location.href = "editar.html";
}

async function carregarEdicao() {
  const id = localStorage.getItem("clienteEditando");
  const cliente = await withApi(
    () => api.getCustomer(id),
    () => getLocalClientes()[Number(id)]
  );
  if (!cliente) return;

  document.getElementById("nome").value = cliente.name || cliente.nome;
  document.getElementById("cpf").value = cliente.document || cliente.cpf;
  document.getElementById("placa").value = cliente.identifier || cliente.placa;
  document.getElementById("veiculo").value = cliente.related_item || cliente.veiculo;
  document.getElementById("servico").value = cliente.primary_demand || cliente.servico;
  document.getElementById("garantia").value = cliente.warranty_info || cliente.garantia;
}

async function salvarEdicao() {
  const id = localStorage.getItem("clienteEditando");
  const payload = {
    name: document.getElementById("nome").value.trim(),
    document: document.getElementById("cpf").value.trim(),
    identifier: document.getElementById("placa").value.trim(),
    relatedItem: document.getElementById("veiculo").value.trim(),
    primaryDemand: document.getElementById("servico").value.trim(),
    warrantyInfo: document.getElementById("garantia").value.trim()
  };

  await withApi(
    () => api.updateCustomer(id, payload),
    () => {
      const clientes = getLocalClientes();
      clientes[Number(id)] = {
        ...clientes[Number(id)],
        nome: payload.name,
        cpf: payload.document,
        placa: payload.identifier,
        veiculo: payload.relatedItem,
        servico: payload.primaryDemand,
        garantia: payload.warrantyInfo
      };
      setLocalClientes(clientes);
    }
  );

  window.location.href = "clientes.html";
}

function abrirCliente(id) {
  localStorage.setItem("clienteSelecionado", id);
  window.location.href = "cliente.html";
}

async function carregarCliente() {
  const id = localStorage.getItem("clienteSelecionado");
  const dadosCliente = document.getElementById("dadosCliente");
  const historico = document.getElementById("historico");

  const cliente = await withApi(
    () => api.getCustomer(id),
    () => getLocalClientes()[Number(id)]
  );

  if (!cliente || !dadosCliente || !historico) {
    if (historico) historico.innerHTML = '<div class="empty-state">Cadastro nao encontrado.</div>';
    return;
  }

  const nome = cliente.name || cliente.nome;
  const documento = cliente.document || cliente.cpf;
  const identificador = cliente.identifier || cliente.placa;
  const item = cliente.related_item || cliente.veiculo;
  const garantia = cliente.warranty_info || cliente.garantia;
  const demanda = cliente.primary_demand || cliente.servico;

  dadosCliente.innerHTML = `
    <div class="list-card">
      <strong>${escapeHtml(nome)}</strong>
      <div class="list-meta">
        <span>Documento: ${escapeHtml(documento)}</span>
        <span>Identificador: ${escapeHtml(identificador)}</span>
      </div>
      <div class="list-meta">
        <span>Item relacionado: ${escapeHtml(item)}</span>
        <span>Garantia: ${escapeHtml(garantia || "Nao informada")}</span>
      </div>
      <p class="muted">Demanda principal: ${escapeHtml(demanda || "Nao informada")}</p>
    </div>
  `;

  const itens = cliente.history || cliente.historico || [];
  if (!itens.length) {
    historico.innerHTML = '<div class="empty-state">Nenhum registro lancado para este cadastro.</div>';
    return;
  }

  historico.innerHTML = itens.map((serv) => `
    <article class="list-card">
      <div class="list-card-header">
        <strong>${escapeHtml(serv.description || serv.servico)}</strong>
        <span class="status success">${formatCurrency(serv.amount || serv.valor)}</span>
      </div>
      <p class="muted">Lancado em ${escapeHtml(serv.created_at || serv.data || "")}</p>
    </article>
  `).join("");
}

async function adicionarServico() {
  const id = localStorage.getItem("clienteSelecionado");
  const descricao = document.getElementById("novoServico").value.trim();
  const valor = parseMoney(document.getElementById("valor").value);
  if (!descricao || !valor) return;

  await withApi(
    () => api.addCustomerHistory(id, { description: descricao, amount: valor }),
    () => {
      const clientes = getLocalClientes();
      const cliente = clientes[Number(id)];
      if (!cliente.historico) cliente.historico = [];
      cliente.historico.push({
        servico: descricao,
        valor,
        data: new Date().toLocaleDateString("pt-BR")
      });
      clientes[Number(id)] = cliente;
      setLocalClientes(clientes);
    }
  );

  carregarCliente();
}

async function salvarServicoCatalogo() {
  const nome = document.getElementById("servicoNome")?.value.trim();
  const categoria = document.getElementById("servicoCategoria")?.value.trim();
  const prazo = document.getElementById("servicoPrazo")?.value.trim();
  const valor = parseMoney(document.getElementById("servicoValor")?.value);
  const descricao = document.getElementById("servicoDescricao")?.value.trim();
  const msg = document.getElementById("msgServico");

  if (!nome || !categoria || !prazo || !valor || !descricao) {
    if (msg) msg.textContent = "Preencha todos os campos do servico.";
    return;
  }

  await withApi(
    () => api.createService({ name: nome, category: categoria, averageDeadline: prazo, basePrice: valor, description: descricao }),
    () => {
      const servicos = getLocalServicos();
      servicos.unshift({ name: nome, category: categoria, average_deadline: prazo, base_price: valor, description: descricao });
      setLocalServicos(servicos);
    }
  );

  if (msg) msg.textContent = "Servico salvo com sucesso.";
  carregarServicos();
}

async function carregarServicos() {
  const lista = document.getElementById("listaServicos");
  if (!lista) return;

  const servicos = await withApi(() => api.getServices(), () => getLocalServicos());
  const categorias = new Set(servicos.map((item) => item.category || item.categoria));
  const media = servicos.reduce((acc, item) => acc + Number(item.base_price || item.valor || 0), 0) / (servicos.length || 1);

  const totalServicosCatalogo = document.getElementById("totalServicosCatalogo");
  const totalCategoriasServico = document.getElementById("totalCategoriasServico");
  const mediaServico = document.getElementById("mediaServico");

  if (totalServicosCatalogo) totalServicosCatalogo.textContent = servicos.length;
  if (totalCategoriasServico) totalCategoriasServico.textContent = categorias.size;
  if (mediaServico) mediaServico.textContent = formatCurrency(media);

  lista.innerHTML = servicos.map((servico) => `
    <article class="list-card">
      <div class="list-card-header">
        <div>
          <strong>${escapeHtml(servico.name || servico.nome)}</strong>
          <div class="list-meta">
            <span>${escapeHtml(servico.category || servico.categoria)}</span>
            <span>Prazo medio ${escapeHtml(servico.average_deadline || servico.prazo)}</span>
          </div>
        </div>
        <span class="status info">${formatCurrency(servico.base_price || servico.valor)}</span>
      </div>
      <p class="muted">${escapeHtml(servico.description || servico.descricao)}</p>
    </article>
  `).join("");
}

async function salvarProdutoCatalogo() {
  const nome = document.getElementById("produtoNome")?.value.trim();
  const categoria = document.getElementById("produtoCategoria")?.value.trim();
  const estoque = Number(document.getElementById("produtoEstoque")?.value.trim());
  const valor = parseMoney(document.getElementById("produtoValor")?.value);
  const descricao = document.getElementById("produtoDescricao")?.value.trim();
  const msg = document.getElementById("msgProduto");

  if (!nome || !categoria || !estoque || !valor || !descricao) {
    if (msg) msg.textContent = "Preencha todos os campos do produto.";
    return;
  }

  await withApi(
    () => api.createProduct({ name: nome, category: categoria, stock: estoque, price: valor, description: descricao }),
    () => {
      const produtos = getLocalProdutos();
      produtos.unshift({ name: nome, category: categoria, stock: estoque, price: valor, description: descricao });
      setLocalProdutos(produtos);
    }
  );

  if (msg) msg.textContent = "Produto salvo com sucesso.";
  carregarProdutos();
}

async function carregarProdutos() {
  const lista = document.getElementById("listaProdutos");
  if (!lista) return;

  const produtos = await withApi(() => api.getProducts(), () => getLocalProdutos());
  const categorias = new Set(produtos.map((item) => item.category || item.categoria));
  const estoqueTotal = produtos.reduce((acc, item) => acc + Number(item.stock || item.estoque || 0), 0);
  const media = produtos.reduce((acc, item) => acc + Number(item.price || item.valor || 0), 0) / (produtos.length || 1);

  const totalProdutosCatalogo = document.getElementById("totalProdutosCatalogo");
  const totalCategoriasProduto = document.getElementById("totalCategoriasProduto");
  const estoqueTotalProdutos = document.getElementById("estoqueTotalProdutos");
  const mediaProduto = document.getElementById("mediaProduto");

  if (totalProdutosCatalogo) totalProdutosCatalogo.textContent = produtos.length;
  if (totalCategoriasProduto) totalCategoriasProduto.textContent = categorias.size;
  if (estoqueTotalProdutos) estoqueTotalProdutos.textContent = estoqueTotal;
  if (mediaProduto) mediaProduto.textContent = formatCurrency(media);

  lista.innerHTML = produtos.map((produto) => `
    <article class="list-card">
      <div class="list-card-header">
        <div>
          <strong>${escapeHtml(produto.name || produto.nome)}</strong>
          <div class="list-meta">
            <span>${escapeHtml(produto.category || produto.categoria)}</span>
            <span>Estoque ${escapeHtml(produto.stock || produto.estoque)}</span>
          </div>
        </div>
        <span class="status info">${formatCurrency(produto.price || produto.valor)}</span>
      </div>
      <p class="muted">${escapeHtml(produto.description || produto.descricao)}</p>
    </article>
  `).join("");
}

async function salvarOrcamento() {
  const cliente = document.getElementById("orcamentoCliente")?.value.trim();
  const tipo = document.getElementById("orcamentoTipo")?.value;
  const status = document.getElementById("orcamentoStatus")?.value;
  const item = document.getElementById("orcamentoItem")?.value.trim();
  const valor = parseMoney(document.getElementById("orcamentoValor")?.value);
  const observacao = document.getElementById("orcamentoObservacao")?.value.trim();
  const msg = document.getElementById("msgOrcamento");

  if (!cliente || !tipo || !status || !item || !valor || !observacao) {
    if (msg) msg.textContent = "Preencha todos os campos do orcamento.";
    return;
  }

  await withApi(
    () => api.createQuote({ customerName: cliente, quoteType: tipo, status, mainItem: item, amount: valor, notes: observacao }),
    () => {
      const orcamentos = getLocalOrcamentos();
      orcamentos.unshift({ customer_name: cliente, quote_type: tipo, status, main_item: item, amount: valor, notes: observacao });
      setLocalOrcamentos(orcamentos);
    }
  );

  if (msg) msg.textContent = "Orcamento salvo com sucesso.";
  carregarOrcamentos();
}

async function carregarOrcamentos() {
  const lista = document.getElementById("listaOrcamentos");
  if (!lista) return;

  const orcamentos = await withApi(() => api.getQuotes(), () => getLocalOrcamentos());
  const total = orcamentos.length;
  const aprovados = orcamentos.filter((item) => item.status === "Aprovado").length;
  const execucao = orcamentos.filter((item) => item.status === "Em execucao").length;
  const valorProjetado = orcamentos.reduce((acc, item) => acc + Number(item.amount || item.valor || 0), 0);

  const totalOrcamentos = document.getElementById("totalOrcamentos");
  const orcamentosAprovados = document.getElementById("orcamentosAprovados");
  const orcamentosExecucao = document.getElementById("orcamentosExecucao");
  const valorOrcamentos = document.getElementById("valorOrcamentos");

  if (totalOrcamentos) totalOrcamentos.textContent = total;
  if (orcamentosAprovados) orcamentosAprovados.textContent = aprovados;
  if (orcamentosExecucao) orcamentosExecucao.textContent = execucao;
  if (valorOrcamentos) valorOrcamentos.textContent = formatCurrency(valorProjetado);

  lista.innerHTML = orcamentos.map((orcamento) => {
    const statusClass = orcamento.status === "Aprovado" || orcamento.status === "Finalizado"
      ? "success"
      : orcamento.status === "Em execucao"
        ? "warning"
        : "info";

    return `
      <article class="list-card">
        <div class="list-card-header">
          <div>
            <strong>${escapeHtml(orcamento.customer_name || orcamento.cliente)}</strong>
            <div class="list-meta">
              <span>${escapeHtml(orcamento.quote_type || orcamento.tipo)}</span>
              <span>${escapeHtml(orcamento.main_item || orcamento.item)}</span>
            </div>
          </div>
          <span class="status ${statusClass}">${escapeHtml(orcamento.status)}</span>
        </div>
        <div class="list-meta">
          <span>Valor ${formatCurrency(orcamento.amount || orcamento.valor)}</span>
        </div>
        <p class="muted">${escapeHtml(orcamento.notes || orcamento.observacao)}</p>
      </article>
    `;
  }).join("");
}

async function carregarPainelEmpresa() {
  const fat = document.getElementById("fat");
  const cli = document.getElementById("cli");
  const ser = document.getElementById("ser");
  const est = document.getElementById("est");
  const msgIA = document.getElementById("msgIA");
  if (!fat || !cli || !ser || !est || !msgIA) return;

  const [clientes, servicos, produtos, resumoFinanceiro] = await Promise.all([
    withApi(() => api.getCustomers(), () => getLocalClientes()),
    withApi(() => api.getServices(), () => getLocalServicos()),
    withApi(() => api.getProducts(), () => getLocalProdutos()),
    withApi(
      () => api.getFinancialSummary(),
      async () => {
        const orcamentos = getLocalOrcamentos();
        return {
          approvedRevenue: orcamentos.reduce((acc, item) => acc + Number(item.amount || item.valor || 0), 0),
          projectedRevenue: orcamentos.reduce((acc, item) => acc + Number(item.amount || item.valor || 0), 0),
          inProgressOrders: orcamentos.filter((item) => item.status === "Em execucao").length,
          totalItems: getLocalServicos().length + getLocalProdutos().length
        };
      }
    )
  ]);

  fat.textContent = formatCurrency(resumoFinanceiro.approvedRevenue || resumoFinanceiro.projectedRevenue || 0);
  cli.textContent = clientes.length;
  ser.textContent = servicos.length;
  est.textContent = produtos.length;

  const mensagens = [
    "Seu catalogo ja esta pronto para atender varios segmentos com servicos e produtos.",
    "A base de clientes, orcamentos e financeiro esta centralizada para acelerar a operacao.",
    "A plataforma permite crescer sem depender de um unico nicho de mercado."
  ];
  msgIA.textContent = mensagens[Math.floor(Math.random() * mensagens.length)];
}

async function carregarFinanceiro() {
  const resumo = document.getElementById("financeiroResumo");
  if (!resumo) return;

  const [servicos, produtos, orcamentos, financeiro] = await Promise.all([
    withApi(() => api.getServices(), () => getLocalServicos()),
    withApi(() => api.getProducts(), () => getLocalProdutos()),
    withApi(() => api.getQuotes(), () => getLocalOrcamentos()),
    withApi(
      () => api.getFinancialSummary(),
      async () => {
        const localOrcamentos = getLocalOrcamentos();
        return {
          approvedRevenue: localOrcamentos.filter((item) => item.status === "Aprovado" || item.status === "Finalizado").reduce((acc, item) => acc + Number(item.amount || item.valor || 0), 0),
          projectedRevenue: localOrcamentos.reduce((acc, item) => acc + Number(item.amount || item.valor || 0), 0),
          inProgressOrders: localOrcamentos.filter((item) => item.status === "Em execucao").length,
          totalItems: getLocalServicos().length + getLocalProdutos().length
        };
      }
    )
  ]);

  const financeiroProjetado = document.getElementById("financeiroProjetado");
  const financeiroAprovado = document.getElementById("financeiroAprovado");
  const financeiroExecucao = document.getElementById("financeiroExecucao");
  const financeiroItens = document.getElementById("financeiroItens");

  if (financeiroProjetado) financeiroProjetado.textContent = formatCurrency(financeiro.projectedRevenue);
  if (financeiroAprovado) financeiroAprovado.textContent = formatCurrency(financeiro.approvedRevenue);
  if (financeiroExecucao) financeiroExecucao.textContent = financeiro.inProgressOrders;
  if (financeiroItens) financeiroItens.textContent = financeiro.totalItems;

  resumo.innerHTML = `
    <article class="list-card">
      <div class="list-card-header">
        <strong>Servicos cadastrados</strong>
        <span class="status info">${servicos.length} itens</span>
      </div>
      <p class="muted">Base pronta para propostas, O.S. e atendimentos de varios segmentos.</p>
    </article>
    <article class="list-card">
      <div class="list-card-header">
        <strong>Produtos cadastrados</strong>
        <span class="status info">${produtos.length} itens</span>
      </div>
      <p class="muted">Catalogo de produtos disponivel para venda, composicao de orcamento e estoque.</p>
    </article>
    <article class="list-card">
      <div class="list-card-header">
        <strong>Carteira comercial</strong>
        <span class="status success">${orcamentos.length} registros</span>
      </div>
      <p class="muted">Orcamentos e ordens sustentam a leitura inicial de receita da operacao.</p>
    </article>
  `;
}

async function carregarRelatorio() {
  const totalGeralEl = document.getElementById("totalGeral");
  const totalHojeEl = document.getElementById("totalHoje");
  const clientesAtivosEl = document.getElementById("clientesAtivos");
  const qtdServicosEl = document.getElementById("qtdServicos");
  const listaRelatorio = document.getElementById("listaRelatorio");
  if (!listaRelatorio) return;

  const clientes = await withApi(() => api.getCustomers(), () => getLocalClientes());
  let totalGeral = 0;
  let totalHoje = 0;
  let qtdServicos = 0;
  let clientesAtivos = 0;
  const hoje = new Date().toLocaleDateString("pt-BR");

  const html = await Promise.all(clientes.map(async (cliente, index) => {
    const full = await withApi(() => api.getCustomer(cliente.id), () => cliente);
    const historico = full.history || full.historico || [];
    let totalCliente = 0;

    if (historico.length > 0) clientesAtivos += 1;

    historico.forEach((item) => {
      const valor = Number(item.amount || item.valor || 0);
      totalCliente += valor;
      totalGeral += valor;
      qtdServicos += 1;

      const data = item.created_at || item.data || "";
      if (String(data).includes(hoje)) totalHoje += valor;
    });

    return `
      <article class="list-card">
        <div class="list-card-header">
          <strong>${escapeHtml(full.name || full.nome)}</strong>
          <span class="status info">${formatCurrency(totalCliente)}</span>
        </div>
        <div class="list-meta">
          <span>${escapeHtml(full.related_item || full.veiculo || "")}</span>
          <span>Identificador ${escapeHtml(full.identifier || full.placa || index)}</span>
        </div>
      </article>
    `;
  }));

  if (totalGeralEl) totalGeralEl.textContent = formatCurrency(totalGeral);
  if (totalHojeEl) totalHojeEl.textContent = formatCurrency(totalHoje);
  if (clientesAtivosEl) clientesAtivosEl.textContent = clientesAtivos;
  if (qtdServicosEl) qtdServicosEl.textContent = qtdServicos;
  listaRelatorio.innerHTML = html.join("") || '<div class="empty-state">Ainda nao ha dados suficientes para gerar o relatorio.</div>';
}

document.addEventListener("DOMContentLoaded", () => {
  if (hasApi()) {
    const body = document.body;
    if (body?.dataset?.auth === "true") {
      const roles = (body.dataset.roles || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      api.ensureSession({ roles });
    }
  }

  atualizarResumoDashboard();
});
