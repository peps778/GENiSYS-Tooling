import type { SOPCase } from '../types/notesSop';

export const webTestingCases: SOPCase[] = [
  {
    id: 'web-login',
    category: 'web',
    title: 'Login Page',
    summary:
      'A login flow exists and its authentication and authorization behavior needs to be mapped.',
    whenToUse: ['Username/password form', 'API login endpoint'],
    prerequisites: [
      'Authorized test account where required',
      'Baseline request captured',
    ],
    observations: [
      'Status code',
      'Error wording',
      'Cookies/tokens',
      'Redirects',
    ],
    initialChecks: [
      'Capture a normal failed login',
      'Inspect session behavior',
      'Check whether successful login changes state',
    ],
    steps: [
      {
        id: 'a',
        action: 'Capture a baseline request',
        purpose: 'Record method, endpoint, parameters, headers, and response.',
        command: 'curl -i -X POST https://TARGET/login',
        expectedObservation: 'Authentication response and session behavior.',
        possibleResults: ['Failure', 'Success', 'Validation error'],
        evidence: ['Request', 'Response'],
      },
      {
        id: 'b',
        action: 'Compare authentication outcomes',
        purpose:
          'Identify meaningful differences without assuming their cause.',
        expectedObservation:
          'Differences in status, body, redirect, or session state.',
        possibleResults: [
          'Consistent failure',
          'Different response',
          'Session issued',
        ],
        evidence: ['Paired responses'],
      },
    ],
    branches: [
      {
        id: 'token',
        condition: 'A token/session is issued',
        result: 'Session analysis',
        nextAction: 'Inspect token structure or cookie attributes.',
        nextCaseId: 'web-api',
        evidence: ['Token/cookie metadata'],
      },
      {
        id: 'error',
        condition: 'Database/template-specific errors appear',
        result: 'Potential injection clue',
        nextAction:
          'Validate the behavior with controlled, context-appropriate tests.',
        evidence: ['Exact error'],
      },
      {
        id: 'consistent',
        condition: 'Responses remain indistinguishable',
        result: 'No clear behavioral distinction',
        nextAction:
          'Pivot to session, password-reset, authorization, or API surface analysis.',
        evidence: ['Baseline comparison'],
      },
    ],
    alternativePaths: [
      'Password-reset flow',
      'Registration behavior',
      'Authorization checks after authentication',
      'Session/cookie analysis',
    ],
    evidenceToRecord: [
      'Endpoint',
      'Method',
      'Parameters',
      'Status',
      'Cookies/tokens',
      'Response differences',
    ],
    stopConditions: [
      'No new information after controlled comparisons',
      'Account or credential testing exceeds scope',
    ],
    relatedCases: ['web-api', 'vuln-auth', 'vuln-sql'],
    estimatedTime: '10–25 min',
    difficulty: 'intermediate',
    tags: ['login', 'authentication', 'session', 'api'],
  },
  {
    id: 'web-api',
    category: 'web',
    title: 'API Endpoint',
    summary:
      'A REST/JSON-style API is available or discovered through the application.',
    whenToUse: ['JSON response', 'API path', 'JavaScript references an API'],
    prerequisites: ['Endpoint and method known'],
    observations: [
      'Object identifiers',
      'Authorization headers',
      'HTTP methods',
      'JSON fields',
    ],
    initialChecks: [
      'Record normal request',
      'Map required fields',
      'Check authorization boundary',
    ],
    steps: [
      {
        id: 'a',
        action: 'Map the request contract',
        purpose: 'Understand required parameters and normal responses.',
        command:
          "curl -i -H 'Accept: application/json' https://TARGET/api/resource",
        expectedObservation: 'JSON response and status.',
        possibleResults: ['200', '401/403', '404', 'Validation error'],
        evidence: ['Request/response'],
      },
      {
        id: 'b',
        action: 'Compare authorized resource access',
        purpose: 'Determine whether object ownership is enforced server-side.',
        expectedObservation:
          'Access to own resource versus another authorized test resource.',
        possibleResults: [
          'Proper denial',
          'Unexpected access',
          'Different error',
        ],
        evidence: ['Comparison'],
      },
    ],
    branches: [
      {
        id: 'authz',
        condition: "Another object's data is returned unexpectedly",
        result: 'Possible object-level authorization issue',
        nextAction:
          'Record the exact object IDs and authorization context and validate safely.',
        nextCaseId: 'vuln-idor',
        evidence: ['Requests', 'Responses'],
      },
      {
        id: 'method',
        condition: 'Different methods produce unexpected behavior',
        result: 'Method handling case',
        nextAction: 'Compare documented and implemented methods.',
        evidence: ['Method comparison'],
      },
      {
        id: 'normal',
        condition: 'Authorization is enforced',
        result: 'No access-control issue observed',
        nextAction:
          'Inspect validation, data exposure, filtering, and error behavior.',
        evidence: ['Authorization response'],
      },
    ],
    alternativePaths: [
      'Inspect JavaScript for undocumented routes',
      'Check GraphQL if present',
      'Review pagination/filter parameters',
    ],
    evidenceToRecord: [
      'Endpoint',
      'Method',
      'Object ID',
      'Auth context',
      'Response',
    ],
    stopConditions: [
      'No authorized test object exists',
      "Further testing would affect another user's data",
    ],
    relatedCases: ['web-login', 'vuln-idor', 'vuln-access-control'],
    estimatedTime: '10–30 min',
    difficulty: 'intermediate',
    tags: ['api', 'json', 'authorization', 'idor'],
  },
  {
    id: 'web-upload',
    category: 'web',
    title: 'File Upload',
    summary:
      'An application accepts uploaded files and should be analyzed as a validation, storage, and authorization workflow.',
    whenToUse: ['Image upload', 'Document upload', 'Import feature'],
    prerequisites: ['Authorized test environment', 'Non-sensitive test files'],
    observations: [
      'Accepted extension',
      'MIME handling',
      'Actual signature',
      'Storage URL',
    ],
    initialChecks: [
      'Upload a normal file',
      'Record response',
      'Inspect retrieved file',
    ],
    steps: [
      {
        id: 'a',
        action: 'Establish a normal upload baseline',
        purpose: 'Understand how valid files are accepted and stored.',
        expectedObservation: 'Upload response and retrieval behavior.',
        possibleResults: ['Accepted', 'Rejected', 'Transformed'],
        evidence: ['Upload request', 'Response'],
      },
      {
        id: 'b',
        action: 'Compare metadata and content validation',
        purpose:
          'Determine whether validation relies only on superficial properties.',
        expectedObservation:
          'Difference between filename/MIME and actual file content.',
        possibleResults: [
          'Content validated',
          'Metadata-only behavior',
          'Server transformation',
        ],
        evidence: ['File metadata', 'Response'],
      },
    ],
    branches: [
      {
        id: 'stored',
        condition: 'File is retrievable from a predictable path',
        result: 'Storage/access-control case',
        nextAction: 'Check whether retrieval requires authorization.',
        evidence: ['Retrieval URL'],
      },
      {
        id: 'processed',
        condition: 'Server transforms the file',
        result: 'Processing pipeline',
        nextAction: 'Analyze the transformation and generated metadata.',
        evidence: ['Before/after hashes'],
      },
      {
        id: 'rejected',
        condition: 'File is rejected',
        result: 'Validation behavior documented',
        nextAction:
          'Record which validation layer rejected it and pivot if useful.',
        evidence: ['Rejection response'],
      },
    ],
    alternativePaths: [
      'Inspect upload endpoint in JavaScript',
      'Inspect returned metadata',
      'Analyze stored artifact with File Analysis',
    ],
    evidenceToRecord: [
      'Original file hash',
      'Filename',
      'MIME',
      'Signature',
      'Response',
      'Storage path',
    ],
    stopConditions: [
      'Upload testing could overwrite real data',
      'Processing would affect resources outside the test scope',
    ],
    relatedCases: ['vuln-file-upload', 'forensics-unknown-file'],
    estimatedTime: '10–25 min',
    difficulty: 'intermediate',
    tags: ['upload', 'file', 'mime', 'storage'],
  },

  {
    id: 'web-sqli-error',
    category: 'web',
    title: 'SQL Injection Indicator',
    summary:
      'Input handling produces database-like errors or behavior changes that warrant controlled validation.',
    whenToUse: [
      'Database error',
      'Quote-related response change',
      'Unexpected query behavior',
    ],
    prerequisites: ['Authorized test target', 'A normal baseline request'],
    observations: [
      'Status/body differences',
      'Database product clues',
      'Reflected input',
    ],
    initialChecks: [
      'Capture baseline',
      'Change one input at a time',
      'Record exact errors',
    ],
    steps: [
      {
        id: 'a',
        action: 'Establish an input baseline',
        purpose: 'Understand normal validation and response behavior.',
        expectedObservation: 'Stable response for a normal value.',
        possibleResults: ['Accepted', 'Rejected', 'Normalized'],
        evidence: ['Baseline request/response'],
      },
      {
        id: 'b',
        action: 'Compare harmless syntax variations',
        purpose:
          'Determine whether a controlled input change affects query handling.',
        expectedObservation: 'Consistent or meaningfully different response.',
        possibleResults: [
          'No difference',
          'Database-like error',
          'Validation response',
        ],
        evidence: ['Paired responses'],
      },
    ],
    branches: [
      {
        id: 'error',
        condition: 'Database-specific error or syntax clue appears',
        result: 'Injection candidate',
        nextAction:
          'Validate with minimal, non-destructive comparison and preserve the exact response.',
        nextCaseId: 'vuln-sql',
        evidence: ['Error text', 'Request pair'],
      },
      {
        id: 'blind',
        condition: 'Response changes without an error',
        result: 'Behavioral injection candidate',
        nextAction: 'Use controlled true/false comparisons only within scope.',
        evidence: ['Timing/body/status comparison'],
      },
      {
        id: 'none',
        condition: 'No meaningful difference',
        result: 'No indicator observed',
        nextAction:
          'Pivot to authorization, business logic, or another input surface.',
        evidence: ['Baseline comparison'],
      },
    ],
    alternativePaths: [
      'JSON body fields',
      'Search/filter parameters',
      'Second-order input locations',
    ],
    evidenceToRecord: [
      'Endpoint',
      'Parameter',
      'Baseline',
      'Comparison input',
      'Exact response',
      'Confidence',
    ],
    stopConditions: [
      'Do not modify or delete data',
      'Stop if testing risks production impact',
      'Do not automate broad extraction without explicit authorization',
    ],
    relatedCases: ['web-api', 'vuln-sql', 'web-login'],
    estimatedTime: '10–30 min',
    difficulty: 'intermediate',
    tags: ['sqli', 'injection', 'database', 'errors'],
  },
  {
    id: 'web-xss-reflection',
    category: 'web',
    title: 'Reflected or Stored XSS Candidate',
    summary:
      'User-controlled content is reflected or rendered in a browser context and needs context-aware validation.',
    whenToUse: [
      'Search term reflected',
      'Profile/comment field',
      'HTML/JS response context',
    ],
    prerequisites: ['Authorized browser session', 'Non-sensitive test value'],
    observations: [
      'HTML escaping',
      'Attribute context',
      'Script context',
      'Persistence',
    ],
    initialChecks: [
      'Submit a unique marker',
      'Locate it in the response/DOM',
      'Determine whether it persists',
    ],
    steps: [
      {
        id: 'a',
        action: 'Trace the marker through the application',
        purpose:
          'Identify where user input is reflected and how it is encoded.',
        expectedObservation:
          'Marker appears in HTML, attribute, script, or text node.',
        possibleResults: ['Escaped', 'Reflected unescaped', 'Not reflected'],
        evidence: ['Response/DOM excerpt'],
      },
      {
        id: 'b',
        action: 'Classify the rendering context',
        purpose: 'Avoid treating every reflection as executable behavior.',
        expectedObservation: 'Specific browser parsing context.',
        possibleResults: [
          'Text context',
          'Attribute context',
          'Script context',
          'DOM-only',
        ],
        evidence: ['Context excerpt'],
      },
    ],
    branches: [
      {
        id: 'escaped',
        condition: 'Input is consistently encoded',
        result: 'No execution evidence',
        nextAction:
          'Record encoding behavior and inspect other sinks only if in scope.',
        evidence: ['Encoded output'],
      },
      {
        id: 'candidate',
        condition: 'Input reaches an executable context',
        result: 'XSS candidate',
        nextAction:
          'Use a benign proof marker in the authorized environment and document the sink/context.',
        nextCaseId: 'vuln-xss',
        evidence: ['Sink context'],
      },
      {
        id: 'stored',
        condition: 'Input persists for later viewers',
        result: 'Stored XSS candidate',
        nextAction:
          'Limit validation to designated test accounts and document affected view.',
        evidence: ['Persistence evidence'],
      },
    ],
    alternativePaths: [
      'DOM sink review',
      'Template rendering',
      'CSP/header review',
    ],
    evidenceToRecord: [
      'Input field',
      'Reflection location',
      'Encoding',
      'Persistence',
      'Affected route',
    ],
    stopConditions: [
      'Do not target other users',
      'Do not collect cookies or sensitive data',
      'Stop after proving the rendering context',
    ],
    relatedCases: ['web-api', 'vuln-xss', 'web-login'],
    estimatedTime: '10–25 min',
    difficulty: 'intermediate',
    tags: ['xss', 'reflected', 'stored', 'dom', 'html'],
  },
  {
    id: 'web-path-traversal',
    category: 'web',
    title: 'Path Traversal / Local File Read Candidate',
    summary:
      'A file, template, download, or image parameter may be resolving paths outside its intended directory.',
    whenToUse: [
      'download?file=',
      'Template parameter',
      'Unexpected filesystem error',
    ],
    prerequisites: ['Known file-handling endpoint', 'Authorized test files'],
    observations: [
      'Path normalization',
      'Error paths',
      'Canonical filenames',
      'Access-control behavior',
    ],
    initialChecks: [
      'Request a known valid file',
      'Record normalization',
      'Compare invalid versus valid paths',
    ],
    steps: [
      {
        id: 'a',
        action: 'Map the file parameter contract',
        purpose: 'Determine expected names, IDs, and normal response.',
        expectedObservation: 'Known file returned or validation error.',
        possibleResults: ['File returned', 'ID required', 'Rejected'],
        evidence: ['Baseline response'],
      },
      {
        id: 'b',
        action: 'Check path-boundary enforcement',
        purpose:
          'Determine whether the server confines resolution to the intended directory using harmless authorized fixtures.',
        expectedObservation: 'Contained path or boundary failure.',
        possibleResults: [
          'Properly contained',
          'Normalization anomaly',
          'Unexpected file access',
        ],
        evidence: ['Comparison responses'],
      },
    ],
    branches: [
      {
        id: 'contained',
        condition: 'Only intended files are accessible',
        result: 'Boundary appears enforced',
        nextAction: 'Inspect authorization and filename canonicalization.',
        evidence: ['Access denial'],
      },
      {
        id: 'read',
        condition: 'An out-of-directory authorized fixture is returned',
        result: 'Path traversal candidate',
        nextAction:
          'Record the exact parameter and returned fixture without accessing sensitive system files.',
        nextCaseId: 'vuln-path-traversal',
        evidence: ['Request/response'],
      },
      {
        id: 'error',
        condition: 'Error reveals internal path details',
        result: 'Path disclosure candidate',
        nextAction:
          'Record the minimum necessary error and assess information exposure.',
        evidence: ['Sanitized error'],
      },
    ],
    alternativePaths: [
      'Download endpoints',
      'Image resize parameters',
      'Template loaders',
    ],
    evidenceToRecord: [
      'Endpoint',
      'Parameter',
      'Expected root',
      'Normalization',
      'Returned fixture',
      'Error',
    ],
    stopConditions: [
      'Do not read secrets or system files',
      'Stop after a safe fixture proves boundary behavior',
    ],
    relatedCases: [
      'web-upload',
      'vuln-path-traversal',
      'forensics-unknown-file',
    ],
    estimatedTime: '10–25 min',
    difficulty: 'intermediate',
    tags: ['lfi', 'path-traversal', 'file-read', 'download'],
  },
  {
    id: 'web-ssrf',
    category: 'web',
    title: 'Server-Side Request Forgery Candidate',
    summary:
      'A server-side URL fetcher may retrieve resources beyond the intended external destination.',
    whenToUse: ['URL preview', 'Webhook tester', 'Import-from-URL feature'],
    prerequisites: [
      'Authorized callback endpoint or controlled test server',
      'Known URL-fetch feature',
    ],
    observations: [
      'Outbound request timing',
      'Redirect handling',
      'Response inclusion',
      'Allowlist behavior',
    ],
    initialChecks: [
      'Use a controlled URL',
      'Record callback/request metadata',
      'Check redirect policy',
    ],
    steps: [
      {
        id: 'a',
        action: 'Establish outbound fetch behavior',
        purpose: 'Confirm whether the server actually performs the fetch.',
        expectedObservation: 'Controlled endpoint receives a request.',
        possibleResults: ['Fetched', 'Rejected', 'Queued'],
        evidence: ['Callback log'],
      },
      {
        id: 'b',
        action: 'Assess destination restrictions',
        purpose:
          'Determine whether destinations are constrained without probing sensitive networks.',
        expectedObservation: 'Allowlist/denylist behavior.',
        possibleResults: [
          'Strict allowlist',
          'Validation weakness',
          'No fetch',
        ],
        evidence: ['Controlled comparisons'],
      },
    ],
    branches: [
      {
        id: 'safe',
        condition: 'Only approved destinations are fetched',
        result: 'Restriction observed',
        nextAction: 'Document validation and redirect behavior.',
        evidence: ['Allowlist result'],
      },
      {
        id: 'weak',
        condition: 'Unapproved controlled destination is fetched',
        result: 'SSRF candidate',
        nextAction:
          'Record the destination and callback evidence; do not access internal services.',
        nextCaseId: 'vuln-ssrf',
        evidence: ['Callback log', 'Request'],
      },
      {
        id: 'redirect',
        condition: 'Redirects bypass destination policy',
        result: 'Redirect validation candidate',
        nextAction: 'Test only with controlled redirect targets.',
        evidence: ['Redirect chain'],
      },
    ],
    alternativePaths: [
      'Webhook configuration',
      'PDF/image fetcher',
      'Import jobs',
    ],
    evidenceToRecord: [
      'Input URL',
      'Callback timestamp',
      'Headers',
      'Redirect chain',
      'Validation result',
    ],
    stopConditions: [
      'Do not probe cloud metadata or internal networks',
      'Do not access third-party systems',
      'Stop after controlled callback proof',
    ],
    relatedCases: ['web-api', 'vuln-ssrf'],
    estimatedTime: '10–25 min',
    difficulty: 'advanced',
    tags: ['ssrf', 'url-fetch', 'webhook', 'egress'],
  },
  {
    id: 'web-business-logic',
    category: 'web',
    title: 'Business Logic / Workflow Bypass',
    summary:
      'A multi-step workflow may accept actions out of order or fail to enforce state transitions.',
    whenToUse: ['Checkout flow', 'Approval process', 'Invite/reset workflow'],
    prerequisites: [
      'Test account and disposable records',
      'Normal workflow captured',
    ],
    observations: [
      'State fields',
      'Step order',
      'Server-side validation',
      'Replay behavior',
    ],
    initialChecks: [
      'Complete normal flow',
      'Record each state transition',
      'Identify server-enforced checkpoints',
    ],
    steps: [
      {
        id: 'a',
        action: 'Model the expected state machine',
        purpose: 'Define which transitions should be allowed.',
        expectedObservation: 'Sequence of valid states and actions.',
        possibleResults: ['Linear flow', 'Branching flow', 'Token-bound flow'],
        evidence: ['State diagram/requests'],
      },
      {
        id: 'b',
        action: 'Replay a single transition out of order',
        purpose: 'Check server-side enforcement using disposable test data.',
        expectedObservation: 'Rejected or accepted transition.',
        possibleResults: ['Rejected', 'Accepted unexpectedly', 'State reset'],
        evidence: ['Request/response'],
      },
    ],
    branches: [
      {
        id: 'enforced',
        condition: 'Invalid transition is rejected',
        result: 'State enforcement observed',
        nextAction: 'Inspect authorization at adjacent transitions.',
        evidence: ['Denial response'],
      },
      {
        id: 'bypass',
        condition: 'Protected transition succeeds out of order',
        result: 'Workflow bypass candidate',
        nextAction:
          'Document required state, request, and impact using only test records.',
        evidence: ['State comparison'],
      },
    ],
    alternativePaths: [
      'Parameter tampering',
      'Replay/idempotency',
      'Role transition checks',
    ],
    evidenceToRecord: [
      'Expected state',
      'Actual state',
      'Request sequence',
      'Test record ID',
      'Impact',
    ],
    stopConditions: [
      'Do not create financial, legal, or irreversible effects',
      'Use disposable records only',
    ],
    relatedCases: ['web-api', 'vuln-business-logic'],
    estimatedTime: '15–35 min',
    difficulty: 'advanced',
    tags: ['business-logic', 'workflow', 'state', 'authorization'],
  },
];
