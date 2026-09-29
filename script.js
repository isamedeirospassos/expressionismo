'use strict';

// Endereço base: sem /rest/v1/ e sem formatação de link.
const SUPABASE_URL = 'https://uyvptiezznewwlufesog.supabase.co';

const SUPABASE_KEY = 'sb_publishable_XZh6LrwRHE1gNNtM04Hohw_QwGAFhAD';

const form = document.querySelector('#feedback-form');
const statusMessage = document.querySelector('#form-status');
const sendButton = form.querySelector('button[type="submit"]');
const connectionNote = document.querySelector('#connection-note');
const fields = [...form.querySelectorAll('textarea')];

const originalButton = sendButton.innerHTML;

let sending = false;

if (connectionNote) {
  connectionNote.hidden = true;
}

function showStatus(message, state) {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
  statusMessage.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (sending) return;

  const hasAnswer = fields.some((field) => {
    return field.value.trim() !== '';
  });

  if (!hasAnswer) {
    showStatus(
      'Preencha pelo menos um campo para enviar seu comentário.',
      'error'
    );

    fields[0].focus();
    return;
  }

  if (!form.reportValidity()) return;

  const comentario = {
    gostou: form.elements.namedItem('gostou').value.trim(),
    opiniao: form.elements.namedItem('opiniao').value.trim(),
    sugestoes: form.elements.namedItem('sugestoes').value.trim(),
    mensagem: form.elements.namedItem('mensagem').value.trim()
  };

  const hasLongAnswer = Object.values(comentario).some((value) => {
    return value.length > 1500;
  });

  if (hasLongAnswer) {
    showStatus(
      'Cada resposta pode ter no máximo 1.500 caracteres.',
      'error'
    );

    return;
  }

  sending = true;
  sendButton.disabled = true;
  sendButton.textContent = 'ENVIANDO…';

  form.setAttribute('aria-busy', 'true');
  statusMessage.textContent = '';

  fields.forEach((field) => {
    field.readOnly = true;
  });

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const response = await fetch(
      SUPABASE_URL + '/rest/v1/comentarios_exposicao',
      {
        method: 'POST',

        headers: {
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },

        body: JSON.stringify(comentario),
        signal: controller.signal
      }
    );

    if (!response.ok) {
      // Mostra o motivo técnico no Console do navegador.
      let details = {};

      try {
        details = await response.json();
      } catch {
        // A resposta pode não conter JSON.
      }

      console.error('Erro ao salvar no Supabase:', {
        status: response.status,
        code: details.code,
        message: details.message,
        hint: details.hint
      });

      showStatus(
        'Não foi possível enviar. Código HTTP: ' +
          response.status +
          '. Seu texto foi mantido.',
        'error'
      );

      return;
    }

    form.reset();

    showStatus(
      'Comentário enviado! Obrigado pelo carinho com a nossa exposição. ❤️',
      'success'
    );
  } catch (error) {
    if (error.name === 'AbortError') {
      showStatus(
        'O serviço demorou para responder. Não conseguimos confirmar o envio. Seu texto foi mantido.',
        'error'
      );
    } else {
      console.error('Falha de conexão:', error.message);

      showStatus(
        'Não foi possível confirmar o envio. Confira sua conexão. Seu texto foi mantido.',
        'error'
      );
    }
  } finally {
    clearTimeout(timer);

    sending = false;
    sendButton.disabled = false;
    sendButton.innerHTML = originalButton;

    fields.forEach((field) => {
      field.readOnly = false;
    });

    form.removeAttribute('aria-busy');
  }
});

// Animações suaves.
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08
    }
  );

  document.documentElement.classList.add('motion');

  document.querySelectorAll('.reveal').forEach((element) => {
    observer.observe(element);
  });
}