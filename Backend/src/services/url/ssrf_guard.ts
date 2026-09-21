/**
 * SSRF Guard - Server-Side Request Forgery Defensive Barrier
 * 
 * Protects server-side URL operations (inspection, metadata lookup, redirection)
 * from reaching private networks, loopback addresses, cloud metadata endpoints,
 * or non-HTTP protocols.
 */

import dns from 'dns';
import net from 'net';

export interface SsrfValidationResult {
  isSafe: boolean;
  reason?: string;
  resolvedIps?: string[];
  parsedUrl?: URL;
}

/**
 * Checks whether an IPv4 address falls within reserved/private ranges:
 * - Loopback: 127.0.0.0/8
 * - RFC 1918 Private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
 * - Link-local: 169.254.0.0/16
 * - Current network: 0.0.0.0/8
 * - Shared address space (CGNAT): 100.64.0.0/10
 * - IETF Protocol / Documentation: 192.0.0.0/24, 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24
 * - Benchmarking: 198.18.0.0/15
 * - Broadcast / Multicast: 224.0.0.0/4, 240.0.0.0/4, 255.255.255.255
 */
export function isPrivateOrBlockedIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IPv4 is treated as unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Broadcast/Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private-Use)
  if (a === 10) return true;

  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-Local & Cloud Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private-Use 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && parts[2] === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1 Documentation)
  if (a === 192 && b === 0 && parts[2] === 2) return true;

  // 192.168.0.0/16 (Private-Use)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Network Benchmark Tests)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2 Documentation)
  if (a === 198 && b === 51 && parts[2] === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3 Documentation)
  if (a === 203 && b === 0 && parts[2] === 113) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved / Broadcast)
  if (a >= 224) return true;

  return false;
}

/**
 * Checks whether an IPv6 address is private, loopback, link-local, or IPv4-mapped private
 */
export function isPrivateOrBlockedIPv6(ip: string): boolean {
  const clean = ip.toLowerCase().trim();

  // Loopback (::1) & Unspecified (::)
  if (clean === '::1' || clean === '::' || clean === '0:0:0:0:0:0:0:1' || clean === '0:0:0:0:0:0:0:0') {
    return true;
  }

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or WHATWG-normalized hex form ::ffff:7f00:1)
  if (clean.startsWith('::ffff:')) {
    const mapped = clean.slice(7);
    if (net.isIPv4(mapped)) {
      return isPrivateOrBlockedIPv4(mapped);
    }
    // Handle WHATWG hex-normalized notation (e.g. 7f00:1 for 127.0.0.1, a00:1 for 10.0.0.1)
    const hexParts = mapped.split(':');
    if (hexParts.length === 2) {
      const h1 = parseInt(hexParts[0], 16);
      const h2 = parseInt(hexParts[1], 16);
      if (!isNaN(h1) && !isNaN(h2)) {
        const mappedIpv4 = [
          (h1 >> 8) & 0xff,
          h1 & 0xff,
          (h2 >> 8) & 0xff,
          h2 & 0xff,
        ].join('.');
        return isPrivateOrBlockedIPv4(mappedIpv4);
      }
    }
    return true; // Any unrecognized ::ffff: mapping is blocked as unsafe
  }

  // Unique Local Address (fc00::/7 - fc00:: to fdff::)
  if (clean.startsWith('fc') || clean.startsWith('fd')) {
    return true;
  }

  // Link-Local (fe80::/10 - fe80:: to febf::)
  if (/^fe[89ab]/i.test(clean)) {
    return true;
  }

  // Site-Local (fec0::/10 - deprecated)
  if (/^fe[c-f]/i.test(clean)) {
    return true;
  }

  // Multicast (ff00::/8)
  if (clean.startsWith('ff')) {
    return true;
  }

  return false;
}

/**
 * General IP check covering both IPv4 and IPv6
 */
export function isPrivateOrBlockedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    return isPrivateOrBlockedIPv4(ip);
  }
  if (version === 6) {
    return isPrivateOrBlockedIPv6(ip);
  }
  return true; // Not a valid IP format is treated as unsafe
}

/**
 * Known internal hostnames and cloud metadata hosts
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'instance-data',
  'metadata.google.internal',
  'metadata.internal',
  '169.254.169.254',
  '100.100.100.200', // Alibaba cloud metadata
]);

/**
 * Validates a target URL before any outbound network request or inspection.
 * Resolves DNS to ensure the destination does not point to internal infrastructure.
 */
export async function validateUrlForSafeFetch(rawUrl: string): Promise<SsrfValidationResult> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return {
      isSafe: false,
      reason: 'MALFORMED_URL: The supplied string cannot be parsed as a valid URL.',
    };
  }

  // 1. Strict Protocol Enforcement: Only HTTP and HTTPS
  const protocol = parsedUrl.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return {
      isSafe: false,
      reason: `FORBIDDEN_PROTOCOL: Protocol "${protocol}" is prohibited. Only HTTP and HTTPS are permitted.`,
      parsedUrl,
    };
  }

  // 2. Reject credentials in URL (e.g. http://user:pass@host)
  if (parsedUrl.username || parsedUrl.password) {
    return {
      isSafe: false,
      reason: 'EMBEDDED_CREDENTIALS: URLs with embedded userinfo credentials are not permitted for fetching.',
      parsedUrl,
    };
  }

  const rawHostname = parsedUrl.hostname.toLowerCase().trim();
  const hostname = rawHostname.startsWith('[') && rawHostname.endsWith(']')
    ? rawHostname.slice(1, -1)
    : rawHostname;

  if (!hostname) {
    return {
      isSafe: false,
      reason: 'EMPTY_HOSTNAME: The URL has no valid hostname.',
      parsedUrl,
    };
  }

  // 3. Blocked Hostname Suffixes and Exact Matches
  if (BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_HOSTNAMES.has(rawHostname)) {
    return {
      isSafe: false,
      reason: `BLOCKED_HOSTNAME: Hostname "${rawHostname}" is a forbidden internal or cloud metadata destination.`,
      parsedUrl,
    };
  }

  if (
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.home') ||
    hostname.endsWith('.corp')
  ) {
    return {
      isSafe: false,
      reason: `BLOCKED_INTERNAL_DOMAIN: Hostname "${rawHostname}" points to an internal top-level domain.`,
      parsedUrl,
    };
  }

  // 4. Direct IP check if hostname is already a standard numeric IP address
  if (net.isIP(hostname)) {
    if (isPrivateOrBlockedIp(hostname)) {
      return {
        isSafe: false,
        reason: `PRIVATE_OR_RESERVED_IP: Hostname "${rawHostname}" is a private, loopback, or cloud metadata IP address.`,
        resolvedIps: [hostname],
        parsedUrl,
      };
    }
    return {
      isSafe: true,
      resolvedIps: [hostname],
      parsedUrl,
    };
  }

  // 5. Hexadecimal / Octal / Decimal obfuscated IPv4 format check (e.g. 0177.0.0.1, 0x7f.0.0.1, 2130706433)
  if (/^0x[0-9a-f]+$/i.test(hostname) || /^\d+$/.test(hostname) || /^(?:0[0-7]+|\d+)(?:\.(?:0[0-7]+|\d+)){1,3}$/.test(hostname)) {
    return {
      isSafe: false,
      reason: `NUMERIC_IP_OBFUSCATION: Hostname "${hostname}" uses obfuscated numeric IP notation.`,
      parsedUrl,
    };
  }

  // 6. DNS Pre-Resolution: Verify that all resolved IPs for the hostname are strictly public
  try {
    const lookupResults = await dns.promises.lookup(hostname, { all: true });

    if (!lookupResults || lookupResults.length === 0) {
      return {
        isSafe: false,
        reason: `DNS_RESOLUTION_FAILED: Hostname "${hostname}" could not be resolved by DNS.`,
        parsedUrl,
      };
    }

    const resolvedIps = lookupResults.map((r) => r.address);

    for (const record of lookupResults) {
      if (isPrivateOrBlockedIp(record.address)) {
        return {
          isSafe: false,
          reason: `DNS_RESOLVED_PRIVATE_IP: Hostname "${hostname}" resolved to prohibited IP address "${record.address}".`,
          resolvedIps,
          parsedUrl,
        };
      }
    }

    return {
      isSafe: true,
      resolvedIps,
      parsedUrl,
    };
  } catch (err: any) {
    return {
      isSafe: false,
      reason: `DNS_ERROR: Failed to resolve domain "${hostname}": ${err?.message || 'Host not found'}`,
      parsedUrl,
    };
  }
}
