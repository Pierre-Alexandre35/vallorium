import { Helmet } from 'react-helmet-async';
import { InventoryView } from 'src/views/inventory';

export function InventoryPage() {
  return (
    <>
      <Helmet>
        <title>Le parc</title>
      </Helmet>

      <InventoryView />
    </>
  );
}
