import { QtmDivider } from '@qtm/react';
import { Typography } from 'src/components/typography';

export function InventoryView() {
  return (
    <div className="flex flex-col h-full">
      <Typography component="title-1">Parc</Typography>
      <QtmDivider className="mt-s mb-l" />

      <iframe
        src="https://dit-grafana.cluster.local/d-solo/de1r1sc4upk3kb/new-dashboard?orgId=1&theme=light&panelId=1"
        className="flex-1 h-full"
        frameBorder="0"
        // @ts-ignore Using the no-capital syntax should enalbe prop for firefox (TODO: check this)
        // eslint-disable-next-line react/no-unknown-property
        frameborder="0"
      ></iframe>
    </div>
  );
}
