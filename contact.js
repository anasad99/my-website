(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var status = document.getElementById('form-status');
  var fields = ['name', 'email', 'message'];

  function setError(id, show) {
    var input = document.getElementById(id);
    var error = document.getElementById(id + '-error');
    error.hidden = !show;
    input.setAttribute('aria-invalid', show ? 'true' : 'false');
    if (show) {
      input.setAttribute('aria-describedby', id + '-error');
    } else {
      input.removeAttribute('aria-describedby');
    }
  }

  function validate() {
    var firstBad = null;

    fields.forEach(function (id) {
      var input = document.getElementById(id);
      var bad = !input.value.trim() || (input.type === 'email' && !input.checkValidity());
      setError(id, bad);
      if (bad && !firstBad) firstBad = input;
    });

    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  // Clear an error as soon as the person starts fixing it.
  fields.forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      if (!document.getElementById(id + '-error').hidden) setError(id, false);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var name = document.getElementById('name').value.trim();
    var email = document.getElementById('email').value.trim();
    var message = document.getElementById('message').value.trim();
    var endpoint = form.dataset.endpoint;

    if (endpoint) {
      status.textContent = 'Sending…';

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          status.textContent = 'Thanks — your message is on its way.';
        })
        .catch(function () {
          status.textContent =
            'That didn\u2019t send. Email anasadacc@gmail.com directly and I\u2019ll pick it up.';
        });

      return;
    }

    // No endpoint configured: hand off to the person's email client.
    var subject = 'Project enquiry from ' + name;
    var body = message + '\n\n\u2014\n' + name + '\n' + email;

    window.location.href =
      'mailto:' + form.dataset.mailto +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    status.textContent = 'Opening your email app…';
  });
})();
