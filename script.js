/* global pdfjsLib, St */

// указываем воркер PDF.js (обязательно)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js';

// путь к вашему PDF
const BOOK_URL = 'assets/book.pdf';

// элементы интерфейса
const container = document.getElementById('flipbook');
const pageCounter = document.getElementById('page');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

// инициализация flip-книги
const pageFlip = new St.PageFlip(container, {
  width: 900,        // базовый размер страницы (px)
  height: 1273,      // под A4 (соотношение ~1:1.414)
  size: 'stretch',   // адаптив под контейнер
  minWidth: 315,
  maxWidth: 2000,
  minHeight: 420,
  maxHeight: 2500,
  showCover: false,  // если первая страница — обложка, можно true
  drawShadow: true,
  flippingTime: 600, // скорость перелистывания (мс)
  useMouseEvents: true,
  usePortrait: true, // на узких экранах — одна страница
  autoSize: true
});

// рендер PDF в изображения (data URLs), чтобы загрузить в PageFlip
async function renderPDFtoImages(url) {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const images = [];

  // масштаб под плотность пикселей для чёткости
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // ограничим до 2х
  const scale = 2 * dpr;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // JPEG 92%: резко и умеренно по размеру, можно поменять на PNG
    const url = canvas.toDataURL('image/jpeg', 0.92);
    images.push(url);
  }

  return images;
}

function bindControls() {
  prevBtn.addEventListener('click', () => pageFlip.flipPrev());
  nextBtn.addEventListener('click', () => pageFlip.flipNext());

  pageFlip.on('flip', (e) => {
    const current = e.data + 1;
    const total = pageFlip.getPageCount();
    pageCounter.textContent = `${current} / ${total}`;
    prevBtn.disabled = current <= 1;
    nextBtn.disabled = current >= total;
  });
}

(async function main() {
  try {
    const imgs = await renderPDFtoImages(BOOK_URL);
    pageFlip.loadFromImages(imgs);
    pageCounter.textContent = `1 / ${imgs.length}`;
    prevBtn.disabled = true;
    nextBtn.disabled = imgs.length <= 1;
    bindControls();
  } catch (err) {
    container.innerHTML = `<div style="padding:1rem;color:#f66">
      Ошибка загрузки/рендера PDF: ${err.message}
    </div>`;
    console.error(err);
  }
})();
