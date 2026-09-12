(function () {
  var form = document.querySelector('form.work-form');
  if (!form) return;

  var fileInput = document.getElementById('images');
  var submitBtn = form.querySelector('button[type="submit"]');
  var status = document.createElement('p');
  status.className = 'hint';
  form.appendChild(status);

  // Vercel (and most serverless hosts) reject requests over ~4.5MB before
  // they ever reach the app. Photos straight off a phone or camera blow
  // past that easily, so downscale and re-encode each one in the browser
  // before upload — this also just makes every deploy target faster.
  function compressImage(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          URL.revokeObjectURL(img.src);
          if (blob) resolve(blob); else reject(new Error('Could not process ' + file.name));
        }, 'image/jpeg', quality);
      };
      img.onerror = function () {
        URL.revokeObjectURL(img.src);
        reject(new Error(file.name + ' isn’t a format the browser can open (try JPG or PNG).'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async function compressAll(files, maxDim, quality) {
    var blobs = [];
    for (var i = 0; i < files.length; i++) {
      blobs.push(await compressImage(files[i], maxDim, quality));
    }
    return blobs;
  }

  function totalSize(blobs) {
    return blobs.reduce(function (sum, b) { return sum + b.size; }, 0);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    var files = fileInput ? Array.prototype.slice.call(fileInput.files) : [];
    submitBtn.disabled = true;

    try {
      var blobs = [];
      if (files.length) {
        status.textContent = 'Compressing ' + files.length + ' image' + (files.length === 1 ? '' : 's') + '…';
        blobs = await compressAll(files, 1800, 0.82);

        // Safety net for a batch of large/detailed photos: if it's still
        // too big for a single request, compress harder and try once more.
        if (totalSize(blobs) > 3.5 * 1024 * 1024) {
          status.textContent = 'Still large — compressing further…';
          blobs = await compressAll(files, 1400, 0.6);
        }
      }

      var formData = new FormData(form);
      formData.delete('images');
      blobs.forEach(function (blob, i) {
        formData.append('images', blob, 'image-' + (i + 1) + '.jpg');
      });

      status.textContent = 'Saving…';
      var res = await fetch(form.action, { method: 'POST', body: formData });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      // A non-redirect response means the server re-rendered this page
      // with a validation error — show that instead of guessing at one.
      var html = await res.text();
      document.open();
      document.write(html);
      document.close();
    } catch (err) {
      status.textContent = err.message || 'Something went wrong preparing the images.';
      submitBtn.disabled = false;
    }
  });
})();
