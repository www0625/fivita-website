const { categories, products } = window.FIVITA_SHOP;

const app = document.querySelector("#shop-app");

const categoryById = new Map(categories.map((category) => [category.id, category]));
const productById = new Map(products.map((product) => [product.id, product]));
const productsBasePath = getProductsBasePath();

function link(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${productsBasePath}${normalizedPath}`;
}

function asset(path) {
  return `${productsBasePath}/${path.replace(/^\/+/, "")}`;
}

function getProductsBasePath() {
  const path = window.location.pathname.replace(/\/+$/, "");
  const productsIndex = path.indexOf("/products");
  return productsIndex === -1 ? "" : path.slice(0, productsIndex);
}

function getRoute() {
  const fullPath = window.location.pathname.replace(/\/+$/, "");
  const path = fullPath.slice(productsBasePath.length) || "/products";

  if (path === "/products") return { type: "products" };

  const categoryMatch = path.match(/^\/products\/category\/([^/]+)$/);
  if (categoryMatch) return { type: "category", categoryId: decodeURIComponent(categoryMatch[1]) };

  const productMatch = path.match(/^\/products\/item\/([^/]+)$/);
  if (productMatch) return { type: "item", productId: decodeURIComponent(productMatch[1]) };

  return { type: "not-found" };
}

function renderShell(content) {
  app.innerHTML = content;
  app.classList.remove("is-loaded");
  window.requestAnimationFrame(() => app.classList.add("is-loaded"));
}

function renderProductsHome() {
  document.title = "全部商品 | FIVITA";
  renderShell(`
    <section class="shop-section" aria-label="一级类目">
      <div class="primary-category-list">
        ${categories.map(renderCategoryCard).join("")}
      </div>
    </section>
  `);
}

function renderCategoryCard(category) {
  return `
    <a class="primary-category-card" href="${link(`/products/category/${category.id}`)}">
      <img src="${asset(category.image)}" alt="${category.name}" />
    </a>
  `;
}

function renderCategoryPage(categoryId) {
  const category = categoryById.get(categoryId);
  if (!category) {
    renderNotFound();
    return;
  }

  const categoryProducts = products.filter((product) => product.category === category.id);
  const groups = category.subcategories.map((subcategory) => ({
    name: subcategory,
    products: categoryProducts.filter((product) => product.subcategory === subcategory),
  }));

  document.title = `${category.name} | FIVITA`;
  renderShell(`
    <nav class="shop-breadcrumb" aria-label="面包屑">
      <a href="${link("/products")}">全部商品</a>
      <span>${category.name}</span>
    </nav>

    <section class="category-title-block" aria-labelledby="category-title">
      <h1 id="category-title">${category.name}</h1>
      <p>${category.summary}</p>
    </section>

    <section class="subcategory-stack" aria-label="${category.name}商品">
      ${groups.map(renderProductGroup).join("")}
    </section>
  `);
}

function renderProductGroup(group) {
  return `
    <section class="subcategory-group" aria-labelledby="${slugify(group.name)}">
      <div class="subcategory-heading">
        <h2 id="${slugify(group.name)}">${group.name}</h2>
      </div>
      <div class="shop-product-grid">
        ${
          group.products.length
            ? group.products.map(renderProductCard).join("")
            : `<p class="empty-note">这个子类目商品筹备中。</p>`
        }
      </div>
    </section>
  `;
}

function renderProductCard(product) {
  return `
    <a class="shop-product-card" href="${link(`/products/item/${product.id}`)}">
      <img src="${asset(product.image)}" alt="${product.name}" />
      <span>${product.name}</span>
    </a>
  `;
}

function renderItemPage(productId) {
  const product = productById.get(productId);
  if (!product) {
    renderNotFound();
    return;
  }

  const category = categoryById.get(product.category);
  const ingredientText = product.ingredients || product.description;
  const relatedProducts = products.filter(
    (item) =>
      item.category === product.category &&
      item.subcategory === product.subcategory &&
      item.id !== product.id
  );

  document.title = `${product.name} | FIVITA`;
  renderShell(`
    <nav class="shop-breadcrumb" aria-label="面包屑">
      <a href="${link("/products")}">全部商品</a>
      <a href="${link(`/products/category/${category.id}`)}">${category.name}</a>
      <span>${product.name}</span>
    </nav>

    <article class="product-detail">
      <div class="product-detail-image">
        <img src="${asset(product.image)}" alt="${product.name}" />
      </div>
      <div class="product-detail-copy">
        <p class="eyebrow">${category.name} / ${product.subcategory}</p>
        <h1>${product.name}</h1>
        <p>${ingredientText}</p>
        <div class="tag-list">
          ${product.tags.map((tag) => `<span>${tag}</span>`).join("")}
        </div>
        <button class="button" type="button">加入购物车</button>
      </div>
    </article>

    <section class="shop-section related-section" aria-labelledby="related-title">
      <div class="subcategory-heading">
        <h2 id="related-title">同系统商品</h2>
      </div>
      <div class="related-product-strip">
        ${
          relatedProducts.length
            ? relatedProducts.map(renderProductCard).join("")
            : `<p class="empty-note">这个二级类目暂无其他商品。</p>`
        }
      </div>
    </section>
  `);
}

function renderNotFound() {
  document.title = "页面未找到 | FIVITA";
  renderShell(`
    <section class="shop-hero" aria-labelledby="not-found-title">
      <p class="eyebrow">未找到页面</p>
      <h1 id="not-found-title">这个商品路径暂时不存在</h1>
      <p>请回到全部商品，重新选择想探索的健康系统。</p>
      <a class="button" href="${link("/products")}">返回全部商品</a>
    </section>
  `);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "");
}

function renderCurrentRoute() {
  const route = getRoute();

  if (route.type === "products") renderProductsHome();
  if (route.type === "category") renderCategoryPage(route.categoryId);
  if (route.type === "item") renderItemPage(route.productId);
  if (route.type === "not-found") renderNotFound();
}

document.addEventListener("click", (event) => {
  const anchor = event.target.closest("a");
  if (!anchor) return;

  const url = new URL(anchor.href);
  if (
    url.origin !== window.location.origin ||
    !url.pathname.startsWith(`${productsBasePath}/products`)
  ) {
    return;
  }

  event.preventDefault();
  window.history.pushState({}, "", url.pathname);
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderCurrentRoute();
});

window.addEventListener("popstate", renderCurrentRoute);
renderCurrentRoute();
