/* Lumière Hotel — frontend interactions (demo only) */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const money = n => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);
  const readBooking = () => { try { return JSON.parse(localStorage.getItem('lumiereBooking') || 'null'); } catch { return null; } };

  // Room selection carries the chosen room into the booking form.
  document.querySelectorAll('.book-btn').forEach(button => button.addEventListener('click', () => {
    localStorage.setItem('lumiereSelectedRoom', button.dataset.room || '');
    location.href = 'booking.html';
  }));

  const form = document.getElementById('bookingForm');
  if (form) {
    const room = document.getElementById('roomType');
    const checkin = document.getElementById('checkin');
    const checkout = document.getElementById('checkout');
    const total = document.getElementById('bookingTotal');
    const today = new Date(); today.setHours(0,0,0,0);
    const iso = d => { const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return x.toISOString().slice(0,10); };
    checkin.min = iso(today); checkout.min = iso(today);
    const selected = localStorage.getItem('lumiereSelectedRoom');
    if (selected) { [...room.options].forEach(o => { if (o.value === selected) room.value = selected; }); localStorage.removeItem('lumiereSelectedRoom'); }
    const nightsBetween = () => {
      if (!checkin.value || !checkout.value) return 0;
      return Math.round((new Date(`${checkout.value}T00:00:00`) - new Date(`${checkin.value}T00:00:00`)) / 86400000);
    };
    const calculate = () => {
      const nights = nightsBetween();
      const price = Number(room.selectedOptions[0]?.dataset.price || 0);
      total.textContent = money(price * Math.max(nights, 0));
      return { price, total: price * nights, nights, room: room.value };
    };
    [room, checkin, checkout].forEach(el => el.addEventListener('change', () => {
      if (el === checkin && checkin.value) { checkout.min = checkin.value; if (checkout.value && checkout.value <= checkin.value) checkout.value = ''; }
      calculate();
    }));
    calculate();
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const stay = calculate();
      if (stay.nights < 1) { checkout.setCustomValidity('Tanggal check-out harus setelah check-in.'); checkout.reportValidity(); checkout.setCustomValidity(''); return; }
      if (stay.nights > 30) { checkout.setCustomValidity('Untuk demo ini, durasi maksimal adalah 30 malam.'); checkout.reportValidity(); checkout.setCustomValidity(''); return; }
      const data = {
        name: document.getElementById('guestName').value.trim(), email: document.getElementById('guestEmail').value.trim(),
        room: stay.room, price: stay.price, total: stay.total, nights: stay.nights,
        guests: document.getElementById('guests').value, checkin: checkin.value, checkout: checkout.value,
        notes: document.getElementById('notes').value.trim()
      };
      localStorage.setItem('lumiereBooking', JSON.stringify(data)); location.href = 'payment.html';
    });
  }

  // Build payment summary with text nodes to avoid injecting stored form content as HTML.
  const summary = document.getElementById('paymentSummary');
  const booking = readBooking();
  if (summary) {
    summary.replaceChildren();
    if (booking) {
      const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'RINGKASAN PEMESANAN'; summary.append(eyebrow);
      const heading = document.createElement('h2'); heading.textContent = booking.room; summary.append(heading);
      const details = document.createElement('p');
      details.textContent = `Nama: ${booking.name}\nEmail: ${booking.email}\nTamu: ${booking.guests}\nCheck-in: ${booking.checkin}\nCheck-out: ${booking.checkout}\nDurasi: ${booking.nights} malam`;
      details.style.whiteSpace = 'pre-line'; summary.append(details);
      const line = document.createElement('div'); line.className = 'summary-line';
      const label = document.createElement('span'); label.textContent = 'Total simulasi';
      const amount = document.createElement('strong'); amount.textContent = money(booking.total);
      line.append(label, amount); summary.append(line);
    } else {
      const msg = document.createElement('p'); msg.textContent = 'Belum ada detail pemesanan. Silakan isi formulir terlebih dahulu.'; summary.append(msg);
      const link = document.createElement('a'); link.className = 'btn btn-dark'; link.href = 'booking.html'; link.textContent = 'Ke Pemesanan'; summary.append(link);
      const payButton = document.getElementById('payButton'); if (payButton) payButton.disabled = true;
    }
  }

  const pay = document.getElementById('payButton');
  if (pay) pay.addEventListener('click', () => {
    if (!booking) return;
    pay.disabled = true; pay.textContent = 'Memproses pembayaran…';
    const status = document.getElementById('paymentStatus');
    status.textContent = 'Memverifikasi pembayaran simulasi…';
    window.setTimeout(() => {
      booking.paymentMethod = document.getElementById('payMethod').value;
      booking.confirmation = 'LM' + Math.random().toString(36).slice(2,8).toUpperCase();
      localStorage.setItem('lumiereBooking', JSON.stringify(booking)); location.href = 'booking-success.html';
    }, 1100);
  });

  const success = document.getElementById('successSummary');
  if (success) {
    const data = readBooking();
    success.textContent = data ? `Kode: ${data.confirmation || 'LM-DEMO'} · ${data.room} · ${data.nights} malam · Total ${money(data.total)} · Metode: ${data.paymentMethod || 'Belum dipilih'}` : 'Terima kasih telah memilih Lumière Hotel.';
  }

  const contact = document.getElementById('contactForm');
  if (contact) contact.addEventListener('submit', event => {
    event.preventDefault(); if (!contact.reportValidity()) return;
    document.getElementById('contactFeedback').textContent = 'Terima kasih! Pesan demo Anda berhasil dicatat pada tampilan ini.'; contact.reset();
  });

  // Gallery lightbox: click an image to view it larger; keyboard accessible.
  document.querySelectorAll('.gallery-img').forEach(img => {
    img.tabIndex = 0; img.setAttribute('role', 'button'); img.setAttribute('aria-label', `Perbesar: ${img.alt}`);
    const open = () => {
      let modal = document.getElementById('galleryLightbox');
      if (!modal) {
        modal = document.createElement('div'); modal.id = 'galleryLightbox'; modal.className = 'gallery-lightbox'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-label','Pratinjau foto');
        modal.innerHTML = '<button type="button" class="lightbox-close" aria-label="Tutup">×</button><img alt="">'; document.body.append(modal);
        modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('.lightbox-close')) modal.classList.remove('show'); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('show'); });
      }
      const preview = modal.querySelector('img'); preview.src = img.currentSrc || img.src; preview.alt = img.alt; modal.classList.add('show'); modal.querySelector('button').focus();
    };
    img.addEventListener('click', open); img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  // Small UX details shared by all pages.
  document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
  document.querySelectorAll('img:not([loading])').forEach(img => { if (!img.closest('.hero,.page-hero')) img.loading = 'lazy'; });
});
