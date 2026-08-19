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
  var animationOff = document.body.hasAttribute('data-no-animation');
  if (!animationOff && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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


  // --- Accordion -----------------------------------------------------------
  document.querySelectorAll('[data-accordion]').forEach(function (group) {
    group.querySelectorAll('.accordion-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var panel = document.getElementById(trigger.getAttribute('aria-controls'));
        var open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!open));
        if (panel) panel.hidden = open;
      });
    });
  });

  // --- Tabs ----------------------------------------------------------------
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('.tab-button'));
    if (!tabs.length) return;

    var select = function (index, focus) {
      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.setAttribute('tabindex', active ? '0' : '-1');
        var panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) panel.hidden = !active;
      });
      if (focus) tabs[index].focus();
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i); });
      tab.addEventListener('keydown', function (event) {
        var next = event.key === 'ArrowRight' ? i + 1 : event.key === 'ArrowLeft' ? i - 1
          : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
        if (next === null) return;
        event.preventDefault();
        select((next + tabs.length) % tabs.length, true);
      });
    });
  });

  // --- Counters ------------------------------------------------------------
  // Counts up only the numeric part, so "41%", "5.8m" and "18yrs" all animate
  // without losing their formatting.
  var counters = document.querySelectorAll('[data-count-to]');
  if (counters.length) {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var animate = function (holder) {
      var target = holder.querySelector('[data-count-target]');
      var raw = holder.getAttribute('data-count-to') || '';
      var match = raw.match(/-?[\d.,]+/);
      if (!target || !match) return;

      var numberText = match[0];
      var end = parseFloat(numberText.replace(/,/g, ''));
      if (!isFinite(end)) return;

      var decimals = (numberText.split('.')[1] || '').length;
      var started = performance.now();
      var duration = 1100;

      var frame = function (now) {
        var progress = Math.min((now - started) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = (end * eased).toFixed(decimals);
        target.textContent = raw.replace(numberText, current);
        if (progress < 1) requestAnimationFrame(frame);
        else target.textContent = raw;
      };
      requestAnimationFrame(frame);
    };

    if ('IntersectionObserver' in window && !reduced) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animate(entry.target);
          countObserver.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { countObserver.observe(c); });
    }
  }

  // --- Carousel ------------------------------------------------------------
  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var track = carousel.querySelector('[data-carousel-track]');
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-slide'));
    var dotsWrap = carousel.querySelector('[data-carousel-dots]');
    if (!track || slides.length < 2) return;

    var index = 0;
    var dots = [];

    var show = function (next) {
      index = (next + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      track.style.transition = 'transform .45s cubic-bezier(.23,1,.32,1)';
      slides.forEach(function (slide, i) { slide.setAttribute('aria-hidden', String(i !== index)); });
      dots.forEach(function (dot, i) { dot.setAttribute('aria-current', String(i === index)); });
    };

    if (dotsWrap) {
      slides.forEach(function (slide, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', 'Go to quote ' + (i + 1));
        dot.addEventListener('click', function () { show(i); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    var prev = carousel.querySelector('[data-carousel-prev]');
    var next = carousel.querySelector('[data-carousel-next]');
    if (prev) prev.addEventListener('click', function () { show(index - 1); });
    if (next) next.addEventListener('click', function () { show(index + 1); });

    carousel.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    });

    // Swipe on touch devices.
    var startX = null;
    carousel.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 45) show(index + (delta < 0 ? 1 : -1));
      startX = null;
    });

    show(0);
  });

  // --- Gallery lightbox ----------------------------------------------------
  document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
    gallery.querySelectorAll('.gallery-open').forEach(function (button) {
      button.addEventListener('click', function () {
        var src = button.getAttribute('data-full');
        var caption = button.getAttribute('data-caption');
        if (!src) return;

        var box = document.createElement('div');
        box.className = 'lightbox';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', caption || 'Image');

        var image = document.createElement('img');
        image.src = src;
        image.alt = caption || '';

        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'lightbox-close';
        close.setAttribute('aria-label', 'Close');
        close.textContent = '\u00d7';

        var inner = document.createElement('div');
        inner.appendChild(image);
        if (caption) {
          var text = document.createElement('p');
          text.className = 'lightbox-caption';
          text.textContent = caption;
          inner.appendChild(text);
        }

        box.appendChild(inner);
        box.appendChild(close);

        var dismiss = function () {
          box.remove();
          document.removeEventListener('keydown', onKey);
          button.focus();
        };
        var onKey = function (e) { if (e.key === 'Escape') dismiss(); };

        close.addEventListener('click', dismiss);
        box.addEventListener('click', function (e) { if (e.target === box) dismiss(); });
        document.addEventListener('keydown', onKey);

        document.body.appendChild(box);
        close.focus();
      });
    });
  });

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
