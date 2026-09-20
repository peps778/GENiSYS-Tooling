import type { OSINTCase } from "../types/osint";

type Seed = [string, string, string, string[], string[], string[], string, string] | {
  title: string; situation: string; objective: string; observation?: string; collection?: string[];
  validation?: string[]; evidence?: string[]; interpretation?: string; falsePositives?: string[];
  next?: string[]; stop?: string[]; tools?: string[]; evidenceTypes?: string[];
};

const makeCases = (
  prefix: string,
  category: OSINTCase["category"],
  phase: OSINTCase["phase"],
  seeds: Seed[],
  difficulty: OSINTCase["difficulty"] = "intermediate",
): OSINTCase[] =>
  seeds.map((seed, i) => {
    const [title, situation, objective, collectionMethod, validationSteps, evidenceToPreserve, interpretation, falsePositive] = Array.isArray(seed)
      ? seed
      : [seed.title, seed.situation, seed.objective, seed.collection ?? ["Record the source URL or query."], seed.validation ?? ["Repeat using an independent source."], seed.evidence ?? ["Source URL and timestamp"], seed.interpretation ?? "Treat the observation as a lead until independently corroborated.", (seed.falsePositives ?? ["Stale or shared infrastructure"]).join("; ")];
    return {
      id: `CASE-OSINT-${prefix}-${String(i + 1).padStart(3, "0")}`,
      title, category, difficulty, phase, situation, objective,
      initialObservation: Array.isArray(seed) ? "A public-source observation is available but its meaning is not yet established." : seed.observation ?? "A public-source observation is available but its meaning is not yet established.",
      collectionMethod, validationSteps, evidenceToPreserve, interpretation,
      falsePositiveConsiderations: Array.isArray(seed) ? [falsePositive, "Stale indexing or cached data", "Shared infrastructure or third-party hosting"] : seed.falsePositives ?? ["Stale indexing or cached data", "Shared infrastructure or third-party hosting"],
      nextSteps: Array.isArray(seed) ? ["Correlate with an independent public source.", "Record the result in investigation notes."] : seed.next ?? ["Correlate with an independent public source.", "Record the result in investigation notes."],
      stopConditions: Array.isArray(seed) ? ["Stop when the observation is adequately documented and the next validation step adds no evidence.", "Stop if further collection would exceed authorized scope."] : seed.stop ?? ["Stop when the observation is adequately documented and the next validation step adds no evidence.", "Stop if further collection would exceed authorized scope."],
      relatedCases: [], relatedTools: Array.isArray(seed) ? ["dig", "curl"] : seed.tools ?? ["dig", "curl"], evidenceTypes: Array.isArray(seed) ? ["primary source", "corroborating source"] : seed.evidenceTypes ?? ["primary source", "corroborating source"], status: "lead" as const,
    };
  });

const dnsSeeds: Seed[] = [
  ["A record maps a hostname","A public hostname returns one IPv4 address.","Document the address and resolver context.",["Capture A response, TTL, timestamp, and resolver."],["Repeat against a second resolver and compare freshness."],["DNS output","timestamp","resolver context"],"The hostname currently resolves to the observed IPv4 address.","CDN or shared hosting can make the address non-unique."],
  ["AAAA record exposes IPv6","A hostname returns an IPv6 address not seen in the IPv4 lookup.","Determine whether IPv6 represents the same service or separate infrastructure.",["Query AAAA and record all returned values."],["Compare service behavior and certificates through authorized observation."],["AAAA response","service comparison"],"IPv6 may expose a parallel path to the same application.","IPv6 may be a provider-managed endpoint."],
  ["CNAME identifies provider","A hostname aliases to a third-party domain.","Identify the alias relationship and preserve it as infrastructure evidence.",["Query CNAME and record the full chain."],["Resolve the target and compare certificate/provider information."],["CNAME chain","DNS timestamp"],"The alias indicates a dependency or hosting relationship, not ownership of the target provider.","Providers routinely reuse shared hostnames."],
  ["MX provider correlation","A domain advertises external MX hosts.","Document mail infrastructure without assuming organizational control of the provider.",["Query MX and preserve priorities/targets."],["Correlate with provider documentation and other DNS records."],["MX output","source timestamp"],"The domain advertises the observed mail handling service.","Hosted mail providers serve many unrelated organizations."],
  ["NS delegation","The domain returns multiple authoritative nameservers.","Map DNS delegation and provider relationships.",["Query NS and SOA; preserve the complete answer."],["Repeat with another resolver and compare delegation."],["NS/SOA output"],"The nameservers are part of the domain's current delegation.","DNS providers may use generic names across customers."],
  ["TXT verification token","A TXT record contains a service-verification string.","Record the exact value and identify its stated service.",["Capture exact TXT output and record resolver/time."],["Search the documented service's public verification guidance."],["TXT record"],"The value may indicate a service relationship if independently documented.","TXT records can persist after services are retired."],
  ["SPF record correlation","TXT data contains an SPF policy.","Understand advertised mail-sending domains and mechanisms.",["Capture the exact SPF record."],["Resolve included domains and compare with current mail infrastructure."],["SPF text","related DNS records"],"SPF describes an advertised sending policy, not proof that every sender is legitimate.","SPF can be stale or overly broad."],
  ["DMARC policy","A DMARC record is published.","Document policy and reporting destinations.",["Query _dmarc hostname and preserve output."],["Compare SPF/DKIM documentation and policy state."],["DMARC TXT"],"The record describes the domain's published email authentication policy.","Policy presence does not prove message authenticity."],
  ["CAA record","CAA records restrict certificate authority issuance.","Document the current advertised certificate policy.",["Query CAA and preserve flags/tags/values."],["Compare with observed certificates from authorized public sources."],["CAA output","certificate source"],"CAA may constrain certificate issuance for the domain.","Certificate authorities and DNS changes can lag."],
  ["SRV service record","A service-specific SRV record is published.","Identify advertised service targets and ports.",["Query the relevant SRV name and preserve priority/weight/port/target."],["Validate that the target currently resolves and is relevant."],["SRV output"],"SRV is an advertised service location, not proof of an exposed service.","Unused records can remain published."],
  ["SOA serial change","The SOA serial differs between observations.","Assess whether DNS state changed.",["Capture SOA responses with timestamps."],["Repeat from independent resolvers and check authoritative response."],["SOA serials"],"A serial difference can indicate a zone update but does not identify what changed.","Resolver caching and provider-specific serial schemes can confuse comparisons."],
  ["PTR correlation","An IP has a reverse DNS hostname.","Correlate reverse DNS with forward records.",["Run PTR lookup and preserve returned hostname."],["Resolve the hostname forward and compare addresses."],["PTR and A/AAAA outputs"],"Forward/reverse consistency can strengthen infrastructure correlation.","PTR is operator-controlled and can be generic."],
  ["Multiple A records","A hostname returns several IPv4 addresses.","Determine whether the service is load-balanced or distributed.",["Capture all addresses and TTL."],["Repeat over time and compare resolver results."],["All returned addresses"],"Multiple addresses may represent load balancing, failover, or distributed hosting.","CDNs and shared platforms commonly rotate addresses."],
  ["Low TTL observation","A record has an unusually short TTL.","Assess whether rapid DNS changes matter to the investigation.",["Record TTL and repeat after the TTL window."],["Compare successive responses and provider context."],["DNS responses over time"],"A short TTL indicates intended DNS agility, not suspicious behavior by itself.","CDNs routinely use short TTLs."],
  ["Wildcard DNS","Random labels resolve under a domain.","Determine whether wildcard DNS is present.",["Query several non-existent labels."],["Compare responses and authoritative behavior."],["Queries and responses"],"Wildcard DNS can affect subdomain discovery and false-positive rates.","Resolvers, parking pages, or application routing can mimic wildcard behavior."],
  ["Delegated subzone","A child zone has its own NS records.","Map the delegation boundary.",["Query child-zone NS/SOA records."],["Compare child authority with parent delegation."],["Parent/child DNS outputs"],"Delegation indicates administrative separation, not necessarily organizational separation.","Managed services often delegate subzones."],
  ["DNSSEC observation","DNS responses expose DNSSEC-related records.","Document whether DNSSEC is present and relevant.",["Query DNSKEY/DS where appropriate."],["Compare parent DS and child DNSKEY state."],["DNSSEC records"],"DNSSEC evidence describes validation infrastructure.","Absence of DNSSEC is not evidence of compromise."],
  ["TXT ownership record","A TXT record references a hosted service.","Determine whether the service relationship is still current.",["Capture exact record and service name."],["Check current public documentation and related records."],["TXT output"],"The record may show an intended verification relationship.","Verification records often outlive the service."],
  ["Name server geography","Nameservers appear distributed across regions.","Document provider distribution without inferring physical ownership.",["Record all NS hostnames and public provider metadata."],["Compare multiple public sources."],["NS list","provider references"],"Distribution may reflect provider architecture.","Nameserver location does not locate the organization."],
  ["Resolver discrepancy","Different public resolvers return different answers.","Explain the discrepancy before choosing one response.",["Capture resolver, timestamp, TTL, and response from each."],["Query authoritative servers where appropriate and within scope."],["Resolver comparison"],"Differences can reflect propagation, caching, split DNS, or transient changes.","Resolver geography can affect answers."],
  ["DNS response with NXDOMAIN","A queried hostname returns NXDOMAIN.","Document absence at the observation time.",["Capture response code and authority section."],["Repeat with another resolver and record timestamp."],["NXDOMAIN response"],"NXDOMAIN is an observation, not proof that the name never existed.","Historical or split-horizon DNS may differ."],
  ["DNS timeout","A resolver times out for a query.","Distinguish resolver failure from authoritative behavior.",["Capture timeout and resolver context."],["Retry with independent resolver and a known-good query."],["Query logs"],"The result is inconclusive until the resolver path is validated.","Network conditions can cause transient timeouts."],
  ["CAA absent","No CAA record is returned.","Document absence without treating it as a weakness.",["Query CAA and record response."],["Check whether parent policy or provider documentation changes interpretation."],["DNS response"],"No CAA record means no CAA policy was observed at that name.","CAA may be inherited through provider-specific processes."],
  ["Mail host A record","An MX target resolves to one or more addresses.","Correlate mail host names with DNS infrastructure.",["Resolve each MX target and preserve answers."],["Compare with SPF/DKIM/DMARC evidence."],["MX + A/AAAA"],"The records collectively describe advertised mail infrastructure.","Hosted providers may share addresses across customers."],
  ["DKIM selector","A DKIM selector TXT record is published.","Record the selector and key metadata.",["Query selector._domainkey and preserve exact output."],["Check whether the selector appears in current public documentation or messages lawfully available."],["DKIM TXT"],"The selector is an email-authentication configuration artifact.","Selectors can be rotated or retired."],
  ["DNS record history lead","A public historical source shows a previous record.","Determine whether historical infrastructure is relevant.",["Capture historical source, date, and exact record."],["Compare with current DNS and archive context."],["Historical DNS source"],"Historical DNS can explain past infrastructure relationships.","Historical datasets can contain stale or inaccurate observations."],
  ["Host with trailing dot","A hostname is represented with a trailing dot.","Normalize presentation without changing the DNS name.",["Capture raw and normalized forms."],["Compare canonical DNS output."],["Raw query output"],"A trailing dot denotes an absolute DNS name.","String normalization can obscure the original evidence."],
  ["Mixed-case presentation","A hostname appears with mixed case in a source.","Determine whether case affects the relevant comparison.",["Preserve original source and normalized hostname."],["Compare DNS resolution using normalized form."],["Source screenshot/text"],"DNS names are generally case-insensitive, but source text may preserve case.","Application identifiers embedded in URLs can be case-sensitive elsewhere."],
  ["Multiple TXT records","A domain returns several TXT strings.","Classify each record before interpreting it.",["Capture all TXT strings without truncation."],["Resolve included domains and identify documented services."],["Complete TXT response"],"Multiple unrelated verification and policy records may coexist.","Search snippets can omit records."],
  ["CAA issuewild","A CAA record contains issuewild.","Document wildcard certificate policy separately.",["Capture exact CAA tags and values."],["Compare with certificate observations where relevant."],["CAA output"],"The tag applies to wildcard certificate issuance policy.","Provider behavior can vary."],
  ["SRV priority shift","Repeated SRV queries show different ordering.","Assess whether weighting or provider behavior explains the change.",["Capture priority, weight, port, and target over time."],["Compare authoritative responses."],["SRV observations"],"Ordering may reflect service balancing rather than infrastructure change.","Client selection behavior differs by protocol."],
  ["IPv6-only record","A hostname has AAAA data but no A data.","Document IPv6-only resolution.",["Query both A and AAAA and preserve empty/positive responses."],["Validate the service over an authorized IPv6 path."],["A/AAAA responses"],"The hostname may intentionally be IPv6-only.","Resolver or network limitations can hide IPv4 data."],
  ["CNAME chain","A hostname follows multiple aliases.","Map the complete public chain.",["Query CNAME and resolve each target."],["Confirm each hop independently."],["CNAME chain"],"The chain can reveal provider dependencies.","CDN indirection may be expected."],
  ["DNS provider migration","Nameservers changed between dated sources.","Document the transition.",["Capture current NS and historical evidence with dates."],["Compare domain lifecycle and authoritative responses."],["Current + historical NS"],"The domain appears to have changed DNS providers at some point.","Historical data may have collection gaps."],
  ["Record with unusual TTL","A record TTL differs sharply from neighboring records.","Determine whether the difference is intentional.",["Record TTLs for relevant records."],["Repeat after cache expiration."],["TTL comparison"],"TTL variation is a configuration observation, not an attribution signal.","CDN and managed DNS defaults vary."],
  ["Public resolver metadata","A resolver response includes authority/additional sections.","Use extra sections to understand the response context.",["Preserve the full resolver output."],["Compare with authoritative output where appropriate."],["Full DNS response"],"Additional sections can provide supporting infrastructure context.","Resolver formatting differs."],
  ["TXT includes include:","SPF references another domain with include.","Trace the public include relationship.",["Capture SPF and referenced include domains."],["Resolve each include within public DNS."],["SPF chain"],"The policy depends on other published infrastructure.","Long or stale include chains are common."],
  ["MX priority ordering","Multiple MX records have different priorities.","Document advertised failover order.",["Capture all MX values and priorities."],["Compare with current provider documentation."],["MX response"],"Priority expresses mail routing preference.","Actual delivery can involve additional provider logic."],
  ["SOA responsible mailbox","SOA includes an RNAME value.","Record it as zone metadata.",["Capture complete SOA response."],["Interpret RNAME according to DNS notation, not as a guessed personal address."],["SOA output"],"The field identifies a DNS administrative mailbox representation.","It may be generic or stale."],
  ["DNS evidence snapshot","An investigation needs reproducible DNS evidence.","Create a timestamped snapshot of relevant records.",["Capture command, resolver, output, timestamp, and timezone."],["Repeat later to identify changes."],["Snapshot artifact","hash"],"A snapshot supports later comparison.","A single snapshot does not establish historical continuity."],
];

const whoisTitles = [
"Recently registered domain","Expired domain","Privacy-protected registration","Unusual registrar",
"Suspicious nameserver","Domain transfer","Related domain","Registration-date correlation",
"Updated-date correlation","Expiration-date review","Registrar abuse contact","Domain status flags",
"Registrant organization field","Registrant country field","Redacted registrant data","Proxy service continuity",
"Domain lifecycle timeline","Nameserver change correlation","Registrar migration","New registration near event date",
"Expired domain re-registration","Historical WHOIS comparison","Current WHOIS versus archive","Multiple related domains",
"Registration pattern across domains","Different registrars for related domains","Shared nameserver correlation","Shared registrar correlation",
"Domain lock status","WHOIS data conflict"
];
const whoisSeeds: Seed[] = whoisTitles.map((title)=>({
  title,
  situation:`A domain registration record presents a ${title.toLowerCase()} observation during public-source research.`,
  objective:"Document the registration fact and determine what it can and cannot support about domain history or attribution.",
  observation:"The current or historical WHOIS/RDAP source contains registration metadata relevant to the investigation.",
  collection:["Capture the exact source, retrieval date/time, timezone, and relevant registration fields.","Preserve the returned status, registrar, dates, nameservers, and privacy/proxy indicators."],
  validation:["Compare current data with an independent registry/RDAP or reputable historical source.","Check whether the field is current, historical, redacted, or provider-generated."],
  evidence:["WHOIS/RDAP response","retrieval timestamp","historical source when applicable"],
  interpretation:"WHOIS/RDAP is registration evidence. It is not proof of current ownership or control.",
  falsePositives:["Privacy services can obscure registrant details.","Organizations change registrars and nameservers.","Historical datasets may be incomplete or stale."],
  next:["Build a dated domain lifecycle timeline.","Correlate only with independent evidence that is relevant to the scope."],
  stop:["Stop attribution work when the available registration fields are exhausted or remain privacy-protected without independent corroboration."],
  tools:["whois","curl"],
  evidenceTypes:["registration record","historical record"]
}));

const subdomainTitles = [
"Standard www discovery","API subdomain","Development subdomain","Staging environment","Mail infrastructure","VPN hostname","Admin hostname","Legacy application","Forgotten hostname","Cloud CNAME",
"CDN CNAME","Third-party SaaS CNAME","Wildcard DNS","Dangling CNAME indicator","Multiple nameservers","Different DNS providers","Internal-looking hostname exposed publicly","Regional subdomain","Customer portal","Authentication portal",
"Documentation host","Static asset host","Image host","Storage bucket hostname","Git-related hostname","Monitoring hostname","Status page","Mail relay","SPF record correlation","DKIM record correlation",
"DMARC record","MX infrastructure correlation","IPv6-only hostname","PTR correlation","Shared hosting","Reverse DNS correlation","Certificate-derived hostname","Historical hostname","Newly created hostname","Removed hostname",
"Duplicate host records","Multiple IP addresses","Geographic infrastructure","Load-balanced hostname","API version hostname","Mobile backend hostname","WebSocket hostname","Legacy API","Unusual service hostname","Hostname requiring manual validation"
];
const subdomainSeeds = subdomainTitles.map((title)=>({
  title,
  situation:`A public hostname or certificate/DNS source presents a ${title.toLowerCase()} lead.`,
  objective:"Discover, classify, validate, and document the hostname without treating discovery as evidence of a vulnerability.",
  observation:"The hostname appears in a public source or DNS response.",
  collection:["Record the hostname, source, query method, timestamp, and DNS result.","Capture CNAME, A/AAAA, certificate, or source context as applicable."],
  validation:["Resolve the hostname and classify the service using authorized, non-invasive observation.","Compare against an independent source such as certificates, archives, or public documentation."],
  evidence:["Hostname","DNS response","source URL or certificate reference","timestamp"],
  interpretation:"The hostname is an infrastructure discovery lead; its security significance must be established separately.",
  falsePositives:["Wildcard DNS","Shared SaaS/CDN infrastructure","Historical or retired hosts","Certificate names that are not currently served"],
  next:["Classify as current, historical, third-party, or unresolved.","Preserve corroborating evidence if the hostname remains relevant."],
  stop:["Stop active probing when classification can be completed from public evidence or when further interaction is outside scope."],
  tools:["dig","crt.sh","httpx","wayback"],
  evidenceTypes:["DNS","certificate","public webpage"]
}));

const urlTitles = [
"Unusual port","Encoded path","Double encoding","Redirect parameter","Tracking parameter","Suspicious subdomain","Lookalike domain","Punycode",
"IDN","Long URL","Nested URL","Callback URL","API endpoint","File path","Query parameter","Fragment","URL shortener","Redirect chain",
"Canonicalization","Mixed-case host","Trailing dot","IPv4 URL","IPv6 URL","Scheme comparison","Userinfo field","Explicit credentials-like userinfo",
"Port normalization","Percent-encoded delimiter","Repeated query key","Empty query value","Path traversal-like text as evidence","Encoded Unicode",
"Base64-looking parameter","Return URL parameter","Next URL parameter","Continue URL parameter","Open redirect lead","Hostname versus path confusion",
"Subdomain boundary","Registered-domain boundary","TLD interpretation","Query-string source attribution","Fragment-only state","Client-side route",
"API version path","Nested redirect","URL with escaped characters","Shortener expiration","Canonical URL mismatch"
];
const urlSeeds = urlTitles.map((title)=>({
  title,
  situation:`A public URL contains a ${title.toLowerCase()} pattern.`,
  objective:"Parse the URL into components, normalize it carefully, and document what the structure actually shows.",
  observation:"The URL contains a structural element that may affect interpretation or source correlation.",
  collection:["Preserve the original URL exactly as observed.","Parse scheme, userinfo, host, port, path, query, and fragment separately."],
  validation:["Normalize only for comparison; retain the original evidence.","Follow redirects only when authorized and record every hop and response status."],
  evidence:["Original URL","normalized comparison","redirect chain if collected"],
  interpretation:"URL structure can reveal routing, tracking, application behavior, or a destination relationship, but structure alone is not proof of intent.",
  falsePositives:["Legitimate tracking parameters","Provider-generated redirects","Encoded application state","Shared redirect infrastructure"],
  next:["Correlate the relevant host/path with public documentation or independent sources.","Record unresolved semantics as a hypothesis."],
  stop:["Stop URL expansion when the destination is outside scope, requires authentication, or no longer adds relevant evidence."],
  tools:["curl","jq"],
  evidenceTypes:["URL","HTTP response","public source"]
}));

const metadataTitles = [
"Image contains GPS","Image contains camera model","Image contains software metadata","PDF contains author","PDF contains producer","Office document contains creator",
"Document contains organization name","Metadata timestamp differs from filesystem timestamp","Metadata stripped","Metadata inconsistent","Screenshot metadata","Social-media recompressed image",
"Exported image","Edited photograph","GPS coordinates requiring validation","Timezone mismatch","Camera clock mismatch","Multiple metadata blocks","XMP versus EXIF conflict","IPTC fields",
"Embedded thumbnail","PDF creation application","Office revision information","Template metadata","Spreadsheet metadata","Presentation metadata","Audio encoder metadata","Video creation metadata",
"Archive timestamps","ZIP metadata","File modification timestamp","Filename inconsistency","Hidden metadata","Unicode filename","Duplicate files","Hash comparison","Metadata preserved after transfer",
"Metadata changed after conversion","Metadata removed by platform","Metadata contradicts visible content","GPS absent but location clue exists","Camera serial information","Editing software identification",
"Document language metadata","Embedded author information","Embedded URL","Embedded comments","PDF producer/version correlation","Metadata requiring independent confirmation","Metadata that should not be treated as attribution"
];
const metadataSeeds = metadataTitles.map((title)=>({
  title,
  situation:`An artifact presents a ${title.toLowerCase()} observation.`,
  objective:"Extract, preserve, and validate metadata without treating a metadata field as ground truth.",
  observation:"A metadata field, timestamp, embedded object, or file property differs from the visible content or other evidence.",
  collection:["Preserve the original artifact before conversion or editing.","Run the appropriate metadata/file inspection tool and record its version/output."],
  validation:["Compare metadata with filesystem timestamps and visible content.","Seek an independent source or artifact when the field affects attribution or chronology."],
  evidence:["Original artifact","metadata output","SHA-256","filesystem context where available"],
  interpretation:"Metadata can support a timeline or artifact characterization, but it can be removed, rewritten, copied, or generated by software.",
  falsePositives:["Platform recompression","File export/conversion","Copied files","Camera clock errors","Template metadata"],
  next:["Record the metadata as observed and identify the independent evidence needed for attribution or chronology."],
  stop:["Stop metadata interpretation when the original artifact is unavailable or the field cannot be independently contextualized."],
  tools:["ExifTool","pdfinfo","file","strings"],
  evidenceTypes:["metadata","file artifact","hash"]
}));

const searchTitles = [
"Find public documentation","Find indexed PDFs","Find public policy documents","Find public presentations","Find public reports","Find public contact pages","Find public subdomains","Find API documentation",
"Find technology references","Find archived terminology","Search exact phrase","Search organization name","Search domain variants","Search filename patterns","Search public repositories","Search public status pages",
"Search public help pages","Search public changelogs","Search public job postings","Search public conference materials","Search public security disclosures","Search public documentation versions","Search historical terminology","Search organization aliases",
"Search product names","Search project names","Search email-domain references","Search public contact information","Search public certificates","Search public technical references","Search specific file formats","Search exact error messages",
"Search unique strings","Search public source-code references","Search public package references","Search public configuration examples","Search public screenshots","Search public image references","Search public press releases","Search public meeting documents",
"Search public PDFs by date","Search domain-specific terminology","Search related organizations","Search vendor references","Search third-party references","Search historical pages","Search duplicated content","Search contradictory public information",
"Search requiring source verification","Search producing false positives"
];
const searchSeeds = searchTitles.map((title)=>({
  title,
  situation:`A public-source research task requires ${title.toLowerCase()}.`,
  objective:"Locate relevant public material while preserving the original source and validating result freshness.",
  observation:"A search engine returns one or more potentially relevant results.",
  collection:["Record the exact query, provider, date/time, and result URL.","Open the primary source and capture the relevant passage rather than relying on the search snippet."],
  validation:["Verify the source is public, in scope, and relevant.","Compare important claims against another independent source where practical."],
  evidence:["Exact query","source URL","retrieval timestamp","relevant passage"],
  interpretation:"Search results are discovery aids; the primary source carries the evidentiary value.",
  falsePositives:["Stale indexes","Duplicated content","Search snippets detached from context","Unrelated organizations sharing terms"],
  next:["Follow the strongest primary source and record provenance.","Use provider-neutral syntax where possible."],
  stop:["Stop broadening search when additional queries produce duplicates or unrelated material and the research question is answered."],
  tools:["Google/Bing/DuckDuckGo search","wayback"],
  evidenceTypes:["search result","primary webpage","document"]
}));

const usernameTitles = [
"Exact username match","Case variation","Underscore variation","Numeric suffix","Old username","Username reuse","Inactive account","Deleted profile","Profile image reuse","Biography correlation",
"Website link","Git repository link","Forum profile","Developer profile","Gaming handle","Social profile","Organization account","Brand account","Impersonation candidate","Fan account",
"Shared username","Common username","Username collision","Historical alias","Profile migration","Account rename","Multilingual variation","Transliteration","Typo variation","Domain username",
"Email local-part correlation","Public code author","Public forum author","Timestamp correlation","Location clue","Language clue","Organization clue","Project clue","Profile metadata","Avatar correlation",
"Conflicting identity","Insufficient evidence","False positive","Independent corroboration","Archived profile","Cached result","Search-engine result","Public repository reference","Cross-platform consistency","Source reliability assessment"
];
const usernameSeeds = usernameTitles.map((title)=>({
  title,
  situation:`A public profile or search result presents a ${title.toLowerCase()} relationship.`,
  objective:"Determine whether the identifier is useful for correlation without assuming two accounts belong to the same person.",
  observation:"A username, handle, avatar, biography, link, or timestamp appears similar across public sources.",
  collection:["Record exact profile URLs, display names, handles, public links, and retrieval times.","Preserve only information relevant to the authorized investigation."],
  validation:["Require independent corroboration such as a linked website, consistent public biography, repository identity, or other source-specific relationship.","Document conflicting indicators."],
  evidence:["Profile URL","public profile fields","independent corroborating source"],
  interpretation:"An identical username is an identifier match, not identity proof.",
  falsePositives:["Username reuse","common handles","fan or organization accounts","impersonation","platform renames"],
  next:["Seek an independent cross-source link before attributing accounts.","Record the correlation as unverified if corroboration is absent."],
  stop:["Stop when additional public sources add no independent corroboration or would require access to private content."],
  tools:["Google/Bing/DuckDuckGo search","wayback"],
  evidenceTypes:["profile","public post","repository reference"]
}));

const emailTitles = [
"Public email","Organization email","Role-based email","Personal domain","Disposable domain","Domain MX provider","SPF record","DKIM selector","DMARC policy","Email pattern",
"Public PDF email","Public webpage email","Repository email","Forum email","Historical email","Old domain","Alias","Forwarding address","Catch-all indication","Typo domain",
"Lookalike domain","Unicode domain","Public breach reference where lawfully available","Email-domain correlation","Organization correlation","Public profile correlation","Multiple public sources","Conflicting information",
"Stale address","Invalid address","Abandoned domain","Role change","Domain migration","Provider migration","Shared mailbox","Generic contact","Support address","Security contact",
"Abuse contact","Privacy contact","Technical contact","Public mailing list","Public documentation","Public source-code reference","Email header evidence","Sender-domain mismatch","Reply-To mismatch",
"SPF/DKIM/DMARC interpretation","Phishing indicator analysis","Evidence preservation","False positive","Insufficient evidence","Independent validation"
];
const emailSeeds = emailTitles.map((title)=>({
  title,
  situation:`A public-source investigation encounters a ${title.toLowerCase()} lead.`,
  objective:"Characterize the email address and its domain relationship using public evidence only.",
  observation:"An email address or email-domain relationship is visible in a public source or lawfully available artifact.",
  collection:["Record the exact address, source URL/artifact, and timestamp.","For domain analysis, capture MX/TXT records relevant to the question."],
  validation:["Correlate with independent public sources and current DNS.","For headers, preserve the complete relevant header set before interpreting authentication results."],
  evidence:["Email address","source URL/artifact","DNS records or headers when relevant"],
  interpretation:"Email discovery or domain correlation does not prove account ownership, identity, or message authenticity.",
  falsePositives:["Role accounts","Shared mailboxes","Forwarding","Stale addresses","Lookalike domains","Provider-managed infrastructure"],
  next:["Validate the specific relationship required by the investigation and document uncertainty."],
  stop:["Do not attempt login, password recovery, or access to private accounts. Stop when public evidence is exhausted."],
  tools:["dig","whois","Google/Bing/DuckDuckGo search"],
  evidenceTypes:["public email","DNS","email header"]
}));

const evidenceTitles = [
"Public webpage","Public PDF","Public image","Public document","Public repository","Public DNS record","Public WHOIS result","Public certificate","Public search result","Archived webpage",
"Cached content","Public API documentation","Public status page","Public job posting","Public forum","Public social profile","Public username","Public email","Public metadata","Public screenshot",
"Public video","Public audio","Public announcement","Public press release","Public technical article","Public Git commit","Public package","Public changelog","Public configuration example","Public DNS TXT record",
"Public MX record","Public certificate relationship","Multiple-source corroboration","Conflicting sources","Stale source","Deleted source","Archived source","Redirected URL","URL shortener","Third-party hosted content",
"Screenshot without source","Source without timestamp","Metadata-only evidence","Search-result-only evidence","Duplicate evidence","Derived evidence","Unverified attribution","False positive","Evidence requiring preservation","Evidence requiring escalation"
];
const evidenceSeeds = evidenceTitles.map((title)=>({
  title,
  situation:`The investigation contains ${title.toLowerCase()} that may support a finding.`,
  objective:"Preserve provenance and classify the material before using it in reporting.",
  observation:"A public artifact or record is available, but its evidentiary role has not yet been classified.",
  collection:["Record source URL, collection date/time, timezone, collector, and description.","Capture relevant content and preserve downloaded artifacts with SHA-256 where appropriate."],
  validation:["Check source reliability, freshness, and context.","Corroborate material findings with an independent source where possible."],
  evidence:["Evidence ID","source URL","timestamp","relevant passage/artifact","hash where applicable"],
  interpretation:"Classify the material as observed, corroborated, unverified, historical, current, archived, contradicted, or derived as appropriate.",
  falsePositives:["Screenshots can omit provenance.","Search results can be stale.","Third-party mirrors can alter context.","Derived information can accidentally become overstated."],
  next:["Add the evidence record to the case notes and reporting timeline.","Preserve unresolved contradictions explicitly."],
  stop:["Stop collection when the relevant evidence is preserved or further acquisition is outside scope."],
  tools:["curl","wget","jq"],
  evidenceTypes:["web","document","artifact","archive"]
}));

const additionalDnsSeeds: Seed[] = [
  { title: "CAA wildcard policy", situation: "A wildcard CAA rule is published for a domain.", objective: "Document whether certificate issuance policy applies broadly or to a specific hostname.", collection: ["Query CAA records at the relevant labels and preserve flags, tags, values, and timestamp."], validation: ["Compare parent and child CAA responses and observed certificates where authorized."], evidence: ["CAA response", "certificate observation"], interpretation: "CAA policy can constrain certificate issuance but does not establish which certificates currently exist.", falsePositives: ["Inherited policy", "provider-managed certificates", "stale DNS"], next: ["Map the policy scope to the hostname under investigation."], stop: ["Stop once the relevant CAA scope is documented and independently checked."], tools: ["dig", "curl"], evidenceTypes: ["DNS", "TLS"] },
  { title: "DNS answer ordering", situation: "Repeated DNS queries return the same addresses in different order.", objective: "Determine whether answer ordering affects the observation without treating order as a change in infrastructure.", collection: ["Capture repeated answers, TTL values, resolver identity, and timestamps."], validation: ["Repeat through an independent resolver and compare the address set rather than only ordering."], evidence: ["Repeated DNS responses"], interpretation: "Address ordering can vary because of resolver behavior, load balancing, or provider policy.", falsePositives: ["Round-robin DNS", "resolver caching", "EDNS or provider behavior"], next: ["Compare the stable set of answers over time."], stop: ["Stop when ordering variation is documented and does not affect the investigation question."], tools: ["dig", "nslookup"], evidenceTypes: ["DNS"] },
  { title: "DNS negative response", situation: "A queried hostname returns NXDOMAIN or another negative DNS response.", objective: "Document the negative result and determine whether it is authoritative for the question being asked.", collection: ["Capture status, authority section, SOA where returned, resolver, and timestamp."], validation: ["Repeat against an authoritative path or independent resolver and compare the negative response."], evidence: ["Negative DNS response", "SOA authority data"], interpretation: "A negative response indicates the queried name was not resolved by that DNS path at that time; it is not proof that the name never existed.", falsePositives: ["Negative caching", "split-horizon DNS", "recent DNS changes"], next: ["Check historical or authoritative sources when historical existence matters."], stop: ["Stop once the negative result is reproducible and its scope is understood."], tools: ["dig", "nslookup"], evidenceTypes: ["DNS", "historical"] },
  { title: "DNS delegation mismatch", situation: "Parent delegation and child authoritative responses appear inconsistent.", objective: "Determine whether the mismatch reflects propagation, stale delegation, or an observation error.", collection: ["Capture parent NS/DS data and child SOA/NS responses with timestamps."], validation: ["Query multiple authoritative servers and independent resolvers."], evidence: ["Parent delegation", "child authority response"], interpretation: "A delegation mismatch can indicate DNS transition or configuration inconsistency, but requires authoritative comparison.", falsePositives: ["Propagation delay", "provider migration", "resolver cache"], next: ["Recheck after an appropriate interval if the investigation requires current state."], stop: ["Stop when authoritative responses agree or the discrepancy is documented as unresolved."], tools: ["dig"], evidenceTypes: ["DNS"] },
  { title: "DNS TXT token lifecycle", situation: "A verification TXT token is present during one observation and absent later.", objective: "Document the lifecycle without assuming why the token changed.", collection: ["Capture exact TXT values and timestamps from repeated observations."], validation: ["Compare authoritative responses and identify the service named by the token."], evidence: ["TXT observations over time"], interpretation: "A changing verification token demonstrates DNS state changed; it does not by itself prove ownership transfer or service activation.", falsePositives: ["Token rotation", "service migration", "cleanup of old records"], next: ["Correlate the timing with public service documentation or other independent records."], stop: ["Stop when the relevant DNS change is documented and attribution remains appropriately qualified."], tools: ["dig", "wayback"], evidenceTypes: ["DNS", "historical"] },
  { title: "Multiple MX priorities", situation: "A domain publishes several MX records with different priorities.", objective: "Document advertised mail routing and understand which hosts are preferred by the DNS policy.", collection: ["Capture every MX target and priority exactly as returned."], validation: ["Resolve targets and compare with current provider documentation."], evidence: ["MX response", "target resolution"], interpretation: "MX priority describes advertised routing preference, not the identity of individual senders.", falsePositives: ["Backup mail services", "shared providers", "stale records"], next: ["Check related SPF, DKIM, and DMARC records if email infrastructure is relevant."], stop: ["Stop when advertised routing is fully documented."], tools: ["dig"], evidenceTypes: ["DNS", "email"] },
  { title: "DNS wildcard exception", situation: "Most random labels resolve through wildcard DNS, but one label behaves differently.", objective: "Determine whether the exception represents a real hostname or a DNS configuration boundary.", collection: ["Query several random labels and the exceptional label; preserve all responses."], validation: ["Compare authoritative responses and application behavior only within authorized scope."], evidence: ["Comparative DNS responses"], interpretation: "A wildcard exception can identify an explicit record or delegated boundary, not necessarily a live application.", falsePositives: ["DNS provider behavior", "application routing", "negative caching"], next: ["Validate the hostname with an independent source before treating it as an asset."], stop: ["Stop when the DNS behavior is characterized and no additional public evidence is needed."], tools: ["dig", "dnsx"], evidenceTypes: ["DNS"] },
  { title: "Authoritative server comparison", situation: "Authoritative nameservers return different answers for the same record.", objective: "Identify whether the difference is transient or represents inconsistent authoritative state.", collection: ["Query each authoritative server directly and timestamp every response."], validation: ["Repeat after the observed TTL and compare serials and answer sets."], evidence: ["Per-server DNS responses", "SOA serials"], interpretation: "Different authoritative answers can occur during updates or indicate configuration inconsistency; the cause needs validation.", falsePositives: ["Zone propagation", "provider anycast behavior", "recent update"], next: ["Document the exact servers and responses before drawing an infrastructure conclusion."], stop: ["Stop when the discrepancy is resolved or recorded as an open observation."], tools: ["dig"], evidenceTypes: ["DNS"] },
  { title: "DNS resolver provenance", situation: "A DNS result differs between two public resolvers.", objective: "Determine whether resolver caching or path differences explain the observation.", collection: ["Record resolver identities, response TTLs, timestamps, and complete answer sections."], validation: ["Query authoritative servers and compare cache age where visible."], evidence: ["Resolver responses", "authoritative response"], interpretation: "Resolver differences may reflect caching or propagation rather than different authoritative configuration.", falsePositives: ["Cached answers", "EDNS behavior", "regional DNS policy"], next: ["Prefer authoritative evidence when the investigation requires current DNS state."], stop: ["Stop when the discrepancy has an identified scope or cannot be resolved with public evidence."], tools: ["dig", "nslookup"], evidenceTypes: ["DNS"] },
  { title: "DNS record absence after migration", situation: "A record present in historical material is no longer returned in current DNS.", objective: "Document the change between historical and current DNS state.", collection: ["Preserve the historical source and current DNS response with separate timestamps."], validation: ["Check authoritative responses and a second historical source where available."], evidence: ["Historical DNS evidence", "current DNS response"], interpretation: "The evidence supports a DNS state change; it does not by itself explain the reason for the migration or removal.", falsePositives: ["Expired historical data", "provider migration", "split-horizon DNS"], next: ["Correlate the timing with public change records if relevant."], stop: ["Stop when the historical/current distinction is clearly documented."], tools: ["dig", "wayback"], evidenceTypes: ["DNS", "historical"] }
];

const additionalUrlSeeds: Seed[] = [
  { title: "URL fragment analysis", situation: "A URL contains a fragment identifier after the path and query.", objective: "Separate the client-side fragment from server-requested URL components.", collection: ["Preserve the original URL and parse scheme, authority, path, query, and fragment separately."], validation: ["Compare browser behavior and server-visible components without assuming the fragment is sent to the server."], evidence: ["Original URL", "parsed components"], interpretation: "The fragment is generally handled client-side and can identify a document section or application state without being part of the HTTP request target.", falsePositives: ["Single-page application routing", "client-side state", "encoded application data"], next: ["Inspect the actual request URL when request-level evidence is required."], stop: ["Stop once the component boundary answers the investigation question."], tools: ["curl"], evidenceTypes: ["URL", "web"] }
];

export const dnsCases = makeCases("DNS", "dns", "enumeration", [...dnsSeeds, ...additionalDnsSeeds], "foundational");
export const whoisCases = makeCases("WHOIS", "whois", "correlation", whoisSeeds, "intermediate");
export const subdomainCases = makeCases("SUB", "subdomains", "discovery", subdomainSeeds, "intermediate");
export const urlDomainCases = makeCases("URL", "url-domain", "validation", [...urlSeeds, ...additionalUrlSeeds], "intermediate");
export const metadataCases = makeCases("META", "metadata", "validation", metadataSeeds, "intermediate");
export const searchOperatorCases = makeCases("SEARCH", "search", "discovery", searchSeeds, "foundational");
export const usernameCases = makeCases("USER", "username-email", "correlation", usernameSeeds, "intermediate");
export const emailCases = makeCases("EMAIL", "username-email", "correlation", emailSeeds, "intermediate");
export const publicEvidenceCases = makeCases("EVID", "public-evidence", "evidence", evidenceSeeds, "intermediate");

export const OSINT_CASES: OSINTCase[] = [
  ...dnsCases, ...whoisCases, ...subdomainCases, ...urlDomainCases, ...metadataCases,
  ...searchOperatorCases, ...usernameCases, ...emailCases, ...publicEvidenceCases,
];

// Deterministic related-case links are added once after all IDs exist.
for (let i = 0; i < OSINT_CASES.length; i++) {
  const current = OSINT_CASES[i];
  const sameCategory = OSINT_CASES.filter((x) => x.category === current.category && x.id !== current.id);
  current.relatedCases = sameCategory.slice(i % Math.max(1, sameCategory.length), (i % Math.max(1, sameCategory.length)) + 2).map((x) => x.id);
}

export const OSINT_CASE_COUNTS = {
  dns: dnsCases.length, whois: whoisCases.length, subdomains: subdomainCases.length,
  urlDomain: urlDomainCases.length, metadata: metadataCases.length, search: searchOperatorCases.length,
  username: usernameCases.length, email: emailCases.length, publicEvidence: publicEvidenceCases.length,
  total: OSINT_CASES.length,
};
