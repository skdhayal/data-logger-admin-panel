import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        />
        <style>{`
          .MuiDataGrid-root .MuiDataGrid-cell:focus {
            outline: none;
          }
          .MuiDataGrid-root .MuiDataGrid-row.Mui-selected {
            background-color: rgba(25, 118, 210, 0.08);
          }
          .MuiDataGrid-root .MuiDataGrid-row.Mui-selected:hover {
            background-color: rgba(25, 118, 210, 0.12);
          }
        `}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 