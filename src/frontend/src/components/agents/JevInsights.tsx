import { ReactNode, useState } from "react";
import { makeStyles, tokens, Text, Button } from "@fluentui/react-components";
import { ArrowRightRegular, ChevronDownRegular, ChevronRightRegular, FlashRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    margin: "2px 0 6px 0",
    fontSize: "12px",
    borderRadius: "999px",
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground2,
    width: "fit-content",
  },
  chipConfidence: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  insights: {
    marginTop: "4px",
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
  },
  insightsToggle: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 6px",
    textTransform: "none",
    fontSize: "12px",
  },
  panel: {
    marginTop: "6px",
    padding: "10px 12px",
    borderRadius: "8px",
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxWidth: "560px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  label: {
    width: "190px",
    flexShrink: 0,
    fontSize: "11px",
    lineHeight: "1.2",
  },  barTrack: {
    flexGrow: 1,
    height: "8px",
    borderRadius: "4px",
    backgroundColor: tokens.colorNeutralBackground4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "4px",
    backgroundColor: tokens.colorPaletteGreenForeground1,
  },
  barFillWarn: {
    height: "100%",
    borderRadius: "4px",
    backgroundColor: tokens.colorPaletteDarkOrangeForeground1,
  },
  value: {
    width: "44px",
    textAlign: "right",
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    opacity: 0.8,
    marginTop: "2px",
  },
  warn: {
    color: tokens.colorPaletteDarkOrangeForeground1,
  },
});

const pct = (v: number | undefined | null) =>
  v === undefined || v === null ? "—" : `${Math.round(v * 100)}%`;

function ProbBar({ label, value, warn }: { label: string; value: number | undefined; warn?: boolean }) {
  const styles = useStyles();
  return (
    <div className={styles.row}>
      <Text className={styles.label}>{label}</Text>
      <div className={styles.barTrack}>
        <div
          className={warn ? styles.barFillWarn : styles.barFill}
          style={{ width: `${Math.max(2, Math.round((value ?? 0) * 100))}%` }}
        />
      </div>
      <Text className={`${styles.value}${warn ? ` ${styles.warn}` : ""}`}>{pct(value)}</Text>
    </div>
  );
}

export function JevRoutingChip({ routing }: { routing: any }): ReactNode {
  const styles = useStyles();
  if (!routing) return null;
  const topic = routing.topic?.replace(/_/g, " ");
  return (
    <div className={styles.chip}>
      <FlashRegular aria-hidden={true} />
      <span>
        Jev · routed: <b>{routing.route?.replace(/_/g, " ")}</b>{" "}
        <span className={styles.chipConfidence}>{pct(routing.route_confidence)}</span>
        {topic && routing.route !== "off_topic" && (
          <>
            {" · topic: "}
            {topic}
          </>
        )}
        {routing.latency_ms != null && <> · {routing.latency_ms}ms</>}
      </span>
    </div>
  );
}

export function JevInsights({
  routing,
  verification,
  skippedLlm,
}: {
  routing?: any;
  verification?: any;
  skippedLlm?: boolean;
}): ReactNode {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  if (!routing && !verification && !skippedLlm) return null;
  return (
    <div className={styles.insights}>
      <Button
        appearance="subtle"
        className={styles.insightsToggle}
        icon={open ? <ChevronDownRegular /> : <ChevronRightRegular />}
        onClick={() => setOpen(!open)}
      >
        System Insights {skippedLlm ? "· LLM call skipped ⚡" : ""}
      </Button>
      {open && (
        <div className={styles.panel}>
          {routing && (
            <>
              <Text className={styles.sectionTitle}>Routing (Jev)</Text>
              <ProbBar label="route" value={routing.route_confidence} />
              <ProbBar label="topic" value={routing.topic_confidence} />
              {routing.is_genuine != null && <ProbBar label="genuine" value={routing.is_genuine} />}
              {routing.latency_ms != null && (
                <Text>
                  <ArrowRightRegular aria-hidden={true} /> decided in {routing.latency_ms}ms · {routing.model}
                </Text>
              )}
            </>
          )}
          {verification && (
            <>
              <Text className={styles.sectionTitle}>
                Citation verification (Jev) ·{" "}
                {verification.results?.reduce((n: number, r: any) => n + (r.citations || 1), 0)} citations
                across {verification.results?.length} sources
              </Text>
              {verification.results?.map((r: any, i: number) => (
                <ProbBar
                  key={`v-${i}`}
                  label={
                    `${(r.label || "source")
                      .replace(/\.pdf$/i, "")
                      .replace(/^\d{8,12}_/, "")
                      .slice(0, 26)}` + (r.citations > 1 ? ` (×${r.citations})` : "")
                  }
                  value={r.supported}
                  warn={r.supported != null && r.supported < 0.6}
                />
              ))}              {verification.latency_ms != null && (
                <Text>
                  <ArrowRightRegular aria-hidden={true} /> verified in {verification.latency_ms}ms · {verification.model}
                </Text>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
