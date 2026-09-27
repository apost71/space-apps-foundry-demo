import { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Spinner,
  Input,
  Title1,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  DocumentPdfRegular,
  SearchRegular,
  OpenRegular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1,
  },
  hero: {
    width: "100%",
    padding: "40px 24px 32px 24px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: tokens.shadow8,
  },
  heroInner: {
    width: "100%",
    maxWidth: "960px",
    margin: "0 auto",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  title: {
    lineHeight: "1",
  },
  description: {
    opacity: 0.75,
    maxWidth: "640px",
  },
  content: {
    width: "100%",
    maxWidth: "960px",
    margin: "0 auto",
    padding: "24px",
    boxSizing: "border-box",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "16px",
  },
  search: {
    maxWidth: "360px",
    flexGrow: 1,
  },
  count: {
    opacity: 0.7,
    whiteSpace: "nowrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "16px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: "10px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    transitionProperty: "box-shadow, transform",
    transitionDuration: "150ms",
    ":hover": {
      boxShadow: tokens.shadow16,
      transform: "translateY(-2px)",
    },
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },
  docIcon: {
    fontSize: "24px",
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  docTitle: {
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: "1.3",
  },
  meta: {
    display: "flex",
    gap: "12px",
    opacity: 0.65,
    fontSize: tokens.fontSizeBase300,
  },
  viewLink: {
    marginTop: "auto",
    paddingTop: "4px",
  },
  empty: {
    textAlign: "center",
    padding: "48px 0",
    opacity: 0.7,
  },
  footer: {
    width: "100%",
    maxWidth: "960px",
    margin: "0 auto",
    padding: "16px 24px 40px 24px",
    opacity: 0.65,
    fontSize: tokens.fontSizeBase300,
  },
});

interface IDocumentInfo {
  name: string;
  size: number;
  last_modified: string | null;
}

const formatSize = (bytes: number): string => {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const formatTitle = (name: string): string =>
  name.replace(/\.(pdf|md|txt)$/i, "").replace(/_/g, " ");

const formatNtrsId = (name: string): string | null => {
  const m = name.match(/^(\d{8,12})_/);
  return m ? `NTRS ${m[1]}` : null;
};

export function DocumentsPage(): JSX.Element {
  const styles = useStyles();
  const [docs, setDocs] = useState<IDocumentInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/documents", { credentials: "include" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setDocs(data.documents ?? []);
      } catch (e) {
        setError("Failed to load the document list.");
        console.error(e);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!docs) return [];
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => d.name.toLowerCase().includes(q));
  }, [docs, query]);

  const goBack = () => {
    window.location.hash = "";
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.topRow}>
            <Button
              appearance="subtle"
              icon={<ArrowLeftRegular />}
              onClick={goBack}
            >
              Chat
            </Button>
          </div>
          <Title1 className={styles.title}>Knowledge Base</Title1>
          <Text className={styles.description}>
            These are the sources the research assistant draws from — every
            answer is grounded in and cites these NASA publications.
          </Text>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <Input
            className={styles.search}
            contentBefore={<SearchRegular />}
            placeholder="Search documents..."
            value={query}
            onChange={(_, data) => setQuery(data.value)}
          />
          {docs && (
            <Text className={styles.count}>
              {filtered.length} of {docs.length} documents
            </Text>
          )}
        </div>

        {error && <Text>{error}</Text>}
        {!docs && !error && <Spinner label="Loading documents..." />}

        {docs && filtered.length === 0 && (
          <div className={styles.empty}>
            <Text>No documents match “{query}”.</Text>
          </div>
        )}

        {filtered.length > 0 && (
          <div className={styles.grid}>
            {filtered.map((doc) => {
              const ntrsId = formatNtrsId(doc.name);
              return (
                <div key={doc.name} className={styles.card}>
                  <div className={styles.cardTop}>
                    <DocumentPdfRegular
                      className={styles.docIcon}
                      aria-hidden={true}
                    />
                    <Text className={styles.docTitle}>
                      {formatTitle(doc.name)}
                    </Text>
                  </div>
                  <div className={styles.meta}>
                    {ntrsId && <span>{ntrsId}</span>}
                    <span>{formatSize(doc.size)}</span>
                    {doc.last_modified && (
                      <span>
                        {new Date(doc.last_modified).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className={styles.viewLink}>
                    <a
                      href={
                        "/documents/" + encodeURIComponent(doc.name)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<OpenRegular />}
                        iconPosition="after"
                      >
                        View PDF
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        Corpus built from NASA NTRS publications via{" "}
        <a
          href="https://github.com/apost71/space-apps-foundry-demo/blob/main/scripts/download_nasa_docs.py"
          target="_blank"
          rel="noopener noreferrer"
        >
          scripts/download_nasa_docs.py
        </a>
        {" · "}
        <a
          href="https://github.com/apost71/space-apps-foundry-demo"
          target="_blank"
          rel="noopener noreferrer"
        >
          About this project ↗
        </a>
      </div>
    </div>
  );
}
