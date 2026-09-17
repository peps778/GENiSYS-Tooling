export const katanaReference = [
  ["katana -u https://TARGET", "Basic crawl of an authorized target."],
  ["katana -u https://TARGET -d 2", "Limit crawl depth."],
  ["katana -u https://TARGET -jc", "Enable JavaScript crawling."],
  ["katana -u https://TARGET -o endpoints.txt", "Save discovered URLs."],
  ["katana -list targets.txt", "Process a list of authorized targets."],
  ["katana -u https://TARGET -jc | sort -u", "Deduplicate discovered URLs."],
  ["katana -u https://TARGET -jc | grep -Ei '\\.(js|json|php)(\\?|$)'", "Filter selected endpoint/file patterns."],
];
