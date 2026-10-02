const carouselTrack = document.querySelector(".carrusel-pista");
const carouselSlides = document.querySelectorAll(".carrusel-diapositiva");
const carouselDots = document.querySelectorAll(".carrusel-punto");
const previousButton = document.querySelector(".carrusel-anterior");
const nextButton = document.querySelector(".carrusel-siguiente");

if (carouselTrack && carouselSlides.length && carouselDots.length) {
	let activeSlide = 0;

	function showSlide(index) {
		activeSlide = (index + carouselSlides.length) % carouselSlides.length;
		carouselTrack.style.transform = `translateX(-${activeSlide * 100}%)`;

		carouselDots.forEach((dot, dotIndex) => {
			const isActive = dotIndex === activeSlide;
			dot.classList.toggle("activo", isActive);

			if (isActive) {
				dot.setAttribute("aria-current", "true");
			} else {
				dot.removeAttribute("aria-current");
			}
		});
	}

	previousButton?.addEventListener("click", () => showSlide(activeSlide - 1));
	nextButton?.addEventListener("click", () => showSlide(activeSlide + 1));

	carouselDots.forEach((dot, index) => {
		dot.addEventListener("click", () => showSlide(index));
	});
}

const catalog = window.productosCatalogo || [];
const productGrid = document.querySelector(".productos");

function assetUrl(path) {
	return path.split("/").map(encodeURI).join("/");
}

function formatPrice(price) {
	return price === null ? "Consultar precio" : `$${price.toFixed(2)} USD`;
}

const cartStorageKey = "ris-cart";

function readCart() {
	try {
		const savedCart = JSON.parse(localStorage.getItem(cartStorageKey) || "[]");
		if (!Array.isArray(savedCart)) return [];
		return savedCart
			.filter((item) => catalog.some((product) => product.id === item.id))
			.map((item) => ({
				id: item.id,
				quantity: Math.max(1, Math.min(10, Math.floor(Number(item.quantity) || 1)))
			}));
	} catch {
		return [];
	}
}

function saveCart(items) {
	try {
		localStorage.setItem(cartStorageKey, JSON.stringify(items));
	} catch {
		return;
	}
	window.dispatchEvent(new Event("ris-cart-updated"));
}

function cartDetails() {
	return readCart().map((item) => ({
		...item,
		product: catalog.find((product) => product.id === item.id)
	}));
}

function cartTotals(items) {
	return items.reduce((totals, item) => {
		totals.quantity += item.quantity;
		if (item.product.price === null) {
			totals.pendingPrice = true;
		} else {
			totals.subtotal += item.product.price * item.quantity;
		}
		return totals;
	}, { quantity: 0, subtotal: 0, pendingPrice: false });
}

const cartLayer = document.createElement("div");
cartLayer.className = "carrito-capa";
cartLayer.innerHTML = `
	<div class="carrito-fondo" data-cerrar-carrito></div>
	<aside class="carrito-panel" role="dialog" aria-modal="true" aria-labelledby="carrito-titulo" aria-hidden="true">
		<header class="carrito-encabezado">
			<h2 id="carrito-titulo">Tu carrito</h2>
			<button class="carrito-cerrar" type="button" aria-label="Cerrar carrito">&times;</button>
		</header>
		<div class="carrito-lineas"></div>
		<div class="carrito-vacio" hidden>Tu carrito está vacío.<a href="tienda.html#productos">Seguir comprando</a></div>
		<footer class="carrito-pie">
			<div class="carrito-subtotal"><span>Subtotal</span><strong>$0.00 USD</strong></div>
			<p class="carrito-nota" hidden>El subtotal no incluye productos por cotizar; el total se confirma por WhatsApp.</p>
			<a class="btn-comprar carrito-pagar" href="pago.html" target="_blank" rel="noopener">Pagar pedido</a>
		</footer>
	</aside>`;
document.body.append(cartLayer);

const cartPanel = cartLayer.querySelector(".carrito-panel");
const cartLines = cartLayer.querySelector(".carrito-lineas");

function renderCart() {
	const items = cartDetails();
	const totals = cartTotals(items);
	cartLines.replaceChildren();
	cartLayer.querySelector(".carrito-vacio").hidden = items.length > 0;
	cartLayer.querySelector(".carrito-pie").hidden = items.length === 0;
	cartLayer.querySelector(".carrito-subtotal strong").textContent = `$${totals.subtotal.toFixed(2)} USD`;
	cartLayer.querySelector(".carrito-nota").hidden = !totals.pendingPrice;
	cartLayer.querySelector(".carrito-pagar").setAttribute("aria-label", `Pagar pedido con ${totals.quantity} productos`);

	document.querySelectorAll(".cart-count").forEach((badge) => {
		badge.textContent = String(totals.quantity);
		badge.hidden = totals.quantity === 0;
	});

	items.forEach((item) => {
		const row = document.createElement("article");
		row.className = "carrito-item";
		const image = document.createElement("img");
		image.className = "carrito-item-imagen";
		image.src = assetUrl(item.product.images[0]);
		image.alt = "";
		const body = document.createElement("div");
		body.className = "carrito-item-cuerpo";
		const name = document.createElement("a");
		name.className = "carrito-item-nombre";
		name.href = `producto.html?id=${encodeURIComponent(item.id)}`;
		name.textContent = item.product.name;
		const unitPrice = document.createElement("p");
		unitPrice.className = "carrito-item-precio";
		unitPrice.textContent = formatPrice(item.product.price);
		const controls = document.createElement("div");
		controls.className = "carrito-controles";
		const decrease = document.createElement("button");
		decrease.type = "button";
		decrease.textContent = "−";
		decrease.setAttribute("aria-label", `Reducir ${item.product.name}`);
		decrease.disabled = item.quantity <= 1;
		const quantity = document.createElement("span");
		quantity.textContent = String(item.quantity);
		quantity.setAttribute("aria-label", `${item.quantity} unidades`);
		const increase = document.createElement("button");
		increase.type = "button";
		increase.textContent = "+";
		increase.setAttribute("aria-label", `Aumentar ${item.product.name}`);
		increase.disabled = item.quantity >= 10;
		const remove = document.createElement("button");
		remove.type = "button";
		remove.className = "carrito-quitar";
		remove.textContent = "Quitar";
		remove.setAttribute("aria-label", `Quitar ${item.product.name} del carrito`);
		controls.append(decrease, quantity, increase, remove);
		body.append(name, unitPrice, controls);
		const lineTotal = document.createElement("strong");
		lineTotal.className = "carrito-item-total";
		lineTotal.textContent = item.product.price === null
			? "Por cotizar"
			: `$${(item.product.price * item.quantity).toFixed(2)}`;
		row.append(image, body, lineTotal);
		cartLines.append(row);

		function updateQuantity(change) {
			const nextCart = readCart().map((entry) => entry.id === item.id
				? { ...entry, quantity: Math.max(1, Math.min(10, entry.quantity + change)) }
				: entry);
			saveCart(nextCart);
		}

		decrease.addEventListener("click", () => updateQuantity(-1));
		increase.addEventListener("click", () => updateQuantity(1));
		remove.addEventListener("click", () => saveCart(readCart().filter((entry) => entry.id !== item.id)));
	});
}

function openCart() {
	cartLayer.classList.add("abierto");
	cartPanel.setAttribute("aria-hidden", "false");
	document.body.classList.add("carrito-abierto");
	cartLayer.querySelector(".carrito-cerrar").focus();
}

function closeCart() {
	cartLayer.classList.remove("abierto");
	cartPanel.setAttribute("aria-hidden", "true");
	document.body.classList.remove("carrito-abierto");
}

document.querySelectorAll(".btn-carrito").forEach((button) => button.addEventListener("click", openCart));
cartLayer.querySelector(".carrito-cerrar").addEventListener("click", closeCart);
cartLayer.querySelector(".carrito-fondo").addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") closeCart();
});
window.addEventListener("ris-cart-updated", renderCart);
window.addEventListener("storage", renderCart);
renderCart();

if (productGrid) {
	catalog.forEach((product) => {
		const card = document.createElement("article");
		card.className = "producto-card";

		const imageFrame = document.createElement("div");
		imageFrame.className = "producto-foto";
		const primaryImage = document.createElement("img");
		primaryImage.src = assetUrl(product.images[0]);
		primaryImage.alt = product.name;
		primaryImage.loading = "eager";
		const secondaryImage = document.createElement("img");
		secondaryImage.src = assetUrl(product.images[1] || product.images[0]);
		secondaryImage.alt = "";
		secondaryImage.className = "producto-foto-secundaria";
		secondaryImage.loading = "eager";
		imageFrame.append(primaryImage, secondaryImage);

		const title = document.createElement("h2");
		title.textContent = product.name;
		const price = document.createElement("p");
		price.className = "producto-precio";
		price.textContent = formatPrice(product.price);
		const buyLink = document.createElement("a");
		buyLink.className = "btn-comprar";
		buyLink.href = `producto.html?id=${encodeURIComponent(product.id)}`;
		buyLink.target = "_blank";
		buyLink.rel = "noopener";
		buyLink.textContent = "Comprar";

		card.append(imageFrame, title, price, buyLink);
		productGrid.append(card);
	});

	const searchInput = document.querySelector(".input-busqueda");
	const searchQuery = new URLSearchParams(location.search).get("buscar") || "";
	if (searchInput) searchInput.value = searchQuery;
	function filterProducts() {
		const query = searchInput.value.trim().toLocaleLowerCase("es");
		productGrid.querySelectorAll(".producto-card").forEach((card, index) => {
			card.hidden = !catalog[index].name.toLocaleLowerCase("es").includes(query);
		});
	}
	filterProducts();
	searchInput?.addEventListener("input", filterProducts);
}

document.querySelectorAll(".input-busqueda").forEach((searchInput) => {
	if (productGrid) return;
	searchInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter" && searchInput.value.trim()) {
			location.href = `tienda.html?buscar=${encodeURIComponent(searchInput.value.trim())}#productos`;
		}
	});
});

const detailRoot = document.querySelector(".detalle-producto");

if (detailRoot) {
	const product = catalog.find((item) => item.id === new URLSearchParams(location.search).get("id"));

	if (!product) {
		detailRoot.textContent = "No se encontró este producto.";
	} else {
		const mainImage = detailRoot.querySelector(".detalle-imagen-principal");
		const thumbnails = detailRoot.querySelector(".detalle-miniaturas");
		const description = detailRoot.querySelector(".detalle-descripcion");
		const price = detailRoot.querySelector(".detalle-precio");
		const title = detailRoot.querySelector(".detalle-titulo");
		const previous = detailRoot.querySelector(".detalle-anterior");
		const next = detailRoot.querySelector(".detalle-siguiente");
		const addButton = detailRoot.querySelector(".agregar-carrito");
		let activeImage = 0;

		title.textContent = product.name;
		price.textContent = formatPrice(product.price);
		description.textContent = product.description;

		function showImage(index) {
			activeImage = (index + product.images.length) % product.images.length;
			mainImage.src = assetUrl(product.images[activeImage]);
			mainImage.alt = `${product.name}, imagen ${activeImage + 1}`;
			thumbnails.querySelectorAll("button").forEach((button, buttonIndex) => {
				button.classList.toggle("activo", buttonIndex === activeImage);
				button.setAttribute("aria-pressed", String(buttonIndex === activeImage));
			});
		}

		product.images.forEach((imagePath, index) => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "detalle-miniatura";
			button.setAttribute("aria-label", `Ver imagen ${index + 1}`);
			button.setAttribute("aria-pressed", "false");
			const image = document.createElement("img");
			image.src = assetUrl(imagePath);
			image.alt = "";
			image.loading = "eager";
			button.append(image);
			button.addEventListener("click", () => showImage(index));
			thumbnails.append(button);
		});

		previous.addEventListener("click", () => showImage(activeImage - 1));
		next.addEventListener("click", () => showImage(activeImage + 1));
		showImage(0);

		addButton.addEventListener("click", () => {
			const cart = readCart();
			const existingItem = cart.find((item) => item.id === product.id);
			if (existingItem) {
				if (existingItem.quantity >= 10) {
					addButton.textContent = "Máximo 10 unidades";
					return;
				}
				existingItem.quantity += 1;
			} else {
				cart.push({ id: product.id, quantity: 1 });
			}
			saveCart(cart);
			addButton.textContent = "Agregado al carrito";
			addButton.classList.add("agregado");
			openCart();
		});
	}
}

const checkoutSummary = document.querySelector("#resumen-pedido");

if (checkoutSummary) {
	const checkoutLink = document.querySelector("#whatsapp-pedido");
	const items = cartDetails();
	const totals = cartTotals(items);
	const subtotal = document.querySelector(".pago-subtotal");
	const pendingNote = document.querySelector(".pago-nota-precio");
	const messageLines = ["Hola, quiero finalizar este pedido en RisTecnologia:"];

	checkoutSummary.replaceChildren();
	items.forEach((item) => {
		const row = document.createElement("article");
		row.className = "pago-item";
		const image = document.createElement("img");
		image.src = assetUrl(item.product.images[0]);
		image.alt = "";
		const detail = document.createElement("div");
		detail.className = "pago-item-detalle";
		const name = document.createElement("strong");
		name.textContent = item.product.name;
		const units = document.createElement("span");
		units.textContent = `${item.quantity} ${item.quantity === 1 ? "unidad" : "unidades"}`;
		const lineTotal = document.createElement("strong");
		lineTotal.className = "pago-item-total";
		if (item.product.price === null) {
			lineTotal.textContent = "Por cotizar";
			messageLines.push(`- ${item.quantity} x ${item.product.name}: precio por confirmar`);
		} else {
			const total = item.product.price * item.quantity;
			lineTotal.textContent = `$${total.toFixed(2)} USD`;
			messageLines.push(`- ${item.quantity} x ${item.product.name}: $${item.product.price.toFixed(2)} c/u = $${total.toFixed(2)} USD`);
		}
		detail.append(name, units);
		row.append(image, detail, lineTotal);
		checkoutSummary.append(row);
	});

	subtotal.textContent = `$${totals.subtotal.toFixed(2)} USD`;
	pendingNote.textContent = totals.pendingPrice ? "Hay productos por cotizar; el monto final se confirma por WhatsApp." : "";
	if (items.length) {
		messageLines.push(`Subtotal de productos con precio: $${totals.subtotal.toFixed(2)} USD`);
		if (totals.pendingPrice) messageLines.push("Algunos productos requieren confirmar su precio.");
		messageLines.push("¿Me ayudan a confirmar disponibilidad y envío?");
		checkoutLink.href = `https://wa.me/584123260875?text=${encodeURIComponent(messageLines.join("\n"))}`;
	} else {
		const empty = document.createElement("p");
		empty.className = "pago-vacio";
		empty.textContent = "Todavía no agregaste productos al carrito.";
		checkoutSummary.append(empty);
		checkoutLink.href = "tienda.html#productos";
		checkoutLink.textContent = "Volver a productos";
		checkoutLink.classList.add("deshabilitado");
	}
}
