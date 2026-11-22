const header = document.querySelector('.header');
const galleryView = document.getElementById('gallery-view');
const detailView = document.getElementById('detail-view');
const headerBtn = document.querySelector('.header__btn');
const logo = document.querySelector('.header__logo');
const heroGalleryItems = document.querySelector('.hero__items');
const mainTitle = document.getElementById('main-title');
let dataObj;
let iso;
let currentIndex = 0;
let galleryScrollY = sessionStorage.getItem('galleryScrollY') ? Number(sessionStorage.getItem('galleryScrollY')) : 0;
let detailScrollY = sessionStorage.getItem('detailScrollY') ? Number(sessionStorage.getItem('detailScrollY')) : 0;
let lastFocusedElement = null;

/* === Prevent browser native scroll restoration ===
 * - Forces manual scroll control so saved galleryScrollY takes precedence
 * - Avoids browser fighting scroll position on back/forward
 */
if ('scrollRestoration' in history) {
	history.scrollRestoration = 'manual';
}

/* === Header scroll effect ===
 * - Adds 'window-scroll' class to header when page is scrolled down
 * - Used for styling header appearance on scroll
 */
if (header) {
	window.addEventListener('scroll', () => {
		header.classList.toggle('window-scroll', window.scrollY > 0);
		if (detailView.classList.contains('hidden')) {
			galleryScrollY = window.scrollY;
			sessionStorage.setItem('galleryScrollY', String(galleryScrollY));
		} else {
			detailScrollY = window.scrollY;
			sessionStorage.setItem('detailScrollY', String(detailScrollY));
		}
	});
}

/* === Fetch gallery data from data.json ===
 * - Loads painting data asynchronously
 * - Builds gallery layout after data arrives
 * - Restores detail view from URL if ?detail= parameter exists
 * - Otherwise shows gallery view
 */
async function fetchData() {
	try {
		const response = await fetch('data.json');
		if (!response.ok) throw new Error(`${response.status}`);
		dataObj = await response.json();
		buildHeroGalleryLayout();
		const params = new URLSearchParams(window.location.search);
		const detailParam = params.get('detail');

		if (detailParam !== null) {
			const detailIndex = Number(detailParam);
			if (!isNaN(detailIndex) && dataObj[detailIndex]) {
				currentIndex = detailIndex;
				showDetail(dataObj[detailIndex]);
				updateDetailUI();
			} else {
				showGallery();
			}
		} else {
			showGallery();
		}
	} catch (err) {
		console.error('Failed to load gallery data:', err);
		renderError();
	}
}

fetchData();

/* === Show gallery view ===
 * - Displays the painting grid, hides detail view
 * - Restores saved scroll position so user returns to where they left off
 * - Triggers Isotope layout recalculation for proper masonry grid
 */
function showGallery() {
	galleryView.classList.remove('hidden');
	galleryView.setAttribute('aria-hidden', 'false');
	galleryView.inert = false;
	// galleryView.focus({ preventScroll: true });
	if (detailView.contains(document.activeElement)) {
		document.activeElement.blur();
	}
	detailView.classList.add('hidden');
	detailView.setAttribute('aria-hidden', 'true');
	detailView.inert = true;
	headerBtn.textContent = 'Start slideshow';
	mainTitle.textContent = 'Galleria slideshow site';

	if (iso) {
		requestAnimationFrame(() => {
			iso.layout();
		});
	}
	window.scrollTo(0, galleryScrollY);
}

/* === Show detail view for a specific painting ===
 * - Hides gallery, displays painting detail with image, info, controls
 * - Scrolls page to top so detail view starts at the top
 * - Accepts a painting object from dataObj
 */
function showDetail(item) {
	detailView.classList.remove('hidden');
	detailView.setAttribute('aria-hidden', 'false');
	detailView.inert = false;
	// detailView.focus({ preventScroll: true });
	if (galleryView.contains(document.activeElement)) {
		document.activeElement.blur();
	}
	galleryView.classList.add('hidden');
	galleryView.setAttribute('aria-hidden', 'true');
	galleryView.inert = true;
	headerBtn.textContent = 'Stop slideshow';
	mainTitle.textContent = item.name;
	const detailLayout = `
				<div class="detail__main">
					<div class="detail__container">
						<div class="detail__wrapper">
							<div class="detail__content content-detail">
								<div class="content-detail__image-wrapper">
									<picture class="content-detail__main-image object-fit">
										<source srcset="${item.images.hero.large}" media="(min-width: 48rem)">
										<img src="${item.images.hero.small}" alt="${item.name} by ${item.artist.name}">
									</picture>
									<button type="button" class="content-detail__button-overlay">
										<span class="content-detail__button-overlay-icon icon-view-image" aria-hidden="true"></span>
										<span class="content-detail__button-overlay-text">VIEW IMAGE</span>
									</button>
								</div>
								<div class="content-detail__info-wrapper">
									<div class="content-detail__info-body">
										<h2 class="content-detail__info-title">${item.name}</h2>
										<div class="content-detail__info-artist-name">${item.artist.name}</div>
									</div>
									<figure class="content-detail__info-artist-image">
										<img src="${item.artist.image}" alt="${item.artist.name}">
									</figure>
								</div>
							</div>
							<div class="detail__description description-detail">
								<div class="description-detail__wrapper">
									<div class="description-detail__text" data-year="${item.year}">
										<p>${item.description}</p>
									</div>
									<a href="${item.source}" class="description-detail__source" target="_blank" rel="noopener noreferrer">GO TO SOURCE</a>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="detail__progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100">
					<span style="width: 5%"></span>
				</div>
				<div class="detail__controls controls-detail">
					<div class="controls-detail__container">
						<div class="controls-detail__wrapper">
							<div class="controls-detail__info">
								<h3 class="controls-detail__title">${item.name}</h3>
								<div class="controls-detail__artist-name">${item.artist.name}</div>
							</div>
							<div class="controls-detail__buttons">
								<button type="button" class="controls-detail__button controls-detail__button--prev" aria-label="Navigate to previous image">
									<span class="controls-detail__button-icon icon-back-button" aria-hidden="true"></span>
								</button>
								<button type="button" class="controls-detail__button controls-detail__button--next" aria-label="Navigate to next image">
									<span class="controls-detail__button-icon icon-next-button" aria-hidden="true"></span>
								</button>
							</div>
						</div>
					</div>
				</div>
		`;
	detailView.innerHTML = detailLayout;
	// window.scrollTo({ top: 0, behavior: 'auto' });
	window.scrollTo(0, detailScrollY);
}

/*=== Build dynamically hero section items from retrieved data ===*/
function buildHeroGalleryLayout() {
	const heroGalleryLayout = dataObj
		.map((item, index) => {
			return `
			<div class="hero__item item-hero">
				<a href="#" class="item-hero__link" data-index="${index}" aria-label="View ${item.name}">
					<figure class="item-hero__card object-fit">
						<picture class="item-hero__image">
        			<source srcset="${item.images.thumbnail}" media="(min-width: 48rem)">
       		 		<img src="${item.images.gallery}" alt="${item.name} by ${item.artist.name}">
    				</picture>
						<figcaption class="item-hero__caption">
								<h2 class="item-hero__title">${item.name}</h2>
								<div class="item-hero__artist">${item.artist.name}</div>
						</figcaption>
					</figure>
				</a>
			</div>
		`;
		})
		.join('');
	heroGalleryItems.innerHTML = heroGalleryLayout;

	const gridSizer = document.createElement('div');
	gridSizer.className = 'grid-sizer';
	heroGalleryItems.prepend(gridSizer);
	gridInit();
	// window.addEventListener('resize', () => {
	// 	if (iso) {
	// 		iso.layout();
	// 	}
	// });
	let resizeTimer;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			if (iso) {
				requestAnimationFrame(() => {
					iso.layout();
				});
			}
		}, 150); // wait 150ms after rotation settles
	});
}

/* === Build dynamically view image popup === */
function buildViewImageLayout() {
	const item = dataObj[currentIndex];
	const layout = `
        <div class="view-image" role="dialog" aria-modal="true" aria-label="View image">
            <div class="view-image__wrapper">
							<button type="button" class="view-image__close" aria-label="Close">Close</button>
							<figure class="view-image__figure">
									<img src="${item.images.hero.large}" alt="${item.name} by ${item.artist.name}">
							</figure>
						</div>
        </div>
    `;
	document.body.insertAdjacentHTML('beforeend', layout);
}

/*=== Open/close view image popup === */
function openViewImage() {
	const existingViewImage = document.querySelector('.view-image');
	if (existingViewImage) existingViewImage.remove();

	buildViewImageLayout();
	const popup = document.querySelector('.view-image');
	popup.style.display = 'flex';
	popup.setAttribute('aria-hidden', 'false');
	document.body.style.overflow = 'hidden';

	// Remember where focus was, then move focus into the dialog
	lastFocusedElement = document.activeElement;
	const closeBtn = popup.querySelector('.view-image__close');
	// Let the DOM settle, then move focus into the dialog
	requestAnimationFrame(() => {
		if (closeBtn) closeBtn.focus();
	});

	// Trap Tab inside the popup
	popup.addEventListener('keydown', trapFocus);
}

function closeViewImage() {
	const popup = document.querySelector('.view-image');
	if (popup) {
		popup.style.display = 'none';
		popup.setAttribute('aria-hidden', 'true');
		popup.removeEventListener('keydown', trapFocus);
	}
	document.body.style.overflow = '';

	// Return focus to the element that opened the dialog
	if (lastFocusedElement && document.contains(lastFocusedElement)) {
		lastFocusedElement.focus();
		lastFocusedElement = null;
	}
}

/* === Closing view image by clicking close button or empty space === */
document.body.addEventListener('click', e => {
	const closeBtn = e.target.closest('.view-image__close');
	const backdrop = e.target.closest('.view-image');
	if (closeBtn || (backdrop && e.target === backdrop)) {
		closeViewImage();
	}
});

/*=== Render Error State ===*/
function renderError() {
	heroGalleryItems.innerHTML = `
    <div class="hero__error">
      <p>Something went wrong 😟 We're working on it</p>
    </div>
  `;
}

/*=== Build masonry grid ===*/
function gridInit() {
	const items = document.querySelector('.hero__items');
	imagesLoaded(items, () => {
		iso = new Isotope(items, {
			itemSelector: '.item-hero',
			percentPosition: true,
			masonry: {
				columnWidth: '.grid-sizer',
				// gutter: 40,
			},
		});
		// window.scrollTo(0, galleryScrollY);
	});
}

/* === Click on gallery painting ===
 * - Opens detail view for the clicked painting
 * - Saves current gallery scroll position before navigating away
 * - Updates URL with ?detail=<index> for direct linking and reload persistence
 */
heroGalleryItems.addEventListener('click', e => {
	const link = e.target.closest('.item-hero__link');
	if (!link) return;
	const index = link.dataset.index;
	const item = dataObj[index];
	e.preventDefault();
	currentIndex = Number(index);
	galleryScrollY = window.scrollY;
	sessionStorage.setItem('galleryScrollY', String(galleryScrollY));
	detailScrollY = 0;
	showDetail(item);
	updateDetailUI();
	history.pushState(null, '', '?detail=' + index);
});

/* === Header Start/Stop slideshow button ===
 * - When gallery is open: starts slideshow from first painting
 * - When detail view is open: returns to gallery
 * - Guards against clicks before data is loaded
 */
headerBtn.addEventListener('click', () => {
	if (!dataObj?.length) return;
	if (detailView.classList.contains('hidden')) {
		currentIndex = 0;
		galleryScrollY = window.scrollY;
		sessionStorage.setItem('galleryScrollY', String(galleryScrollY));
		showDetail(dataObj[0]);
		updateDetailUI();
		history.pushState(null, '', '?detail=0');
	} else {
		showGallery();
		history.pushState(null, '', window.location.pathname);
	}
});

/* === Returning to gallery view by clicking on logo ===
 * - Only works when detail view is open
 * - Prevents default anchor jump
 * - Removes ?detail= from URL so reload shows gallery
 * - Restores previous gallery scroll position via showGallery()
 */
logo.addEventListener('click', e => {
	e.preventDefault();
	if (!detailView.classList.contains('hidden')) {
		showGallery();
		history.pushState(null, '', window.location.pathname);
	}
});

/* === Prev/Next navigation buttons ===
 * - Event delegation on detailView (survives innerHTML rebuilds)
 * - Navigates between paintings using arrow controls
 * - Updates URL, progress bar, and button disabled states at boundaries
 */
detailView.addEventListener('click', e => {
	const viewImageButton = e.target.closest('.content-detail__button-overlay');
	if (viewImageButton) {
		openViewImage();
		return;
	}
	const prevButton = e.target.closest('.controls-detail__button--prev');
	const nextButton = e.target.closest('.controls-detail__button--next');

	if (prevButton) {
		currentIndex = currentIndex - 1;
	} else if (nextButton) {
		currentIndex = currentIndex + 1;
	} else {
		return;
	}

	if (currentIndex < 0 || currentIndex >= dataObj.length) {
		currentIndex = currentIndex < 0 ? 0 : dataObj.length - 1;
		return;
	}

	// galleryScrollY = window.scrollY;
	detailScrollY = 0;
	showDetail(dataObj[currentIndex]);
	updateDetailUI();
	history.pushState(null, '', '?detail=' + currentIndex);
});

/* === Keyboard navigation in detail view ===
 * - Arrow Left/Right: navigate between paintings
 * - Escape: return to gallery view
 * - Only active when detail view is visible
 * - Prevents page scroll while navigating slides
 */
window.addEventListener('keydown', e => {
	if (detailView.classList.contains('hidden')) return;

	const popup = document.querySelector('.view-image');
	const popupIsOpen = popup && popup.style.display === 'flex';

	if (popupIsOpen) {
		if (e.key === 'Escape') {
			closeViewImage();
		}
		return;
	}

	e.preventDefault();
	if (e.key === 'ArrowLeft') {
		currentIndex = currentIndex - 1;
	} else if (e.key === 'ArrowRight') {
		currentIndex = currentIndex + 1;
	} else if (e.key === 'Escape') {
		showGallery();
		history.pushState(null, '', window.location.pathname);
		return;
	}

	if (currentIndex < 0 || currentIndex >= dataObj.length) {
		currentIndex = currentIndex < 0 ? 0 : dataObj.length - 1;
		return;
	}
	detailScrollY = 0;
	showDetail(dataObj[currentIndex]);
	updateDetailUI();
	history.pushState(null, '', '?detail=' + currentIndex);
});

/* === Update detail view UI state ===
 * - Disables prev button at first image, next at last image
 * - Adds is-start / is-last classes for styling
 * - Updates progress bar width based on current position
 */
function updateDetailUI() {
	const prevBtn = detailView.querySelector('.controls-detail__button--prev');
	const nextBtn = detailView.querySelector('.controls-detail__button--next');
	const progressBar = detailView.querySelector('.detail__progress-bar');
	const progressBarSpan = detailView.querySelector('.detail__progress-bar span');

	if (prevBtn) {
		prevBtn.disabled = currentIndex === 0;
		prevBtn.classList.toggle('is-start', currentIndex === 0);
	}
	if (nextBtn) {
		nextBtn.disabled = currentIndex === dataObj.length - 1;
		nextBtn.classList.toggle('is-last', currentIndex === dataObj.length - 1);
	}
	if (progressBar && progressBarSpan) {
		const progressValue = Math.round(((currentIndex + 1) / dataObj.length) * 100);
		progressBar.setAttribute('aria-valuenow', progressValue);
		progressBarSpan.style.width = progressValue + '%';
	}
}

/* === Trap Tab focus inside view-image popup ===
 * - Intercepts Tab while the image lightbox is open
 * - Cycles focus between focusable elements inside .view-image only
 * - Prevents Tab from escaping to page content behind the backdrop
 * - Wraps from last to first element (Shift+Tab reverses direction)
 */
function trapFocus(e) {
	if (e.key !== 'Tab') return;

	const popup = document.querySelector('.view-image');
	if (!popup) return;

	const focusable = popup.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
	if (focusable.length === 0) return;

	e.preventDefault();

	const current = Array.from(focusable).indexOf(document.activeElement);
	const next = e.shiftKey ? current - 1 : current + 1;

	if (next >= focusable.length) {
		focusable[0].focus();
	} else if (next < 0) {
		focusable[focusable.length - 1].focus();
	} else {
		focusable[next].focus();
	}
}

/* === Browser back/forward navigation ===
 * - Handles popstate event when user clicks browser back/forward
 * - Reads ?detail= from URL and shows matching view
 * - Ensures gallery returns to saved scroll position on back
 */
window.addEventListener('popstate', () => {
	const popup = document.querySelector('.view-image');
	if (popup && popup.style.display === 'flex') {
		closeViewImage();
		return; // Don't navigate, just close the popup
	}

	const params = new URLSearchParams(window.location.search);
	const detailParam = params.get('detail');

	if (detailParam !== null) {
		const detailIndex = Number(detailParam);
		if (!isNaN(detailIndex) && dataObj[detailIndex]) {
			currentIndex = detailIndex;
			showDetail(dataObj[detailIndex]);
			updateDetailUI();
			window.scrollTo({ top: 0, behavior: 'auto' });
		} else {
			showGallery();
		}
	} else {
		showGallery();
	}
});
