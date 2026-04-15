class FinsangMartAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(
    baseURL: string = process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:3001/api"
  ) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
    // Store token in localStorage for persistence
    if (token) {
      localStorage.setItem("finsangmart_token", token);
    } else {
      localStorage.removeItem("finsangmart_token");
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("finsangmart_token");
    }
    return this.token;
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem("finsangmart_token");
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          url: url,
          data: data,
        });
        throw new Error(
          data.error ||
            data.details ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      console.error("API Request Error:", error);
      throw new Error(
        `API request failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Admin Authentication Methods
  async adminSignup(email: string, password: string, name: string) {
    return this.request("/auth/admin/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async adminSignin(email: string, password: string) {
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

  async updateUserProfile(name: string, profileImageUrl?: string) {
    return this.request("/auth/user", {
      method: "POST",
      body: JSON.stringify({ name, profile_image_url: profileImageUrl }),
    });
  }

  async getUserProfile() {
    return this.request("/auth/user");
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/auth/user/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  async getUsers(page: number = 1, limit: number = 10) {
    return this.request(`/auth/users?page=${page}&limit=${limit}`);
  }

  // Product Methods
  async getProducts(page: number = 1, limit: number = 10, type?: string) {
    let url = `/admin/products?page=${page}&limit=${limit}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    return this.request(url);
  }

  async debugProducts() {
    return this.request("/products/debug/all");
  }

  async debugTable() {
    return this.request("/products/debug/table");
  }

  async getProduct(id: string) {
    return this.request(`/admin/products/${id}`);
  }

  async createProduct(productData: any) {
    return this.request("/admin/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId: string, productData: any) {
    return this.request(`/admin/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  }

  async uploadProductImage(
    file: File
  ): Promise<{ url: string; fileName: string }> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${this.baseURL}/storage/product-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    return response.json();
  }

  async deleteProduct(id: string) {
    return this.request(`/admin/products/${id}`, {
      method: "DELETE",
    });
  }

  async getProductTypes() {
    return this.request("/admin/product-types");
  }

  async createProductType(name: string, description?: string) {
    return this.request("/admin/product-types", {
      method: "POST",
      body: JSON.stringify({ type: name }),
    });
  }

  async deleteProductType(type: string) {
    return this.request(`/admin/product-types/${encodeURIComponent(type)}`, {
      method: "DELETE",
    });
  }

  async compareProducts(productIds: string[]) {
    return this.request("/products/compare", {
      method: "POST",
      body: JSON.stringify({ productIds }),
    });
  }

  // Banner Methods
  async getBanners() {
    return this.request("/banners");
  }

  async createBanner(bannerData: any) {
    return this.request("/banners", {
      method: "POST",
      body: JSON.stringify(bannerData),
    });
  }

  async updateBanner(id: string, bannerData: any) {
    return this.request(`/banners/${id}`, {
      method: "PUT",
      body: JSON.stringify(bannerData),
    });
  }

  async deleteBanner(id: string) {
    return this.request(`/banners/${id}`, {
      method: "DELETE",
    });
  }

  // Training Methods
  async getTrainingCategories(page: number = 1, limit: number = 10) {
    return this.request(`/training/categories?page=${page}&limit=${limit}`);
  }

  async createTrainingCategory(categoryData: any) {
    return this.request("/training/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  async deleteTrainingCategory(id: string) {
    return this.request(`/training/categories/${id}`, {
      method: "DELETE",
    });
  }

  async getTrainingVideos(page: number = 1, limit: number = 10) {
    return this.request(`/training/videos?page=${page}&limit=${limit}`);
  }

  async getTrainingVideosByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10
  ) {
    return this.request(
      `/training/videos/${categoryId}?page=${page}&limit=${limit}`
    );
  }

  async createTrainingVideo(videoData: any) {
    return this.request("/training/videos", {
      method: "POST",
      body: JSON.stringify(videoData),
    });
  }

  async updateTrainingVideo(id: string, videoData: any) {
    return this.request(`/training/videos/${id}`, {
      method: "PUT",
      body: JSON.stringify(videoData),
    });
  }

  async deleteTrainingVideo(id: string) {
    return this.request(`/training/videos/${id}`, {
      method: "DELETE",
    });
  }

  async getTrainingVideo(id: string) {
    return this.request(`/training/videos/single/${id}`);
  }

  // Grow Methods
  async getGrowCategories(page: number = 1, limit: number = 10) {
    return this.request(`/grow/categories?page=${page}&limit=${limit}`);
  }

  async createGrowCategory(categoryData: any) {
    return this.request("/grow/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  async deleteGrowCategory(id: string) {
    return this.request(`/grow/categories/${id}`, {
      method: "DELETE",
    });
  }

  async getGrowPosters(page: number = 1, limit: number = 10) {
    return this.request(`/grow/posters?page=${page}&limit=${limit}`);
  }

  async getGrowPostersByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10
  ) {
    return this.request(
      `/grow/posters/${categoryId}?page=${page}&limit=${limit}`
    );
  }

  async createGrowPoster(posterData: any) {
    return this.request("/grow/posters", {
      method: "POST",
      body: JSON.stringify(posterData),
    });
  }

  async updateGrowPoster(id: string, posterData: any) {
    return this.request(`/grow/posters/${id}`, {
      method: "PUT",
      body: JSON.stringify(posterData),
    });
  }

  async deleteGrowPoster(id: string) {
    return this.request(`/grow/posters/${id}`, {
      method: "DELETE",
    });
  }

  async getGrowPoster(id: string) {
    return this.request(`/grow/posters/single/${id}`);
  }

  // Analytics Methods
  async getAnalyticsOverview() {
    return this.request("/analytics/overview");
  }

  // Storage Methods
  async uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    const url = `${this.baseURL}/storage/profile-image`;
    const config: RequestInit = {
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

  async uploadGrowPoster(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    const url = `${this.baseURL}/storage/grow-poster`;
    const config: RequestInit = {
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

  async uploadGeneralFile(file: File, folder: string = "general") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const url = `${this.baseURL}/storage/upload`;
    const config: RequestInit = {
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

  async deleteProfileImage(fileName: string) {
    return this.request("/storage/profile-image", {
      method: "DELETE",
      body: JSON.stringify({ fileName }),
    });
  }

  async deleteProductImage(fileName: string) {
    return this.request(
      `/storage/product-image/${encodeURIComponent(fileName)}`,
      {
        method: "DELETE",
      }
    );
  }

  async deleteGrowPosterFile(fileName: string) {
    return this.request(
      `/storage/grow-poster/${encodeURIComponent(fileName)}`,
      {
        method: "DELETE",
      }
    );
  }

  async deleteFile(fileName: string) {
    return this.request(`/storage/file/${encodeURIComponent(fileName)}`, {
      method: "DELETE",
    });
  }

  async getProductImageInfo(fileName: string) {
    return this.request(
      `/storage/product-image/${encodeURIComponent(fileName)}`
    );
  }

  async getGrowPosterInfo(fileName: string) {
    return this.request(`/storage/grow-poster/${encodeURIComponent(fileName)}`);
  }

  async getFileInfo(fileName: string) {
    return this.request(`/storage/file/${encodeURIComponent(fileName)}`);
  }
}

// Create and export a singleton instance
const apiClient = new FinsangMartAPI();

export default apiClient;
export { FinsangMartAPI };
