require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const { port } = require("./config");
const { all, get, initDb, run } = require("./db");
const { createToken, authRequired } = require("./auth");
const { seedIfEmpty } = require("./seed");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(process.cwd()));

function buildAddress(row) {
  return [row.street, row.number, row.complement, row.district, row.city, row.state, row.zip_code]
    .filter(Boolean)
    .join(", ");
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      typePerson,
      name,
      document,
      phone,
      city,
      state,
      zipCode,
      street,
      number,
      district,
      complement,
      email,
      roleProfile,
      password
    } = req.body;

    if (!typePerson || !name || !document || !city || !state || !zipCode || !street || !number || !district || !email || !roleProfile || !password) {
      return res.status(400).json({ error: "Dados obrigatorios nao informados." });
    }

    const existing = await get("SELECT id FROM users WHERE email = ? OR document = ?", [email, document]);
    if (existing) {
      return res.status(409).json({ error: "Ja existe cadastro com este e-mail ou documento." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      `INSERT INTO users (
        type_person, name, document, phone, city, state, zip_code, street, number, district, complement, email, role_profile, password_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [typePerson, name, document, phone || "", city, state, zipCode, street, number, district, complement || "", email, roleProfile, passwordHash]
    );

    const user = await get("SELECT id, type_person, name, document, email, role_profile FROM users WHERE id = ?", [result.id]);
    const token = createToken({ id: user.id, email: user.email, roleProfile: user.role_profile });

    if (roleProfile === "prestador" || roleProfile === "ambos") {
      const companyExists = await get("SELECT id FROM companies WHERE document = ?", [document]);
      if (!companyExists) {
        await run(
          `INSERT INTO companies (
            owner_user_id, legal_type, name, document, segment, city, state, zip_code, street, number, district, complement, description, email
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            typePerson,
            name,
            document,
            "Prestador independente",
            city,
            state,
            zipCode,
            street,
            number,
            district,
            complement || "",
            "Prestador cadastrado automaticamente pelo portal unico.",
            email
          ]
        );
      }
    }

    return res.status(201).json({ token, user });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno ao criar cadastro." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get("SELECT * FROM users WHERE email = ?", [email]);

    if (!user) {
      return res.status(401).json({ error: "Credenciais invalidas." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Credenciais invalidas." });
    }

    const token = createToken({ id: user.id, email: user.email, roleProfile: user.role_profile });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        typePerson: user.type_person,
        roleProfile: user.role_profile
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno no login." });
  }
});

app.get("/api/auth/me", authRequired, async (req, res) => {
  try {
    const user = await get(
      "SELECT id, name, email, type_person, role_profile, city, state FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: "Usuario nao encontrado." });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      typePerson: user.type_person,
      roleProfile: user.role_profile,
      city: user.city,
      state: user.state
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao carregar sessao." });
  }
});

app.get("/api/companies", async (req, res) => {
  try {
    const rows = await all("SELECT * FROM companies ORDER BY rating DESC, name ASC");
    return res.json(rows.map((row) => ({
      id: row.id,
      name: row.name,
      segment: row.segment,
      featuredService: row.featured_service,
      city: row.city,
      state: row.state,
      description: row.description,
      rating: row.rating,
      address: buildAddress(row)
    })));
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar empresas." });
  }
});

app.get("/api/customers", authRequired, async (req, res) => {
  try {
    const rows = await all(`
      SELECT
        c.*,
        COUNT(h.id) AS history_count,
        IFNULL(SUM(h.amount), 0) AS history_total
      FROM customers c
      LEFT JOIN customer_history h ON h.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar clientes." });
  }
});

app.post("/api/customers", authRequired, async (req, res) => {
  try {
    const { name, document, identifier, relatedItem, primaryDemand, warrantyInfo } = req.body;
    if (!name || !document || !identifier || !relatedItem || !primaryDemand || !warrantyInfo) {
      return res.status(400).json({ error: "Dados do cliente incompletos." });
    }

    const result = await run(
      `INSERT INTO customers (name, document, identifier, related_item, primary_demand, warranty_info) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, document, identifier, relatedItem, primaryDemand, warrantyInfo]
    );
    const customer = await get("SELECT * FROM customers WHERE id = ?", [result.id]);
    return res.status(201).json(customer);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar cliente." });
  }
});

app.get("/api/customers/:id", authRequired, async (req, res) => {
  try {
    const customer = await get("SELECT * FROM customers WHERE id = ?", [req.params.id]);
    if (!customer) {
      return res.status(404).json({ error: "Cliente nao encontrado." });
    }

    const history = await all(
      "SELECT * FROM customer_history WHERE customer_id = ? ORDER BY created_at DESC",
      [req.params.id]
    );

    return res.json({ ...customer, history });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar cliente." });
  }
});

app.put("/api/customers/:id", authRequired, async (req, res) => {
  try {
    const { name, document, identifier, relatedItem, primaryDemand, warrantyInfo } = req.body;
    await run(
      `UPDATE customers
       SET name = ?, document = ?, identifier = ?, related_item = ?, primary_demand = ?, warranty_info = ?
       WHERE id = ?`,
      [name, document, identifier, relatedItem, primaryDemand, warrantyInfo, req.params.id]
    );

    const customer = await get("SELECT * FROM customers WHERE id = ?", [req.params.id]);
    return res.json(customer);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar cliente." });
  }
});

app.delete("/api/customers/:id", authRequired, async (req, res) => {
  try {
    await run("DELETE FROM customer_history WHERE customer_id = ?", [req.params.id]);
    await run("DELETE FROM customers WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao excluir cliente." });
  }
});

app.post("/api/customers/:id/history", authRequired, async (req, res) => {
  try {
    const { description, amount } = req.body;
    if (!description || !amount) {
      return res.status(400).json({ error: "Dados do historico incompletos." });
    }

    const result = await run(
      "INSERT INTO customer_history (customer_id, description, amount) VALUES (?, ?, ?)",
      [req.params.id, description, amount]
    );

    const history = await get("SELECT * FROM customer_history WHERE id = ?", [result.id]);
    return res.status(201).json(history);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao registrar historico." });
  }
});

app.get("/api/services", async (req, res) => {
  try {
    const rows = await all("SELECT * FROM services ORDER BY created_at DESC");
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar servicos." });
  }
});

app.post("/api/services", authRequired, async (req, res) => {
  try {
    const { name, category, averageDeadline, basePrice, description } = req.body;
    if (!name || !category || !averageDeadline || !basePrice || !description) {
      return res.status(400).json({ error: "Dados do servico incompletos." });
    }

    const result = await run(
      `INSERT INTO services (name, category, average_deadline, base_price, description) VALUES (?, ?, ?, ?, ?)`,
      [name, category, averageDeadline, basePrice, description]
    );
    const service = await get("SELECT * FROM services WHERE id = ?", [result.id]);
    return res.status(201).json(service);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar servico." });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const rows = await all("SELECT * FROM products ORDER BY created_at DESC");
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar produtos." });
  }
});

app.post("/api/products", authRequired, async (req, res) => {
  try {
    const { name, category, stock, price, description } = req.body;
    if (!name || !category || stock == null || !price || !description) {
      return res.status(400).json({ error: "Dados do produto incompletos." });
    }

    const result = await run(
      `INSERT INTO products (name, category, stock, price, description) VALUES (?, ?, ?, ?, ?)`,
      [name, category, stock, price, description]
    );
    const product = await get("SELECT * FROM products WHERE id = ?", [result.id]);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar produto." });
  }
});

app.get("/api/quotes", authRequired, async (req, res) => {
  try {
    const rows = await all("SELECT * FROM quotes ORDER BY created_at DESC");
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar orcamentos." });
  }
});

app.post("/api/quotes", authRequired, async (req, res) => {
  try {
    const { customerName, quoteType, status, mainItem, amount, notes } = req.body;
    if (!customerName || !quoteType || !status || !mainItem || !amount || !notes) {
      return res.status(400).json({ error: "Dados do orcamento incompletos." });
    }

    const result = await run(
      `INSERT INTO quotes (customer_name, quote_type, status, main_item, amount, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [customerName, quoteType, status, mainItem, amount, notes]
    );
    const quote = await get("SELECT * FROM quotes WHERE id = ?", [result.id]);
    return res.status(201).json(quote);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar orcamento." });
  }
});

app.get("/api/financial-summary", authRequired, async (req, res) => {
  try {
    const approved = await get(`SELECT IFNULL(SUM(amount), 0) AS total FROM quotes WHERE status IN ('Aprovado', 'Finalizado')`);
    const projected = await get(`SELECT IFNULL(SUM(amount), 0) AS total FROM quotes`);
    const inProgress = await get(`SELECT COUNT(*) AS total FROM quotes WHERE status = 'Em execucao'`);
    const serviceCount = await get(`SELECT COUNT(*) AS total FROM services`);
    const productCount = await get(`SELECT COUNT(*) AS total FROM products`);

    return res.json({
      approvedRevenue: approved.total,
      projectedRevenue: projected.total,
      inProgressOrders: inProgress.total,
      totalItems: serviceCount.total + productCount.total
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao montar resumo financeiro." });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(process.cwd(), "home.html"));
});

async function start() {
  await initDb();
  await seedIfEmpty();

  app.listen(port, () => {
    console.log(`AutoID server running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
