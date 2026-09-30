(function () {
  var form = document.querySelector('form.work-form');
  if (!form) return;

  // Sent as a few images per request rather than all at once — a serverless
  // host (Vercel) rejects any single request over ~4.5MB before it even
  // reaches the app, and enough compressed photos together can still cross
  // that even though each one alone is small.
  var BATCH_SIZE = 3;
  var BATCH_SAFE_BYTES = 3.8 * 1024 * 1024;

  var fileInput = document.getElementById('images');
  var submitBtn = form.querySelector('button[type="submit"]');
  var status = document.createElement('p');
  status.className = 'hint';
  form.appendChild(status);

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

  function chunk(arr, size) {
    var out = [];
    for (var i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  function imagesFormData(blobs) {
    var fd = new FormData();
    blobs.forEach(function (blob, i) {
      fd.append('images', blob, 'image-' + (i + 1) + '.jpg');
    });
    return fd;
  }

  // Throws either an Error with .validationHtml (server re-rendered the page
  // with a field error — the caller redisplays it) or a plain Error.message.
  async function postBatch(url, formData) {
    var res = await fetch(url, { method: 'POST', body: formData });
    if (res.ok) return res.json();

    var contentType = res.headers.get('content-type') || '';
    if (contentType.indexOf('application/json') !== -1) {
      var body = await res.json();
      throw new Error(body.error || 'Upload failed.');
    }
    var err = new Error('validation error');
    err.validationHtml = await res.text();
    throw err;
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
      }

      var fileBatches = chunk(files, BATCH_SIZE);
      var blobBatches = chunk(blobs, BATCH_SIZE);
      if (blobBatches.length === 0) blobBatches.push([]);

      // Re-compress harder any individual batch that's still too big to
      // send safely in one request.
      for (var b = 0; b < blobBatches.length; b++) {
        if (totalSize(blobBatches[b]) > BATCH_SAFE_BYTES) {
          status.textContent = 'Compressing batch ' + (b + 1) + ' further…';
          blobBatches[b] = await compressAll(fileBatches[b], 1400, 0.6);
        }
      }

      var baseData = new FormData(form);
      baseData.delete('images');
      blobBatches[0].forEach(function (blob, i) {
        baseData.append('images', blob, 'image-' + (i + 1) + '.jpg');
      });

      status.textContent = blobBatches.length > 1
        ? 'Uploading images (1/' + blobBatches.length + ')…'
        : 'Saving…';
      var result = await postBatch(form.action, baseData);
      var slug = result.slug;

      for (var i = 1; i < blobBatches.length; i++) {
        status.textContent = 'Uploading images (' + (i + 1) + '/' + blobBatches.length + ')…';
        await postBatch('/admin/works/' + slug + '/images', imagesFormData(blobBatches[i]));
      }

      window.location.href = '/admin';
    } catch (err) {
      if (err && err.validationHtml) {
        document.open();
        document.write(err.validationHtml);
        document.close();
        return;
      }
      status.textContent = (err && err.message) ||
        'Something went wrong. If some images already uploaded, check /admin — the work may have been saved with what succeeded so far.';
      submitBtn.disabled = false;
    }
  });
})();
