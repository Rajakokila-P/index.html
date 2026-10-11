const menu = document.querySelector('.menu');
const nav = document.querySelector('nav');
menu.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!expanded));
  nav.classList.toggle('open', !expanded);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();
const serviceSelect = document.querySelector('#enquiry-service');
document.querySelectorAll('.service-enquiry').forEach(link => {
  link.addEventListener('click', () => { serviceSelect.value = link.dataset.service; });
});
document.querySelector('#enquiry-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const details = new FormData(form);
  const subject = 'SP Raja enquiry: ' + details.get('service');
  const body = `Name: ${details.get('name')}\nReply email: ${details.get('email')}\nService: ${details.get('service')}\n\n${details.get('message')}`;
  window.location.href = 'mailto:sarvamsky@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  document.querySelector('#enquiry-feedback').textContent = 'Email draft requested. Send it from your email app. If no app opens, email sarvamsky@gmail.com directly.';
});
