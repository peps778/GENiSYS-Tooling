import type { OSINTTool } from "../types/osint";

const catalog: Array<[string,string,string,string,string,string,string,string[]]> = [
["dig","DNS","Query DNS records for a name.","example.com A","Resolver response with answer/authority/additional sections.","Use for authorized public DNS observation.","Resolver caching, split DNS, and provider behavior can affect output.",["host","nslookup","dnsx"]],
["host","DNS","Compact DNS lookup and reverse lookup.","example.com","Human-readable record result.","Use for quick public DNS checks.","Output is less structured than dig.",["dig","nslookup"]],
["nslookup","DNS","Portable DNS lookup utility.","example.com","Resolver answer and server context.","Useful on Windows and cross-platform environments.","Formatting and capabilities vary by platform.",["dig","host"]],
["whois","Registration","Query registration records where the registry/service supports it.","example.com","Registration/registrar data.","Use public registration data only.","Privacy, redaction, stale data, and registry differences.",["curl","dig"]],
["rdap","Registration","Query standardized domain registration data through RDAP.","example.com","Structured registration data such as registrar, dates, statuses, nameservers, and available public fields.","Use public RDAP data and record the RDAP server/source and retrieval time.","Public fields can be redacted; availability and fields vary by registry/registrar and jurisdiction.",["whois","curl","dig"]],
["subfinder","Discovery","Passive subdomain enumeration using configured public sources.","example.com","Candidate subdomains and source references.","Keep source usage within authorized research scope.","Coverage depends on sources and configuration.",["amass","crt.sh"]],
["amass","Discovery","Asset and subdomain discovery using multiple data sources.","example.com","Candidate names and relationships.","Use passive/public modes for OSINT work unless active testing is authorized.","Can produce stale or duplicate candidates.",["subfinder","dnsx"]],
["crt.sh","Certificates","Search Certificate Transparency records.","%.example.com","Certificate names and certificate metadata.","Use public CT data for discovery and correlation.","Certificate names may be historical or unused.",["Censys","urlscan.io"]],
["theHarvester","Discovery","Aggregate public-source names, hosts, emails, and related data.","example.com","Collected public references.","Use only public sources and respect provider terms.","Source coverage and result freshness vary.",["subfinder","search"]],
["dnsx","DNS","Resolve candidate names and inspect DNS records at scale.","example.com","Structured DNS observations.","Restrict queries to authorized/public scope.","Resolver rate limits and wildcard DNS create false positives.",["dig","subfinder"]],
["httpx","Web discovery","Probe HTTP(S) endpoints and collect response metadata.","https://example.com","Status, title, headers, technology hints depending on options.","Only probe authorized hosts.","Active requests can have operational impact; fingerprints can be wrong.",["curl","subfinder"]],
["Wayback Machine","Archives","Retrieve historical public web snapshots.","https://example.com","Archived URLs and snapshots.","Use archived public content for historical context.","Archives can be incomplete or altered by capture limitations.",["curl","search"]],
["ExifTool","Metadata","Read metadata from images and many document/media types.","file.jpg","EXIF/XMP/IPTC and other metadata.","Analyze artifacts you are authorized to possess.","Metadata may be stripped or rewritten.",["pdfinfo","file"]],
["pdfinfo","Metadata","Inspect PDF document properties and structure.","file.pdf","Creator/producer, pages, dates, dimensions.","Use on collected documents within scope.","Fields can be rewritten by export tools.",["ExifTool","file"]],
["strings","File triage","Extract printable strings from binary artifacts.","file.bin","Readable strings for triage.","Use on artifacts you are authorized to analyze.","Output lacks structural context and can contain false leads.",["file","jq"]],
["file","File identification","Identify file type from signatures and metadata.","artifact.bin","Reported MIME/type and format clues.","Use on collected artifacts.","Polyglots and malformed files can confuse identification.",["strings","ExifTool"]],
["curl","HTTP","Retrieve public URLs and inspect HTTP behavior.","https://example.com","Headers, status, redirects, body depending on options.","Use for public/in-scope resources.","Requests can be active; preserve exact options and response context.",["wget","jq"]],
["wget","HTTP","Retrieve public web resources and files.","https://example.com/report.pdf","Downloaded artifact and response information.","Use only for public/in-scope resources.","Downloads can change local timestamps and content.",["curl","sha256sum"]],
["jq","Data processing","Filter and format JSON output.","response.json","Structured selected fields.","Use locally on collected JSON.","Does not validate the truth of the data.",["curl","strings"]],
["CyberChef","Data transformation","Inspect or transform encoded data interactively.","encoded text","Decoded/transformed representation.","Use for analysis of data you are authorized to inspect.","Transformations are not evidence by themselves.",["jq","strings"]],
["Shodan","Internet exposure search","Search indexed internet-facing service observations.","example.com","Indexed service/host metadata.","Use for passive public research and respect service terms.","Index may be stale and does not prove current exposure.",["Censys","urlscan.io"]],
["Censys","Internet exposure search","Search public certificate and host datasets.","example.com","Certificate/host observations.","Use public datasets for authorized research.","Dataset freshness and attribution limits.",["crt.sh","Shodan"]],
["urlscan.io","Web observation","Search public URL scan records and observed resources.","example.com","Public scan metadata, URLs, domains, resources.","Use existing public scans for passive research.","Scans may contain third-party data and can be stale.",["Wayback Machine","Censys"]],
["VirusTotal","Artifact/domain intelligence","Review public reputation and relationship data for domains, URLs, and files.","example.com","Public detections, relationships, metadata depending on access.","Use public records and avoid uploading sensitive artifacts without authorization.","Third-party detections are not authoritative proof.",["urlscan.io","Censys"]],
["Maltego","Graph correlation","Visualize and correlate entities from configured transforms.","example.com","Graph entities and relationships.","Use public/authorized sources and document transform provenance.","Graph relationships can look stronger than their source evidence.",["SpiderFoot","Recon-ng"]],
["SpiderFoot","OSINT automation","Automate collection from many public OSINT sources.","example.com","Hosts, domains, usernames, emails, and relationships.","Keep modules passive/public unless explicitly authorized otherwise.","Automation can generate large noisy datasets.",["Recon-ng","theHarvester"]],
["Recon-ng","Recon framework","Organize public reconnaissance modules and results.","example.com","Structured reconnaissance records.","Use only passive/public modules for OSINT scope unless authorized.","Modules and APIs change; output requires validation.",["SpiderFoot","theHarvester"]],
["Google/Bing/DuckDuckGo search","Search","Locate public indexed sources using provider-supported syntax.","site:example.com filetype:pdf","Search results and source URLs.","Use public-source research and record exact query/provider.","Indexing varies; snippets are not primary evidence.",["Wayback Machine","urlscan.io"]],
];

const scenarios = [
  ["baseline collection","Establish a baseline result set before correlating sources.","Capture the tool version/query, timestamp, and complete relevant output.","Repeat with an independent source and document differences."],
  ["freshness check","Determine whether a public result is current enough for the question.","Record source date and retrieval time.","Compare with a current primary source or second dataset."],
  ["cross-source correlation","Use the tool to compare an observation with another public source.","Preserve the relationship and provenance of both observations.","Require independent corroboration before attribution."],
  ["false-positive review","A result looks relevant but could arise from shared infrastructure or stale data.","Record the candidate result and its context.","Test alternative explanations and document unresolved uncertainty."],
];

export const osintTools: OSINTTool[] = catalog.map(([id,category,purpose,input,output,safe,limits,related]) => ({
  id,name:id,category,purpose,typicalInput:input,typicalOutput:output,safeUse:safe,evidenceProduced:"Query/output, source reference, timestamp, and artifact/hash where applicable.",limitations:limits,relatedTools:related
}));

export interface OSINTToolScenario {
  id: string;
  tool: string;
  situation: string;
  objective: string;
  input: string;
  expectedObservation: string;
  validation: string;
  evidence: string;
  limitations: string;
  nextStep: string;
  stopCondition: string;
}

export const OSINT_TOOL_SCENARIOS: OSINTToolScenario[] = osintTools.flatMap((tool, toolIndex) =>
  scenarios.map(([kind, situation, observation, validation], i) => ({
    id: `TOOL-OSINT-${String(toolIndex * 4 + i + 1).padStart(3, "0")}`,
    tool: tool.name,
    situation: `${tool.name}: ${kind}. ${situation}`,
    objective: `Use ${tool.name} to ${tool.purpose.toLowerCase()} while keeping the observation separate from interpretation.`,
    input: tool.typicalInput,
    expectedObservation: `${observation} Expected output: ${tool.typicalOutput}`,
    validation: `${validation} ${tool.limitations}`,
    evidence: tool.evidenceProduced,
    limitations: tool.limitations,
    nextStep: "Correlate the result with the relevant case library and preserve only evidence material to the investigation.",
    stopCondition: "Stop when the question is answered, the source is exhausted, or further interaction would exceed authorized scope.",
  }))
);
