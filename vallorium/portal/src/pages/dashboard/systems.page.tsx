import { Helmet } from 'react-helmet-async';
import { SystemsView } from 'src/views/dashboard';

export function SystemsPage() {
  return (
    <>
      <Helmet>
        <title>Systems</title>
      </Helmet>

      <SystemsView />
    </>
  );
}
