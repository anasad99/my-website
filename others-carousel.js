(function () {
  var grid = document.getElementById('others-grid');
  var prevBtn = document.querySelector('[data-carousel-prev]');
  var nextBtn = document.querySelector('[data-carousel-next]');
  if (!grid || !prevBtn || !nextBtn) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step() {
    var card = grid.querySelector('.others__card');
    if (!card) return grid.clientWidth;
    var gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  }

  function update() {
    var maxScroll = grid.scrollWidth - grid.clientWidth;
    prevBtn.hidden = grid.scrollLeft <= 1;
    nextBtn.hidden = grid.scrollLeft >= maxScroll - 1;
  }

  prevBtn.addEventListener('click', function () {
    grid.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  nextBtn.addEventListener('click', function () {
    grid.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  grid.addEventListener('scroll', update);
  window.addEventListener('resize', update);
  update();
})();
