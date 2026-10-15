/* ============================================================
   main.js — page-level interactions
   - Enquiry form validation (contact.html)
   - Scroll reveal for [data-reveal] elements
   - Back-to-top button
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------- Enquiry form ---------------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;

      function check(id, test, msg) {
        var el  = form.querySelector('#' + id);
        if (!el) return;
        var field = el.closest('.field');
        var err   = field ? field.querySelector('.field-error') : null;

        if (!test(el.value.trim())) {
          if (err) {
            err.textContent = msg;
            err.classList.remove('hidden');
          }
          el.classList.add('border-red-400');
          ok = false;
        } else {
          if (err) err.classList.add('hidden');
          el.classList.remove('border-red-400');
        }
      }

      check('name',    function (v) { return v.length > 1; },                    'Please enter your name.');
      check('email',   function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }, 'Please enter a valid email.');
      check('phone',   function (v) { return /^[0-9+\-\s()]{8,15}$/.test(v); },    'Please enter a valid phone number.');
      check('message', function (v) { return v.length > 5; },                    'Please tell us about your requirement.');

      if (!ok) return;

      /* NOTE: No backend is configured yet.
         To actually deliver the enquiry, connect a form service here
         (Formspree, Web3Forms, Getform, or your own API). */
      var success = document.getElementById('form-success');
      if (success) {
        success.classList.remove('hidden');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        form.reset();
        setTimeout(function () { success.classList.add('hidden'); }, 8000);
      }
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('animate-fadeUp');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------------- Back to top ---------------- */
  var btt = document.getElementById('back-to-top');
  if (btt) {
    window.addEventListener('scroll', function () {
      var hidden = window.scrollY < 400;
      btt.classList.toggle('opacity-0', hidden);
      btt.classList.toggle('pointer-events-none', hidden);
    });
    btt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});