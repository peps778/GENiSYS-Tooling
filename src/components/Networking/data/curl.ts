export const curlCommands = [
  ['curl https://example.com', 'Fetch a response body.'],
  ['curl -i https://example.com', 'Include response headers.'],
  ['curl -I https://example.com', 'Send a HEAD request and show headers.'],
  [
    'curl -v https://example.com',
    'Verbose connection, TLS, request, and response details.',
  ],
  ['curl -s https://example.com', 'Silent mode; suppress progress and errors.'],
  ['curl -L https://example.com', 'Follow redirects.'],
  ['curl -H "Header: value" https://example.com', 'Add a request header.'],
  ['curl -b "session=value" https://example.com', 'Send a cookie.'],
  ['curl -c cookies.txt https://example.com', 'Save cookies to a file.'],
  ['curl -b cookies.txt https://example.com', 'Load cookies from a file.'],
  ['curl -d "key=value" https://example.com', 'Send form data.'],
  [
    'curl -H "Content-Type: application/json" -d \'{"key":"value"}\' https://example.com',
    'Send JSON data.',
  ],
] as const;
