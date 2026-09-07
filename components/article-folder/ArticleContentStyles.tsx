export default function ArticleContentStyles() {
  return (
    <style jsx global>{`
      .article-content {
        color: #444;
        font-family:
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
        font-size: 16px;
        line-height: 2;
      }

      .article-content p {
        margin: 0 0 1.5em;
      }

      .article-content h1 {
        margin: 2em 0 0.7em;
        color: #222;
        font-family: Georgia, serif;
        font-size: 38px;
        font-weight: 400;
        line-height: 1.3;
      }

      .article-content h2 {
        margin: 1.8em 0 0.7em;
        color: #222;
        font-family: Georgia, serif;
        font-size: 30px;
        font-weight: 400;
        line-height: 1.35;
      }

      .article-content h3 {
        margin: 1.6em 0 0.6em;
        color: #222;
        font-family: Georgia, serif;
        font-size: 23px;
        font-weight: 600;
        line-height: 1.4;
      }

      .article-content ul,
      .article-content ol {
        margin: 0 0 1.5em;
        padding-left: 1.6em;
      }

      .article-content li {
        margin-bottom: 0.5em;
      }

      .article-content blockquote {
        margin: 2em 0;
        padding: 4px 0 4px 22px;
        border-left: 3px solid #c8647b;
        color: #777;
        font-style: italic;
      }

      .article-content hr {
        margin: 3em 0;
        border: 0;
        border-top: 1px solid #e5ddd9;
      }

      .article-content a {
        color: #a64d68;
        text-decoration: underline;
      }

      .article-content img {
        display: block;
        width: 100%;
        max-width: 100%;
        height: auto;
        margin: 2em auto;
        border-radius: 12px;
      }

      .article-content strong {
        color: #222;
      }

      .article-content em {
        font-style: italic;
      }

      @media (max-width: 700px) {
        .article-content {
          font-size: 15px;
          line-height: 1.9;
        }

        .article-content h1 {
          font-size: 32px;
        }

        .article-content h2 {
          font-size: 26px;
        }

        .article-content h3 {
          font-size: 21px;
        }
      }
    `}</style>
  );
}