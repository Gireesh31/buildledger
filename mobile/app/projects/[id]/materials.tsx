import { formatINR } from "@/lib/format";
import { balanceDue, outstandingBills } from "@/lib/ledger";
import { EntryPage } from "../../../src/EntryPage";
import { StatTile, TileGrid } from "../../../src/ui";

export default function Materials() {
  return (
    <EntryPage
      collection="materials"
      catalog="material"
      multiple
      header={(records) => {
        const due = outstandingBills(records);
        return (
          <TileGrid>
            <StatTile label="Material spend" value={formatINR(records.reduce((s, r) => s + (Number(r.amount) || 0), 0))} />
            <StatTile label="Outstanding due" value={formatINR(due.amount)} hint={due.count > 0 ? `${due.count} unpaid bill${due.count === 1 ? "" : "s"}` : "No unpaid bills"} critical={due.amount > 0} />
          </TileGrid>
        );
      }}
      extras={(records) => [
        { label: "Balance due", values: Object.fromEntries(records.filter((r) => balanceDue(r) > 0).map((r) => [r.id, { text: formatINR(balanceDue(r), true), critical: true }])) },
      ]}
    />
  );
}
