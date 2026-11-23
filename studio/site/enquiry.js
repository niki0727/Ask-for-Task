const enquiry = document.querySelector('#enquiry');
if (enquiry) enquiry.addEventListener('submit', async event => {
 event.preventDefault();
 const button = enquiry.querySelector('button');
 const status = document.querySelector('#enquiry-status');
 const fields = Object.fromEntries(new FormData(enquiry));
 button.disabled = true;
 status.textContent = 'Sending…';
 try {
  const response = await fetch((document.querySelector('meta[name=studio-base]')?.content||'')+'/api/enquiries', {
   method: 'POST', headers: {'Content-Type': 'application/json'},
   body: JSON.stringify({...fields, creator: enquiry.dataset.creator, consent: fields.consent === 'on'})
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error);
  status.textContent = result.preview
   ? 'Test enquiry saved. Reference: ' + result.reference
   : 'A4T Studio received your enquiry. We’ll reply by email. Reference: ' + result.reference;
  enquiry.reset();
 } catch (error) {
  status.textContent = error.message;
 } finally {
  button.disabled = false;
 }
});
