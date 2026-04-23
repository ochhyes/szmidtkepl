<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="pl">
      <head>
        <meta charset="utf-8"/>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS</title>
        <style>
          body { font-family: Georgia, serif; background: #FAF8F3; color: #1F1B18; max-width: 680px; margin: 0 auto; padding: 48px 24px; line-height: 1.7; }
          h1 { font-weight: 500; font-size: 36px; letter-spacing: -0.02em; }
          .meta { color: #6B6560; font-style: italic; margin-bottom: 32px; }
          .item { padding: 24px 0; border-bottom: 1px solid #E5DFD2; }
          .item h2 { font-weight: 500; font-size: 22px; letter-spacing: -0.01em; margin: 0 0 8px; }
          .item h2 a { color: #1F1B18; text-decoration: none; }
          .item h2 a:hover { color: #6B2E2E; }
          .item .date { color: #8A857E; font-style: italic; font-size: 14px; }
          .item p { color: #6B6560; margin: 8px 0 0; }
          .hint { background: #F1ECE1; padding: 16px; font-style: italic; color: #6B6560; font-size: 15px; margin-bottom: 32px; }
        </style>
      </head>
      <body>
        <h1><xsl:value-of select="/rss/channel/title"/></h1>
        <div class="meta"><xsl:value-of select="/rss/channel/description"/></div>
        <div class="hint">
          To jest feed RSS. Wklej adres tej strony do czytnika (np. Feedly, NetNewsWire), a nowe teksty pojawią się same.
        </div>
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <h2>
              <a>
                <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
                <xsl:value-of select="title"/>
              </a>
            </h2>
            <div class="date"><xsl:value-of select="pubDate"/></div>
            <p><xsl:value-of select="description"/></p>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
