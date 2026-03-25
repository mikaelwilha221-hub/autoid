const bcrypt = require("bcryptjs");
const { all, get, run } = require("./db");

async function seedIfEmpty() {
  const companyCount = await get("SELECT COUNT(*) AS total FROM companies");
  if (companyCount && companyCount.total > 0) return;

  const passwordHash = await bcrypt.hash("123456", 10);
  const userResult = await run(
    `INSERT INTO users (
      type_person, name, document, phone, city, state, zip_code, street, number, district, complement, email, role_profile, password_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "pj",
      "AutoID Demo",
      "12345678000199",
      "(65) 99999-0000",
      "Cuiaba",
      "MT",
      "78040-365",
      "Avenida Miguel Sutil",
      "8000",
      "Santa Rosa",
      "",
      "demo@autoid.com",
      "ambos",
      passwordHash
    ]
  );

  const companies = [
    ["Alpha Solutions", "11222333000101", "Tecnologia e suporte", "Sao Paulo", "SP", "01310-100", "Avenida Paulista", "1000", "Bela Vista", "", "Operacao focada em implantacao, suporte e servicos recorrentes.", 4.8, "Implantacao de sistemas"],
    ["Studio Prime", "22333444000102", "Marketing e design", "Curitiba", "PR", "80530-010", "Rua Mateus Leme", "850", "Centro Civico", "", "Consultoria criativa, branding e servicos visuais para negocios.", 4.9, "Branding e criacao visual"],
    ["Central Service", "33444555000103", "Manutencao e operacoes", "Goiania", "GO", "74230-100", "Avenida T-63", "1200", "Setor Bueno", "", "Equipe especializada em operacoes, manutencao e suporte continuado.", 4.7, "Atendimento tecnico e contratos"],
    ["Vida Integral", "44555666000104", "Saude e bem-estar", "Belo Horizonte", "MG", "30110-042", "Avenida do Contorno", "5600", "Funcionarios", "", "Operacao com foco em saude preventiva, atendimento e acompanhamento continuo.", 4.9, "Atendimento clinico e programas corporativos"],
    ["Casa Forte Engenharia", "55666777000105", "Construcao e engenharia", "Campinas", "SP", "13010-201", "Rua Barreto Leme", "1450", "Centro", "", "Empresa voltada para servicos tecnicos, obras e manutencao em varios portes.", 4.6, "Projetos, laudos e manutencao predial"],
    ["Move Educacao", "66777888000106", "Educacao e treinamento", "Recife", "PE", "50050-410", "Rua do Principe", "330", "Boa Vista", "", "Plataforma educacional com servicos de treinamento para pessoas e empresas.", 4.8, "Cursos, treinamentos e capacitacao empresarial"],
    ["LogiMax", "77888999000107", "Logistica e transporte", "Cuiaba", "MT", "78040-365", "Avenida Miguel Sutil", "8000", "Santa Rosa", "", "Especialista em operacao logistica, roteirizacao e distribuicao.", 4.7, "Gestao de entregas e operacao de transporte"],
    ["Studio Aura", "88999000000108", "Beleza e estetica", "Florianopolis", "SC", "88015-200", "Avenida Rio Branco", "404", "Centro", "", "Atendimento focado em estetica, bem-estar e servicos personalizados.", 4.9, "Procedimentos esteticos e atendimento premium"],
    ["Mercato Pro", "99000111000109", "Comercio e varejo", "Porto Alegre", "RS", "90020-008", "Rua dos Andradas", "1222", "Centro Historico", "", "Loja multissetorial com operacao de produtos, kits e atendimento comercial.", 4.5, "Venda de produtos e atendimento consultivo"],
    ["Secure One", "10111222000110", "Seguranca e monitoramento", "Brasilia", "DF", "71200-030", "SIA Trecho 3", "1200", "Zona Industrial", "", "Empresa focada em servicos de seguranca, vigilancia e operacao tecnica.", 4.8, "Monitoramento, controle de acesso e suporte tecnico"]
  ];

  for (const company of companies) {
    await run(
      `INSERT INTO companies (
        owner_user_id, legal_type, name, document, segment, city, state, zip_code, street, number, district, complement, description, rating, featured_service
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userResult.id, "pj", ...company]
    );
  }

  const customers = [
    ["Maria Souza", "123.456.789-00", "REF-001", "Contrato corporativo", "Implantacao operacional", "90 dias"],
    ["Pedro Santos", "987.654.321-00", "REF-002", "Kit operacional", "Atendimento tecnico", "30 dias"]
  ];

  for (const customer of customers) {
    await run(
      `INSERT INTO customers (name, document, identifier, related_item, primary_demand, warranty_info) VALUES (?, ?, ?, ?, ?, ?)`,
      customer
    );
  }

  const insertedCustomers = await all("SELECT id FROM customers ORDER BY id ASC");
  for (const customer of insertedCustomers) {
    await run(
      `INSERT INTO customer_history (customer_id, description, amount) VALUES (?, ?, ?)`,
      [customer.id, "Servico inicial registrado", 350]
    );
  }

  const services = [
    ["Consultoria inicial", "Consultoria", "2 dias", 450, "Diagnostico inicial para mapear necessidade e proposta de execucao."],
    ["Implantacao operacional", "Implantacao", "5 dias", 1800, "Servico de implantacao e configuracao de rotina operacional."]
  ];

  for (const service of services) {
    await run(
      `INSERT INTO services (name, category, average_deadline, base_price, description) VALUES (?, ?, ?, ?, ?)`,
      service
    );
  }

  const products = [
    ["Pacote premium", "Assinatura", 25, 299, "Plano recorrente com suporte e acesso ampliado."],
    ["Kit operacional", "Equipamento", 14, 890, "Conjunto de itens para operacao e atendimento."]
  ];

  for (const product of products) {
    await run(
      `INSERT INTO products (name, category, stock, price, description) VALUES (?, ?, ?, ?, ?)`,
      product
    );
  }

  const quotes = [
    ["Alpha Trade", "Servico", "Aprovado", "Implantacao operacional", 1800, "Inicio previsto para a proxima semana"],
    ["Maria Souza", "Misto", "Em execucao", "Consultoria e kit operacional", 1340, "Projeto em andamento"]
  ];

  for (const quote of quotes) {
    await run(
      `INSERT INTO quotes (customer_name, quote_type, status, main_item, amount, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      quote
    );
  }
}

module.exports = {
  seedIfEmpty
};
