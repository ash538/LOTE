/* ashchand.com.au admin — dependency-free SPA over /api/admin. */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var toastEl = document.getElementById('toast');
  var state = { user: null, blockTypes: [], counts: {} };

  // --- Utilities -----------------------------------------------------------
  function api(path, options) {
    options = options || {};
    var init = { method: options.method || 'GET', credentials: 'same-origin', headers: {} };
    if (options.body instanceof FormData) {
      init.body = options.body;
    } else if (options.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }
    return fetch('/api/admin' + path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) throw new Error(body.error || 'Request failed (' + res.status + ')');
        return body;
      });
    });
  }

  function toast(message, isError) {
    toastEl.textContent = message;
    toastEl.className = 'toast is-visible' + (isError ? ' is-error' : '');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { toastEl.className = 'toast'; }, 3200);
  }

  function fail(error) { toast(error.message || String(error), true); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'class') node.className = attrs[key];
      else if (key === 'text') node.textContent = attrs[key];
      else if (key === 'html') node.innerHTML = attrs[key];
      else if (key.slice(0, 2) === 'on') node.addEventListener(key.slice(2), attrs[key]);
      else if (attrs[key] === true) node.setAttribute(key, '');
      else if (attrs[key] !== false && attrs[key] != null) node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (child == null || child === false) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  // Mirrors h.cssValue on the server, so the preview can never render a rule
  // the saved site would not — and a stray brace cannot break the preview.
  function cssValue(value) {
    var out = String(value == null ? '' : value).replace(/[<>;{}@\\]/g, '').replace(/[/*]/g, '').trim();
    ['"', "'"].forEach(function (quote) {
      if ((out.split(quote).length - 1) % 2 !== 0) out = out.split(quote).join('');
    });
    return out;
  }

  function confirmed(message) { return window.confirm(message); }

  // --- Collections ---------------------------------------------------------
  var COLLECTIONS = {
    nav: {
      label: 'Menus', singular: 'link', titleField: 'label', subtitleField: 'url',
      description: 'Header and footer links. Drag to reorder. Use <code>/#story</code> style URLs to jump to a section.',
      fields: [
        { name: 'label', label: 'Label', type: 'text', required: true },
        { name: 'url', label: 'URL', type: 'text', required: true, hint: 'A section anchor like /#story, or a full URL.' },
        { name: 'location', label: 'Menu', type: 'select', options: ['header', 'footer'] },
        { name: 'is_button', label: 'Show as the header button', type: 'checkbox' },
        { name: 'new_tab', label: 'Open in a new tab', type: 'checkbox' },
      ],
    },
    'form-fields': {
      label: 'Form builder', singular: 'field', titleField: 'label', subtitleField: 'type',
      description: 'The fields on your enquiry form. Drag to reorder.',
      fields: [
        { name: 'label', label: 'Label', type: 'text', required: true },
        {
          name: 'type', label: 'Type', type: 'select',
          options: ['text', 'email', 'tel', 'textarea', 'select', 'checkboxes', 'date', 'number'],
        },
        { name: 'placeholder', label: 'Placeholder', type: 'text' },
        { name: 'help', label: 'Helper text', type: 'text' },
        { name: 'options', label: 'Options (for dropdown / checkboxes)', type: 'list' },
        { name: 'is_required', label: 'Required', type: 'checkbox' },
        { name: 'is_active', label: 'Show on the site', type: 'checkbox' },
      ],
    },
  };

  // --- Field rendering -----------------------------------------------------
  function fieldWrap(def, control, extra) {
    return el('div', { class: 'field' }, [
      el('label', { text: def.label + (def.required ? ' *' : '') }),
      control,
      extra,
      def.hint ? el('p', { class: 'hint', text: def.hint }) : null,
    ]);
  }

  function renderField(def, value, onChange) {
    var type = def.type || 'text';

    if (type === 'checkbox') {
      var box = el('input', { type: 'checkbox' });
      box.checked = !!Number(value) || value === true;
      box.addEventListener('change', function () { onChange(box.checked ? 1 : 0); });
      return el('div', { class: 'checkbox-field' }, [box, el('span', { text: def.label })]);
    }

    if (type === 'select') {
      var select = el('select', {});
      (def.options || []).forEach(function (opt) {
        var option = el('option', { value: opt, text: opt });
        if (String(value) === String(opt)) option.selected = true;
        select.appendChild(option);
      });
      if (value == null || value === '') select.value = (def.options || [])[0] || '';
      select.addEventListener('change', function () { onChange(select.value); });
      return fieldWrap(def, select);
    }

    if (type === 'textarea' || type === 'richtext') {
      var area = el('textarea', { class: type === 'richtext' ? 'tall' : '' });
      area.value = value == null ? '' : value;
      area.addEventListener('input', function () { onChange(area.value); });
      return fieldWrap(def, area, type === 'richtext'
        ? el('p', { class: 'hint', text: 'Formatting: ## heading, **bold**, *italic*, - bullet, > quote, [link](/url)' })
        : el('p', { class: 'hint', text: 'Line breaks are kept in headings.' }));
    }

    if (type === 'color') {
      var picker = el('input', { type: 'color', value: value || '#000000' });
      var text = el('input', { type: 'text', value: value || '' });
      picker.addEventListener('input', function () { text.value = picker.value; onChange(picker.value); });
      text.addEventListener('input', function () {
        if (/^#[0-9a-f]{6}$/i.test(text.value)) picker.value = text.value;
        onChange(text.value);
      });
      return fieldWrap(def, el('div', { class: 'color-field' }, [picker, text]));
    }

    if (type === 'range') {
      var slider = el('input', {
        type: 'range', min: def.min || '0', max: def.max || '100', step: def.step || '1',
      });
      slider.value = value == null || value === '' ? (def.min || '0') : value;
      var readout = el('output', { class: 'range-value', text: String(slider.value) });
      slider.addEventListener('input', function () {
        readout.textContent = slider.value;
        onChange(slider.value);
      });
      return fieldWrap(def, el('div', { class: 'range-field' }, [slider, readout]));
    }

    if (type === 'image' || type === 'file') {
      return fieldWrap(def, uploadControl(value, onChange, type));
    }

    if (type === 'list') {
      var listValue = Array.isArray(value) ? value : (value ? String(value).split('\n') : []);
      var listArea = el('textarea', {});
      listArea.value = listValue.join('\n');
      listArea.addEventListener('input', function () {
        onChange(listArea.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean));
      });
      return fieldWrap(def, listArea, el('p', { class: 'hint', text: 'One per line.' }));
    }

    if (type === 'repeater') return repeaterControl(def, Array.isArray(value) ? value : [], onChange);

    var input = el('input', { type: type === 'date' ? 'date' : type === 'number' ? 'number' : 'text' });
    input.value = value == null ? '' : value;
    input.addEventListener('input', function () { onChange(input.value); });
    return fieldWrap(def, input);
  }

  function uploadControl(value, onChange, kind) {
    var isImage = kind !== 'file';
    var preview = el('div', { class: 'preview' }, [value ? null : el('span', { text: isImage ? 'No image' : 'No file' })]);
    if (value && isImage) preview.style.backgroundImage = 'url("' + value + '")';
    if (value && !isImage) preview.textContent = 'PDF';

    var urlInput = el('input', { type: 'text', placeholder: isImage ? '/uploads/photo.jpg or https://…' : '/uploads/essay.pdf or https://…' });
    urlInput.value = value || '';
    urlInput.addEventListener('input', function () {
      if (isImage) preview.style.backgroundImage = urlInput.value ? 'url("' + urlInput.value + '")' : '';
      onChange(urlInput.value);
    });

    var file = el('input', { type: 'file', accept: isImage ? 'image/*' : 'application/pdf', style: 'display:none' });
    file.addEventListener('change', function () {
      if (!file.files[0]) return;
      var form = new FormData();
      form.append('file', file.files[0]);
      api('/media', { method: 'POST', body: form }).then(function (media) {
        urlInput.value = media.url;
        preview.textContent = '';
        if (isImage) preview.style.backgroundImage = 'url("' + media.url + '")'; else preview.textContent = 'PDF';
        onChange(media.url);
        toast('Uploaded');
      }).catch(fail);
    });

    return el('div', { class: 'image-field' }, [
      preview,
      el('div', { class: 'image-controls' }, [
        urlInput,
        el('div', { class: 'list-actions' }, [
          el('button', { class: 'btn btn-sm', type: 'button', text: 'Upload', onclick: function () { file.click(); } }),
          el('button', {
            class: 'btn btn-sm', type: 'button', text: 'Choose existing',
            onclick: function () {
              openMediaPicker(function (url) {
                urlInput.value = url;
                preview.textContent = '';
                if (isImage) preview.style.backgroundImage = 'url("' + url + '")'; else preview.textContent = 'PDF';
                onChange(url);
              });
            },
          }),
          el('button', {
            class: 'btn btn-sm btn-danger', type: 'button', text: 'Clear',
            onclick: function () { urlInput.value = ''; preview.style.backgroundImage = ''; preview.textContent = ''; onChange(''); },
          }),
          file,
        ]),
      ]),
    ]);
  }

  function repeaterControl(def, items, onChange) {
    var wrap = el('div', { class: 'field' }, [el('label', { text: def.label })]);
    var body = el('div', {});

    function paint() {
      body.textContent = '';
      items.forEach(function (item, index) {
        var card = el('div', { class: 'repeater-item' }, [
          el('div', { class: 'repeater-head' }, [
            el('span', { text: def.label + ' ' + (index + 1) }),
            el('div', { class: 'list-actions' }, [
              index > 0 ? el('button', { class: 'btn btn-sm', type: 'button', text: '↑', onclick: function () {
                items.splice(index - 1, 0, items.splice(index, 1)[0]); onChange(items.slice()); paint();
              } }) : null,
              index < items.length - 1 ? el('button', { class: 'btn btn-sm', type: 'button', text: '↓', onclick: function () {
                items.splice(index + 1, 0, items.splice(index, 1)[0]); onChange(items.slice()); paint();
              } }) : null,
              el('button', { class: 'btn btn-sm btn-danger', type: 'button', text: 'Remove', onclick: function () {
                items.splice(index, 1); onChange(items.slice()); paint();
              } }),
            ]),
          ]),
        ]);
        (def.fields || []).forEach(function (sub) {
          card.appendChild(renderField(sub, item[sub.name], function (value) {
            item[sub.name] = value;
            onChange(items.slice());
          }));
        });
        body.appendChild(card);
      });
    }
    paint();

    wrap.appendChild(body);
    wrap.appendChild(el('button', {
      class: 'btn btn-sm', type: 'button', text: '+ Add',
      onclick: function () { items.push({}); onChange(items.slice()); paint(); },
    }));
    return wrap;
  }

  // --- Modal & media picker ------------------------------------------------
  function openModal(title, buildBody) {
    var body = el('div', {});
    var backdrop = el('div', { class: 'modal-backdrop', onclick: function (e) { if (e.target === backdrop) close(); } }, [
      el('div', { class: 'modal' }, [
        el('div', { class: 'modal-head' }, [
          el('h2', { text: title }),
          el('button', { class: 'btn btn-sm', type: 'button', text: 'Close', onclick: function () { close(); } }),
        ]),
        body,
      ]),
    ]);
    function close() { backdrop.remove(); }
    buildBody(body, close);
    document.body.appendChild(backdrop);
    return close;
  }

  function openMediaPicker(onPick) {
    openModal('Files', function (body, close) {
      var grid = el('div', { class: 'media-grid' });
      body.appendChild(grid);
      api('/media').then(function (items) {
        if (!items.length) { grid.appendChild(el('p', { class: 'empty', text: 'Nothing uploaded yet.' })); return; }
        items.forEach(function (item) {
          var thumb = el('div', { class: 'thumb' });
          if (/^image\//.test(item.mime)) thumb.style.backgroundImage = 'url("' + item.url + '")';
          else thumb.appendChild(el('span', { class: 'thumb-label', text: 'PDF' }));
          grid.appendChild(el('div', {
            class: 'media-item', style: 'cursor:pointer',
            onclick: function () { onPick(item.url); close(); },
          }, [thumb, el('div', { class: 'meta' }, [el('span', { text: item.original_name || item.filename })])]));
        });
      }).catch(fail);
    });
  }

  // --- Shell ---------------------------------------------------------------
  var NAV = [
    { group: 'Site', items: [
      { route: '', label: 'Dashboard' },
      { route: 'pages', label: 'Page & sections' },
      { route: 'collections/nav', label: 'Menus' },
    ] },
    { group: 'Enquiries', items: [
      { route: 'collections/form-fields', label: 'Form builder' },
      { route: 'enquiries', label: 'Enquiries', badge: 'new_enquiries' },
    ] },
    { group: 'Configuration', items: [
      { route: 'media', label: 'Files' },
      { route: 'settings', label: 'Settings & theme', adminOnly: true },
      { route: 'account', label: 'Account' },
    ] },
  ];

  function renderShell(main) {
    var current = location.hash.replace(/^#\/?/, '');
    var isAdmin = state.user && state.user.role === 'admin';
    var sidebar = el('aside', { class: 'sidebar' }, [
      el('a', { class: 'sidebar-brand', href: '#/' }, [
        'ashchand.com.au',
        el('small', { text: state.user ? state.user.email : '' }),
      ]),
    ]);

    NAV.forEach(function (group) {
      var items = group.items.filter(function (item) { return isAdmin || !item.adminOnly; });
      if (!items.length) return;
      var box = el('div', { class: 'side-group' }, [el('h4', { text: group.group })]);
      items.forEach(function (item) {
        var active = current === item.route || (item.route && current.indexOf(item.route) === 0);
        var badge = item.badge ? state.counts[item.badge] : 0;
        box.appendChild(el('a', { class: 'side-link' + (active ? ' is-active' : ''), href: '#/' + item.route }, [
          el('span', { text: item.label }),
          badge ? el('span', { class: 'side-badge', text: String(badge) }) : null,
        ]));
      });
      sidebar.appendChild(box);
    });

    sidebar.appendChild(el('div', { class: 'side-foot' }, [
      el('a', { href: '/', target: '_blank', text: 'View site ↗' }),
      el('a', { href: '#', text: 'Sign out', onclick: function (e) {
        e.preventDefault();
        api('/logout', { method: 'POST' }).then(function () { state.user = null; location.hash = ''; boot(); });
      } }),
    ]));

    app.className = '';
    app.textContent = '';
    app.appendChild(el('div', { class: 'shell' }, [sidebar, el('main', { class: 'main' }, [main])]));
  }

  function headRow(title, description, actions) {
    return el('div', { class: 'page-head-row' }, [
      el('div', {}, [el('h1', { text: title }), description ? el('p', { html: description }) : null]),
      el('div', { class: 'head-actions' }, actions || []),
    ]);
  }

  function statusPill(value) {
    return el('span', { class: 'pill ' + String(value || '').toLowerCase(), text: value || '' });
  }

  function makeSortable(container, onDrop) {
    var dragging = null;
    container.addEventListener('dragstart', function (e) {
      var row = e.target.closest('[data-id]');
      if (!row) return;
      dragging = row;
      row.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    container.addEventListener('dragend', function () {
      if (dragging) dragging.classList.remove('is-dragging');
      container.querySelectorAll('.drag-over').forEach(function (n) { n.classList.remove('drag-over'); });
      dragging = null;
    });
    container.addEventListener('dragover', function (e) {
      e.preventDefault();
      var row = e.target.closest('[data-id]');
      if (!row || row === dragging || !dragging) return;
      container.querySelectorAll('.drag-over').forEach(function (n) { n.classList.remove('drag-over'); });
      row.classList.add('drag-over');
      var rect = row.getBoundingClientRect();
      container.insertBefore(dragging, (e.clientY - rect.top) / rect.height > 0.5 ? row.nextSibling : row);
    });
    container.addEventListener('drop', function (e) {
      e.preventDefault();
      container.querySelectorAll('.drag-over').forEach(function (n) { n.classList.remove('drag-over'); });
      onDrop(Array.prototype.map.call(container.querySelectorAll('[data-id]'), function (n) { return n.getAttribute('data-id'); }));
    });
  }

  // --- Views ---------------------------------------------------------------
  function viewLogin(message) {
    app.className = '';
    app.textContent = '';
    var email = el('input', { type: 'email', autocomplete: 'username' });
    var password = el('input', { type: 'password', autocomplete: 'current-password' });
    var error = el('p', { class: 'hint', style: 'color:var(--danger)', text: message || '' });

    var form = el('form', { onsubmit: function (e) {
      e.preventDefault();
      api('/login', { method: 'POST', body: { email: email.value, password: password.value } })
        .then(function (res) { state.user = res.user; boot(); })
        .catch(function (err) { error.textContent = err.message; });
    } }, [
      el('div', { class: 'field' }, [el('label', { text: 'Email' }), email]),
      el('div', { class: 'field' }, [el('label', { text: 'Password' }), password]),
      error,
      el('button', { class: 'btn btn-primary', type: 'submit', text: 'Sign in' }),
    ]);

    app.appendChild(el('div', { class: 'login-wrap' }, [
      el('div', { class: 'login-card' }, [
        el('h1', { text: 'ashchand.com.au' }),
        el('p', { class: 'sub', text: 'Sign in to edit your site.' }),
        form,
      ]),
    ]));
    email.focus();
  }

  function viewDashboard() {
    api('/overview').then(function (data) {
      state.counts = data.counts;
      var stats = el('div', { class: 'stat-grid' }, [
        ['Sections', data.counts.sections], ['Form fields', data.counts.form_fields],
        ['New enquiries', data.counts.new_enquiries], ['Enquiries', data.counts.enquiries],
        ['Files', data.counts.media],
      ].map(function (pair) {
        return el('div', { class: 'stat-card' }, [el('b', { text: String(pair[1]) }), el('span', { text: pair[0] })]);
      }));

      var recent;
      if (!data.recent_enquiries.length) {
        recent = el('p', { class: 'empty', text: 'No enquiries yet.' });
      } else {
        recent = el('div', { class: 'list' });
        data.recent_enquiries.forEach(function (item) {
          recent.appendChild(el('div', { class: 'list-row' }, [
            el('div', { class: 'list-main' }, [
              el('strong', { text: item.name || item.email || 'Enquiry' }),
              el('span', { text: item.created_at }),
            ]),
            statusPill(item.status),
            el('a', { class: 'btn btn-sm', href: '#/enquiries', text: 'Open' }),
          ]));
        });
      }

      renderShell(el('div', {}, [
        headRow('Dashboard', 'Everything on the site is editable here.', [
          el('a', { class: 'btn', href: '/', target: '_blank', text: 'View site ↗' }),
          el('a', { class: 'btn btn-primary', href: '#/pages', text: 'Edit the page' }),
        ]),
        stats,
        el('h2', { text: 'Recent enquiries' }),
        recent,
      ]));
    }).catch(handleAuthError);
  }

  function viewPages() {
    api('/pages').then(function (pages) {
      var list = el('div', { class: 'list' });
      pages.forEach(function (page) {
        list.appendChild(el('div', { class: 'list-row' }, [
          el('div', { class: 'list-main' }, [
            el('strong', { text: page.title }),
            el('span', { text: '/' + (page.slug === 'home' ? '' : page.slug) }),
          ]),
          statusPill(page.status),
          el('div', { class: 'list-actions' }, [
            el('a', { class: 'btn btn-sm', href: '/' + (page.slug === 'home' ? '' : page.slug) + '?preview=1', target: '_blank', text: 'Preview' }),
            el('a', { class: 'btn btn-sm btn-primary', href: '#/pages/' + page.id, text: 'Edit' }),
          ]),
        ]));
      });

      renderShell(el('div', {}, [
        headRow('Page & sections', 'Your site is one page made of sections you can edit, reorder and hide.', [
          el('button', { class: 'btn', text: '+ New page', onclick: function () {
            var title = window.prompt('Page title');
            if (!title) return;
            api('/pages', { method: 'POST', body: { title: title, status: 'draft' } })
              .then(function (page) { location.hash = '#/pages/' + page.id; }).catch(fail);
          } }),
        ]),
        list,
      ]));
    }).catch(handleAuthError);
  }

  function viewPageEditor(id) {
    Promise.all([api('/pages/' + id), api('/block-types')]).then(function (results) {
      var page = results[0];
      state.blockTypes = results[1];
      var byType = {};
      state.blockTypes.forEach(function (b) { byType[b.type] = b; });

      function reload() { viewPageEditor(id); }

      var draft = {
        title: page.title, slug: page.slug, status: page.status,
        seo_title: page.seo_title, seo_description: page.seo_description, og_image: page.og_image,
      };
      var meta = el('div', { class: 'card' }, []);
      [
        { name: 'title', label: 'Page title', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['published', 'draft'] },
        { name: 'seo_title', label: 'Browser tab / search title', type: 'text' },
        { name: 'seo_description', label: 'Meta description', type: 'textarea' },
        { name: 'og_image', label: 'Social share image', type: 'image' },
      ].forEach(function (def) {
        meta.appendChild(renderField(def, draft[def.name], function (value) { draft[def.name] = value; }));
      });

      var blockList = el('div', {});
      page.blocks.forEach(function (block) {
        var def = byType[block.type] || { label: block.type, fields: [] };
        var data = Object.assign({}, def.defaults || {}, block.data || {});
        var anchor = block.anchor || '';
        var body = el('div', { class: 'block-body', style: 'display:none' });
        var expanded = false;

        var head = el('div', { class: 'block-head', onclick: function (e) {
          if (e.target.closest('button')) return;
          expanded = !expanded;
          body.style.display = expanded ? 'block' : 'none';
        } }, [
          el('span', { class: 'drag-handle', text: '⠿' }),
          el('div', {}, [
            el('strong', { text: def.label }),
            el('div', { class: 'block-type', text: (block.anchor ? '#' + block.anchor + ' · ' : '') + (data.heading || def.description || block.type).slice(0, 80) }),
          ]),
          el('div', { class: 'list-actions' }, [
            el('button', { class: 'btn btn-sm', text: block.is_visible ? 'Hide' : 'Show', onclick: function () {
              api('/blocks/' + block.id, { method: 'PUT', body: { is_visible: block.is_visible ? 0 : 1 } }).then(reload).catch(fail);
            } }),
            el('button', { class: 'btn btn-sm', text: 'Duplicate', onclick: function () {
              api('/blocks/' + block.id + '/duplicate', { method: 'POST' }).then(reload).catch(fail);
            } }),
            el('button', { class: 'btn btn-sm btn-danger', text: 'Delete', onclick: function () {
              if (!confirmed('Delete this ' + def.label + ' section?')) return;
              api('/blocks/' + block.id, { method: 'DELETE' }).then(reload).catch(fail);
            } }),
          ]),
        ]);

        body.appendChild(renderField(
          { name: 'anchor', label: 'Section link name', type: 'text', hint: 'Lets the menu jump here, e.g. "story" makes /#story work.' },
          anchor, function (value) { anchor = value; }
        ));
        (def.fields || []).forEach(function (fieldDef) {
          body.appendChild(renderField(fieldDef, data[fieldDef.name], function (value) { data[fieldDef.name] = value; }));
        });
        body.appendChild(el('button', {
          class: 'btn btn-primary btn-sm', text: 'Save section', onclick: function () {
            api('/blocks/' + block.id, { method: 'PUT', body: { data: data, anchor: anchor } })
              .then(function () { toast('Section saved'); reload(); }).catch(fail);
          },
        }));

        blockList.appendChild(el('div', {
          class: 'block-item' + (block.is_visible ? '' : ' is-hidden'), 'data-id': block.id, draggable: 'true',
        }, [head, body]));
      });

      makeSortable(blockList, function (ids) {
        api('/pages/' + page.id + '/blocks/reorder', { method: 'POST', body: { ids: ids } })
          .then(function () { toast('Sections reordered'); }).catch(fail);
      });

      renderShell(el('div', {}, [
        headRow(page.title, 'Page settings and sections.', [
          el('a', { class: 'btn', href: '#/pages', text: '← All pages' }),
          el('a', { class: 'btn', href: '/' + (page.slug === 'home' ? '' : page.slug) + '?preview=1', target: '_blank', text: 'Preview ↗' }),
          !page.is_locked ? el('button', { class: 'btn btn-danger', text: 'Delete page', onclick: function () {
            if (!confirmed('Delete "' + page.title + '" and all its sections?')) return;
            api('/pages/' + page.id, { method: 'DELETE' }).then(function () { location.hash = '#/pages'; }).catch(fail);
          } }) : null,
        ]),
        el('h2', { text: 'Page settings' }),
        meta,
        el('button', { class: 'btn btn-primary', text: 'Save page settings', onclick: function () {
          api('/pages/' + page.id, { method: 'PUT', body: draft }).then(function () { toast('Page saved'); reload(); }).catch(fail);
        } }),
        el('h2', { style: 'margin-top:30px', text: 'Sections' }),
        page.blocks.length ? blockList : el('p', { class: 'empty', text: 'No sections yet.' }),
        el('div', { style: 'margin-top:14px' }, [
          el('button', { class: 'btn btn-primary', text: '+ Add section', onclick: function () {
            openModal('Add a section', function (body, close) {
              var picker = el('div', { class: 'block-picker' });
              state.blockTypes.forEach(function (def) {
                picker.appendChild(el('button', { class: 'block-option', type: 'button', onclick: function () {
                  api('/pages/' + page.id + '/blocks', { method: 'POST', body: { type: def.type } })
                    .then(function () { close(); reload(); toast(def.label + ' added'); }).catch(fail);
                } }, [el('strong', { text: def.label }), el('span', { text: def.description || '' })]));
              });
              body.appendChild(picker);
            });
          } }),
        ]),
      ]));
    }).catch(handleAuthError);
  }

  function viewCollection(key) {
    var def = COLLECTIONS[key];
    if (!def) return viewDashboard();

    api('/collections/' + key).then(function (items) {
      var list = el('div', { class: 'list' });
      items.forEach(function (item) {
        list.appendChild(el('div', { class: 'list-row', 'data-id': item.id, draggable: 'true' }, [
          el('span', { class: 'drag-handle', text: '⠿' }),
          el('div', { class: 'list-main' }, [
            el('strong', { text: item[def.titleField] || '(untitled)' }),
            el('span', { text: String(item[def.subtitleField] || '') }),
          ]),
          item.location ? el('span', { class: 'pill', text: item.location }) : null,
          item.is_button ? el('span', { class: 'pill featured', text: 'Button' }) : null,
          key === 'form-fields' ? statusPill(item.is_active ? 'published' : 'hidden') : null,
          key === 'form-fields' && item.is_required ? el('span', { class: 'pill', text: 'Required' }) : null,
          el('div', { class: 'list-actions' }, [
            el('button', { class: 'btn btn-sm btn-primary', text: 'Edit', onclick: function () { openEntryEditor(key, item); } }),
            el('button', { class: 'btn btn-sm btn-danger', text: 'Delete', onclick: function () {
              if (!confirmed('Delete this ' + def.singular + '?')) return;
              api('/collections/' + key + '/' + item.id, { method: 'DELETE' })
                .then(function () { toast('Deleted'); viewCollection(key); }).catch(fail);
            } }),
          ]),
        ]));
      });

      makeSortable(list, function (ids) {
        api('/collections/' + key + '/reorder', { method: 'POST', body: { ids: ids } })
          .then(function () { toast('Order saved'); }).catch(fail);
      });

      renderShell(el('div', {}, [
        headRow(def.label, def.description || '', [
          el('button', { class: 'btn btn-primary', text: '+ New ' + def.singular, onclick: function () { openEntryEditor(key, null); } }),
        ]),
        items.length ? list : el('p', { class: 'empty', text: 'Nothing here yet.' }),
      ]));
    }).catch(handleAuthError);
  }

  function openEntryEditor(key, item) {
    var def = COLLECTIONS[key];
    var draft = {};
    def.fields.forEach(function (field) {
      var value = item ? item[field.name] : undefined;
      if (value === undefined) {
        value = field.type === 'checkbox' ? (field.name === 'is_active' ? 1 : 0)
          : field.type === 'list' ? []
            : field.type === 'select' ? (field.options || [])[0] : '';
      }
      draft[field.name] = value;
    });

    openModal((item ? 'Edit ' : 'New ') + def.singular, function (body, close) {
      def.fields.forEach(function (field) {
        body.appendChild(renderField(field, draft[field.name], function (value) { draft[field.name] = value; }));
      });
      body.appendChild(el('div', { class: 'list-actions' }, [
        el('button', { class: 'btn btn-primary', text: 'Save', onclick: function () {
          var request = item
            ? api('/collections/' + key + '/' + item.id, { method: 'PUT', body: draft })
            : api('/collections/' + key, { method: 'POST', body: draft });
          request.then(function () { close(); toast('Saved'); viewCollection(key); }).catch(fail);
        } }),
        el('button', { class: 'btn', text: 'Cancel', onclick: close }),
      ]));
    });
  }

  function viewEnquiries() {
    api('/enquiries').then(function (items) {
      var list = el('div', { class: 'list' });
      items.forEach(function (item) {
        var detail = el('div', { class: 'enquiry-detail', style: 'display:none' });
        var dl = el('dl', {});
        Object.keys(item.data || {}).forEach(function (key) {
          var entry = item.data[key];
          var isPair = entry && typeof entry === 'object' && !Array.isArray(entry);
          var value = isPair && 'value' in entry ? entry.value : entry;
          dl.appendChild(el('dt', { text: isPair && entry.label ? entry.label : key }));
          dl.appendChild(el('dd', { text: Array.isArray(value) ? value.join(', ') : String(value == null ? '' : value) }));
        });
        detail.appendChild(dl);

        var notes = el('textarea', { placeholder: 'Private notes' });
        notes.value = item.notes || '';
        var statusSelect = el('select', {});
        ['new', 'actioned', 'archived'].forEach(function (s) {
          var option = el('option', { value: s, text: s });
          if (item.status === s) option.selected = true;
          statusSelect.appendChild(option);
        });

        detail.appendChild(el('div', { class: 'row' }, [
          el('div', { class: 'field' }, [el('label', { text: 'Status' }), statusSelect]),
          el('div', { class: 'field' }, [el('label', { text: 'Notes' }), notes]),
        ]));
        detail.appendChild(el('div', { class: 'list-actions' }, [
          el('button', { class: 'btn btn-sm btn-primary', text: 'Save', onclick: function () {
            api('/enquiries/' + item.id, { method: 'PUT', body: { status: statusSelect.value, notes: notes.value } })
              .then(function () { toast('Updated'); viewEnquiries(); }).catch(fail);
          } }),
          item.email ? el('a', { class: 'btn btn-sm', href: 'mailto:' + item.email, text: 'Reply by email' }) : null,
          el('button', { class: 'btn btn-sm btn-danger', text: 'Delete', onclick: function () {
            if (!confirmed('Delete this enquiry?')) return;
            api('/enquiries/' + item.id, { method: 'DELETE' }).then(function () { viewEnquiries(); }).catch(fail);
          } }),
        ]));

        list.appendChild(el('div', {}, [
          el('div', { class: 'list-row', style: 'cursor:pointer', onclick: function () {
            detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
          } }, [
            el('div', { class: 'list-main' }, [
              el('strong', { text: item.name || item.email || 'Enquiry' }),
              el('span', { text: item.created_at }),
            ]),
            statusPill(item.status),
          ]),
          detail,
        ]));
      });

      renderShell(el('div', {}, [
        headRow('Enquiries', 'Everything sent through the form on your site.', [
          el('a', { class: 'btn', href: '/api/admin/enquiries.csv', text: 'Export CSV' }),
          el('a', { class: 'btn', href: '#/collections/form-fields', text: 'Edit form fields' }),
        ]),
        items.length ? list : el('p', { class: 'empty', text: 'No enquiries yet.' }),
      ]));
    }).catch(handleAuthError);
  }

  function viewMedia() {
    api('/media').then(function (items) {
      var file = el('input', { type: 'file', accept: 'image/*,application/pdf', multiple: true });
      file.addEventListener('change', function () {
        var uploads = Array.prototype.map.call(file.files, function (f) {
          var form = new FormData();
          form.append('file', f);
          return api('/media', { method: 'POST', body: form });
        });
        Promise.all(uploads).then(function () { toast('Uploaded'); viewMedia(); }).catch(fail);
      });

      var grid = el('div', { class: 'media-grid' });
      items.forEach(function (item) {
        var thumb = el('div', { class: 'thumb' });
        if (/^image\//.test(item.mime)) thumb.style.backgroundImage = 'url("' + item.url + '")';
        else thumb.appendChild(el('span', { class: 'thumb-label', text: 'PDF' }));
        grid.appendChild(el('div', { class: 'media-item' }, [
          el('a', { href: item.url, target: '_blank' }, [thumb]),
          el('div', { class: 'meta' }, [
            el('span', { text: item.original_name || item.filename }),
            el('button', { class: 'btn btn-sm btn-danger', text: '×', onclick: function () {
              if (!confirmed('Delete this file? Anything using it will break.')) return;
              api('/media/' + item.id, { method: 'DELETE' }).then(function () { viewMedia(); }).catch(fail);
            } }),
          ]),
        ]));
      });

      renderShell(el('div', {}, [
        headRow('Files', 'Your portrait, the essay PDF and anything else the site links to.', []),
        el('div', { class: 'card' }, [el('div', { class: 'field' }, [el('label', { text: 'Upload images or PDFs' }), file])]),
        items.length ? grid : el('p', { class: 'empty', text: 'Nothing uploaded yet.' }),
      ]));
    }).catch(handleAuthError);
  }

  function viewSettings(keepGroup) {
    Promise.all([api('/settings'), api('/presets')]).then(function (results) {
      var schema = results[0];
      var presets = results[1];
      var draft = {};
      schema.fields.forEach(function (field) { draft[field.key] = field.value; });

      // Re-rendering (after a discard) should leave you on the tab you were on.
      var activeGroup = keepGroup || schema.groups[0].key;
      var tabs = el('div', { class: 'tabs' });
      var panel = el('div', {});
      var preview = el('iframe', { class: 'theme-preview-frame', src: '/', title: 'Live preview' });
      var previewWidth = 'desktop';

      // The preview is same-origin, so the draft theme can be pushed straight
      // into its document — no save, no reload.
      function applyPreview() {
        var doc = preview.contentDocument;
        if (!doc || !doc.head || !doc.body) return;
        var style = doc.getElementById('theme-draft') || doc.createElement('style');
        style.id = 'theme-draft';
        style.textContent = ':root{' +
          '--paper:' + cssValue(draft.color_paper) + ';' +
          '--ink:' + cssValue(draft.color_ink) + ';' +
          '--oxblood:' + cssValue(draft.color_oxblood) + ';' +
          '--butter:' + cssValue(draft.color_butter) + ';' +
          '--muted:' + cssValue(draft.color_muted) + ';' +
          '--serif:' + cssValue(draft.font_serif) + ';' +
          '--sans:' + cssValue(draft.font_sans) + ';' +
          '--scale:' + (draft.heading_scale || 1) + ';' +
          '--space:' + (draft.section_space || 1) + ';' +
          '--radius:' + (draft.corner_radius || 0) + 'px;' +
          '--btn-radius:' + (draft.button_style === 'pill' ? '999px' : draft.button_style === 'rounded' ? '8px' : '0px') + ';' +
          '--container:' + (draft.container_width || 1440) + 'px;' +
          '}' +
          // Scroll reveals never fire inside an off-screen iframe, which would
          // leave the preview blank. Show everything instead.
          '[data-reveal]{opacity:1 !important;transform:none !important}';
        if (!style.parentNode) doc.head.appendChild(style);

        // Pull in the preset's web fonts so the preview shows the real faces.
        if (draft.font_import_url) {
          var link = doc.getElementById('theme-draft-font') || doc.createElement('link');
          link.id = 'theme-draft-font';
          link.rel = 'stylesheet';
          if (link.href !== draft.font_import_url) link.href = draft.font_import_url;
          if (!link.parentNode) doc.head.appendChild(link);
        }
      }

      // A slow or blocked webfont can delay `load` indefinitely, which would
      // leave the preview blank, so poll for the document rather than wait.
      function applyPreviewWhenReady(attempt) {
        var doc = preview.contentDocument;
        if (doc && doc.head && doc.body) { applyPreview(); return; }
        if (attempt < 60) setTimeout(function () { applyPreviewWhenReady(attempt + 1); }, 120);
      }

      preview.addEventListener('load', applyPreview);
      applyPreviewWhenReady(0);

      function onFieldChange(key, value) {
        draft[key] = value;
        if (schemaGroupOf(key) === 'theme') applyPreview();
      }

      function schemaGroupOf(key) {
        var field = schema.fields.find(function (f) { return f.key === key; });
        return field ? field.group : '';
      }

      function applyPreset(values) {
        Object.keys(values).forEach(function (key) { draft[key] = values[key]; });
        paint();
        applyPreview();
        toast('Applied — save to keep it');
      }

      function presetButtons() {
        var fontRow = el('div', { class: 'preset-grid' });
        presets.fonts.forEach(function (pair) {
          var active = draft.font_serif === pair.heading && draft.font_sans === pair.body;
          fontRow.appendChild(el('button', {
            class: 'preset' + (active ? ' is-active' : ''), type: 'button',
            onclick: function () {
              applyPreset({ font_serif: pair.heading, font_sans: pair.body, font_import_url: pair.import });
            },
          }, [
            el('strong', { text: pair.label, style: 'font-family:' + pair.heading }),
            el('span', { text: pair.note }),
          ]));
        });

        var paletteRow = el('div', { class: 'preset-grid' });
        presets.palettes.forEach(function (palette) {
          var active = draft.color_oxblood === palette.accent && draft.color_paper === palette.paper;
          var swatches = el('span', { class: 'swatches' });
          [palette.paper, palette.ink, palette.accent, palette.highlight].forEach(function (colour) {
            var chip = el('i', {});
            chip.style.background = colour;
            swatches.appendChild(chip);
          });
          paletteRow.appendChild(el('button', {
            class: 'preset' + (active ? ' is-active' : ''), type: 'button',
            onclick: function () {
              applyPreset({
                color_paper: palette.paper, color_ink: palette.ink, color_oxblood: palette.accent,
                color_butter: palette.highlight, color_muted: palette.muted,
              });
            },
          }, [swatches, el('strong', { text: palette.label }), el('span', { text: palette.note })]));
        });

        return el('div', {}, [
          el('div', { class: 'card' }, [
            el('h3', { text: 'Font pairings' }),
            el('p', { class: 'hint', text: 'Click one to try it. Nothing is saved until you press Save.' }),
            fontRow,
          ]),
          el('div', { class: 'card' }, [
            el('h3', { text: 'Colour palettes' }),
            el('p', { class: 'hint', text: 'Each sets all five colours. Fine-tune any of them below.' }),
            paletteRow,
          ]),
        ]);
      }

      function paint() {
        tabs.textContent = '';
        schema.groups.forEach(function (group) {
          tabs.appendChild(el('button', {
            class: 'tab' + (group.key === activeGroup ? ' is-active' : ''), text: group.label,
            onclick: function () { activeGroup = group.key; paint(); },
          }));
        });

        panel.textContent = '';
        if (activeGroup === 'theme') panel.appendChild(presetButtons());

        var card = el('div', { class: 'card' });
        schema.fields.filter(function (f) { return f.group === activeGroup; }).forEach(function (field) {
          card.appendChild(renderField(
            { name: field.key, label: field.label, type: field.type, options: field.options,
              min: field.min, max: field.max, step: field.step },
            draft[field.key], function (value) { onFieldChange(field.key, value); }
          ));
        });
        panel.appendChild(card);
      }
      paint();

      var previewPane = el('div', { class: 'theme-preview' }, [
        el('div', { class: 'theme-preview-bar' }, [
          el('span', { text: 'Live preview' }),
          el('div', { class: 'list-actions' }, [
            el('button', { class: 'btn btn-sm', type: 'button', text: 'Desktop', onclick: function (e) {
              previewWidth = 'desktop';
              preview.parentNode.classList.remove('is-mobile');
              setActive(e.target);
            } }),
            el('button', { class: 'btn btn-sm', type: 'button', text: 'Mobile', onclick: function (e) {
              previewWidth = 'mobile';
              preview.parentNode.classList.add('is-mobile');
              setActive(e.target);
            } }),
            el('button', { class: 'btn btn-sm', type: 'button', text: 'Reload', onclick: function () {
              preview.contentWindow.location.reload();
            } }),
          ]),
        ]),
        preview,
      ]);

      function setActive(button) {
        var row = button.parentNode;
        Array.prototype.forEach.call(row.children, function (b) { b.classList.remove('btn-primary'); });
        button.classList.add('btn-primary');
      }

      renderShell(el('div', { class: 'settings-layout' }, [
        headRow('Settings & theme', 'Try a font pairing or palette, nudge the sliders, and watch the preview. Nothing goes live until you save.', [
          el('a', { class: 'btn', href: '/', target: '_blank', text: 'View site ↗' }),
        ]),
        el('div', { class: 'settings-split' }, [
          el('div', {}, [tabs, panel]),
          previewPane,
        ]),
        el('div', { class: 'sticky-save' }, [
          el('button', { class: 'btn btn-primary', text: 'Save settings', onclick: function () {
            api('/settings', { method: 'PUT', body: draft })
              .then(function () { toast('Saved — your site is updated'); }).catch(fail);
          } }),
          el('button', { class: 'btn', text: 'Discard changes', onclick: function () { viewSettings(activeGroup); } }),
          el('span', { class: 'status', text: 'The preview is your draft; the live site changes on save.' }),
        ]),
      ]));
    }).catch(handleAuthError);
  }

  function viewAccount() {
    var isAdmin = state.user.role === 'admin';
    (isAdmin ? api('/users') : Promise.resolve([])).then(function (users) {
      var newPassword = el('input', { type: 'password', autocomplete: 'new-password' });
      var list = el('div', { class: 'list' });
      users.forEach(function (user) {
        list.appendChild(el('div', { class: 'list-row' }, [
          el('div', { class: 'list-main' }, [
            el('strong', { text: user.name || user.email }),
            el('span', { text: user.email + ' · ' + user.role }),
          ]),
          user.id !== state.user.id ? el('button', { class: 'btn btn-sm btn-danger', text: 'Remove', onclick: function () {
            if (!confirmed('Remove ' + user.email + '?')) return;
            api('/users/' + user.id, { method: 'DELETE' }).then(function () { viewAccount(); }).catch(fail);
          } }) : el('span', { class: 'pill', text: 'You' }),
        ]));
      });

      var invite = { email: '', name: '', password: '', role: 'editor' };
      var inviteCard = el('div', { class: 'card' }, [el('h3', { text: 'Give someone else access' })]);
      [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'text' },
        { name: 'password', label: 'Temporary password', type: 'text', hint: 'At least 8 characters.' },
        { name: 'role', label: 'Role', type: 'select', options: ['editor', 'admin'] },
      ].forEach(function (field) {
        inviteCard.appendChild(renderField(field, invite[field.name], function (value) { invite[field.name] = value; }));
      });
      inviteCard.appendChild(el('button', { class: 'btn btn-primary', text: 'Create account', onclick: function () {
        api('/users', { method: 'POST', body: invite }).then(function () { toast('Account created'); viewAccount(); }).catch(fail);
      } }));

      renderShell(el('div', {}, [
        headRow(isAdmin ? 'Account & access' : 'Your account', 'Sign-in details.', []),
        el('div', { class: 'card' }, [
          el('h3', { text: 'Change your password' }),
          el('div', { class: 'field' }, [el('label', { text: 'New password' }), newPassword]),
          el('button', { class: 'btn btn-primary', text: 'Update password', onclick: function () {
            api('/account/password', { method: 'POST', body: { password: newPassword.value } })
              .then(function (res) { toast(res.message); setTimeout(function () { location.reload(); }, 1200); })
              .catch(fail);
          } }),
        ]),
        isAdmin ? el('h2', { text: 'People with access' }) : null,
        isAdmin ? list : null,
        isAdmin ? inviteCard : null,
      ]));
    }).catch(handleAuthError);
  }

  // --- Routing -------------------------------------------------------------
  function handleAuthError(error) {
    if (/signed in/i.test(error.message)) { state.user = null; viewLogin('Your session expired. Please sign in again.'); return; }
    fail(error);
  }

  function route() {
    if (!state.user) return viewLogin();
    var path = location.hash.replace(/^#\/?/, '');
    var parts = path.split('/');

    if (path === '' || path === 'dashboard') return viewDashboard();
    if (parts[0] === 'pages') return parts[1] ? viewPageEditor(parts[1]) : viewPages();
    if (parts[0] === 'collections' && parts[1]) return viewCollection(parts[1]);
    if (path === 'enquiries') return viewEnquiries();
    if (path === 'media') return viewMedia();
    if (path === 'settings') {
      if (state.user.role !== 'admin') { toast('Only an admin can change settings.', true); return viewDashboard(); }
      return viewSettings();
    }
    if (path === 'account') return viewAccount();
    return viewDashboard();
  }

  function boot() {
    api('/me')
      .then(function (user) {
        state.user = user;
        return api('/overview').then(function (data) { state.counts = data.counts; });
      })
      .then(route)
      .catch(function () { viewLogin(); });
  }

  window.addEventListener('hashchange', route);
  boot();
})();
