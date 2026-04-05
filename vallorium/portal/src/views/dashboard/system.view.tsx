import { QtmButton } from '@qtm/react';
import { locationOptions } from 'src/constants';
import { useBoolean } from 'src/hooks';
import { DataUploadModal } from 'src/components/data-upload-modal';
import { SystemGrafanaIframe } from 'src/components/iframes';

type P = {
  systemId: string;
};

export function SystemView({ systemId }: P) {
  const isModalOpen = useBoolean(false);

  return (
    <>
      <div className="top-section flex justify-between items-center mb-4">
        <div className="left">
          <h1 className="text-3xl font-bold">Mes Systèmes: {systemId}</h1>
        </div>
        <div className="right flex space-x-4">
          <QtmButton
            variant="filled"
            color="primary"
            onClick={isModalOpen.onTrue}
          >
            Uploads
          </QtmButton>
          &emsp;
          <QtmButton
            variant="filled"
            color="primary"
            onClick={() =>
              window.open(
                'http://dit-grafana.cluster.local/explore?schemaVersion=1',
                '_blank',
              )
            }
          >
            Update Graphs
          </QtmButton>
        </div>
      </div>

      <SystemGrafanaIframe
        dashboardId="d63ad4e3-1c21-4226-ae1c-c795ba6e38c7"
        timeframe={{
          from: '1628726400000',
          to: '1630281600000',
        }}
      />

      {isModalOpen.value && (
        <DataUploadModal
          closeModal={isModalOpen.onFalse}
          systemId={systemId}
          open={isModalOpen.value}
          locationOptions={locationOptions}
        />
      )}
    </>
  );
}
