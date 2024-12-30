export default {
  async fetch(request) {
    let url = new URL(request.url);
    let pathSegments = url.pathname.split('/').filter(segment => segment !== '');
    let realhostname = pathSegments[0] || '';
    let realpathname = pathSegments[1] || '';

    if (url.pathname === "/") {
      const htmlContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>RickRoll</title>
          <style>
            .h_iframe_embed_frame { position: relative; }
            .h_iframe_embed_frame .ratio { display: block; width: 100%; height: auto; }
            .h_iframe_embed_frame iframe { position: absolute; top: 0; left: 0; width: 40%; height: 40%; }
          </style>
        </head>
        <body>
          <h1>iFrame</h1>
          <div class="h_iframe_embed_frame">
            <span style="display: block; padding-top: 57%;"></span>
            <iframe scrolling="no" allowFullScreen="true" webkitallowfullscreen="true" mozallowfullscreen="true"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
          </div>
        </body>
        </html>`;

      return new Response(htmlContent, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  }
}
