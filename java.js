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
