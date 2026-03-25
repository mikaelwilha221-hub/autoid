const api = {
  async request(path, options = {}) {
    const token = localStorage.getItem("autoidToken");
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(path, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Falha na requisicao.");
    }

    return data;
  },

  async registerUser(payload) {
    const data = await this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (data.token) localStorage.setItem("autoidToken", data.token);
    if (data.user) localStorage.setItem("autoidUser", JSON.stringify(data.user));
    return data;
  },

  async login(payload) {
    const data = await this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (data.token) localStorage.setItem("autoidToken", data.token);
    if (data.user) localStorage.setItem("autoidUser", JSON.stringify(data.user));
    return data;
  },

  me() {
    return this.request("/api/auth/me");
  },

  getStoredUser() {
    return JSON.parse(localStorage.getItem("autoidUser") || "null");
  },

  logout(redirectTo = "index.html") {
    localStorage.removeItem("autoidToken");
    localStorage.removeItem("autoidUser");
    localStorage.removeItem("logado");
    if (redirectTo) window.location.href = redirectTo;
  },

  async ensureSession(options = {}) {
    const { roles = [], redirectTo = "index.html" } = options;
    const token = localStorage.getItem("autoidToken");
    if (!token) {
      window.location.href = redirectTo;
      return null;
    }

    try {
      const user = await this.me();
      localStorage.setItem("autoidUser", JSON.stringify(user));

      if (roles.length && !roles.includes(user.roleProfile)) {
        window.location.href = user.roleProfile === "prestador" || user.roleProfile === "ambos"
          ? "empresa.html"
          : "dashboard.html";
        return null;
      }

      return user;
    } catch (error) {
      this.logout(redirectTo);
      return null;
    }
  },

  getCompanies() {
    return this.request("/api/companies");
  },

  getCustomers() {
    return this.request("/api/customers");
  },

  getCustomer(id) {
    return this.request(`/api/customers/${id}`);
  },

  createCustomer(payload) {
    return this.request("/api/customers", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  updateCustomer(id, payload) {
    return this.request(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },

  deleteCustomer(id) {
    return this.request(`/api/customers/${id}`, {
      method: "DELETE"
    });
  },

  addCustomerHistory(id, payload) {
    return this.request(`/api/customers/${id}/history`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  getServices() {
    return this.request("/api/services");
  },

  createService(payload) {
    return this.request("/api/services", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  getProducts() {
    return this.request("/api/products");
  },

  createProduct(payload) {
    return this.request("/api/products", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  getQuotes() {
    return this.request("/api/quotes");
  },

  createQuote(payload) {
    return this.request("/api/quotes", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  getFinancialSummary() {
    return this.request("/api/financial-summary");
  }
};
