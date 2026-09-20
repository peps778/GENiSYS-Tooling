import type { OSINTReference } from "../types/osint";

export const quickReferenceGroups: Array<{ id: string; title: string; description: string; items: OSINTReference[] }> = [
  {
    id: "dns", title: "DNS records", description: "Observe records as infrastructure evidence; unusual values are leads, not conclusions.",
    items: [
      ["A","IPv4 address mapping","An apex or host A record maps a name to IPv4.","Capture resolver, timestamp, TTL, and returned address.","dns"],
      ["AAAA","IPv6 address mapping","May expose infrastructure not represented in IPv4 results.","Capture returned IPv6 values and resolver context.","dns ipv6"],
      ["CNAME","Canonical alias","Shows a name delegated to another hostname; useful for provider and dependency correlation.","Capture target, TTL, and any chain of aliases.","dns"],
      ["MX","Mail exchange","Shows advertised mail-handling hosts and can support provider correlation.","Capture priority, hostnames, and resolver/time.","email"],
      ["NS","Authoritative nameserver","Shows delegated DNS authorities and possible provider relationships.","Capture all authorities and delegation context.","dns"],
      ["TXT","Arbitrary text records","May contain SPF, verification tokens, ownership clues, or service configuration.","Capture the exact returned strings; classify before interpreting.","dns"],
      ["SOA","Zone authority metadata","Contains primary server, responsible mailbox representation, serial, and timing values.","Capture complete SOA response and timestamp.","dns"],
      ["PTR","Reverse DNS","Maps an IP to a hostname when published; useful for correlation, not ownership proof.","Record queried address, returned name, and resolver.","reverse-dns"],
      ["CAA","Certificate issuance policy","Can indicate which certificate authorities a domain authorizes.","Capture exact flags, tags, values, and timestamp.","tls dns"],
      ["SRV","Service location","Advertises service-specific host/port targets.","Capture service, protocol, priority, weight, port, target.","dns services"],
    ].map(([name,summary,detail,evidence,tags]) => ({ id:`dns-${name.toLowerCase()}`, name, summary, details:[detail,evidence], tags:tags.split(" ") })),
  },
  {
    id: "dns-commands", title: "DNS commands", description: "Resolver queries for observation and documentation. Use only against systems in scope.",
    items: [
      ["dig example.com","Basic DNS response","Inspect resolver output, answer section, authority section, and TTL.","dig example.com","dig"],
      ["dig example.com A","A record","Request IPv4 records explicitly.","dig example.com A","dig dns"],
      ["dig example.com AAAA","AAAA record","Request IPv6 records explicitly.","dig example.com AAAA","dig dns"],
      ["dig example.com MX","MX records","Review mail exchange priorities and targets.","dig example.com MX","dig email"],
      ["dig example.com NS","NS records","Review authoritative nameservers.","dig example.com NS","dig dns"],
      ["dig example.com TXT","TXT records","Review SPF and service-verification strings.","dig example.com TXT","dig"],
      ["dig example.com CNAME","CNAME","Check whether a queried hostname is an alias.","dig example.com CNAME","dig"],
      ["dig example.com SOA","SOA","Inspect zone authority metadata.","dig example.com SOA","dig"],
      ["dig -x 192.0.2.10","PTR","Perform reverse lookup of an IP.","dig -x 192.0.2.10","dig reverse-dns"],
      ["host example.com","Compact DNS lookup","Quickly inspect common records on Unix-like systems.","host example.com","host"],
      ["nslookup example.com","Resolver lookup","Portable interactive/non-interactive DNS lookup.","nslookup example.com","nslookup"],
      ["nslookup -type=MX example.com","Windows-friendly MX","Explicitly request a mail record.","nslookup -type=MX example.com","windows dns"],
    ].map(([name,summary,detail,command,tags]) => ({ id:`cmd-${name.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}`, name, summary, command, details:[detail,"Expected output is a resolver response; preserve timestamp and resolver context."], tags:tags.split(" ") })),
  },
  {
    id: "registration", title: "Registration data", description: "WHOIS/RDAP registration references. Current public data can be redacted or incomplete; use it as dated registration evidence, not automatic ownership proof.",
    items: [
      ["RDAP","Registration Data Access Protocol","Structured registration-data access designed as the successor to WHOIS for current registration data.","Use an RDAP client or the registry/registrar RDAP service and preserve the response source and retrieval time.","rdap registration"],
      ["WHOIS","Legacy registration lookup","WHOIS remains available for some services and domains, but public availability varies and RDAP is the modern standardized path for gTLD registration data.","Preserve the exact response, source, and timestamp; distinguish current from historical data.","whois registration"],
      ["Creation date","Registration lifecycle field","A published creation date indicates the registration date reported by the relevant registration data service.","Compare with current/historical records before using it in chronology.","rdap whois timeline"],
      ["Domain status","Registration status","Statuses can describe registry/registrar state such as transfer or update restrictions.","Record the exact status values and source before interpreting them.","rdap whois status"]
    ].map(([name,summary,detail,evidence,tags]) => ({ id:`registration-${name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, name, summary, details:[detail,evidence], tags:tags.split(" ") })),
  },
  {
    id: "search", title: "Search operators", description: "Common search operators; syntax and support vary by provider. Treat results as leads and verify against the source.",
    items: [
      ["site:example.com","Restrict to a domain","Find publicly indexed pages associated with a domain.","site:example.com","search"],
      ["site:example.com filetype:pdf","File-type discovery","Locate indexed PDF material on a public domain.","site:example.com filetype:pdf","search pdf"],
      ["site:example.com inurl:api","URL-pattern search","Find pages whose indexed URL contains an API-related path.","site:example.com inurl:api","search"],
      ["site:example.com intitle:\"documentation\"","Title search","Locate public documentation pages.","site:example.com intitle:\"documentation\"","search"],
      ["\"exact phrase\"","Exact phrase","Locate public pages containing a quoted phrase.","\"exact phrase\"","search"],
      ["OR","Alternative terms","Search for either of two documented terms.","example OR sample","search"],
      ["-term","Exclude a term","Reduce irrelevant result classes where supported.","example -unrelated","search"],
      ["before:YYYY-MM-DD / after:YYYY-MM-DD","Date bounds","Limit search by provider-supported date syntax; verify the actual source date.","site:example.com after:2025-01-01","search"],
    ].map(([name,summary,detail,command,tags]) => ({ id:`search-${name.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}`, name, summary, command, details:[detail,"Search syntax and indexing behavior vary by provider; do not infer current state from a result alone."], tags:tags.split(" ") })),
  },
  {
    id: "metadata", title: "Metadata tools", description: "Metadata is evidence that needs validation; it is not automatically ground truth.",
    items: [
      ["ExifTool","Image/document metadata","Read EXIF, XMP, IPTC and many document/media metadata formats.","exiftool file.jpg","metadata"],
      ["pdfinfo","PDF properties","Inspect PDF producer, creator, pages, dates, and structural properties.","pdfinfo file.pdf","pdf metadata"],
      ["file","File identification","Identify a file from content signatures and reported type.","file artifact.bin","files"],
      ["strings","Readable strings","Extract printable strings for triage; output requires context and validation.","strings artifact.bin","files"],
    ].map(([name,summary,detail,command,tags]) => ({ id:`meta-${name.toLowerCase()}`, name, summary, command, details:[detail,"Preserve the original artifact before transforming it; record hash and acquisition context where appropriate."], tags:tags.split(" ") })),
  },
  {
    id: "evidence", title: "Evidence rules", description: "Separate what was observed from what it may mean and what has been independently confirmed.",
    items: [
      ["Primary evidence","Direct source material","The source artifact or directly collected record.","URL, timestamp, downloaded artifact, SHA-256 where applicable.","evidence"],
      ["Corroborating evidence","Independent support","A second source that independently supports the observation.","Record source relationship and collection time.","evidence"],
      ["Derived information","Inference","A conclusion formed from multiple observations.","Document the observations used to derive it.","analysis"],
      ["Unverified information","Lead","A claim or observation requiring additional confirmation.","Preserve as a lead; do not state it as established fact.","validation"],
      ["Never assume","Attribution guardrail","Same username, avatar, name, IP, hostname, WHOIS record, or metadata author does not automatically establish identity or ownership.","Observe → correlate → verify → document.","methodology"],
    ].map(([name,summary,detail,evidence,tags]) => ({ id:`evidence-${name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, name, summary, details:[detail,evidence], tags:tags.split(" ") })),
  },
];
