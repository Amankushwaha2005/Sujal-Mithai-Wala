package smw;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/** Parses multipart/form-data for photo uploads (admin add mithai / ads). */
final class Multipart {
  final Map<String, String> fields = new HashMap<>();
  byte[] file;
  String fileName = "";
  String fileField = "";

  static Multipart parse(byte[] body, String contentType) {
    Multipart m = new Multipart();
    String boundary = boundaryOf(contentType);
    if (boundary == null) return m;
    byte[] needle = ("--" + boundary).getBytes(StandardCharsets.ISO_8859_1);
    int pos = indexOf(body, needle, 0);
    while (pos >= 0) {
      int start = pos + needle.length;
      if (start + 1 < body.length && body[start] == '-' && body[start + 1] == '-') break;
      if (start < body.length && body[start] == '\r') start++;
      if (start < body.length && body[start] == '\n') start++;
      int next = indexOf(body, needle, start);
      if (next < 0) break;
      int partEnd = next;
      if (partEnd >= 2 && body[partEnd - 2] == '\r' && body[partEnd - 1] == '\n') partEnd -= 2;
      parsePart(m, body, start, partEnd);
      pos = next;
    }
    return m;
  }

  private static void parsePart(Multipart m, byte[] body, int start, int end) {
    int headerEnd = indexOf(body, "\r\n\r\n".getBytes(StandardCharsets.ISO_8859_1), start);
    if (headerEnd < 0 || headerEnd > end) return;
    String headers = new String(body, start, headerEnd - start, StandardCharsets.ISO_8859_1);
    int dataStart = headerEnd + 4;
    String disp = headerLine(headers, "Content-Disposition");
    String name = headerAttr(disp, "name");
    String filename = headerAttr(disp, "filename");
    if (filename != null && !filename.isBlank()) {
      m.fileField = name;
      m.fileName = filename;
      m.file = java.util.Arrays.copyOfRange(body, dataStart, end);
    } else if (name != null) {
      m.fields.put(name, new String(body, dataStart, end - dataStart, StandardCharsets.UTF_8));
    }
  }

  private static String boundaryOf(String contentType) {
    if (contentType == null) return null;
    for (String p : contentType.split(";")) {
      String t = p.trim();
      if (t.startsWith("boundary=")) {
        String b = t.substring(9).trim();
        if (b.startsWith("\"") && b.endsWith("\"")) b = b.substring(1, b.length() - 1);
        return b;
      }
    }
    return null;
  }

  private static String headerLine(String headers, String key) {
    for (String line : headers.split("\r\n")) {
      if (line.toLowerCase().startsWith(key.toLowerCase() + ":")) {
        return line.substring(key.length() + 1).trim();
      }
    }
    return "";
  }

  private static String headerAttr(String header, String attr) {
    java.util.regex.Matcher m =
        java.util.regex.Pattern.compile(attr + "=\"([^\"]*)\"|" + attr + "=([^;\\s]+)", java.util.regex.Pattern.CASE_INSENSITIVE)
            .matcher(header);
    if (!m.find()) return null;
    return m.group(1) != null ? m.group(1) : m.group(2);
  }

  private static int indexOf(byte[] data, byte[] pat, int from) {
    outer:
    for (int i = from; i <= data.length - pat.length; i++) {
      for (int j = 0; j < pat.length; j++) {
        if (data[i + j] != pat[j]) continue outer;
      }
      return i;
    }
    return -1;
  }
}
