import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { validateConfig } from './lib/config';
import './index.css';

async function start() {
  const root = document.getElementById('root')!;

  try {
    if (import.meta.env.PROD) {
      const response = await fetch('/app-config.json', {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar a configuração.');
      }

      window.__APP_CONFIG__ = await response.json();
    }

    validateConfig();

    // Importar somente depois de carregar a configuração.
    const { default: App } = await import('./App.tsx');

    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    root.style.cssText =
      'padding:3rem;color:white;background:#18212f;min-height:100vh';

    root.textContent =
      'Não foi possível iniciar a aplicação. ' +
      (error instanceof Error
        ? error.message
        : 'Erro de carregamento.') +
      ' Solicite ao suporte a configuração no Catalyst.';
  }
}

void start();
