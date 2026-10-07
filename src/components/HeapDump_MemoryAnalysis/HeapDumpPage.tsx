/**
 * HeapDumpPage.tsx
 *
 * Module-level orchestration component for Heap Dump / Memory Analysis.
 * Owns: file selection, worker lifecycle, high-level analysis state,
 * active tab state, and error state. Delegates all rendering detail to
 * components/ and panels/, and all processing to lib/ via the worker.
 *
 * This is the ONLY file the rest of GENiSYS should ever import from —
 * see index.ts.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import FileDropzone from './components/FileDropzone';
import FileInfoPanel from './components/FileInfoPanel';
import TabNav from './components/TabNav';
import { HeapWorkerClient } from './lib/heapWorkerClient';
import OverviewPanel from './panels/OverviewPanel';
import StringsPanel from './panels/StringsPanel';
import SecretsPanel from './panels/SecretsPanel';
import RegexSearchPanel from './panels/RegexSearchPanel';
import JsonExtractPanel from './panels/JsonExtractPanel';
import type {
  HeapDumpTabId,
  HeapSummary,
  JsonExtractResult,
  RegexSearchResult,
  SecretMatch,
  StringsPage,
} from './types/heap';
import { AlertIcon } from './components/icons';

const PAGE_SIZE = 50;

export default function HeapDumpPage() {
  const clientRef = useRef<HeapWorkerClient | null>(null);

  const [summary, setSummary] = useState<HeapSummary | null>(null);
  const [activeTab, setActiveTab] = useState<HeapDumpTabId>('overview');

  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState<{
    stage: string;
    percent: number;
  } | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const [stringsPage, setStringsPage] = useState<StringsPage | null>(null);
  const [stringsLoading, setStringsLoading] = useState(false);

  const [secrets, setSecrets] = useState<SecretMatch[] | null>(null);
  const [secretsLoading, setSecretsLoading] = useState(false);

  const [regexResults, setRegexResults] = useState<RegexSearchResult[] | null>(
    null,
  );
  const [regexTruncated, setRegexTruncated] = useState(false);
  const [regexLoading, setRegexLoading] = useState(false);
  const [regexError, setRegexError] = useState<string | null>(null);

  const [jsonResults, setJsonResults] = useState<JsonExtractResult[] | null>(
    null,
  );
  const [jsonLoading, setJsonLoading] = useState(false);

  // Lazily create the worker client once, and always terminate it on
  // unmount so no worker keeps running after navigating away from /heap.
  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new HeapWorkerClient();
      clientRef.current.onProgress((stage, percent) =>
        setProgress({ stage, percent }),
      );
    }
    return clientRef.current;
  }, []);

  useEffect(() => {
    return () => {
      clientRef.current?.terminate();
      clientRef.current = null;
    };
  }, []);

  const resetAnalysisState = () => {
    setStringsPage(null);
    setSecrets(null);
    setRegexResults(null);
    setRegexTruncated(false);
    setRegexError(null);
    setJsonResults(null);
    setActiveTab('overview');
  };

  const handleFileSelected = useCallback(
    async (file: File) => {
      setFatalError(null);
      resetAnalysisState();
      setIsParsing(true);
      setProgress({ stage: 'Reading file', percent: 0 });
      try {
        const client = getClient();
        const parsedSummary = await client.parseFile(file);
        setSummary(parsedSummary);
      } catch (err) {
        setFatalError(
          err instanceof Error
            ? err.message
            : 'Failed to parse the selected file.',
        );
      } finally {
        setIsParsing(false);
        setProgress(null);
      }
    },
    [getClient],
  );

  const handleClear = () => {
    clientRef.current?.terminate();
    clientRef.current = null;
    setSummary(null);
    setFatalError(null);
    resetAnalysisState();
  };

  const handleRequestStringsPage = useCallback(
    async (page: number, pageSize: number, filter?: string) => {
      setStringsLoading(true);
      try {
        const result = await getClient().getStringsPage(page, pageSize, filter);
        setStringsPage(result);
      } catch (err) {
        setFatalError(
          err instanceof Error ? err.message : 'Failed to load strings.',
        );
      } finally {
        setStringsLoading(false);
      }
    },
    [getClient],
  );

  const handleScanSecrets = useCallback(async () => {
    setSecretsLoading(true);
    try {
      const result = await getClient().getSecrets();
      setSecrets(result);
    } catch (err) {
      setFatalError(
        err instanceof Error ? err.message : 'Failed to scan for secrets.',
      );
    } finally {
      setSecretsLoading(false);
    }
  }, [getClient]);

  const handleRegexSearch = useCallback(
    async (pattern: string, flags: string) => {
      setRegexLoading(true);
      setRegexError(null);
      try {
        const { results, truncated } = await getClient().regexSearch(
          pattern,
          flags,
        );
        setRegexResults(results);
        setRegexTruncated(truncated);
      } catch (err) {
        setRegexError(err instanceof Error ? err.message : 'Search failed.');
      } finally {
        setRegexLoading(false);
      }
    },
    [getClient],
  );

  const handleExtractJson = useCallback(async () => {
    setJsonLoading(true);
    try {
      const result = await getClient().extractJson();
      setJsonResults(result);
    } catch (err) {
      setFatalError(
        err instanceof Error ? err.message : 'Failed to extract JSON.',
      );
    } finally {
      setJsonLoading(false);
    }
  }, [getClient]);

  return (
    // Width now follows the parent app shell instead of being capped, so the
    // page expands to fill the space freed when the shell sidebar collapses.
    <div className="w-full min-w-0 space-y-5 bg-[#F9FAFB] p-6">
      <header>
        <h1 className="text-lg font-semibold text-[#111827]">
          Heap Dump / Memory Analysis
        </h1>
        <p className="mt-1 text-sm text-[#4B5563]">
          Inspect Chrome/Chromium heap snapshots and Firefox-compatible memory
          dumps for strings, credentials, endpoints, and structured data.
        </p>
      </header>

      {fatalError && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertIcon width={16} height={16} className="mt-0.5 flex-none" />
          <span>{fatalError}</span>
        </div>
      )}

      {!summary && (
        <FileDropzone
          onFileSelected={handleFileSelected}
          disabled={isParsing}
        />
      )}

      {isParsing && progress && (
        <div className="rounded-md border border-[#E5E7EB] bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-[#4B5563]">
            <span>{progress.stage}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
            <div
              className="h-full rounded-full bg-[#16A34A] transition-[width]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {summary && (
        <>
          <FileInfoPanel summary={summary} onClear={handleClear} />
          <TabNav
            activeTab={activeTab}
            onChange={setActiveTab}
            counts={{ secrets: secrets?.length }}
          />

          <div>
            {activeTab === 'overview' && (
              <OverviewPanel
                summary={summary}
                secretsCount={secrets?.length ?? null}
                onGoToSecrets={() => setActiveTab('secrets')}
                onGoToStrings={() => setActiveTab('strings')}
              />
            )}
            {activeTab === 'strings' && (
              <StringsPanel
                page={stringsPage}
                loading={stringsLoading}
                onRequestPage={handleRequestStringsPage}
                pageSize={PAGE_SIZE}
              />
            )}
            {activeTab === 'secrets' && (
              <SecretsPanel
                secrets={secrets}
                loading={secretsLoading}
                onScan={handleScanSecrets}
              />
            )}
            {activeTab === 'search' && (
              <RegexSearchPanel
                results={regexResults}
                truncated={regexTruncated}
                loading={regexLoading}
                error={regexError}
                onSearch={handleRegexSearch}
              />
            )}
            {activeTab === 'json' && (
              <JsonExtractPanel
                results={jsonResults}
                loading={jsonLoading}
                onExtract={handleExtractJson}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
