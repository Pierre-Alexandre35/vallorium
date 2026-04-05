import { AppShell } from "../../../components/layouts/app-shell";
import { VillageSummaryCards } from "../components/village-summary-cards";
import { VillagesTable } from "../components/villages-table";
import { useHomeData } from "../hooks/use-home-data";

export function HomePage() {
  const { data, isLoading, isError } = useHomeData();

  return (
    <AppShell>
      {isLoading ? <div className="card">Loading villages...</div> : null}

      {isError ? (
        <div className="card form__error">
          Failed to load villages. Please try again.
        </div>
      ) : null}

      {data ? (
        <>
          <VillageSummaryCards villages={data} />
          <VillagesTable villages={data} />
        </>
      ) : null}
    </AppShell>
  );
}
