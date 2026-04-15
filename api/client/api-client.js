/**
 * FinsangMart API Client
 * A JavaScript client for interacting with the FinsangMart Backend API
 */

class FinsangMartAPI {
  constructor(baseURL = `${process.env.BASE_URL}`) {
    // constructor(baseURL = 'http://172.24.132.187:3001/api') {
    this.baseURL = baseURL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  clearAuth() {
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  // Admin Authentication Methods
  async adminSignup(email, password, name) {
    return this.request("/auth/admin/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async adminSignin(email, password) {
    const response = await this.request("/auth/admin/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  // Authentication Methods
  async getSession() {
    return this.request("/auth/session");
  }

  async signout() {
    const response = await this.request("/auth/signout", {
      method: "POST",
    });
    this.clearAuth();
    return response;
  }

  async updateUserProfile(name, profileImageUrl) {
    return this.request("/auth/user", {
      method: "POST",
      body: JSON.stringify({ name, profile_image_url: profileImageUrl }),
    });
  }

  async getUserProfile() {
    return this.request("/auth/user");
  }

  async updateUserRole(userId, role) {
    return this.request(`/auth/user/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  async getUsers(page = 1, limit = 10) {
    return this.request(`/auth/users?page=${page}&limit=${limit}`);
  }

  // Product Methods
  async getProducts(page = 1, limit = 10, type = null) {
    let url = `/products?page=${page}&limit=${limit}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    return this.request(url);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.request("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: "DELETE",
    });
  }

  async getProductTypes() {
    return this.request("/products/types/all");
  }

  async createProductType(name, description) {
    return this.request("/products/types", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteProductType(type) {
    return this.request(`/products/types/${encodeURIComponent(type)}`, {
      method: "DELETE",
    });
  }

  async compareProducts(productIds) {
    return this.request("/products/compare", {
      method: "POST",
      body: JSON.stringify({ productIds }),
    });
  }

  // Training Methods
  async getTrainingCategories(page = 1, limit = 10) {
    return this.request(`/training/categories?page=${page}&limit=${limit}`);
  }

  async createTrainingCategory(categoryData) {
    return this.request("/training/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  async deleteTrainingCategory(id) {
    return this.request(`/training/categories/${id}`, {
      method: "DELETE",
    });
  }

  async getTrainingVideos(page = 1, limit = 10) {
    return this.request(`/training/videos?page=${page}&limit=${limit}`);
  }

  async getTrainingVideosByCategory(categoryId, page = 1, limit = 10) {
    return this.request(
      `/training/videos/${categoryId}?page=${page}&limit=${limit}`
    );
  }

  async createTrainingVideo(videoData) {
    return this.request("/training/videos", {
      method: "POST",
      body: JSON.stringify(videoData),
    });
  }

  async updateTrainingVideo(id, videoData) {
    return this.request(`/training/videos/${id}`, {
      method: "PUT",
      body: JSON.stringify(videoData),
    });
  }

  async deleteTrainingVideo(id) {
    return this.request(`/training/videos/${id}`, {
      method: "DELETE",
    });
  }

  async getTrainingVideo(id) {
    return this.request(`/training/videos/single/${id}`);
  }

  // Grow Methods
  async getGrowCategories(page = 1, limit = 10) {
    return this.request(`/grow/categories?page=${page}&limit=${limit}`);
  }

  async createGrowCategory(categoryData) {
    return this.request("/grow/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  async deleteGrowCategory(id) {
    return this.request(`/grow/categories/${id}`, {
      method: "DELETE",
    });
  }

  async getGrowPosters(page = 1, limit = 10) {
    return this.request(`/grow/posters?page=${page}&limit=${limit}`);
  }

  async getGrowPostersByCategory(categoryId, page = 1, limit = 10) {
    return this.request(
      `/grow/posters/${categoryId}?page=${page}&limit=${limit}`
    );
  }

  async createGrowPoster(posterData) {
    return this.request("/grow/posters", {
      method: "POST",
      body: JSON.stringify(posterData),
    });
  }

  async updateGrowPoster(id, posterData) {
    return this.request(`/grow/posters/${id}`, {
      method: "PUT",
      body: JSON.stringify(posterData),
    });
  }

  async deleteGrowPoster(id) {
    return this.request(`/grow/posters/${id}`, {
      method: "DELETE",
    });
  }

  async getGrowPoster(id) {
    return this.request(`/grow/posters/single/${id}`);
  }

  // Storage Methods
  async uploadProfileImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const url = `${this.baseURL}/storage/profile-image`;
    const config = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  async uploadProductImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const url = `${this.baseURL}/storage/product-image`;
    const config = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  async uploadGrowPoster(file) {
    const formData = new FormData();
    formData.append("image", file);

    const url = `${this.baseURL}/storage/grow-poster`;
    const config = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  async uploadGeneralFile(file, folder = "general") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const url = `${this.baseURL}/storage/upload`;
    const config = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  async deleteProfileImage(fileName) {
    return this.request("/storage/profile-image", {
      method: "DELETE",
      body: JSON.stringify({ fileName }),
    });
  }

  async deleteProductImage(fileName) {
    return this.request(
      `/storage/product-image/${encodeURIComponent(fileName)}`,
      {
        method: "DELETE",
      }
    );
  }

  async deleteGrowPoster(fileName) {
    return this.request(
      `/storage/grow-poster/${encodeURIComponent(fileName)}`,
      {
        method: "DELETE",
      }
    );
  }

  async deleteFile(fileName) {
    return this.request(`/storage/file/${encodeURIComponent(fileName)}`, {
      method: "DELETE",
    });
  }

  async getProductImageInfo(fileName) {
    return this.request(
      `/storage/product-image/${encodeURIComponent(fileName)}`
    );
  }

  async getGrowPosterInfo(fileName) {
    return this.request(`/storage/grow-poster/${encodeURIComponent(fileName)}`);
  }

  async getFileInfo(fileName) {
    return this.request(`/storage/file/${encodeURIComponent(fileName)}`);
  }
}

// Export for different environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = FinsangMartAPI;
} else if (typeof window !== "undefined") {
  window.FinsangMartAPI = FinsangMartAPI;
}
