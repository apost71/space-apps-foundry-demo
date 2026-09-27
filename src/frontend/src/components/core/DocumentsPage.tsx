import { JSX } from "react";
import { useEffect, useState } from "react";
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowLeftRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "100vh",
    padding: "32px 24px",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
  inner: {
    width: "100%",
    maxWidth: "860px",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  description: {
    opacity: 0.8,
    marginBottom: "24px",
  },
  footer: {
    marginTop: "24px",
    opacity: 0.7,
    fontSize: "12px",
  },
  sizeCell: {
    whiteSpace: "nowrap",
    opacity: 0.8,
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
  name.replace(/\.pdf$|\.md$|\.txt$/i, "").replace(/_/g, " ");

export function DocumentsPage(): JSX.Element {
  const styles = useStyles();
  const [docs, setDocs] = useState<IDocumentInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.headerRow}>
          <Button
            appearance="subtle"
            icon={<ArrowLeftRegular />}
            onClick={() => {
              window.location.hash = "";
            }}
          >
            Chat
          </Button>
          <Title2>Knowledge Base</Title2>
        </div>
        <Text className={styles.description}>
          These are the sources the research assistant draws from — every answer
          is grounded in and cites these documents.
        </Text>
        {error && <Text>{error}</Text>}
        {!docs && !error && <Spinner label="Loading documents..." />}
        {docs && (
          <Table aria-label="Source documents">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Document</TableHeaderCell>
                <TableHeaderCell>Size</TableHeaderCell>
                <TableHeaderCell>Last modified</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.name}>
                  <TableCell>{formatTitle(doc.name)}</TableCell>
                  <TableCell className={styles.sizeCell}>
                    {formatSize(doc.size)}
                  </TableCell>
                  <TableCell className={styles.sizeCell}>
                    {doc.last_modified
                      ? new Date(doc.last_modified).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <a
                      href={
                        "/documents/" +
                        encodeURIComponent(doc.name).replace(/%20/g, "%20")
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className={styles.footer}>
          Corpus built from NASA NTRS publications via{" "}
          <a href="https://github.com/apost71/space-apps-foundry-demo/blob/main/scripts/download_nasa_docs.py" target="_blank" rel="noopener noreferrer">
            scripts/download_nasa_docs.py
          </a>
          {" · "}
          <a href="https://github.com/apost71/space-apps-foundry-demo" target="_blank" rel="noopener noreferrer">
            About this project ↗
          </a>
        </div>
      </div>
    </div>
  );
}
