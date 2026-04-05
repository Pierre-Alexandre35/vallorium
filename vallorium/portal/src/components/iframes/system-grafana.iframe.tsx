import { QtmAlert } from '@qtm/react';
import { useMemo, useRef } from 'react';
import { SplashScreen } from 'src/components/loading';
import { useUser } from 'src/hooks';
import { Typography } from '../typography';
import { Link } from 'react-router-dom';

type P = {
  dashboardId: string;
  timeframe: {
    from: string;
    to: string;
  };
};

export const SystemGrafanaIframe = ({
  dashboardId,
  timeframe: { from, to },
}: P) => {
  const iFrameRef: React.LegacyRef<HTMLIFrameElement> = useRef(null);
  const { loading: userLoading } = useUser();

  const src = useMemo(
    () =>
      `https://dit-grafana.cluster.local/d/${dashboardId}/hums-dashboard?orgId=1&from=${from}&to=${to}&theme=light`,
    [dashboardId, from, to],
  );

  const loading = useMemo(() => userLoading, [userLoading]);

  return (
    <>
      {loading ? (
        <div className="pt-6xl">
          <SplashScreen subtitle="Loading your graphs..." hideLogo />
        </div>
      ) : (
        <div>
          {location.hostname.includes('local') ? (
            <QtmAlert
              severity="informative"
              dismissible={false}
              className="my-l"
            >
              <Typography>
                Vous semblez utiliser le HUMS en local. Si vous n&apos;avez pas
                configuré de certificat TLS, assurez-vous de visiter{' '}
                <Link
                  className="underline text-primary-500"
                  to="https://dit-grafana.cluster.local/"
                  target="_blank"
                >
                  dit-minio-api.cluster.local
                </Link>{' '}
                avec votre navigateur au moins une fois pour que le dashboard
                ci-dessous s&apos;affiche.
              </Typography>
            </QtmAlert>
          ) : null}
          &emsp;
          <iframe
            ref={iFrameRef}
            src={src}
            width="100%"
            height="800px"
            frameBorder="0"
          />
          &emsp;
        </div>
      )}
    </>
  );
};
