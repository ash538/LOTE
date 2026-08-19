// Public site behaviour: scroll reveals, sticky header, mobile nav and the
// enquiry form submission.
(function () {
  'use strict';

  // --- Scroll reveals ------------------------------------------------------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // --- Sticky header state -------------------------------------------------
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // --- Mobile nav ----------------------------------------------------------
  var toggle = document.querySelector('[data-nav-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      mobileNav.hidden = open;
    });
    mobileNav.addEventListener('click', function (event) {
      if (event.target.tagName !== 'A') return;
      toggle.setAttribute('aria-expanded', 'false');
      mobileNav.hidden = true;
    });
  }

  // --- Enquiry form --------------------------------------------------------
  document.querySelectorAll('[data-enquiry-form]').forEach(function (form) {
    var status = form.querySelector('[data-form-status]');
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      form.querySelectorAll('.has-error').forEach(function (f) { f.classList.remove('has-error'); });
      form.querySelectorAll('.field-error').forEach(function (e) { e.remove(); });

      var payload = {};
      var invalid = null;

      form.querySelectorAll('.field').forEach(function (field) {
        var inputs = field.querySelectorAll('input, select, textarea');
        if (!inputs.length) return;
        var first = inputs[0];
        var name = first.name;
        var value;

        if (first.type === 'checkbox') {
          value = Array.prototype.filter.call(inputs, function (i) { return i.checked; })
            .map(function (i) { return i.value; });
        } else {
          value = first.value.trim();
        }

        var empty = Array.isArray(value) ? value.length === 0 : value === '';
        if (first.required && empty) {
          field.classList.add('has-error');
          var msg = document.createElement('p');
          msg.className = 'field-error';
          msg.textContent = 'This field is required.';
          field.appendChild(msg);
          if (!invalid) invalid = first;
        }
        if (first.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          field.classList.add('has-error');
          var emailMsg = document.createElement('p');
          emailMsg.className = 'field-error';
          emailMsg.textContent = 'Enter a valid email address.';
          field.appendChild(emailMsg);
          if (!invalid) invalid = first;
        }
        payload[name] = value;
      });

      if (invalid) {
        status.textContent = 'Please check the highlighted fields.';
        status.className = 'form-status is-error';
        invalid.focus();
        return;
      }

      var honeypot = form.querySelector('.hp-field');
      button.disabled = true;
      status.className = 'form-status';
      status.textContent = 'Sending…';

      fetch('/api/site/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: payload,
          source_page: window.location.pathname,
          company_website: honeypot ? honeypot.value : '',
        }),
      })
        .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
        .then(function (result) {
          if (!result.ok) throw new Error(result.body.error || 'Something went wrong.');
          form.querySelector('.form-grid').hidden = true;
          button.hidden = true;
          status.className = 'form-status is-success';
          status.textContent = result.body.message;
        })
        .catch(function (error) {
          button.disabled = false;
          status.className = 'form-status is-error';
          status.textContent = error.message + ' Please try again, or email us directly.';
        });
    });
  });
})();
