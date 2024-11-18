import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './',
    plugins: [
      react(),
      {
        name: 'inject-dap-script',
        transformIndexHtml(html) {
          // Check if the environment variable is set to 'true'
          if (env.ADD_DAP_SCRIPT === 'true') {
            return html.replace(
              '</head>',
              '<script async="true" type="text/javascript" src="https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js?agency=NASA&amp;subagency=HQ" id="_fed_an_ua_tag"></script></head>'
            );
          }
          return html;
        }
      }
    ]
  };
});