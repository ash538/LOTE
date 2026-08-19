// Scroll progress, mobile nav, reveal animations and the enquiry form —
// the prototype's behaviour, with the form wired to the real backend.
(function () {
  'use strict';

  // --- Scroll progress -----------------------------------------------------
  var progress = document.querySelector('#progress');
  if (progress) {
    var updateProgress = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  // --- Mobile nav ----------------------------------------------------------
  var menu = document.querySelector('#menu');
  var mobileNav = document.querySelector('#mobile-nav');
  if (menu && mobileNav) {
    menu.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      menu.textContent = open ? '×' : '☰';
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('is-open');
        menu.textContent = '☰';
        menu.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Reveal on scroll ----------------------------------------------------
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  // --- Current section in the nav -----------------------------------------
  var sections = Array.prototype.filter.call(document.querySelectorAll('main section[id]'), function (s) { return s.id; });
  var navLinks = document.querySelectorAll('.nav-links a[href*="#"]');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          var target = link.getAttribute('href').split('#')[1];
          link.classList.toggle('is-current', target === entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (section) { spy.observe(section); });
  }

  // --- Enquiry form --------------------------------------------------------
  document.querySelectorAll('[data-enquiry-form]').forEach(function (form) {
    var status = form.querySelector('[data-form-status]');
    var button = form.querySelector('button[type="submit"]');
    var success = form.parentNode.querySelector('[data-form-success]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      form.querySelectorAll('.has-error').forEach(function (f) { f.classList.remove('has-error'); });
      form.querySelectorAll('.field-error').forEach(function (e) { e.remove(); });

      var payload = {};
      var invalid = null;

      var flag = function (field, message) {
        field.classList.add('has-error');
        var note = document.createElement('p');
        note.className = 'field-error';
        note.textContent = message;
        field.appendChild(note);
      };

      form.querySelectorAll('.field').forEach(function (field) {
        var inputs = field.querySelectorAll('input, select, textarea');
        if (!inputs.length) return;
        var first = inputs[0];
        var value = first.type === 'checkbox'
          ? Array.prototype.filter.call(inputs, function (i) { return i.checked; }).map(function (i) { return i.value; })
          : first.value.trim();
        var empty = Array.isArray(value) ? value.length === 0 : value === '';

        if (first.required && empty) {
          flag(field, 'This one is needed.');
          if (!invalid) invalid = first;
        } else if (first.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          flag(field, 'That email does not look right.');
          if (!invalid) invalid = first;
        }
        payload[first.name] = value;
      });

      if (invalid) {
        status.textContent = 'Have a look at the highlighted fields.';
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
          if (success) {
            form.style.display = 'none';
            success.classList.add('is-visible');
          } else {
            status.textContent = result.body.message;
          }
        })
        .catch(function (error) {
          button.disabled = false;
          status.className = 'form-status is-error';
          status.textContent = error.message + ' Please try again.';
        });
    });
  });
})();
