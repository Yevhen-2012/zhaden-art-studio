(() => {
  const endpoint = window.SITE_CONFIG?.formEndpoint || '';
  let available = false;
  try { available = new URL(endpoint).protocol === 'https:'; } catch {}
  document.querySelectorAll('form[data-contact-form]').forEach(form => {
    const button = form.querySelector('[type="submit"]');
    const notice = form.querySelector('[data-contact-notice]');
    if (available) {
      // A native POST supports static hosting and the provider's confirmation page.
      form.action = endpoint;
      form.method = 'post';
      button.disabled = false;
      notice.hidden = true;
    } else {
      window.Webflow = window.Webflow || [];
      window.Webflow.push(() => { button.disabled = true; });
      // Capture before Webflow's delegated handler; never report a fake success.
      form.addEventListener('submit', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);
    }
  });
})();
