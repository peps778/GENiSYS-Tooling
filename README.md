Built on top of ASTRO + REACT + TAILWIND 

- Components -> Overall react renders
- Navigation -> Nav related components and UI 
- Tools -> [STRICT]: Each component should house each tooling and functions, if possible minimize externalization. 

- USE TS for safety
 

Built mainly for:

1. Decoding / Encoding [DONE]
   - Base64 / Base32 / Base16
   - URL encoding
   - Hex / ASCII
   - Binary
   - Decimal / character conversion
   - ROT / Caesar
   - XOR
   - Hash identification
   - Common cipher helpers
   - File magic/signature identification

2. Heap Dump / Memory Analysis [DONE]
    - Chrome/Chromium heap snapshots
   - Firefox-compatible inspection
   - Extract strings
   - Search for:
       - tokens
       - passwords
       - API keys
       - URLs
       - endpoints
       - flags
   - JSON/structured-data extraction
   - Regex search
   - Large-file processing

3. Web Security / CTF Automation
   - HTTP request builder
   - Headers / cookies / tokens
   - Endpoint enumeration
   - Parameter discovery
   - Status-code analysis
   - Directory/file discovery
   - Basic fuzzing helpers
   - JWT inspection
   - API testing helpers
   - Request/response comparison
   - Common CTF web checks
   - Evidence/output logging

4. Linux Docs / Command Reference
   - grep
   - sed
   - awk
   - cut
   - sort / uniq
   - strings
   - file
   - xxd
   - base64
   - curl
   - wget
   - find
   - locate
   - tar / unzip
   - chmod
   - ps / ss
   - dig / nslookup
   - nmap
   - jq
   - Python one-liners
   - most common kali linux pen test
   - msf console 
   - katana
   - as well as custom linux command generator (select purpose -> select attributes -> generate / add if there are missing process)

5. Network / Recon Reference
   - IP / MAC
   - TCP / UDP
   - DNS
   - HTTP/HTTPS
   - common ports
   - CIDR/subnets
   - routing
   - NAT
   - firewall
   - proxy
   - reverse proxy
   - curl inspection
   - nmap syntax
   - packet-analysis commands

6. Forensics / File Analysis [ONGOING]
   - file identification
   - metadata
   - strings extraction
   - hex inspection
   - image analysis
   - archive inspection
   - steganography helpers
   - deleted/recovered data concepts
   - .bin to image/vid/text/etc convert bin files into its readable file

7. OSINT Reference
   - DNS enumeration
   - WHOIS
   - subdomain concepts
   - URL/domain analysis
   - metadata
   - search operators
   - username/email investigation techniques
   - public-source evidence collection

8. Notes / SOP
   - Enumeration SOP
   - Web testing SOP
   - Network investigation SOP
   - Forensics SOP
   - Stego SOP
   - Encoding/decoding decision tree
   - "What do I try next?" checklist
   - Flag/evidence recording
   - Time-management procedure
    - 