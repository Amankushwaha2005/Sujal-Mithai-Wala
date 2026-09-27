package smw;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/** Password hashing for website signup / login (PBKDF2). */
final class Passwords {
  private static final SecureRandom RNG = new SecureRandom();

  static String hash(String password) throws Exception {
    byte[] salt = new byte[16];
    RNG.nextBytes(salt);
    byte[] dk = pbkdf2(password, salt);
    return "pbkdf2:" + HexFormat.of().formatHex(salt) + ":" + HexFormat.of().formatHex(dk);
  }

  static boolean verify(String password, String stored) throws Exception {
    if (stored == null || !stored.startsWith("pbkdf2:")) return false;
    String[] p = stored.split(":");
    if (p.length != 3) return false;
    byte[] salt = HexFormat.of().parseHex(p[1]);
    byte[] expected = HexFormat.of().parseHex(p[2]);
    byte[] actual = pbkdf2(password, salt);
    return MessageDigest.isEqual(expected, actual);
  }

  private static byte[] pbkdf2(String password, byte[] salt) throws Exception {
    PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 120_000, 256);
    return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
  }

  static boolean looksLikeEmail(String email) {
    return email != null && email.contains("@") && email.contains(".") && email.length() < 200;
  }
}
