import type { OSINTSection } from "../types/osint";

export const OSINT_SECTIONS: OSINTSection[] = [
  { id: "overview", number: "00", title: "Overview", description: "Investigation workflow, quick starts, scope, and evidence rules." },
  { id: "quick-reference", number: "01", title: "Quick Reference", description: "High-value DNS, URL, metadata, search, identity, and evidence references." },
  { id: "dns", number: "02", title: "DNS Enumeration", description: "Record types, resolver commands, observations, validation, and evidence." },
  { id: "whois", number: "03", title: "WHOIS", description: "Registration lifecycle, registrar data, privacy, and attribution limits." },
  { id: "subdomains", number: "04", title: "Subdomains", description: "Discovery, classification, validation, certificates, and cloud relationships." },
  { id: "url-domain", number: "05", title: "URL & Domain Analysis", description: "URL anatomy, encoding, redirects, IDN, ports, and canonicalization." },
  { id: "metadata", number: "06", title: "Metadata", description: "EXIF, XMP, IPTC, document, media, archive, and timestamp analysis." },
  { id: "search", number: "07", title: "Search Operators", description: "Provider-neutral public-source search syntax and validation cases." },
  { id: "username-email", number: "08", title: "Username / Email Investigation", description: "Identity correlation without treating matching identifiers as attribution." },
  { id: "public-evidence", number: "09", title: "Public-Source Evidence", description: "Collection, preservation, corroboration, classification, and reporting." },
  { id: "tools", number: "10", title: "OSINT Tools", description: "Tool reference and operational scenarios with limitations." },
  { id: "evidence-workflow", number: "11", title: "Evidence Workflow", description: "Evidence records, hashes, provenance, confidence, and reporting." },
  { id: "cases", number: "12", title: "Investigation Cases", description: "Searchable master case library across OSINT investigation phases." },
  { id: "logbook", number: "13", title: "Flag Logbook", description: "Track OSINT findings, provenance, verification, and status." },
];
