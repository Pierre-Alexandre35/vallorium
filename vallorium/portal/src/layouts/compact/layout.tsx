import { Header } from 'src/components/header';

export const CompactLayout: React.FunctionComponent<
  React.PropsWithChildren
> = ({ children }) => {
  return (
    <>
      <Header />

      <main>
        <div
          style={{
            paddingTop: '96px',
            paddingBottom: '96px',
            margin: 'auto',
            maxWidth: 400,
            minHeight: '100vh',
            textAlign: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      </main>
    </>
  );
};
