import { formatINR, formatNumber } from "@/lib/format";
import { balanceDue, outstandingBills } from "@/lib/ledger";
import { EntryPage } from "../../../src/EntryPage";
import { StatTile, TileGrid } from "../../../src/ui";

export default function Transport() {
  return (
    <EntryPage
      collection="transport"
      catalog="vehicle"
      multiple
      header={(records) => {
        const due = outstandingBills(records);
        const hours = records.reduce((s, v) => s + (v.chargeType === "hourly" && typeof v.hours === "number" ? v.hours : 0), 0);
        return (
          <TileGrid>
            <StatTile label="Transport cost" value={formatINR(records.reduce((s, r) => s + (Number(r.amount) || 0), 0))} />
            <StatTile label="Outstanding due" value={formatINR(due.amount)} hint={due.count > 0 ? `${due.count} unpaid bill${due.count === 1 ? "" : "s"}` : "No unpaid bills"} critical={due.amount > 0} />
            <StatTile label="Hours hired" value={formatNumber(hours)} hint="Per-hour vehicles only" />
            <StatTile label="Entries" value={String(records.length)} />
          </TileGrid>
        );
      }}
      extras={(records) => [
        { label: "Balance due", values: Object.fromEntries(records.filter((r) => balanceDue(r) > 0).map((r) => [r.id, { text: formatINR(balanceDue(r), true), critical: true }])) },
      ]}
    />
  );
}
