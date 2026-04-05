import { useMemo } from 'react';
import { Header } from 'src/components/header';

export const DashboardLayout: React.FunctionComponent<
  React.PropsWithChildren
> = ({ children }) => {
  const HEADER_HEIGHT = useMemo(() => '64px', []);

  return (
    <>
      <Header />
      <div
        className={'w-full'}
        style={{
          height: HEADER_HEIGHT,
        }}
      ></div>
      <main
        className={
          'bg-bluegrey-25 flex flex-nowrap justify-center overflow-auto'
        }
        style={{
          height: `calc(100% - ${HEADER_HEIGHT})`,
        }}
      >
        <div className="xxsmall:w-11/12 large:w-10/12 xlarge:w-8/12 h-full py-m">
          {children}
        </div>
      </main>
    </>
  );
};
