import { Helmet } from 'react-helmet-async';
import { Navigate, useParams } from 'react-router-dom';
import { RoleGuard } from 'src/guards';
import { useLogger } from 'src/hooks';
import { paths } from 'src/routes/paths';
import { SystemView } from 'src/views/dashboard';

export function SystemPage() {
  const { systemId } = useParams();
  const logger = useLogger({ scope: 'system-page', mode: 'hidden' });

  if (!systemId) {
    logger.warn('No system id foud in params');
    return <Navigate to={paths.systems.root} />;
  } else {
    return (
      <RoleGuard
        oneOf={['admin', systemId]}
        mode="resource"
        resource="web-client"
      >
        <Helmet>
          <title>{systemId}</title>
        </Helmet>

        <SystemView systemId={systemId} />
      </RoleGuard>
    );
  }
}
